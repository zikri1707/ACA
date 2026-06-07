import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Toast = () => {
  const { toast } = useAuth();

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'var(--success-light)',
          color: 'var(--success)',
          border: '1px solid var(--success-border)',
          icon: '✓'
        };
      case 'danger':
        return {
          bg: 'var(--danger-light)',
          color: 'var(--danger)',
          border: '1px solid #fecaca',
          icon: '✕'
        };
      case 'warning':
        return {
          bg: 'var(--warning-light)',
          color: 'var(--warning)',
          border: '1px solid #fef3c7',
          icon: '⚠'
        };
      case 'info':
      default:
        return {
          bg: 'var(--info-light)',
          color: 'var(--info)',
          border: '1px solid #cffafe',
          icon: 'ℹ'
        };
    }
  };

  const styles = getStyle();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 2000,
      backgroundColor: styles.bg,
      color: styles.color,
      border: styles.border,
      borderRadius: 'var(--radius-md)',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: 'var(--shadow-lg)',
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      fontWeight: 600,
      fontSize: '0.9rem',
      maxWidth: '350px'
    }}>
      <span style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 'bold'
      }}>
        {styles.icon}
      </span>
      <span>{toast.message}</span>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
