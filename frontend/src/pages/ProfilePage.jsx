import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, token, updateProfile, showToast } = useAuth();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [businessType, setBusinessType] = useState(user?.business_type || 'jasa');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Nama Lengkap dan Email wajib diisi.', 'warning');
      return;
    }
    await updateProfile({
      name,
      email,
      business_name: businessName,
      business_type: businessType
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Semua field password wajib diisi.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password baru tidak cocok.', 'danger');
      return;
    }

    try {
      const response = await fetch('/api/auth/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengubah password.', 'danger');
    }
  };

  return (
    <div className="grid-cols-2">
      {/* Left panel: Edit Profil */}
      <div className="card">
        <div className="card-title">Pembaruan Profil Usaha</div>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nama Usaha</label>
              <input 
                type="text" 
                className="form-control" 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Simpan Perubahan Profil
          </button>
        </form>
      </div>

      {/* Right panel: Ganti Password */}
      <div className="card">
        <div className="card-title">Ganti Kata Sandi Keamanan</div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">Password Saat Ini *</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password Baru *</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru *</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '1rem' }}>
            Ganti Password Baru
          </button>
        </form>
      </div>
    </div>
  );
};
