import React, { useState, useEffect } from 'react';
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
  const [logoutHover, setLogoutHover] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '88px' : '260px');
  }, [isCollapsed]);

  if (!user) return null;

  const isAdmin = user.role === 'Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'consultation', label: 'Konsultasi', icon: <ConsultationIcon className="w-5 h-5" /> },
    { id: 'accounts', label: 'Akun Akuntansi', icon: <AccountsIcon className="w-5 h-5" /> },
    { id: 'rules', label: 'Rule Base', icon: <RulesIcon className="w-5 h-5" /> },
    { id: 'history', label: 'Riwayat', icon: <HistoryIcon className="w-5 h-5" /> },
    // { id: 'reports', label: 'Laporan', icon: <ReportsIcon className="w-5 h-5" /> },
    { id: 'profile', label: 'Profil Saya', icon: <ProfileIcon className="w-5 h-5" /> }
  ];

  if (isAdmin) {
    menuItems.push({ id: 'settings', label: 'Pengaturan', icon: <SettingsIcon className="w-5 h-5" /> });
  }

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => { setShowLogoutModal(false); setConfirming(false); };
  const handleConfirmLogout = () => {
    setConfirming(true);
    setTimeout(() => { setShowLogoutModal(false); logout(); }, 600);
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <aside style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'fixed',
        top: 0, left: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        padding: '1.5rem 1rem',
        transition: 'width 0.3s ease'
      }}>
        {/* System branding */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '2rem', paddingLeft: isCollapsed ? '0' : '0.5rem',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: isCollapsed ? '1rem' : '0'
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column' }} onClick={() => navigateTo('dashboard')} className="cursor-pointer">
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.025em' }}>
                ACA Advisor
              </span>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                Expert System
              </span>
            </div>
          ) : (
            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => navigateTo('dashboard')}>
              ACA
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'var(--primary-light)', border: 'none', cursor: 'pointer',
              color: 'var(--primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0.4rem', borderRadius: '8px',
              transition: 'all 0.2s ease', width: '32px', height: '32px'
            }}
            className="sidebar-toggle"
            title={isCollapsed ? "Buka Menu" : "Tutup Menu"}
          >
            {isCollapsed ? '»' : '«'}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.map(item => {
            const isActive = currentPage === item.id ||
              (item.id === 'consultation' && currentPage === 'consultation-wizard');
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: 'none',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem', textAlign: 'left', transition: 'var(--transition)',
                  justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}
                className="sidebar-link"
                title={isCollapsed ? item.label : undefined}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}

          {/* ─── Premium Logout Button ─── */}
          <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
            <button
              onClick={handleLogoutClick}
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              title={isCollapsed ? "Keluar" : undefined}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '0.85rem 0' : '0.85rem 1rem',
                borderRadius: '12px',
                border: logoutHover ? '1.5px solid #fca5a5' : '1.5px solid #fecdd3',
                background: logoutHover
                  ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                  : 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
                color: logoutHover ? '#b91c1c' : '#ef4444',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                textAlign: 'left',
                transition: 'all 0.25s ease',
                boxShadow: logoutHover
                  ? '0 4px 16px rgba(239,68,68,0.2)'
                  : '0 1px 4px rgba(239,68,68,0.08)',
                transform: logoutHover ? 'translateY(-1px)' : 'none'
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '8px',
                backgroundColor: logoutHover ? '#fca5a5' : '#fecdd3',
                transition: 'all 0.25s ease',
                flexShrink: 0
              }}>
                <LogoutIcon className="w-4 h-4" />
              </span>
              {!isCollapsed && <span>Keluar</span>}
              {!isCollapsed && logoutHover && (
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.7 }}>→</span>
              )}
            </button>
          </div>
        </nav>

        {/* User Card */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1rem', marginTop: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white', fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
          }} title={isCollapsed ? user.name : undefined}>
            {initials}
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                {isAdmin ? 'Senior Accountant' : `${user.business_name || 'UMKM Owner'}`}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Premium Logout Modal ─── */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeInOverlay 0.2s ease'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px', margin: '1rem',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, #ffffff 0%, #fff7f7 100%)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5)',
            overflow: 'hidden',
            animation: 'slideUpModal 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Top gradient banner */}
            <div style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f97316 100%)',
              padding: '2rem 2rem 3rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '-30px', width: '150px', height: '150px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />

              {/* Icon */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                backdropFilter: 'blur(4px)',
                position: 'relative', zIndex: 1
              }}>
                <span style={{ fontSize: '2rem' }}>👋</span>
              </div>
              <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800, margin: 0, position: 'relative', zIndex: 1 }}>
                Sampai jumpa!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '0.4rem', position: 'relative', zIndex: 1 }}>
                {user.name}
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem', marginTop: '-1rem', position: 'relative' }}>
              {/* White card overlay on gradient */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                marginTop: '-0.5rem',
                marginBottom: '1.25rem',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #f1f5f9'
              }}>
                <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.65, textAlign: 'center', margin: 0 }}>
                  Anda akan keluar dari sesi aktif <strong>ACA Advisor</strong>. Semua perubahan yang belum disimpan tidak akan tersimpan.
                </p>
              </div>

              {/* Warning row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '10px',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: '0.78rem', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                  Pastikan data konsultasi Anda telah tersimpan sebelum keluar.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleCancelLogout}
                  style={{
                    flex: 1, padding: '0.9rem',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontWeight: 700, fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  className="cancel-logout-btn"
                >
                  Tetap di Sini
                </button>
                <button
                  onClick={handleConfirmLogout}
                  disabled={confirming}
                  style={{
                    flex: 1, padding: '0.9rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: confirming
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: 'white',
                    fontWeight: 800, fontSize: '0.9rem',
                    cursor: confirming ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    boxShadow: confirming ? 'none' : '0 4px 16px rgba(220,38,38,0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {confirming ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      Keluar...
                    </>
                  ) : (
                    <>
                      <LogoutIcon className="w-4 h-4" /> Ya, Keluar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sidebar-link:hover {
          background-color: var(--primary-light) !important;
          color: var(--primary) !important;
        }
        .cancel-logout-btn:hover {
          background-color: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        .sidebar-toggle:hover {
          background-color: var(--primary) !important;
          color: white !important;
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
