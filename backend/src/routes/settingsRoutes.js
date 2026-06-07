import express from 'express';
import { run, query } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Retrieve System Configuration (Admin only)
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const config = {
      systemName: 'Account Classification Advisor (ACA)',
      version: '2.4.0',
      complianceStandard: 'SAK EMKM Compliant 2024',
      inferenceMethod: 'Backward Chaining',
      activeStatus: 'Optimal',
      memoryUsage: '32%',
      cpuLoad: '18%',
      autoBackup: true,
      loggingEnabled: true
    };
    return res.json({ config });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil konfigurasi sistem.', error: err.message });
  }
});

// Update System Configuration (Admin only)
router.post('/config', authenticateToken, requireAdmin, async (req, res) => {
  const { systemName, autoBackup, loggingEnabled } = req.body;
  try {
    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Memperbarui konfigurasi sistem: Name=${systemName}, Backup=${autoBackup}, Log=${loggingEnabled}`
    ]);
    return res.json({ message: 'Konfigurasi sistem berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui konfigurasi.', error: err.message });
  }
});

// Get Audit Activity Logs (Admin only)
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await query(`
      SELECT l.*, u.name as user_name, u.email as user_email
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil log aktivitas.', error: err.message });
  }
});

// Simulate Database Backup
router.post('/backup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      'Melakukan Backup Database Sistem'
    ]);
    return res.json({ 
      message: 'Database berhasil diekspor dan dicadangkan.', 
      backupFile: `aca_backup_${Date.now()}.sql` 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal melakukan backup.', error: err.message });
  }
});

// Simulate Database Restore
router.post('/restore', authenticateToken, requireAdmin, async (req, res) => {
  const { backupFile } = req.body;
  if (!backupFile) {
    return res.status(400).json({ message: 'File backup wajib ditentukan.' });
  }
  try {
    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Memulihkan Database Sistem dari file: ${backupFile}`
    ]);
    return res.json({ message: 'Database berhasil dipulihkan dari cadangan.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memulihkan database.', error: err.message });
  }
});

export default router;
