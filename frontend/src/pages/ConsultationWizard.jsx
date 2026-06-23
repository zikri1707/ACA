import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, ArrowRightIcon, SaveIcon } from '../components/Icons';

export const ConsultationWizard = () => {
  const { user, token, loading: authLoading, navigateTo, showToast } = useAuth();
  
  // Wizard steps: 'questions', 'result'
  const [step, setStep] = useState('questions');
  const [isInitialized, setIsInitialized] = useState(false);
  
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

  // Auto-initialize when user and token are ready
  useEffect(() => {
    if (user?.business_type && token && !isInitialized) {
      setIsInitialized(true);
      setStep('questions');
      evaluateSession({}, user.business_type);
    }
  }, [user, token, isInitialized]);

  const resetConsultation = () => {
    setFacts({});
    setAnswersHistory([]);
    setProvenGoal(null);
    setRuleTrace([]);
    setAmount('1000');
    setDescription('');
    setSelectedDynamicAccountId('');
    setStep('questions');
    if (user?.business_type) {
      evaluateSession({}, user.business_type);
    }
  };

  const evaluateSession = async (currentFacts, bType) => {
    const targetBusinessType = bType || user?.business_type;
    if (!targetBusinessType) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/consultations/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          business_type: targetBusinessType,
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
        business_type: user?.business_type || 'jasa',
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

  if (authLoading || (!user && !isInitialized)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '1rem' }}>
        <div className="spinner" style={{ width: '50px', height: '50px', borderWidth: '4px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Memuat profil usaha...</p>
      </div>
    );
  }

  return (
    <div className="printable-consultation">

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
                  {answersHistory.length > 0 ? (
                    <button 
                      onClick={handleBack} 
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--primary)';
                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)';
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.04)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.08)';
                        const arrow = e.currentTarget.querySelector('.back-arrow-svg');
                        if (arrow) arrow.style.transform = 'translateX(-3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.03)';
                        const arrow = e.currentTarget.querySelector('.back-arrow-svg');
                        if (arrow) arrow.style.transform = 'none';
                      }}
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.7rem 1.35rem', 
                        borderRadius: '10px', 
                        border: '1.5px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem', 
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <svg 
                        className="back-arrow-svg"
                        style={{ marginRight: '8px', width: '16px', height: '16px', transition: 'transform 0.2s ease', display: 'flex' }} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Kembali</span>
                    </button>
                  ) : <div />}
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
                  <>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.5rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                      Tidak Terklasifikasi
                    </h1>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--danger)', backgroundColor: '#fee2e2', padding: '0.35rem 0.75rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                      Kombinasi Kondisi Tidak Sesuai Aturan Aktif ✗
                    </span>
                    
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>Penjelasan</h4>
                      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                        Berdasarkan hasil evaluasi <strong>Backward Chaining Engine</strong> menggunakan basis aturan (Rule Base) sistem pakar kami, transaksi Anda <strong>tidak dapat didefinisikan secara otomatis</strong> ke dalam akun SAK EMKM tertentu.
                      </p>
                      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                        Hal ini terjadi karena serangkaian jawaban yang Anda berikan tidak memenuhi satupun jalur logika (rules) akuntansi yang telah dikonfigurasi di dalam sistem saat ini.
                      </p>

                      <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>Rekomendasi Tindakan</h4>
                      <ul style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.75rem', paddingLeft: '1.2rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Tinjau Kembali Jawaban Anda:</strong> Periksa ringkasan jawaban Anda di bawah untuk memastikan tidak ada kesalahan input informasi.
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Mulai Ulang Konsultasi:</strong> Jika Anda merasa ada jawaban yang kurang tepat, klik tombol <strong>Konsultasi Baru</strong> untuk mengulangi proses tanya jawab.
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Hubungi Pakar Akuntansi / Admin:</strong> Ajukan penambahan basis aturan baru jika transaksi ini merupakan aktivitas rutin usaha Anda yang belum terdaftar di sistem.
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Pencatatan Jurnal Manual:</strong> Lakukan pencatatan transaksi secara manual melalui buku kas atau sistem jurnal eksternal berdasarkan prinsip dasar akuntansi.
                        </li>
                      </ul>
                      
                      <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>Ringkasan Jawaban Anda</h4>
                      <div style={{ backgroundColor: 'var(--surface-alt)', borderLeft: '4px solid var(--danger)', padding: '1.25rem 1.5rem', borderRadius: '0 8px 8px 0', fontSize: '1.05rem' }}>
                        {answersHistory.length > 0 ? (
                          <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {answersHistory.map((ans, idx) => (
                              <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                {ans.question.question_text} <strong style={{ color: 'var(--text-primary)' }}>{facts[ans.question.fact_name] === 'yes' ? 'Ya' : 'Tidak'}</strong>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Tidak ada riwayat pertanyaan.</p>
                        )}
                      </div>
                    </div>
                  </>
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
              {provenGoal ? (
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
              ) : (
                <div style={{
                  background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
                  color: 'white',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚠️ Jurnal Tidak Terbentuk
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.6, marginBottom: '1rem' }}>
                    Sistem tidak dapat menghasilkan entri jurnal (Debit/Kredit) karena status klasifikasi transaksi adalah <strong>Tidak Terklasifikasi</strong>.
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    Akun Debit dan Kredit hanya dapat dipetakan jika kriteria transaksi memenuhi salah satu aturan akuntansi yang sah.
                  </p>
                </div>
              )}

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
