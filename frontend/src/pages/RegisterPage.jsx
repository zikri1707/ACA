import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('jasa');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, navigateTo, showToast } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !businessType || !password) {
      showToast('Harap isi semua field wajib.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok.', 'danger');
      return;
    }
    await register(name, email, businessName, businessType, password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#090d16', // Sleek dark slate theme background
      fontFamily: 'var(--font-sans)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0) 75%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0) 75%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Split Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 1fr',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 30px 100px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        maxWidth: '1080px',
        width: '100%',
        minHeight: '640px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Left Side: Form */}
        <div style={{
          padding: '3rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a'
        }}>
          {/* Logo & Header */}
          <div>
            <div 
              style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem', cursor: 'pointer' }}
              onClick={() => navigateTo('landing')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(to right, #3b82f6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ACA</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>Advisor</span>
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '0.15rem' }}>
                Expert System / SAK EMKM Compliance
              </span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white', letterSpacing: '-0.025em' }}>Pendaftaran Akun Baru</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Mulai gunakan sistem penasihat klasifikasi akun dengan membuat akun baru.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>Nama Lengkap *</label>
                  <input
                    type="text"
                    placeholder="Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      padding: '0 12px', height: '42px', borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white', fontSize: '0.82rem', width: '100%', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>Alamat Email *</label>
                  <input
                    type="email"
                    placeholder="budi@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      padding: '0 12px', height: '42px', borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white', fontSize: '0.82rem', width: '100%', outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>Nama Usaha</label>
                  <input
                    type="text"
                    placeholder="Laundry Berkah"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{
                      padding: '0 12px', height: '42px', borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white', fontSize: '0.82rem', width: '100%', outline: 'none'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>Jenis Usaha *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    style={{
                      padding: '0 12px', height: '42px', borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white', fontSize: '0.82rem', width: '100%', outline: 'none', cursor: 'pointer'
                    }}
                    required
                  >
                    <option value="jasa" style={{ backgroundColor: '#0f172a' }}>UMKM Jasa</option>
                    <option value="dagang" style={{ backgroundColor: '#0f172a' }}>UMKM Dagang</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      padding: '0 12px', height: '42px', borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white', fontSize: '0.82rem', width: '100%', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>Konfirmasi Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      padding: '0 12px', height: '42px', borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white', fontSize: '0.82rem', width: '100%', outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                style={{
                  width: '100%', padding: '0.8rem', fontSize: '0.88rem', fontWeight: 800,
                  borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white',
                  cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Buat Akun Baru →
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Sudah memiliki akun?{' '}
              <button 
                onClick={() => navigateTo('login')} 
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                Masuk
              </button>
            </div>
          </div>

          {/* Footer compliance */}
          <div style={{
            fontSize: '0.65rem', color: '#475569', fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.05em'
          }}>
            🛡️ ACA ADVISOR • SAK EMKM AUDIT ENGINE V2.4.0
          </div>
        </div>

        {/* Right Side: Decorative Compliance Dashboard Cards */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #090d16 100%)',
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderLeft: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Abstract Grid Background Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.12) 0%, transparent 60%)',
            pointerEvents: 'none', zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            <span style={{
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa', padding: '0.3rem 0.75rem',
              borderRadius: '99px', fontSize: '0.68rem',
              fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.1em', display: 'inline-block',
              marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              🎯 Akurasi & Kepatuhan
            </span>

            <h3 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              Optimalkan Laporan Pembukuan Anda
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Dengan mendaftar, sistem akan mengarahkan logika kuesioner secara otomatis sesuai dengan profil industri usaha (Dagang/Jasa) yang Anda pilih.
            </p>
          </div>

          {/* Dynamic glassmorphic mockup cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 10, marginBottom: '2rem' }}>
            {/* Stat Item 1 */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
              }}>✓</div>
              <div>
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, margin: 0 }}>Profil Usaha Terarah</h4>
                <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Logika sistem diatur khusus untuk dagang/jasa secara otomatis.</p>
              </div>
            </div>

            {/* Stat Item 2 */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
              }}>⚙️</div>
              <div>
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, margin: 0 }}>SAK EMKM Ready</h4>
                <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Memenuhi standar laporan keuangan mikro yang patuh hukum.</p>
              </div>
            </div>
          </div>

          {/* Footer stats */}
          <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', position: 'relative', zIndex: 10 }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>98.9%</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Akurasi Engine</div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>Aktif</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Database Aturan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
