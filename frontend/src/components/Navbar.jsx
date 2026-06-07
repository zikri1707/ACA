import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, currentPage, toggleTheme, theme } = useAuth();

  if (!user) return null;

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'consultation':
      case 'consultation-wizard':
        return 'Konsultasi Akun Pakar';
      case 'accounts':
        return 'Bagan Akun (Chart of Accounts)';
      case 'rules':
        return 'Basis Pengetahuan (Knowledge Base)';
      case 'history':
        return 'Riwayat Konsultasi';
      case 'reports':
        return 'Laporan & Analitik';
      case 'profile':
        return 'Profil Pengguna';
      case 'settings':
        return 'Konfigurasi Sistem';
      default:
        return 'Sistem Pakar ACA';
    }
  };

  const getPageSubtitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Ringkasan operasional sistem pakar akuntansi Anda hari ini.';
      case 'consultation':
      case 'consultation-wizard':
        return 'Identifikasi klasifikasi akun SAK EMKM secara backward chaining.';
      case 'accounts':
        return 'Kelola struktur bagan akun standar akuntansi entitas mikro.';
      case 'rules':
        return 'Manajemen rules inferensi logika backward chaining.';
      case 'history':
        return 'Akses log dan hasil dari seluruh konsultasi yang pernah dilakukan.';
      case 'reports':
        return 'Analisis laporan tren data klasifikasi dan penggunaan akun.';
      case 'profile':
        return 'Perbarui profil dan ganti kata sandi keamanan Anda.';
      case 'settings':
        return 'Pengaturan parameter sistem, database backup dan restore audit log.';
      default:
        return 'Sistem pakar pembimbing klasifikasi akun akuntansi.';
    }
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '1rem 1.5rem',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em'
        }}>
          {getPageTitle()}
        </h1>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          {getPageSubtitle()}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Compliance Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: 'var(--success-light)',
          color: 'var(--success)',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.7rem',
          fontWeight: 700,
          border: '1px solid var(--success-border)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <span style={{ fontSize: '0.8rem' }}>✓</span> SAK EMKM Compliant
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            transition: 'var(--transition)'
          }}
          title="Ubah Tema Warna"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
};
