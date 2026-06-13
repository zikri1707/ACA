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
  const [amount, setAmount] = useState('');
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

  // Auto-start for non-admin users
  useEffect(() => {
    if (user && user.role !== 'Admin' && step === 'business_select') {
      startConsultation();
    }
  }, [user, step]);

  const resetConsultation = () => {
    setFacts({});
    setAnswersHistory([]);
    setProvenGoal(null);
    setRuleTrace([]);
    setAmount('');
    setDescription('');
    setSelectedDynamicAccountId('');
    if (user?.role === 'Admin') {
      setStep('business_select');
    } else {
      // Auto start directly
      setStep('questions');
      evaluateSession({});
    }
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
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '420px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="spinner" />
              </div>
            ) : currentQuestion ? (
              <>
                <div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    letterSpacing: '0.05em'
                  }}>
                    ID PERTANYAAN: {currentQuestion.code}
                  </span>
                  
                  <h2 style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                    {currentQuestion.question_text}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    Jawab dengan jujur agar sistem dapat memformulasikan Jurnal Umum yang seimbang (balance).
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                    <button 
                      onClick={() => handleAnswer('yes')}
                      className="btn" 
                      style={{
                        padding: '1.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>✓</span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Ya, Benar</span>
                    </button>

                    <button 
                      onClick={() => handleAnswer('no')}
                      className="btn" 
                      style={{
                        padding: '1.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>✕</span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Tidak</span>
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={handleBack} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    ← Kembali
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Mengevaluasi rule-based engine SIA...</p>
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
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>NAMA AKUN TERDETEKSI</span>
                  {provenGoal && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>95% CONFIDENCE SCORE ✓</span>}
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
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Penjelasan Logika</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                        Berdasarkan data yang dimasukkan, transaksi terbukti merupakan bagian dari <strong>{provenGoal.rule_name.split(' (')[0]}</strong>. Aturan pakar <strong>{provenGoal.rule_code}</strong> menyimpulkan bahwa karakteristik transaksi ini memenuhi kriteria standar kepatuhan akuntansi SAK EMKM untuk pencatatan pos terkait.
                      </p>
                      
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Rule Tracing (Jalur Logika)</h4>
                      <div style={{ backgroundColor: 'var(--surface-alt)', borderLeft: '4px solid var(--primary)', padding: '1rem', borderRadius: '0 8px 8px 0', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {provenGoal.rule_code}: {provenGoal.rule_name}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Kondisi Terpenuhi: {ruleTrace.find(r => r.status === 'passed')?.conditions?.map(c => `${c.fact_name}=${c.actual}`).join(', ')}
                        </div>
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
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Lengkapi Data Nominal Transaksi</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Sistem telah memformulasikan transaksi ini sebagai jurnal berpasangan. Masukkan nominal akhir untuk mempostingnya ke Buku Besar.
                  </p>

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

                    <div className="form-group" style={{ marginBottom: '0' }}>
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

                    <div className="form-group" style={{ marginBottom: '0' }}>
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
                      <SaveIcon className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Posting Jurnal (Dr=Cr)'}
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
                      DEBIT {amount && `(Rp ${parseFloat(amount).toLocaleString('id-ID')})`}
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>
                      {debitDisplay}
                    </h4>
                  </div>

                  <div style={{ paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bfdbfe' }}>
                      KREDIT {amount && `(Rp ${parseFloat(amount).toLocaleString('id-ID')})`}
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>
                      {creditDisplay}
                    </h4>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#e0f2fe', lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Penjelasan Preview Jurnal:</p>
                  <p>Menurut prinsip Akuntansi Berpasangan (Double-Entry), transaksi ini menambah nilai di sisi <strong>Debit</strong> pada akun <strong style={{color:'white'}}>{debitDisplay}</strong> dan menyeimbangkannya di sisi <strong>Kredit</strong> pada akun <strong style={{color:'white'}}>{creditDisplay}</strong>.</p>
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
