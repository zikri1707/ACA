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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f1f5f9',
      fontFamily: 'var(--font-sans)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Split Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-premium)',
        overflow: 'hidden',
        maxWidth: '1000px',
        width: '100%',
        minHeight: '600px'
      }}>
        {/* Left Side: Form */}
        <div style={{
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Logo & Header */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '3rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>ACA Advisor</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Expert System for SME Accounting Compliance
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>Selamat Datang</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
              Silakan masuk ke akun Anda untuk melanjutkan konsultasi.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>✉</span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="nama@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <button type="button" className="btn-link" style={{ fontSize: '0.75rem' }} onClick={() => alert('Fitur demo: Silakan hubungi admin di admin@aca.com')}>Lupa Password?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="remember" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                  Ingat saya untuk 30 hari
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}>
                Masuk <span style={{ marginLeft: '0.5rem' }}>→</span>
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
              Belum memiliki akun?{' '}
              <button className="btn-link" onClick={() => navigateTo('register')}>Daftar</button>
            </div>
          </div>

          {/* Footer compliance */}
          <div style={{
            fontSize: '0.7rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '2rem'
          }}>
            🛡️ SAK EMKM COMPLIANT SYSTEM VER 2.4.0
          </div>
        </div>

        {/* Right Side: Decorative Status Cards */}
        <div style={{
          background: 'linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glass background decoration */}
          <div style={{
            position: 'absolute',
            width: '150%',
            height: '150%',
            top: '-20%',
            left: '-20%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }} />

          {/* Card 1: System Status */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.6)',
            position: 'relative',
            zIndex: 10,
            maxWidth: '360px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              📈 System Status
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>99.8% Accuracy</h3>
            
            {/* Custom progress bar */}
            <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.75rem' }}>
              <div style={{ width: '99.8%', height: '100%', backgroundColor: '#2563eb' }} />
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
              Advanced rule-tracing engine validates every classification against national standards.
            </p>
          </div>

          {/* Center Graphic: Book */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150px',
            fontSize: '5rem',
            position: 'relative',
            zIndex: 5
          }}>
            📖
          </div>

          {/* Card 2: Knowledge Base Update */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.6)',
            position: 'relative',
            zIndex: 10,
            maxWidth: '360px',
            marginLeft: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              🔄 Knowledge Base Updated
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
              Current logic paths are synchronized with the latest Indonesian SAK EMKM regulations as of 2024.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
