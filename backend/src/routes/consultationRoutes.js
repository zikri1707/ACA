import express from 'express';
import { run, query, get } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { BackwardChainingEngine } from '../engine/BackwardChainingEngine.js';
import { InventoryEngine } from '../engine/InventoryEngine.js';

const router = express.Router();

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

router.post('/save', authenticateToken, async (req, res) => {
  const { 
    business_type, 
    confidence_level, 
    reasoning_text, 
    rule_trace, 
    answers,
    amount,
    debit_account_id,
    credit_account_id,
    description,
    items,
    rule_code
  } = req.body;

  if (!business_type || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Data hasil konsultasi tidak lengkap.' });
  }

  try {
    await run('BEGIN TRANSACTION');

    const conResult = await run(`
      INSERT INTO consultations (user_id, business_type, confidence_level, reasoning_text, rule_trace_json)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      business_type,
      confidence_level || 0,
      reasoning_text || 'Tidak teridentifikasi',
      JSON.stringify(rule_trace || [])
    ]);

    const consultationId = conResult.id;

    for (const ans of answers) {
      await run(`
        INSERT INTO consultation_answers (consultation_id, question_id, answer)
        VALUES (?, ?, ?)
      `, [consultationId, ans.question_id, ans.answer]);
    }

    // Integritas Data Jurnal (Single-Row)
    if (amount !== undefined && amount !== null && amount !== '') {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
         await run('ROLLBACK');
         return res.status(400).json({ message: 'Nominal transaksi tidak valid.' });
      }
      if (!debit_account_id || !credit_account_id) {
         await run('ROLLBACK');
         return res.status(400).json({ message: 'Akun Debit dan Kredit wajib diisi (Balance gagal).' });
      }

      const journalDesc = description || `Transaksi Konsultasi #${consultationId}`;
      
      await run(`
        INSERT INTO journals (consultation_id, debit_account_id, credit_account_id, amount, description)
        VALUES (?, ?, ?, ?, ?)
      `, [consultationId, debit_account_id, credit_account_id, parsedAmount, journalDesc]);
      
      // Integritas Moving Average & HPP
      if (items && items.length > 0 && rule_code) {
        if (rule_code === 'R-003' || rule_code === 'R-004') {
          await InventoryEngine.calculateAndSaveMovingAverage(items, consultationId);
        } else if (rule_code === 'R-002' || rule_code === 'R-009') {
          await InventoryEngine.generateHppJournal(items, consultationId);
        }
      }
    }

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Menyimpan Konsultasi Akuntansi #${consultationId}`
    ]);

    await run('COMMIT');

    return res.status(201).json({ message: 'Konsultasi berhasil disimpan.', id: consultationId });
  } catch (err) {
    await run('ROLLBACK');
    return res.status(500).json({ message: 'Gagal menyimpan riwayat konsultasi.', error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT c.id, c.date, c.business_type, c.confidence_level, c.reasoning_text, c.created_at,
             u.name as user_name, u.business_name
      FROM consultations c
      JOIN users u ON c.user_id = u.id
    `;
    const params = [];

    if (req.user.role !== 'Admin') {
      sql += ' WHERE c.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY c.date DESC';

    const history = await query(sql, params);

    for (let i = 0; i < history.length; i++) {
      const journals = await query(`
        SELECT j.amount, 
               ad.code as debit_code, ad.name as debit_name,
               ac.code as credit_code, ac.name as credit_name
        FROM journals j
        JOIN accounts ad ON j.debit_account_id = ad.id
        JOIN accounts ac ON j.credit_account_id = ac.id
        WHERE j.consultation_id = ?
      `, [history[i].id]);
      history[i].journals = journals;
    }

    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil riwayat konsultasi.', error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const consultation = await get(`
      SELECT c.*, u.name as user_name, u.business_name
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!consultation) {
      return res.status(404).json({ message: 'Data konsultasi tidak ditemukan.' });
    }

    if (req.user.role !== 'Admin' && consultation.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const answers = await query(`
      SELECT ca.answer, q.code as question_code, q.question_text, q.fact_name, q.id as question_id
      FROM consultation_answers ca
      JOIN questions q ON ca.question_id = q.id
      WHERE ca.consultation_id = ?
    `, [req.params.id]);

    const journals = await query(`
      SELECT j.*, 
             ad.code as debit_account_code, ad.name as debit_account_name,
             ac.code as credit_account_code, ac.name as credit_account_name
      FROM journals j
      JOIN accounts ad ON j.debit_account_id = ad.id
      JOIN accounts ac ON j.credit_account_id = ac.id
      WHERE j.consultation_id = ?
    `, [req.params.id]);

    return res.json({ consultation, answers, journals });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil detail konsultasi.', error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  // same implementation
  try {
    const consultation = await get('SELECT id, user_id FROM consultations WHERE id = ?', [req.params.id]);
    if (!consultation) return res.status(404).json({ message: 'Riwayat konsultasi tidak ditemukan.' });
    if (req.user.role !== 'Admin' && consultation.user_id !== req.user.id) return res.status(403).json({ message: 'Akses ditolak.' });
    await run('DELETE FROM consultations WHERE id = ?', [req.params.id]);
    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [req.user.id, `Menghapus Riwayat Konsultasi #${req.params.id}`]);
    return res.json({ message: 'Riwayat konsultasi berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus riwayat konsultasi.', error: err.message });
  }
});

export default router;
