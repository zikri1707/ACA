import express from 'express';
import { run, query, get } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get List of Accounts (with search and filters)
router.get('/', authenticateToken, async (req, res) => {
  const { search, category } = req.query;
  let sql = 'SELECT * FROM accounts WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (code LIKE ? OR name LIKE ? OR description LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal);
  }

  if (category && category !== 'Semua') {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY code ASC';

  try {
    const accounts = await query(sql, params);
    return res.json({ accounts });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil daftar akun.', error: err.message });
  }
});

// Get Single Account Details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const account = await get('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    if (!account) {
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }
    return res.json({ account });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil detail akun.', error: err.message });
  }
});

// Create Account (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { code, name, category, subcategory, description } = req.body;

  if (!code || !name || !category) {
    return res.status(400).json({ message: 'Kode, Nama, dan Kategori akun wajib diisi.' });
  }

  try {
    // Check if code already exists
    const existing = await get('SELECT id FROM accounts WHERE code = ?', [code]);
    if (existing) {
      return res.status(400).json({ message: 'Kode akun sudah digunakan.' });
    }

    const result = await run(`
      INSERT INTO accounts (code, name, category, subcategory, description)
      VALUES (?, ?, ?, ?, ?)
    `, [code, name, category, subcategory || null, description || null]);

    const newAccount = await get('SELECT * FROM accounts WHERE id = ?', [result.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id, 
      `Membuat Akun CoA Baru: ${code} - ${name}`
    ]);

    return res.status(201).json({ message: 'Akun berhasil ditambahkan.', account: newAccount });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal membuat akun.', error: err.message });
  }
});

// Update Account (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { code, name, category, subcategory, description } = req.body;

  if (!code || !name || !category) {
    return res.status(400).json({ message: 'Kode, Nama, dan Kategori akun wajib diisi.' });
  }

  try {
    const existing = await get('SELECT id FROM accounts WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }

    // Check code duplication
    const duplicate = await get('SELECT id FROM accounts WHERE code = ? AND id != ?', [code, req.params.id]);
    if (duplicate) {
      return res.status(400).json({ message: 'Kode akun sudah digunakan oleh akun lain.' });
    }

    await run(`
      UPDATE accounts 
      SET code = ?, name = ?, category = ?, subcategory = ?, description = ?
      WHERE id = ?
    `, [code, name, category, subcategory || null, description || null, req.params.id]);

    const updatedAccount = await get('SELECT * FROM accounts WHERE id = ?', [req.params.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id, 
      `Mengubah Akun CoA: ${code} - ${name}`
    ]);

    return res.json({ message: 'Akun berhasil diperbarui.', account: updatedAccount });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui akun.', error: err.message });
  }
});

// Delete Account (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const account = await get('SELECT id, code, name FROM accounts WHERE id = ?', [req.params.id]);
    if (!account) {
      return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    }

    await run('DELETE FROM accounts WHERE id = ?', [req.params.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id, 
      `Menghapus Akun CoA: ${account.code} - ${account.name}`
    ]);

    return res.json({ message: 'Akun berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus akun.', error: err.message });
  }
});

export default router;
