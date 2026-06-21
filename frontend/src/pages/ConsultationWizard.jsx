import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, ArrowRightIcon, SaveIcon } from '../components/Icons';

export const ConsultationWizard = () => {
  const { user, token, navigateTo, showToast } = useAuth();
  
  // Wizard steps: 'business_select', 'questions', 'result'
  const [step, setStep] = useState('business_select');
  const [businessType, setBusinessType] = useState(user?.business_type || 'jasa');
  
  const [facts, setFacts] = useState({});
  const [answersHistory, setAnswersHistory] = useState([]);
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [ruleTrace, setRuleTrace] = useState([]);
  const [provenGoal, setProvenGoal] = useState(null);
  const [evaluationStatus, setEvaluationStatus] = useState('processing');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Jurnal Input
  const [amount, setAmount] = useState('1000');
  const [description, setDescription] = useState('');
  const [selectedDynamicAccountId, setSelectedDynamicAccountId] = useState('');
  const [expenseAccounts, setExpenseAccounts] = useState([]);

  // Fetch accounts for dynamic dropdown when needed
  useEffect(() => {
    if (provenGoal && provenGoal.requiresUserInput === 'debit') {
      const fetchAccounts = async () => {
        try {
          const res = await fetch('/api/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            // Filter only Expense (Beban) accounts for R-005
            const expenses = data.accounts.filter(a => a.category === 'Beban');
            setExpenseAccounts(expenses);
          }
        } catch (err) {
          console.error("Gagal memuat daftar akun.", err);
        }
      };
      fetchAccounts();
    }
  }, [provenGoal, token]);

  // Auto-start for ALL users based on their registered business_type
  useEffect(() => {
    if (user && step === 'business_select') {
      startConsultation();
    }
  }, [user, step]);

  const resetConsultation = () => {
    setFacts({});
    setAnswersHistory([]);
    setProvenGoal(null);
    setRuleTrace([]);
    setAmount('1000');
    setDescription('');
    setSelectedDynamicAccountId('');
    // Auto start directly
    setStep('questions');
    evaluateSession({});
  };

  const startConsultation = () => {
    setFacts({});
    setAnswersHistory([]);
    setProvenGoal(null);
    setRuleTrace([]);
    setStep('questions');
    evaluateSession({});
  };

  const evaluateSession = async (currentFacts) => {
    setLoading(true);
    try {
      const response = await fetch('/api/consultations/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          business_type: businessType,
          facts: currentFacts
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setEvaluationStatus(data.status);
        setRuleTrace(data.ruleTrace || []);
        
        if (data.status === 'proven') {
          setProvenGoal(data.provenGoal);
          setStep('result');
        } else if (data.status === 'unproven') {
          setProvenGoal(null);
          setStep('result');
        } else {
          setCurrentQuestion(data.nextQuestion);
        }
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses evaluasi logika.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (value) => {
    if (!currentQuestion) return;
    
    setAnswersHistory(prev => [...prev, {
      question: currentQuestion,
      factsBefore: { ...facts }
    }]);

    const updatedFacts = {
      ...facts,
      [currentQuestion.fact_name]: value
    };

    setFacts(updatedFacts);
    evaluateSession(updatedFacts);
  };

  const handleBack = () => {
    if (answersHistory.length === 0) {
      setStep('business_select');
      return;
    }

    const previousState = answersHistory[answersHistory.length - 1];
    setAnswersHistory(prev => prev.slice(0, -1));
    setFacts(previousState.factsBefore);
    evaluateSession(previousState.factsBefore);
  };

  const handleSaveResult = async () => {
    if (amount <= 0) {
      showToast('Nominal transaksi wajib diisi dan lebih dari 0.', 'warning');
      return;
    }
    
    if (provenGoal && provenGoal.requiresUserInput === 'debit' && !selectedDynamicAccountId) {
      showToast('Harap pilih jenis beban terkait.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const answersArray = answersHistory.map(h => ({
        question_id: h.question.question_id || 1,
        answer: facts[h.question.fact_name]
      }));
      
      if (currentQuestion && facts[currentQuestion.fact_name]) {
        answersArray.push({
          question_id: currentQuestion.question_id || 1,
          answer: facts[currentQuestion.fact_name]
        });
      }

      // Resolve final IDs for Journal Post
      let debitId = provenGoal?.debit?.id;
      let creditId = provenGoal?.credit?.id;

      if (provenGoal?.requiresUserInput === 'debit') debitId = selectedDynamicAccountId;

      const postBody = {
        business_type: businessType,
        confidence_level: provenGoal ? 95 : 0,
        reasoning_text: provenGoal 
          ? `Transaksi terklasifikasi otomatis sebagai ${provenGoal.rule_name} berdasarkan rule ${provenGoal.rule_code}.` 
          : 'Transaksi tidak terklasifikasi.',
        rule_trace: ruleTrace,
        answers: answersArray,
        amount: parseFloat(amount),
        description: description || `Transaksi Otomatis Konsultasi ${provenGoal?.rule_name || ''}`,
        debit_account_id: debitId,
        credit_account_id: creditId
      };

      const response = await fetch('/api/consultations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postBody)
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Transaksi berhasil diposting ke Jurnal Umum!', 'success');
        navigateTo('history');
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan konsultasi.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const debitDisplay = provenGoal?.requiresUserInput === 'debit' 
    ? (selectedDynamicAccountId ? expenseAccounts.find(a => a.id == selectedDynamicAccountId)?.name : 'Pilih Jenis Beban')
    : provenGoal?.debit?.name || '-';

  const creditDisplay = provenGoal?.credit?.name || '-';

  const specificAccount = provenGoal ? provenGoal.rule_name.split(' (')[0] : '';
  const category = provenGoal ? ((provenGoal.debit?.name?.includes(specificAccount) ? provenGoal.debit?.category : provenGoal.credit?.category) || 'Akuntansi') : '';

  return (
    <div className="printable-consultation">
      {step === 'business_select' && (
        <div className="card" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Mulai Konsultasi Akuntansi</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Pilih klasifikasi jenis usaha entitas UMKM Anda untuk memuat rule-base yang sesuai.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div 
              onClick={() => setBusinessType('jasa')}
              style={{
                border: businessType === 'jasa' ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: businessType === 'jasa' ? 'var(--primary-light)' : 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'var(--transition)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💼</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: businessType === 'jasa' ? 'var(--primary)' : 'var(--text-primary)' }}>UMKM Jasa</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Bengkel, Laundry, Salon, Jasa Konsultan, Studio Desain, dll.
              </p>
            </div>

            <div 
              onClick={() => setBusinessType('dagang')}
              style={{
                border: businessType === 'dagang' ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: businessType === 'dagang' ? 'var(--primary-light)' : 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'var(--transition)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: businessType === 'dagang' ? 'var(--primary)' : 'var(--text-primary)' }}>UMKM Dagang</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Toko Sembako, Butik Pakaian, Toko Kosmetik, Retail Elektronik, dll.
              </p>
            </div>
          </div>

          <button onClick={startConsultation} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }}>
            Lanjutkan ke Kuisioner →
          </button>
        </div>
      )}

      {step === 'questions' && (
        <div style={{ maxWidth: '850px', margin: '2rem auto' }}>
          <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '520px', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', gap: '1rem' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', borderWidth: '4px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Memuat data evaluasi...</p>
              </div>
            ) : currentQuestion ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                  <div>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'inline-block'
                    }}>
                      ID PERTANYAAN: {currentQuestion.code}
                    </span>
                    
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '1.25rem', marginBottom: '0.75rem', lineHeight: 1.35, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {currentQuestion.question_text}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: 1.5 }}>
                      Jawab dengan jujur agar sistem dapat memformulasikan Jurnal Umum yang seimbang (balance).
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <button 
                      onClick={() => handleAnswer('yes')}
                      className="btn-action-text" 
                      style={{
                        padding: '2.5rem 1.5rem',
                        border: '2px solid var(--border)',
                        borderRadius: '16px',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.015)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.08)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.015)';
                      }}
                    >
                      <span style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800
                      }}>✓</span>
                      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Ya, Benar</span>
                    </button>

                    <button 
                      onClick={() => handleAnswer('no')}
                      className="btn-action-text" 
                      style={{
                        padding: '2.5rem 1.5rem',
                        border: '2px solid var(--border)',
                        borderRadius: '16px',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.015)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--danger)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(220, 38, 38, 0.08)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.015)';
                      }}
                    >
                      <span style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800
                      }}>✕</span>
                      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Tidak</span>
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <button onClick={handleBack} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600 }}>
                    ← Kembali
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', gap: '1rem' }}>
                <div className="spinner" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Mengevaluasi rule-based engine SIA...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'result' && (
        <div>
          <div className="layout-main-side">
            {/* Left side: Logic Explanation & Form Jurnal */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* TOP SECTION: LOGIC EXPLANATION */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>KESIMPULAN TRANSAKSI</span>
                  {provenGoal && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Tepat & Sesuai Standar ✓</span>}
                </div>
                
                {provenGoal ? (
                  <>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                      {provenGoal.rule_name.split(' (')[0]}
                    </h1>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: '#e0f2fe', padding: '0.35rem 0.75rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                      KATEGORI: {(provenGoal.debit?.name.includes(provenGoal.rule_name.split(' (')[0]) ? provenGoal.debit?.category : provenGoal.credit?.category) || 'AKUNTANSI'} ({provenGoal.rule_name.split(' (')[0]})
                    </span>
                    
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>Kesimpulan</h4>
                      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                        Berdasarkan analisis, transaksi ini terklasifikasi ke dalam kelompok <strong>{category}</strong> dengan akun spesifik <strong>{specificAccount}</strong>.
                      </p>

                      <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>Rekomendasi Pencatatan Berdasarkan Standar SAK EMKM</h4>
                      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                        Jurnal entry yang direkomendasikan adalah mencatat penambahan/pengurangan di sisi <strong>Debit pada {debitDisplay}</strong> dan menyeimbangkannya di sisi <strong>Kredit pada {creditDisplay}</strong>. Perlakuan ini telah sesuai dengan standar akuntansi UMKM yang berlaku.
                      </p>
                      
                      <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>Ringkasan Jawaban Anda</h4>
                      <div style={{ backgroundColor: 'var(--surface-alt)', borderLeft: '4px solid var(--primary)', padding: '1.25rem 1.5rem', borderRadius: '0 8px 8px 0', fontSize: '1.05rem' }}>
                        <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {answersHistory.map((ans, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                              {ans.question.question_text} <strong style={{ color: 'var(--text-primary)' }}>{facts[ans.question.fact_name] === 'yes' ? 'Ya' : 'Tidak'}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <h1 style={{ fontSize: '1.75rem', color: 'var(--danger)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    Tidak Terklasifikasi
                  </h1>
                )}
              </div>

              {/* BOTTOM SECTION: FORM */}
              {provenGoal && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {provenGoal.requiresUserInput === 'debit' && (
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          <span style={{ color: 'var(--danger)' }}>*</span> Input: Pilih Jenis Beban (Debit)
                        </label>
                        <select 
                          className="form-control"
                          value={selectedDynamicAccountId}
                          onChange={(e) => setSelectedDynamicAccountId(e.target.value)}
                        >
                          <option value="">-- Pilih Beban Terkait --</option>
                          {expenseAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: '0', display: 'none' }}>
                      <label className="form-label">Nominal Transaksi (Rp)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="Contoh: 1500000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0', display: 'none' }}>
                      <label className="form-label">Keterangan / Memo (Opsional)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Contoh: Pembayaran utilitas bulan Mei"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                    <button 
                      onClick={handleSaveResult} 
                      className="btn btn-primary" 
                      style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }} 
                      disabled={saving}
                    >
                      <SaveIcon className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Journals Preview & Rule Trace */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                color: 'white',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📖 Preview Jurnal
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '1.5rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bfdbfe' }}>
                      DEBIT
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>
                      {debitDisplay}
                    </h4>
                  </div>

                  <div style={{ paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bfdbfe' }}>
                      KREDIT
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>
                      {creditDisplay}
                    </h4>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#e0f2fe', lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Cara Membacanya:</p>
                  <p>Pencatatan uang masuk/keluar ini diletakkan di <strong>Debit</strong> pada <strong style={{color:'white'}}>{debitDisplay}</strong>, dengan sumber asalnya dicatat di <strong>Kredit</strong> pada <strong style={{color:'white'}}>{creditDisplay}</strong>.</p>
                </div>
              </div>

              <div className="card no-print" style={{ textAlign: 'center', padding: '2rem' }}>
                <button onClick={resetConsultation} className="btn btn-secondary" style={{ width: '100%', padding: '0.85rem' }}>
                  🔄 Konsultasi Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
