import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  DashboardIcon,
  ConsultationIcon,
  AccountsIcon,
  RulesIcon,
  HistoryIcon,
  ReportsIcon,
  SettingsIcon,
  ProfileIcon,
  LogoutIcon
} from './Icons';

export const Sidebar = () => {
  const { user, currentPage, navigateTo, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'consultation', label: 'Konsultasi', icon: <ConsultationIcon className="w-5 h-5" /> },
    { id: 'accounts', label: 'Akun Akuntansi', icon: <AccountsIcon className="w-5 h-5" /> },
    { id: 'rules', label: 'Rule Base', icon: <RulesIcon className="w-5 h-5" /> },
    { id: 'history', label: 'Riwayat', icon: <HistoryIcon className="w-5 h-5" /> },
    { id: 'reports', label: 'Laporan', icon: <ReportsIcon className="w-5 h-5" /> },
    { id: 'profile', label: 'Profil Saya', icon: <ProfileIcon className="w-5 h-5" /> }
  ];

  // Admin exclusive page
  if (isAdmin) {
    menuItems.push({ id: 'settings', label: 'Pengaturan', icon: <SettingsIcon className="w-5 h-5" /> });
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <aside style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        padding: '1.5rem 1rem'
      }}>
        {/* System branding */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '2rem',
          paddingLeft: '0.5rem'
        }} onClick={() => navigateTo('dashboard')} className="cursor-pointer">
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--primary)',
            letterSpacing: '-0.025em'
          }}>
            ACA Advisor
          </span>
          <span style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginTop: '0.1rem'
          }}>
            Expert System
          </span>
        </div>

        {/* Navigation Menu */}
        <nav style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          {menuItems.map(item => {
            const isActive = currentPage === item.id || 
              (item.id === 'consultation' && currentPage === 'consultation-wizard');
            
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  transition: 'var(--transition)'
                }}
                className="sidebar-link"
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleLogoutClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--danger)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
              textAlign: 'left',
              transition: 'var(--transition)',
              marginTop: 'auto'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <LogoutIcon className="w-5 h-5" />
            </span>
            <span>Keluar</span>
          </button>
        </nav>

        {/* User Card */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1rem',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--primary)'
          }}>
            {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <h4 style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>{user.name}</h4>
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              fontWeight: 600
            }}>
              {isAdmin ? 'Senior Accountant' : `${user.business_name || 'UMKM Owner'} (${user.business_type === 'jasa' ? 'Jasa' : 'Dagang'})`}
            </p>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.5rem'
            }}>
              <LogoutIcon className="w-6 h-6" />
            </div>
            <h3 className="modal-header" style={{ marginBottom: '0.5rem' }}>Konfirmasi Keluar</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Apakah Anda yakin ingin keluar dari sistem ACA Advisor? Pastikan seluruh data konsultasi Anda telah tersimpan.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={handleCancelLogout} style={{ flex: 1 }}>Batal</button>
              <button className="btn btn-danger" onClick={handleConfirmLogout} style={{ flex: 1 }}>Logout</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .sidebar-link:hover {
          background-color: var(--primary-light) !important;
          color: var(--primary) !important;
        }
      `}</style>
    </>
  );
};
