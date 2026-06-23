import express from 'express';
import { run, query, get } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all rules with conditions and accounts info
router.get('/', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT r.*,
             ad.code as debit_account_code,
             ad.name as debit_account_name,
             ad.category as debit_account_category,
             ac.code as credit_account_code,
             ac.name as credit_account_name,
             ac.category as credit_account_category
      FROM rules r
      LEFT JOIN accounts ad ON r.debit_account_id = ad.id
      LEFT JOIN accounts ac ON r.credit_account_id = ac.id
    `;
    const params = [];
    if (req.user.role !== 'Admin') {
      sql += " WHERE r.business_type = ? OR r.business_type = 'semua'";
      params.push(req.user.business_type);
    }
    sql += " ORDER BY r.priority DESC, r.code ASC";

    const rules = await query(sql, params);

    const conditions = await query('SELECT * FROM rule_conditions');

    // Group conditions by rule_id
    const conditionsMap = {};
    conditions.forEach(cond => {
      if (!conditionsMap[cond.rule_id]) {
        conditionsMap[cond.rule_id] = [];
      }
      conditionsMap[cond.rule_id].push({
        id: cond.id,
        fact_name: cond.fact_name,
        operator: cond.operator,
        expected_value: cond.expected_value
      });
    });

    const detailedRules = rules.map(rule => ({
      ...rule,
      conditions: conditionsMap[rule.id] || []
    }));

    return res.json({ rules: detailedRules });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil data aturan (rules).', error: err.message });
  }
});

// Get Single Rule details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rule = await get('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ message: 'Aturan tidak ditemukan.' });
    }
    const conditions = await query('SELECT * FROM rule_conditions WHERE rule_id = ?', [req.params.id]);
    return res.json({ rule: { ...rule, conditions } });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil detail aturan.', error: err.message });
  }
});

// Create Rule (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { code, name, business_type, journal_debit, journal_credit, description, conditions } = req.body;

  if (!code || !name || !business_type || !journal_debit || !journal_credit || !conditions || !Array.isArray(conditions)) {
    return res.status(400).json({ message: 'Lengkapi seluruh field wajib dan daftar kondisi.' });
  }

  try {
    // Check if code duplicate
    const codeDup = await get('SELECT id FROM rules WHERE code = ?', [code]);
    if (codeDup) {
      return res.status(400).json({ message: 'Kode aturan sudah digunakan.' });
    }

    const ruleRes = await run(`
      INSERT INTO rules (code, name, business_type, journal_debit, journal_credit, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [code, name, business_type, journal_debit, journal_credit, description || null]);

    const ruleId = ruleRes.id;

    // Add conditions
    for (const cond of conditions) {
      await run(`
        INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
        VALUES (?, ?, ?, ?)
      `, [ruleId, cond.fact_name, cond.operator || 'equals', cond.expected_value]);
    }

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Membuat Aturan Pakar Baru: ${code} - ${name}`
    ]);

    return res.status(201).json({ message: 'Aturan pakar berhasil ditambahkan.', ruleId });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal membuat aturan pakar.', error: err.message });
  }
});

// Update Rule (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { code, name, business_type, journal_debit, journal_credit, description, is_active, conditions } = req.body;

  if (!code || !name || !business_type || !journal_debit || !journal_credit || !conditions || !Array.isArray(conditions)) {
    return res.status(400).json({ message: 'Lengkapi seluruh field wajib dan daftar kondisi.' });
  }

  try {
    const existing = await get('SELECT id FROM rules WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: 'Aturan tidak ditemukan.' });
    }

    // Code duplicate
    const codeDup = await get('SELECT id FROM rules WHERE code = ? AND id != ?', [code, req.params.id]);
    if (codeDup) {
      return res.status(400).json({ message: 'Kode aturan sudah digunakan.' });
    }

    await run(`
      UPDATE rules 
      SET code = ?, name = ?, business_type = ?, journal_debit = ?, journal_credit = ?, description = ?, is_active = ?
      WHERE id = ?
    `, [code, name, business_type, journal_debit, journal_credit, description || null, is_active, req.params.id]);

    // Clear old conditions
    await run('DELETE FROM rule_conditions WHERE rule_id = ?', [req.params.id]);

    // Insert new conditions
    for (const cond of conditions) {
      await run(`
        INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
        VALUES (?, ?, ?, ?)
      `, [req.params.id, cond.fact_name, cond.operator || 'equals', cond.expected_value]);
    }

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Mengubah Aturan Pakar: ${code} - ${name}`
    ]);

    return res.json({ message: 'Aturan pakar berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui aturan pakar.', error: err.message });
  }
});

// Delete Rule (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rule = await get('SELECT id, code, name FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ message: 'Aturan tidak ditemukan.' });
    }

    await run('DELETE FROM rules WHERE id = ?', [req.params.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `Menghapus Aturan Pakar: ${rule.code} - ${rule.name}`
    ]);

    return res.json({ message: 'Aturan pakar berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus aturan pakar.', error: err.message });
  }
});

// Toggle Active State
router.patch('/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  const { is_active } = req.body;
  try {
    const rule = await get('SELECT id, code, name FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ message: 'Aturan tidak ditemukan.' });
    }

    await run('UPDATE rules SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);

    await run('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [
      req.user.id,
      `${is_active ? 'Mengaktifkan' : 'Menonaktifkan'} Aturan Pakar: ${rule.code}`
    ]);

    return res.json({ message: `Status aturan berhasil diperbarui.` });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal merubah status aturan.', error: err.message });
  }
});

export default router;
