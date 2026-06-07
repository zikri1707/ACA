import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage = () => {
  const { token, showToast } = useAuth();
  
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState('');

  const fetchSettingsAndLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch system configs
      const configRes = await fetch('/api/settings/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const configData = await configRes.json();
      if (configRes.ok) setConfig(configData.config);

      // 2. Fetch activity audit logs
      const logsRes = await fetch('/api/settings/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logsData = await logsRes.json();
      if (logsRes.ok) setLogs(logsData.logs || []);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat konfigurasi sistem.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setSelectedBackupFile(data.backupFile);
        fetchSettingsAndLogs(); // Reload logs
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackupFile) {
      showToast('Harap pilih file backup terlebih dahulu.', 'warning');
      return;
    }
    setRestoreLoading(true);
    try {
      const response = await fetch('/api/settings/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ backupFile: selectedBackupFile })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        fetchSettingsAndLogs(); // Reload logs
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestoreLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="layout-main-side">
      {/* Left panel: Logs Audit Trail */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-title">
          <span>Log Audit Aktivitas Sistem</span>
          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Audit Trail</span>
        </div>
        
        <div className="table-container" style={{ border: 'none', margin: 0, maxHeight: '420px', overflowY: 'auto' }}>
          <table className="table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Waktu</th>
                <th style={{ width: '30%' }}>Pengguna</th>
                <th style={{ width: '45%' }}>Aktivitas / Operasi</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.user_name || 'System Guest'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.user_email || '-'}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.action}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada log aktivitas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right panel: Database Backup/Restore & Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* DB Operations */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Operasi Database</h3>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <button 
              onClick={handleBackup} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.65rem' }}
              disabled={backupLoading}
            >
              💾 {backupLoading ? 'Mencadangkan...' : 'Backup Database'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <label className="form-label">Pilih File Cadangan (Restore)</label>
            <select 
              className="form-control" 
              value={selectedBackupFile} 
              onChange={(e) => setSelectedBackupFile(e.target.value)}
              style={{ marginBottom: '1rem', fontSize: '0.8rem' }}
            >
              <option value="">-- Pilih File Backup --</option>
              {selectedBackupFile && (
                <option value={selectedBackupFile}>{selectedBackupFile}</option>
              )}
              <option value="aca_backup_manual_v2.sql">aca_backup_manual_v2.sql</option>
              <option value="aca_backup_seed_initial.sql">aca_backup_seed_initial.sql</option>
            </select>

            <button 
              onClick={handleRestore} 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border)' }}
              disabled={restoreLoading || !selectedBackupFile}
            >
              🔄 {restoreLoading ? 'Memulihkan...' : 'Restore Database'}
            </button>
          </div>
        </div>

        {/* System Specs */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Spesifikasi Sistem</h3>
          {config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Nama Sistem:</span>
                <strong>{config.systemName}</strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Versi Rilis:</span>
                <strong>v{config.version}</strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Metode Inferensi:</span>
                <strong className="badge badge-info">{config.inferenceMethod}</strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Kepatuhan:</span>
                <strong>{config.complianceStandard}</strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>Status Layanan:</span>
                <strong style={{ color: 'var(--success)' }}>● {config.activeStatus}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
