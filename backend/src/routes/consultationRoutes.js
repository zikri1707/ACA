import express from 'express';
import { run, query, get } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { BackwardChainingEngine } from '../engine/BackwardChainingEngine.js';

const router = express.Router();

// Evaluate logic path dynamically
router.post('/evaluate', authenticateToken, async (req, res) => {
  const { business_type, facts } = req.body;

  if (!business_type) {
    return res.status(400).json({ message: 'Jenis usaha wajib ditentukan.' });
  }

  try {
    const result = await BackwardChainingEngine.evaluate(business_type, facts);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengevaluasi penalaran.', error: err.message });
  }
});

// Save consultation details
router.post('/save', authenticateToken, async (req, res) => {
  const { 
    business_type, 
    result_account_id, 
    confidence_level, 
    reasoning_text, 
    rule_trace, 
    answers 
  } = req.body;

  if (!business_type || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Data hasil konsultasi tidak lengkap.' });
  }

  try {
    const conResult = await run(`
      INSERT INTO consultations (user_id, business_type, result_account_id, confidence_level, reasoning_text, rule_trace_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      business_type,
      result_account_id || null,
      confidence_level || 0,
      reasoning_text || 'Tidak teridentifikasi',
      JSON.stringify(rule_trace || [])
    ]);

    const consultationId = conResult.id;

    // Save individual questionnaire answers
    for (const ans of answers) {
      await run(`
        INSERT INTO consultation_answers (consultation_id, question_id, answer)
        VALUES (?, ?, ?)
      `, [consultationId, ans.question_id, ans.answer]);
    }

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Menyimpan Konsultasi Akuntansi #${consultationId}`
    ]);

    return res.status(201).json({ message: 'Konsultasi berhasil disimpan.', id: consultationId });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menyimpan riwayat konsultasi.', error: err.message });
  }
});

// Get Consultation History
router.get('/', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT c.id, c.date, c.business_type, c.confidence_level, c.reasoning_text, c.created_at,
             u.name as user_name, u.business_name,
             a.code as account_code, a.name as account_name, a.category as account_category
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN accounts a ON c.result_account_id = a.id
    `;
    const params = [];

    // Standard user can only see their own history. Admin can see everyone's.
    if (req.user.role !== 'Admin') {
      sql += ' WHERE c.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY c.date DESC';

    const history = await query(sql, params);
    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil riwayat konsultasi.', error: err.message });
  }
});

// Get Consultation Details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const consultation = await get(`
      SELECT c.*, u.name as user_name, u.business_name,
             a.code as account_code, a.name as account_name, a.category as account_category,
             a.subcategory as account_subcategory, a.description as account_desc
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN accounts a ON c.result_account_id = a.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!consultation) {
      return res.status(404).json({ message: 'Data konsultasi tidak ditemukan.' });
    }

    // Authorization check
    if (req.user.role !== 'Admin' && consultation.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Fetch answers
    const answers = await query(`
      SELECT ca.answer, q.code as question_code, q.question_text, q.fact_name, q.id as question_id
      FROM consultation_answers ca
      JOIN questions q ON ca.question_id = q.id
      WHERE ca.consultation_id = ?
    `, [req.params.id]);

    return res.json({ consultation, answers });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil detail konsultasi.', error: err.message });
  }
});

// Delete Consultation History
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const consultation = await get('SELECT id, user_id FROM consultations WHERE id = ?', [req.params.id]);

    if (!consultation) {
      return res.status(404).json({ message: 'Riwayat konsultasi tidak ditemukan.' });
    }

    // Access check
    if (req.user.role !== 'Admin' && consultation.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    await run('DELETE FROM consultations WHERE id = ?', [req.params.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Menghapus Riwayat Konsultasi #${req.params.id}`
    ]);

    return res.json({ message: 'Riwayat konsultasi berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus riwayat konsultasi.', error: err.message });
  }
});

export default router;
