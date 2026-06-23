import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, navigateTo } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  return (
    <div 
      className="login-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#f8fafc', // Soft blue-grey background
        fontFamily: 'var(--font-sans)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .login-container {
            padding: 1rem !important;
          }
          .login-split-card {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            border-radius: 16px !important;
          }
          .login-left-panel {
            padding: 2.5rem 1.5rem !important;
          }
          .login-right-panel {
            display: none !important;
          }
        }
      `}</style>
      {/* Decorative Light Blue Glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0) 75%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, rgba(96,165,250,0) 75%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Split Card */}
      <div 
        className="login-split-card"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          maxWidth: '1080px',
          width: '100%',
          minHeight: '640px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Left Side: Form */}
        <div 
          className="login-left-panel"
          style={{
            padding: '3.5rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Logo & Header */}
          <div>
            <div 
              style={{ display: 'flex', flexDirection: 'column', marginBottom: '2.5rem', cursor: 'pointer' }}
              onClick={() => navigateTo('landing')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>ACA</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Advisor</span>
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '0.15rem' }}>
                Expert System / SAK EMKM Compliance
              </span>
            </div>

            <h2 style={{ fontSize: '1.85rem', fontWeight: 900, marginBottom: '0.5rem', color: '#0f172a', letterSpacing: '-0.025em' }}>Selamat Datang</h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Silakan masuk dengan kredensial terdaftar untuk berkonsultasi dengan mesin pakar.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Alamat Email</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.95rem' }}>✉</span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="nama@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      paddingLeft: '38px', height: '46px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.88rem', width: '100%', outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, margin: 0 }}>Password</label>
                  <button 
                    type="button" 
                    className="btn-link" 
                    style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }} 
                    onClick={() => alert('Gunakan password akun terdaftar Anda.')}
                  >
                    Lupa Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.95rem' }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      paddingLeft: '38px', paddingRight: '42px', height: '46px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.88rem', width: '100%', outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <label htmlFor="remember" style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                  Ingat sesi saya di perangkat ini
                </label>
              </div>

              <button 
                type="submit" 
                style={{
                  width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 800,
                  borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white',
                  cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Masuk ke Aplikasi →
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Belum memiliki akun?{' '}
              <button 
                onClick={() => navigateTo('register')} 
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                Daftar Sekarang
              </button>
            </div>
          </div>


        </div>

        {/* Right Side: Blue Premium Panel */}
        <div 
          className="login-right-panel"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            padding: '3.5rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            borderLeft: '1px solid #cbd5e1'
          }}
        >
          {/* Abstract Grid Background Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none', zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff', padding: '0.3rem 0.75rem',
              borderRadius: '99px', fontSize: '0.68rem',
              fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.1em', display: 'inline-block',
              marginBottom: '2rem', border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              🔮 Knowledge Base Status
            </span>

            <h3 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              Klasifikasi Akuntansi UMKM Secara Instan
            </h3>
            <p style={{ color: '#bfdbfe', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Mesin inferensi pakar dirancang untuk membantu UMKM memproses fakta transaksi kuesioner dan menerbitkan rekomendasi jurnal akuntansi Debit/Kredit yang akurat.
            </p>
          </div>

          {/* Glassmorphic Mockup Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 10, marginBottom: '2rem' }}>
            {/* Stat Item 1 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold'
              }}>✓</div>
              <div>
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, margin: 0 }}>SAK EMKM Validated</h4>
                <p style={{ color: '#bfdbfe', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Bagan kode akun dan aturan terstandarisasi penuh.</p>
              </div>
            </div>

            {/* Stat Item 2 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
              }}>⚙️</div>
              <div>
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, margin: 0 }}>Backward Chaining Trace</h4>
                <p style={{ color: '#bfdbfe', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Penelusuran rule akuntansi transparan & berdaya cepat.</p>
              </div>
            </div>
          </div>

          {/* Footer stats */}
          <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem', position: 'relative', zIndex: 10 }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>98.9%</div>
              <div style={{ fontSize: '0.68rem', color: '#bfdbfe', fontWeight: 700, textTransform: 'uppercase' }}>Akurasi Engine</div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>Aktif</div>
              <div style={{ fontSize: '0.68rem', color: '#bfdbfe', fontWeight: 700, textTransform: 'uppercase' }}>Database Aturan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
