import React from 'react';
import { useAuth } from '../context/AuthContext';

const TOAST_CONFIG = {
  success: {
    bg: '#ffffff',
    borderColor: '#10b981',
    iconBg: '#10b981',
    iconColor: '#ffffff',
    titleColor: '#065f46',
    msgColor: '#374151',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    progressColor: '#10b981',
    title: 'Berhasil',
  },
  danger: {
    bg: '#ffffff',
    borderColor: '#ef4444',
    iconBg: '#ef4444',
    iconColor: '#ffffff',
    titleColor: '#991b1b',
    msgColor: '#374151',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    progressColor: '#ef4444',
    title: 'Gagal',
  },
  warning: {
    bg: '#ffffff',
    borderColor: '#f59e0b',
    iconBg: '#f59e0b',
    iconColor: '#ffffff',
    titleColor: '#92400e',
    msgColor: '#374151',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    progressColor: '#f59e0b',
    title: 'Perhatian',
  },
  info: {
    bg: '#ffffff',
    borderColor: '#3b82f6',
    iconBg: '#3b82f6',
    iconColor: '#ffffff',
    titleColor: '#1e40af',
    msgColor: '#374151',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    progressColor: '#3b82f6',
    title: 'Informasi',
  },
};

export const Toast = () => {
  const { toast } = useAuth();

  if (!toast) return null;

  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 9999,
      width: '360px',
      backgroundColor: cfg.bg,
      borderRadius: '14px',
      borderLeft: `5px solid ${cfg.borderColor}`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      animation: 'toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      {/* Main content */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        padding: '1rem 1.25rem',
      }}>
        {/* Icon badge */}
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '10px',
          backgroundColor: cfg.iconBg,
          color: cfg.iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${cfg.borderColor}55`,
        }}>
          {cfg.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: cfg.titleColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.2rem',
          }}>
            {cfg.title}
          </div>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            color: cfg.msgColor,
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}>
            {toast.message}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '3px',
        backgroundColor: `${cfg.borderColor}22`,
      }}>
        <div style={{
          height: '100%',
          backgroundColor: cfg.progressColor,
          animation: 'toastProgress 3s linear forwards',
          transformOrigin: 'left',
        }} />
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(110%) scale(0.95); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};
