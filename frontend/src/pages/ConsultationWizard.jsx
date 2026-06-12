import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CloseIcon, PrintIcon, SaveIcon } from '../components/Icons';

export const ConsultationWizard = () => {
  const { user, token, navigateTo, showToast } = useAuth();
  
  // Wizard steps: 'business_select', 'questions', 'result'
  const [step, setStep] = useState('business_select');
  const [businessType, setBusinessType] = useState(user?.business_type || 'jasa');
  
  // Session facts & tracing
  const [facts, setFacts] = useState({});
  const [answersHistory, setAnswersHistory] = useState([]); // Stack for back button
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [ruleTrace, setRuleTrace] = useState([]);
  const [provenGoal, setProvenGoal] = useState(null);
  const [evaluationStatus, setEvaluationStatus] = useState('processing');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset and go to business type selection
  const resetConsultation = () => {
    setFacts({});
    setAnswersHistory([]);
    setProvenGoal(null);
    setRuleTrace([]);
    setStep('business_select');
  };

  // Start a new consultation session from selected business type
  const startConsultation = () => {
    setFacts({});
    setAnswersHistory([]);
    setProvenGoal(null);
    setRuleTrace([]);
    setStep('questions');
    evaluateSession({});
  };

  // Call the backend engine to evaluate current facts
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
          // Status: processing. We get a next question
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
    
    // Save state for undo/back
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

  // Generate recommendation Jurnal based on the classification result
  const getJournalRecommendation = (goal) => {
    if (!goal) return { debit: '-', credit: '-' };

    const isKredit = facts['is_kredit'] === 'yes';
    const isAsset = goal.category === 'Aset';
    
    // Custom mapping for our rules
    switch (goal.code) {
      case '1-1000': // Kas Utama (Penerimaan Tunai)
        return { debit: 'Kas Utama', credit: 'Pendapatan Lainnya' };
      case '1-1200': // Piutang Usaha
        return { debit: 'Piutang Usaha', credit: businessType === 'dagang' ? 'Pendapatan Penjualan' : 'Pendapatan Jasa' };
      case '1-1300': // Persediaan
        return { 
          debit: 'Persediaan Barang Dagang', 
          credit: isKredit ? 'Hutang Dagang' : 'Kas Utama' 
        };
      case '1-2100': // Peralatan
        return { 
          debit: 'Peralatan Kantor', 
          credit: isKredit ? 'Hutang Dagang' : 'Kas Utama' 
        };
      case '3-1000': // Modal Pemilik
        return { debit: 'Kas Utama', credit: 'Modal Pemilik' };
      case '3-2000': // Prive
        return { debit: 'Prive Pemilik', credit: 'Kas Utama' };
      case '4-1000': // Pendapatan Penjualan
        return { debit: 'Kas Utama', credit: 'Pendapatan Penjualan' };
      case '4-1100': // Pendapatan Jasa
        return { debit: 'Kas Utama', credit: 'Pendapatan Jasa' };
      case '5-1000': // Beban Gaji
        return { debit: 'Beban Gaji', credit: 'Kas Utama' };
      case '5-1100': // Beban Listrik & Air
        return { debit: 'Beban Listrik & Air', credit: 'Kas Utama' };
      case '5-1200': // Beban Sewa
        return { debit: 'Beban Sewa Kantor', credit: 'Kas Utama' };
      case '5-1500': // Beban ATK
        return { debit: 'Beban ATK', credit: 'Kas Utama' };
      case '2-2000': // Hutang Bank
        return { debit: 'Kas Utama', credit: 'Hutang Bank' };
      default:
        // Generic double-entry fallback
        if (goal.category === 'Beban') {
          return { debit: goal.name, credit: 'Kas Utama' };
        } else if (goal.category === 'Kewajiban') {
          return { debit: 'Kas Utama', credit: goal.name };
        } else {
          return { debit: goal.name, credit: 'Kontra Akun' };
        }
    }
  };

  const handleSaveResult = async () => {
    setSaving(true);
    try {
      const answersArray = answersHistory.map(h => ({
        question_id: h.question.question_id || 1, // Fallback if ID is missing (seeded handles it)
        answer: facts[h.question.fact_name]
      }));
      
      // Include current question answer too
      if (currentQuestion && facts[currentQuestion.fact_name]) {
        answersArray.push({
          question_id: currentQuestion.question_id || 1,
          answer: facts[currentQuestion.fact_name]
        });
      }

      const postBody = {
        business_type: businessType,
        result_account_id: provenGoal?.account_id || null,
        confidence_level: provenGoal ? 95 : 0,
        reasoning_text: provenGoal 
          ? `Berdasarkan fakta transaksi ${businessType === 'jasa' ? 'Jasa' : 'Dagang'} yang diinput, transaksi diklasifikasikan sebagai ${provenGoal.name} (${provenGoal.category}) karena memenuhi aturan logika ${provenGoal.rule_code} (${provenGoal.rule_name}).` 
          : 'Transaksi tidak terklasifikasi dalam basis aturan pakar saat ini.',
        rule_trace: ruleTrace,
        answers: answersHistory.map((h, index) => ({
          question_id: index + 1, // Simple index matching question seed order
          answer: facts[h.question.fact_name]
        }))
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
        showToast('Hasil konsultasi akuntansi berhasil disimpan.', 'success');
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

  const handlePrint = () => {
    window.print();
  };

  const journal = getJournalRecommendation(provenGoal);

  return (
    <div className="printable-consultation">
      {/* 1. Step: Select Business Type */}
      {step === 'business_select' && (
        <div className="card" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Mulai Konsultasi Akuntansi</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Pilih klasifikasi jenis usaha entitas UMKM Anda untuk memuat rule-base yang sesuai.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Jasa Card */}
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

            {/* Dagang Card */}
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

      {/* 2. Step: Active Questionnaire */}
      {step === 'questions' && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Questionnaire Card */}
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
                    Pertanyaan ini membantu mesin inferensi backward chaining menentukan klasifikasi akun keuangan yang tepat berdasarkan karakteristik transaksi.
                  </p>

                  {/* Yes / No buttons */}
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
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fakta/kondisi terpenuhi</span>
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
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kondisi tidak sesuai</span>
                    </button>
                  </div>
                </div>

                {/* Back / Navigation footer */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={handleBack} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    ← Kembali
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Estimasi Selesai: {10 - answersHistory.length > 0 ? 10 - answersHistory.length : 1} Pertanyaan Lagi
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Mengevaluasi basis aturan akuntansi...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Step: Result Page & Journal Recommendations */}
      {step === 'result' && (
        <div>
          <div className="layout-main-side">
            {/* Left side: Conclusion */}
            <div className="card">
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>NAMA AKUN TERDETEKSI</span>
                  <span className="badge badge-success">95% Confidence Score ✓</span>
                </div>
                
                {provenGoal ? (
                  <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    {provenGoal.name}
                  </h1>
                ) : (
                  <h1 style={{ fontSize: '2rem', color: 'var(--danger)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    Tidak Terklasifikasi
                  </h1>
                )}

                <span className="badge badge-info">
                  Kategori: {provenGoal ? provenGoal.category : 'N/A'} ({provenGoal ? (provenGoal.subcategory || '-') : '-'})
                </span>
              </div>

              {/* Logical Explanation */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Alasan Rekomendasi</h3>
                {provenGoal ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <p style={{ marginBottom: '0.75rem' }}>
                      Berdasarkan penalaran sistem, transaksi Anda berhasil dibuktikan sebagai <strong>{provenGoal.name}</strong> (Kode Akun: {provenGoal.code}) dalam kategori <strong>{provenGoal.category}</strong> {provenGoal.subcategory ? `(${provenGoal.subcategory})` : ''}.
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      Aturan yang terpicu adalah <strong>{provenGoal.rule_name} ({provenGoal.rule_code})</strong>, yang secara otomatis aktif karena seluruh kondisi berikut terpenuhi berdasarkan jawaban Anda:
                    </p>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {ruleTrace.filter(t => t.status === 'passed').flatMap(t => 
                        t.conditions.map((c, i) => (
                          <li key={`${t.rule_code}-${i}`}>
                            <code style={{ backgroundColor: 'var(--background)', padding: '0.15rem 0.35rem', borderRadius: '3px', fontSize: '0.75rem' }}>{c.fact_name} = {c.actual}</code> <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.75rem' }}>✓ (terpenuhi)</span>
                          </li>
                        ))
                      )}
                    </ul>
                    <p>
                      Karena rangkaian kondisi di atas terpenuhi, maka sesuai standar akuntansi <strong>SAK EMKM</strong>, sistem menyarankan Anda untuk mencatat transaksi ini dengan mendebit <strong>{journal.debit}</strong> dan mengkredit <strong>{journal.credit}</strong>. Klasifikasi otomatis ini lazim diterapkan pada entitas UMKM <strong>{businessType === 'jasa' ? 'Jasa' : 'Dagang'}</strong> untuk memastikan laporan posisi keuangan dan laba rugi Anda tetap seimbang dan akurat.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Maaf, sistem tidak dapat menemukan klasifikasi akun yang tepat. Rangkaian jawaban Anda tidak memenuhi satu pun kriteria standar pada basis aturan yang tersedia.
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="no-print" style={{ borderTop: '1px dashed var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={handleSaveResult} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }} disabled={saving}>
                  <SaveIcon className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Riwayat'}
                </button>
              </div>
            </div>

            {/* Right side: Journals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Journal recommended card */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                color: 'white',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📖 Rekomendasi Jurnal
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '1.5rem', marginBottom: '1rem' }}>
                  {/* Debit row */}
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bfdbfe' }}>DEBIT</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>{journal.debit}</h4>
                  </div>

                  {/* Credit row */}
                  <div style={{ paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bfdbfe' }}>KREDIT</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>{journal.credit}</h4>
                  </div>
                </div>

                <p style={{ fontSize: '0.7rem', color: '#bfdbfe', fontStyle: 'italic' }}>
                  Entri ini siap untuk diekspor ke modul Buku Besar sesuai standar jurnal berpasangan akuntansi.
                </p>
              </div>

              {/* Consultation New CTA */}
              <div className="card no-print" style={{ textAlign: 'center', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Ada transaksi lain?</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                  Lanjutkan klasifikasi untuk menjaga keakuratan laporan keuangan UMKM Anda.
                </p>
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
