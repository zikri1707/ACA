import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { token, navigateTo } = useAuth();
  const [activeTab, setActiveTab] = useState('rules'); // Documentation section active tab

  const handleStartConsultation = () => {
    if (token) {
      navigateTo('consultation');
    } else {
      navigateTo('login');
    }
  };

  // Sample data for SAK EMKM Rules documentation
  const rulesDoc = [
    { code: 'R-01', desc: 'Klasifikasi Kas Utama', cond: 'IF Penerimaan Tunai AND Likuiditas Tinggi', result: 'Debet: Kas Utama (1-1000) / Kredit: Pendapatan (4-1000)' },
    { code: 'R-02', desc: 'Prive Pemilik', cond: 'IF Penarikan Pribadi AND Akun Ekuitas', result: 'Debet: Prive (3-1200) / Kredit: Kas Utama (1-1000)' },
    { code: 'R-03', desc: 'Beban Dibayar Dimuka', cond: 'IF Pembayaran Sewa > 12 Bulan', result: 'Debet: Sewa Dibayar Dimuka (1-1500) / Kredit: Kas (1-1000)' },
    { code: 'R-04', desc: 'Utang Usaha', cond: 'IF Pembelian Kredit AND Kewajiban Lancar', result: 'Debet: Persediaan (1-1300) / Kredit: Utang Usaha (2-1000)' }
  ];

  // Sample data for CoA documentation
  const coaDoc = [
    { code: '1-1000', name: 'Kas & Setara Kas', cat: 'Aset', desc: 'Uang tunai dan rekening bank yang tersedia segera.' },
    { code: '1-1200', name: 'Piutang Usaha', cat: 'Aset', desc: 'Hak klaim kepada pihak ketiga atas transaksi penjualan.' },
    { code: '2-1000', name: 'Utang Usaha', cat: 'Kewajiban', desc: 'Kewajiban pembayaran kepada supplier pihak ketiga.' },
    { code: '3-1000', name: 'Modal Pemilik', cat: 'Ekuitas', desc: 'Setoran modal awal dan sisa laba ditahan usaha.' },
    { code: '4-1000', name: 'Pendapatan Penjualan', cat: 'Pendapatan', desc: 'Hasil penjualan produk atau jasa utama UMKM.' },
    { code: '5-1000', name: 'Beban Operasional', cat: 'Beban', desc: 'Biaya utilitas, sewa, gaji, dan keperluan umum.' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a', // Clean premium dark mode background
      fontFamily: 'var(--font-sans)',
      color: '#f8fafc',
      overflowX: 'hidden'
    }}>
      {/* ─── CUSTOM CSS ANIMATIONS ─── */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes floatEffect {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: floatEffect 4s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .nav-link {
          color: #94a3b8;
          transition: all 0.25s ease;
          position: relative;
          text-decoration: none;
        }
        .nav-link:hover {
          color: #3b82f6;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: #3b82f6;
          transition: width 0.25s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .feature-card {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.15);
          background: rgba(30, 41, 59, 0.7);
        }
        .doc-tab {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1px solid transparent;
        }
        .doc-tab.active {
          background-color: #2563eb;
          color: white;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }
        .doc-tab:not(.active) {
          background-color: rgba(30, 41, 59, 0.5);
          color: #94a3b8;
          border-color: rgba(255, 255, 255, 0.05);
        }
        .doc-tab:not(.active):hover {
          color: white;
          background-color: rgba(30, 41, 59, 0.8);
        }
      `}</style>

      {/* Background Decorative Glows */}
      <div style={{
        position: 'absolute', top: '5%', left: '10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0) 70%)',
        zIndex: 0, pointerEvents: 'none', animation: 'pulseGlow 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute', top: '45%', right: '5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0) 70%)',
        zIndex: 0, pointerEvents: 'none', animation: 'pulseGlow 10s ease-in-out infinite 2s'
      }} />

      {/* ─── NAVIGATION HEADER (GLASSMORPHISM) ─── */}
      <header style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '1.25rem 2rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(to right, #3b82f6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ACA</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>Advisor</span>
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginTop: '0.1rem' }}>Expert Knowledge System</span>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <a href="#hero" className="nav-link">Beranda</a>
            <a href="#features" className="nav-link">Fitur Utama</a>
            <a href="#how-it-works" className="nav-link">Cara Kerja</a>
            <a href="#about" className="nav-link">Tentang Sistem</a>
            <a href="#docs" className="nav-link">Dokumentasi</a>
          </nav>

          {/* Action button */}
          <button 
            onClick={() => navigateTo(token ? 'dashboard' : 'login')}
            style={{
              padding: '0.55rem 1.5rem', fontSize: '0.8rem', fontWeight: 700,
              borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.5)',
              backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.15)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
              e.currentTarget.style.color = '#60a5fa';
            }}
          >
            {token ? 'Ke Dashboard →' : 'Masuk Sistem'}
          </button>
        </div>
      </header>

      {/* ─── HERO SECTION (VIBRANT GRID) ─── */}
      <section id="hero" style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '6.5rem 2rem 5rem', display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr', gap: '5rem',
        alignItems: 'center', position: 'relative', zIndex: 1
      }} className="animate-fade-in">
        <div>
          <span style={{
            background: 'linear-gradient(90deg, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0.05) 100%)',
            color: '#60a5fa', padding: '0.4rem 1rem',
            borderRadius: '999px', fontSize: '0.75rem',
            fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'inline-block', marginBottom: '1.5rem'
          }}>
            ⚡ SAK EMKM Compliance Teruji
          </span>
          <h1 style={{
            fontSize: '3.6rem', lineHeight: 1.05,
            fontWeight: 900, marginBottom: '1.5rem',
            letterSpacing: '-0.03em', color: 'white'
          }}>
            Automated Accounting <br />
            <span style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Inference Engine
            </span>
          </h1>
          <p style={{
            fontSize: '1.1rem', color: '#94a3b8',
            marginBottom: '2.5rem', lineHeight: 1.7
          }}>
            Sistem penasihat akuntansi cerdas berbasis kecerdasan buatan. Mengotomatiskan klasifikasi akun transaksi jurnal sesuai standar **SAK EMKM** menggunakan logika pelacakan **Backward Chaining** secara presisi.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handleStartConsultation} 
              style={{
                padding: '1rem 2rem', fontSize: '0.95rem', fontWeight: 800,
                borderRadius: '12px', border: 'none',
                backgroundColor: '#2563eb', color: 'white',
                cursor: 'pointer', transition: 'all 0.2s ease',
                boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Mulai Konsultasi Gratis →
            </button>
            <a 
              href="#how-it-works" 
              style={{
                padding: '1rem 2rem', fontSize: '0.95rem', fontWeight: 800,
                borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)', color: '#f8fafc',
                textDecoration: 'none', display: 'flex', alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              Cara Kerja Logika
            </a>
          </div>
        </div>

        {/* Hero Interactive Terminal Card */}
        <div style={{ position: 'relative' }} className="animate-float">
          {/* Card outer border gradient */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.3) 100%)',
            padding: '1px', borderRadius: '24px'
          }}>
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '23px', padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Header simulator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', letterSpacing: '0.05em' }}>ACA_LOGIC_SIMULATOR</span>
              </div>

              {/* Logic Box */}
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px', padding: '1.25rem',
                fontSize: '0.8rem', fontFamily: 'monospace',
                marginBottom: '1.25rem', color: '#e2e8f0', lineHeight: 1.5
              }}>
                <div style={{ color: '#3b82f6', fontWeight: 700, marginBottom: '0.4rem' }}>[INFERENCE GOAL_TRACE: DEBIT_CREDIT_ACCOUNT]</div>
                <div>
                  <span style={{ color: '#94a3b8' }}>[1] Goal set:</span> <span style={{ color: '#8b5cf6' }}>Find Journal Entry</span><br />
                  <span style={{ color: '#94a3b8' }}>[2] Check facts:</span> UMKM Dagang, Pembelian Kredit, Tempo &lt; 1 thn<br />
                  <span style={{ color: '#94a3b8' }}>[3] Executed:</span> <span style={{ color: '#f59e0b' }}>Rule-037 (Utang Lancar)</span><br />
                  <span style={{ color: '#10b981', fontWeight: 800 }}>RESULT MATCHED!</span>
                </div>
              </div>

              {/* Output Box */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                padding: '1rem 1.25rem', border: '1px solid rgba(16,185,129,0.3)',
                backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: '12px',
                marginBottom: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>✓ Terklasifikasi Otomatis</span>
                  <span style={{ backgroundColor: '#10b981', color: 'white', fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>98.9% ACCURACY</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a7f3d0', fontFamily: 'monospace' }}>
                  Debet: Persediaan Barang Dagang (1-1300)<br />
                  Kredit: Utang Usaha (2-1000)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION (GLASSMORPHISM CARDS) ─── */}
      <section id="features" style={{
        backgroundColor: '#090d16',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        padding: '6rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', color: 'white' }}>Fitur Utama Sistem Pakar</h2>
            <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto', fontSize: '0.92rem' }}>
              Dioptimalkan khusus untuk menghasilkan presisi klasifikasi akuntansi setara konsultan profesional.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem'
          }}>
            {[
              { icon: '⚙️', title: 'Klasifikasi Otomatis', desc: 'Mesin inferensi backward chaining kami memetakan transaksi langsung ke pos Debit & Kredit yang akurat.' },
              { icon: '🔍', title: 'Riwayat & Logika', desc: 'Sistem menyajikan audit log penelusuran rule yang transparan untuk setiap keputusan klasifikasi.' },
              { icon: '📚', title: 'Basis Pengetahuan EMKM', desc: 'Kumpulan fakta dan aturan terstruktur yang disesuaikan secara dinamis dengan Standar Akuntansi Keuangan EMKM.' },
              { icon: '📝', title: 'Jurnal Berpasangan Otomatis', desc: 'Menghasilkan draf catatan jurnal berpasangan akurat, lengkap dengan jumlah nominal dan keterangannya.' },
              { icon: '📊', title: 'Analitik & Grafik Laporan', desc: 'Visualisasi grafik interaktif sebaran Debit/Kredit, buku besar, dan persentase kategori akun di riwayat.' },
              { icon: '🛡️', title: 'Akses Keamanan RBAC', desc: 'Sistem login multi-peran untuk membedakan admin pengelola aturan dengan pengguna simulasi.' }
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{
                padding: '2.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', marginBottom: '1.25rem',
                  border: '1px solid rgba(37, 99, 235, 0.2)'
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.65rem', color: 'white' }}>{f.title}</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CARA KERJA SECTION (HORIZONTAL STEPPER) ─── */}
      <section id="how-it-works" style={{
        backgroundColor: '#0f172a',
        padding: '6rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', color: 'white' }}>Bagaimana ACA Bekerja?</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Alur Backward Chaining yang memproses tujuan kesimpulan hingga memvalidasi fakta di lapangan.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem',
            position: 'relative'
          }}>
            {[
              { num: '01', title: 'Pilih Profil UMKM', desc: 'Tentukan jenis usaha Anda (Dagang atau Jasa) saat mendaftar akun pertama kali.' },
              { num: '02', title: 'Jawab Kuesioner', desc: 'Jawab serangkaian pertanyaan berbasis kriteria transaksi secara interaktif.' },
              { num: '03', title: 'Backward Chaining Trace', desc: 'Sistem mencocokkan jawaban dengan premis dan aturan di basis pengetahuan.' },
              { num: '04', title: 'Hasil Jurnal & Rincian', desc: 'Dapatkan akun Debit/Kredit, nominal, persentase kecocokan, dan lembar audit.' }
            ].map((step, i) => (
              <div key={i} style={{
                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '2rem 1.5rem', borderRadius: '16px',
                position: 'relative', minHeight: '200px'
              }}>
                <span style={{
                  position: 'absolute', top: '1.25rem', right: '1.5rem',
                  color: 'rgba(59, 130, 246, 0.25)', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'monospace'
                }}>{step.num}</span>
                <h4 style={{ fontWeight: 800, marginBottom: '0.75rem', color: 'white', fontSize: '0.98rem', paddingRight: '1.5rem' }}>{step.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TENTANG SISTEM SECTION ─── */}
      <section id="about" style={{
        backgroundColor: '#090d16',
        padding: '6rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1.5rem', color: 'white' }}>Tentang ACA Advisor</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.7, fontSize: '0.9rem' }}>
              **ACA Advisor (Account Classification Advisor)** adalah sistem pakar yang dikembangkan untuk menjembatani kesenjangan pengetahuan akuntansi bagi pemilik UMKM. Pelaku usaha sering kali kesulitan mengelompokkan transaksi ke akun yang benar sesuai standar akuntansi yang berlaku.
            </p>
            <p style={{ color: '#94a3b8', marginBottom: '1.75rem', lineHeight: 1.7, fontSize: '0.9rem' }}>
              Dengan menggabungkan kecerdasan buatan konvensional (**Sistem Pakar**) dan kerangka regulasi **SAK EMKM**, sistem ini bekerja layaknya konsultan keuangan digital pribadi yang bekerja 24/7 untuk bisnis Anda.
            </p>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <h4 style={{ color: '#3b82f6', fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.25rem' }}>100%</h4>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>SAK EMKM Compliant</p>
              </div>
              <div>
                <h4 style={{ color: '#8b5cf6', fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.25rem' }}>&lt; 3 Detik</h4>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Waktu Inferensi</p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px', padding: '2.5rem',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'white' }}>Mengapa Backward Chaining?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: '1rem' }}>
              Metode **Backward Chaining** (pelacakan ke belakang) bekerja efisien dengan menetapkan kesimpulan (gol) terlebih dahulu—yaitu kode akun Debit & Kredit yang potensial—kemudian bergerak mundur memeriksa fakta-fakta lapangan yang dimasukkan oleh UMKM.
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.65 }}>
              Hal ini sangat cocok karena jumlah akun solusi dalam SAK EMKM bersifat terhingga dan pasti, sementara kombinasi kondisi transaksi di lapangan sangat bervariasi.
            </p>
          </div>
        </div>
      </section>

      {/* ─── DOKUMENTASI SECTION (TABBED VIEW) ─── */}
      <section id="docs" style={{
        backgroundColor: '#0f172a',
        padding: '6rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', color: 'white' }}>Dokumentasi Sistem</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
              Kumpulan referensi basis aturan (*rules*) dan bagan kode akun standar (*Chart of Accounts*) SAK EMKM.
            </p>
          </div>

          {/* Tabs header */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <button 
              className={`doc-tab ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              📚 Basis Aturan (Rules)
            </button>
            <button 
              className={`doc-tab ${activeTab === 'coa' ? 'active' : ''}`}
              onClick={() => setActiveTab('coa')}
            >
              📋 Chart of Accounts (CoA)
            </button>
          </div>

          {/* Tab content: Rules */}
          {activeTab === 'rules' && (
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px', padding: '1.5rem',
              animation: 'fadeIn 0.3s ease forwards'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: '#e2e8f0', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>KODE</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>DESKRIPSI LOGIKA</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>PREMIS (KONDISI SYARAT)</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>KONSTRUKSI REKOMENDASI JURNAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rulesDoc.map((rule, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < rulesDoc.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td style={{ padding: '1rem', fontWeight: 800, color: '#3b82f6' }}>{rule.code}</td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{rule.desc}</td>
                        <td style={{ padding: '1rem', color: '#94a3b8', fontFamily: 'monospace' }}>{rule.cond}</td>
                        <td style={{ padding: '1rem', color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>{rule.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab content: CoA */}
          {activeTab === 'coa' && (
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px', padding: '1.5rem',
              animation: 'fadeIn 0.3s ease forwards'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: '#e2e8f0', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>KODE AKUN</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>NAMA AKUN</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>KLASIFIKASI</th>
                      <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 800 }}>DESKRIPSI STANDAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coaDoc.map((coa, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < coaDoc.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td style={{ padding: '1rem', fontWeight: 800, color: '#8b5cf6', fontFamily: 'monospace' }}>{coa.code}</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{coa.name}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800,
                            padding: '0.2rem 0.5rem', borderRadius: '4px',
                            backgroundColor: coa.cat === 'Aset' ? '#e0f2fe' : coa.cat === 'Kewajiban' ? '#fff7ed' : coa.cat === 'Ekuitas' ? '#f5f3ff' : coa.cat === 'Pendapatan' ? '#dcfce7' : '#fee2e2',
                            color: coa.cat === 'Aset' ? '#0369a1' : coa.cat === 'Kewajiban' ? '#c2410c' : coa.cat === 'Ekuitas' ? '#6d28d9' : coa.cat === 'Pendapatan' ? '#15803d' : '#b91c1c'
                          }}>{coa.cat}</span>
                        </td>
                        <td style={{ padding: '1rem', color: '#94a3b8', lineHeight: 1.5 }}>{coa.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── CALL TO ACTION SECTION ─── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        color: 'white', padding: '6rem 2rem', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circle glow */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Siap Merapikan Keuangan UMKM Anda?
          </h2>
          <p style={{ color: '#bfdbfe', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Hindari kesalahan pencatatan transaksi sekarang juga. Jalankan mesin inferensi pakar kami dan pastikan laporan audit UMKM Anda memenuhi kriteria legalitas SAK EMKM.
          </p>
          <button 
            onClick={handleStartConsultation} 
            style={{
              padding: '1.1rem 2.25rem', fontSize: '1rem', color: '#1e3a8a', fontWeight: 800,
              backgroundColor: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)', transition: 'all 0.25s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }}
          >
            Mulai Konsultasi Sekarang
          </button>
        </div>
      </section>

      {/* ─── FOOTER SECTION ─── */}
      <footer style={{
        backgroundColor: '#090d16', color: '#64748b', padding: '5rem 2rem 3rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '5rem',
          fontSize: '0.85rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>ACA</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6' }}>Advisor</span>
            </div>
            <p style={{ lineHeight: 1.7, marginBottom: '1.5rem', color: '#94a3b8' }}>
              Sistem Penasihat Klasifikasi Akun (ACA) adalah instrumen digital berbasis web untuk membantu standarisasi pembukuan UMKM secara instan, transparan, dan patuh regulasi keuangan.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 800, marginBottom: '1.25rem' }}>Menu Cepat</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
              <li><a href="#hero" style={{ color: '#94a3b8', textDecoration: 'none' }}>Beranda</a></li>
              <li><a href="#features" style={{ color: '#94a3b8', textDecoration: 'none' }}>Fitur Utama</a></li>
              <li><a href="#how-it-works" style={{ color: '#94a3b8', textDecoration: 'none' }}>Cara Kerja</a></li>
              <li><a href="#about" style={{ color: '#94a3b8', textDecoration: 'none' }}>Tentang Sistem</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 800, marginBottom: '1.25rem' }}>Informasi Kontak</h4>
            <p style={{ lineHeight: 1.7, color: '#94a3b8' }}>
              📧 support@aca-advisor.com<br />
              📍 DKI Jakarta, Indonesia<br />
              📞 +62 21 5092 1234
            </p>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px', margin: '3.5rem auto 0', paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)', textAlign: 'center',
          fontSize: '0.75rem', color: '#475569'
        }}>
          © 2026 ACA Advisor System. Hak Cipta Dilindungi. SAK EMKM Compliant Audit Engine.
        </div>
      </footer>
    </div>
  );
};
