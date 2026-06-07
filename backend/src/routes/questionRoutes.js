import express from 'express';
import { run, query, get } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all questions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const questions = await query('SELECT * FROM questions ORDER BY code ASC');
    return res.json({ questions });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil data pertanyaan.', error: err.message });
  }
});

// Create question (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { code, question_text, fact_name } = req.body;

  if (!code || !question_text || !fact_name) {
    return res.status(400).json({ message: 'Kode, Teks Pertanyaan, dan Nama Fakta wajib diisi.' });
  }

  try {
    // Check if code or fact_name duplicate
    const codeDup = await get('SELECT id FROM questions WHERE code = ?', [code]);
    if (codeDup) {
      return res.status(400).json({ message: 'Kode pertanyaan sudah digunakan.' });
    }

    const factDup = await get('SELECT id FROM questions WHERE fact_name = ?', [fact_name]);
    if (factDup) {
      return res.status(400).json({ message: 'Nama fakta sudah terhubung dengan pertanyaan lain.' });
    }

    const result = await run(`
      INSERT INTO questions (code, question_text, fact_name)
      VALUES (?, ?, ?)
    `, [code, question_text, fact_name]);

    const newQuestion = await get('SELECT * FROM questions WHERE id = ?', [result.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Membuat Pertanyaan Baru: ${code} (${fact_name})`
    ]);

    return res.status(201).json({ message: 'Pertanyaan berhasil ditambahkan.', question: newQuestion });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menambahkan pertanyaan.', error: err.message });
  }
});

// Update question (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { code, question_text, fact_name } = req.body;

  if (!code || !question_text || !fact_name) {
    return res.status(400).json({ message: 'Kode, Teks Pertanyaan, dan Nama Fakta wajib diisi.' });
  }

  try {
    const existing = await get('SELECT id FROM questions WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: 'Pertanyaan tidak ditemukan.' });
    }

    // Code duplicate
    const codeDup = await get('SELECT id FROM questions WHERE code = ? AND id != ?', [code, req.params.id]);
    if (codeDup) {
      return res.status(400).json({ message: 'Kode pertanyaan sudah digunakan.' });
    }

    // Fact duplicate
    const factDup = await get('SELECT id FROM questions WHERE fact_name = ? AND id != ?', [fact_name, req.params.id]);
    if (factDup) {
      return res.status(400).json({ message: 'Nama fakta sudah digunakan oleh pertanyaan lain.' });
    }

    await run(`
      UPDATE questions 
      SET code = ?, question_text = ?, fact_name = ?
      WHERE id = ?
    `, [code, question_text, fact_name, req.params.id]);

    const updated = await get('SELECT * FROM questions WHERE id = ?', [req.params.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Mengubah Pertanyaan: ${code} (${fact_name})`
    ]);

    return res.json({ message: 'Pertanyaan berhasil diperbarui.', question: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui pertanyaan.', error: err.message });
  }
});

// Delete question (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const question = await get('SELECT id, code, fact_name FROM questions WHERE id = ?', [req.params.id]);
    if (!question) {
      return res.status(404).json({ message: 'Pertanyaan tidak ditemukan.' });
    }

    await run('DELETE FROM questions WHERE id = ?', [req.params.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Menghapus Pertanyaan: ${question.code} (${question.fact_name})`
    ]);

    return res.json({ message: 'Pertanyaan berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus pertanyaan.', error: err.message });
  }
});

export default router;
