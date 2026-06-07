import React from 'react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { token, navigateTo } = useAuth();

  const handleStartConsultation = () => {
    if (token) {
      navigateTo('consultation');
    } else {
      navigateTo('login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'var(--font-sans)',
      color: '#0f172a'
    }}>
      {/* Navigation Header */}
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>ACA Advisor</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Expert System</span>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <a href="#hero" style={{ color: '#2563eb' }}>Beranda</a>
            <a href="#features" style={{ color: '#475569' }}>Fitur</a>
            <a href="#how-it-works" style={{ color: '#475569' }}>Cara Kerja</a>
            <a href="#docs" style={{ color: '#475569' }}>Dokumentasi</a>
            <a href="#about" style={{ color: '#475569' }}>Tentang Sistem</a>
          </nav>

          {/* Action button */}
          <button 
            onClick={() => navigateTo(token ? 'dashboard' : 'login')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            {token ? 'Ke Dashboard' : 'Masuk'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '5rem 2rem',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '4rem',
        alignItems: 'center'
      }}>
        <div>
          <span style={{
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: '1px solid #bfdbfe',
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            SAK EMKM Compliance
          </span>
          <h1 style={{
            fontSize: '3rem',
            lineHeight: 1.1,
            fontWeight: 800,
            marginBottom: '1.5rem',
            color: '#0f172a'
          }}>
            Sistem Pakar Akuntansi UMKM
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#475569',
            marginBottom: '2.5rem',
            lineHeight: 1.6
          }}>
            Membantu UMKM mengklasifikasikan transaksi keuangan secara akurat menggunakan metode <strong>Backward Chaining</strong>. Dapatkan keputusan akun jurnal yang terstandarisasi.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleStartConsultation} className="btn btn-primary" style={{ padding: '0.9rem 1.75rem', fontSize: '0.95rem' }}>
              Mulai Konsultasi →
            </button>
            <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '0.9rem 1.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
              Pelajari Metode
            </a>
          </div>
        </div>

        {/* Hero Visual Logic Engine Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Simulasi Logika ACA</span>
            <span style={{ fontSize: '1rem' }}>⚙️</span>
          </div>

          {/* Logic Box */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ color: '#2563eb', fontWeight: 700, marginBottom: '0.25rem' }}>RULE-042: VALIDASI ASET</div>
            <div style={{ color: '#475569' }}>
              <strong>IF</strong> (Masa_Manfaat &gt; 12 bln) <br />
              <strong>AND</strong> (Nilai &gt; Batas_Material) <br />
              <strong>THEN</strong> Klasifikasi = "Aset Tetap"
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '-0.5rem 0 1rem', color: '#64748b' }}>↓</div>

          {/* Result Box */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.25rem',
            border: '1px solid #bfdbfe',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a' }}>✓ Klasifikasi Ditemukan: Aset Tetap</span>
            <span style={{
              backgroundColor: '#10b981',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-sm)'
            }}>99% Match</span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#059669',
            backgroundColor: '#ecfdf5',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)'
          }}>
            ✓ Verified SAK EMKM
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        backgroundColor: 'white',
        borderTop: '1px solid #e2e8f0',
        padding: '5rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Fitur Utama Sistem Pakar</h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
              Dirancang untuk memberikan presisi tingkat akademis bagi pelaku usaha mikro, kecil, dan menengah.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem'
          }}>
            {/* F1 */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '1rem'
              }}>⚙️</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Klasifikasi Otomatis</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Mesin inferensi mengidentifikasi akun berdasarkan karakteristik transaksi secara akurat.
              </p>
            </div>
            {/* F2 */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '1rem'
              }}>🔍</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Riwayat Logika</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Telusuri kembali alasan sistem mengambil keputusan melalui alur rule-tracing yang transparan.
              </p>
            </div>
            {/* F3 */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '1rem'
              }}>📚</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Basis Pengetahuan</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Kumpulan fakta dan aturan akuntansi yang selalu diperbarui sesuai standar EMKM terbaru.
              </p>
            </div>
            {/* F4 */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '1rem'
              }}>📝</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Jurnal Rekomendasi</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Otomatisasi pembuatan draf jurnal akuntansi segera setelah proses klasifikasi selesai.
              </p>
            </div>
            {/* F5 */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '1rem'
              }}>📊</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Laporan & Analitik</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Statistik jenis transaksi terbanyak dan laporan bulanan dengan ekspor data terintegrasi.
              </p>
            </div>
            {/* F6 */}
            <div style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                marginBottom: '1rem'
              }}>🛡️</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Akses Terbatas (RBAC)</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Pemilah hak akses Administrator untuk basis data aturan dan Pengguna untuk simulasi konsultasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{
        backgroundColor: '#e2e8f0',
        padding: '5rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Bagaimana ACA Bekerja?</h2>
            <p style={{ color: '#475569' }}>
              Alur Backward Chaining untuk memastikan setiap kesimpulan didukung oleh fakta yang valid.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem'
          }}>
            {/* Step 1 */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #cbd5e1',
              position: 'relative'
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#cbd5e1', fontWeight: 800 }}>01</span>
              <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Pilih Jenis Usaha</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Tentukan profil UMKM Anda, baik Usaha Jasa maupun Usaha Dagang.</p>
            </div>
            {/* Step 2 */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #cbd5e1',
              position: 'relative'
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#cbd5e1', fontWeight: 800 }}>02</span>
              <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Jawab Pertanyaan</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Jawab kuisioner Ya/Tidak secara interaktif untuk melengkapi basis fakta.</p>
            </div>
            {/* Step 3 */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #cbd5e1',
              position: 'relative'
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#cbd5e1', fontWeight: 800 }}>03</span>
              <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Logika Backward Chaining</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Sistem menelusuri aturan (rules) dari kesimpulan tujuan menuju fakta.</p>
            </div>
            {/* Step 4 */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #cbd5e1',
              position: 'relative'
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#cbd5e1', fontWeight: 800 }}>04</span>
              <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Hasil Klasifikasi</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Dapatkan rekomendasi Kode Akun SAK EMKM dan detail Jurnal debit/kredit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action section */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        color: 'white',
        padding: '5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>
            Siap Menata Keuangan UMKM Anda?
          </h2>
          <p style={{ color: '#bfdbfe', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
            Mulai gunakan sistem pakar hari ini dan pastikan setiap rupiah tercatat dengan benar sesuai standar profesional.
          </p>
          <button 
            onClick={handleStartConsultation} 
            className="btn btn-secondary" 
            style={{ padding: '1rem 2rem', fontSize: '1rem', color: '#2563eb', fontWeight: 700, backgroundColor: 'white', border: 'none' }}
          >
            Daftar Gratis Sekarang
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="docs" style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        padding: '4rem 2rem',
        borderTop: '1px solid #1e293b'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr',
          gap: '4rem',
          fontSize: '0.85rem'
        }}>
          <div>
            <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '1rem' }}>ACA Advisor</h4>
            <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
              Sistem Penasihat Klasifikasi Akun (ACA) adalah alat bantu keputusan berbasis pengetahuan untuk mempermudah UMKM dalam pelaporan keuangan.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>📘</span>
              <span style={{ fontSize: '1rem' }}>🌐</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Navigasi</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><a href="#hero" style={{ color: '#94a3b8' }}>Beranda</a></li>
              <li><a href="#features" style={{ color: '#94a3b8' }}>Fitur Sistem</a></li>
              <li><a href="#how-it-works" style={{ color: '#94a3b8' }}>Cara Kerja</a></li>
              <li><a href="#docs" style={{ color: '#94a3b8' }}>Dokumentasi API</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Kontak</h4>
            <p style={{ lineHeight: 1.6 }}>
              Email: support@aca-advisor.com<br />
              Location: Jakarta, Indonesia<br />
              Phone: +62 21 555 0123
            </p>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '2rem auto 0',
          paddingTop: '2rem',
          borderTop: '1px solid #1e293b',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          © 2026 ACA Advisor System. Built for SME Financial Excellence.
        </div>
      </footer>
    </div>
  );
};
