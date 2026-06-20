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
      backgroundColor: '#f8fafc', // Soft blue-grey background
      fontFamily: 'var(--font-sans)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 1fr',
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
      }}>
        {/* Left Side: Form */}
        <div style={{
          padding: '3rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          {/* Logo & Header */}
          <div>
            <div 
              style={{ display: 'flex', flexDirection: 'column', marginBottom: '2rem', cursor: 'pointer' }}
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

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem', color: '#0f172a', letterSpacing: '-0.025em' }}>Pendaftaran Akun Baru</h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Mulai gunakan sistem penasihat klasifikasi akun dengan membuat akun baru.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Nama Lengkap *</label>
                  <input
                    type="text"
                    placeholder="Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      padding: '0 14px', height: '44px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'all 0.2s'
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
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Alamat Email *</label>
                  <input
                    type="email"
                    placeholder="budi@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      padding: '0 14px', height: '44px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'all 0.2s'
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Nama Usaha</label>
                  <input
                    type="text"
                    placeholder="Laundry Berkah"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{
                      padding: '0 14px', height: '44px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Jenis Usaha *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    style={{
                      padding: '0 14px', height: '44px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none', cursor: 'pointer', transition: 'all 0.2s'
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
                  >
                    <option value="jasa">UMKM Jasa</option>
                    <option value="dagang">UMKM Dagang</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      padding: '0 14px', height: '44px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'all 0.2s'
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
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Konfirmasi Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      padding: '0 14px', height: '44px', borderRadius: '10px',
                      backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
                      color: '#0f172a', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'all 0.2s'
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
                Buat Akun Baru →
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Sudah memiliki akun?{' '}
              <button 
                onClick={() => navigateTo('login')} 
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                Masuk
              </button>
            </div>
          </div>

          {/* Footer compliance */}
          <div style={{
            fontSize: '0.65rem', color: '#64748b', fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.05em', marginTop: '1.5rem'
          }}>
            🛡️ ACA ADVISOR • SAK EMKM AUDIT ENGINE V2.4.0
          </div>
        </div>

        {/* Right Side: Decorative Compliance Dashboard Cards */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderLeft: '1px solid #cbd5e1'
        }}>
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
              🎯 Akurasi & Kepatuhan
            </span>

            <h3 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              Optimalkan Laporan Pembukuan Anda
            </h3>
            <p style={{ color: '#bfdbfe', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Dengan mendaftar, sistem akan mengarahkan logika kuesioner secara otomatis sesuai dengan profil industri usaha (Dagang/Jasa) yang Anda pilih.
            </p>
          </div>

          {/* Dynamic glassmorphic mockup cards */}
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
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, margin: 0 }}>Profil Usaha Terarah</h4>
                <p style={{ color: '#bfdbfe', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Logika sistem diatur khusus untuk dagang/jasa secara otomatis.</p>
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
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: 800, margin: 0 }}>SAK EMKM Ready</h4>
                <p style={{ color: '#bfdbfe', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>Memenuhi standar laporan keuangan mikro yang patuh hukum.</p>
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
