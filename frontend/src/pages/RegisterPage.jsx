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
      backgroundColor: '#f1f5f9',
      fontFamily: 'var(--font-sans)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Split Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-premium)',
        overflow: 'hidden',
        maxWidth: '1000px',
        width: '100%',
        minHeight: '650px'
      }}>
        {/* Left Side: Form */}
        <div style={{
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>ACA Advisor</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Expert System for SME Accounting Compliance
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', color: '#0f172a' }}>Pendaftaran Akun Baru</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Mulai kelola sistem pencatatan transaksi standar SAK EMKM sekarang.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nama Lengkap *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="budi@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Nama Usaha</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Laundry Berkah"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Jenis Usaha *</label>
                  <select
                    className="form-control"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                  >
                    <option value="jasa">UMKM Jasa</option>
                    <option value="dagang">UMKM Dagang</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Konfirmasi Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
                Daftar Akun Baru
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
              Sudah memiliki akun?{' '}
              <button className="btn-link" onClick={() => navigateTo('login')}>Masuk</button>
            </div>
          </div>

          <div style={{
            fontSize: '0.7rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '1.5rem'
          }}>
            🛡️ SAK EMKM COMPLIANT SYSTEM VER 2.4.0
          </div>
        </div>

        {/* Right Side: Decorative */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎯</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>
            Akurasi & Kepatuhan Terjamin
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#bfdbfe', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
            Mesin inferensi backward chaining kami memandu penentuan akun debit/kredit yang kompatibel penuh dengan regulasi SAK EMKM terbaru.
          </p>
        </div>
      </div>
    </div>
  );
};
