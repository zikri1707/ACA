import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { HealthDiagnosticsEngine } from '../engine/HealthDiagnosticsEngine.js';

const router = express.Router();

// Helper for date filtering and user role filtering
const getDateFilter = (req, dateColumn = 'j.transaction_date') => {
  const { startDate, endDate } = req.query;
  let filterStr = '';
  const params = [];
  
  // Role-based filtering
  if (req.user && req.user.role !== 'Admin') {
    // If the query joins consultations as 'c', we should filter by c.user_id
    // But since this helper is mainly for journal queries, we need to join consultations if necessary
    // Most reports queries in this file don't join consultations directly, 
    // so we need to be careful. If the query has journals 'j', we can filter by j.consultation_id IN (...)
    filterStr += ` AND ${dateColumn.split('.')[0]}.consultation_id IN (SELECT id FROM consultations WHERE user_id = ?)`;
    params.push(req.user.id);
  }

  if (startDate) {
    filterStr += ` AND ${dateColumn} >= ?`;
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    filterStr += ` AND ${dateColumn} <= ?`;
    params.push(`${endDate} 23:59:59`);
  }
  return { filterStr, params };
};

// 1. Jurnal Umum
router.get('/journal', authenticateToken, async (req, res) => {
  try {
    const { filterStr, params } = getDateFilter(req);
    const sql = `
      SELECT j.journal_id as id, j.transaction_date as date, j.amount, j.description, j.consultation_id,
             ad.code as debit_account_code, ad.name as debit_account_name,
             ac.code as credit_account_code, ac.name as credit_account_name
      FROM journals j
      JOIN accounts ad ON j.debit_account_id = ad.id
      JOIN accounts ac ON j.credit_account_id = ac.id
      WHERE 1=1 ${filterStr}
      ORDER BY j.transaction_date DESC, j.journal_id DESC
    `;
    const journals = await query(sql, params);
    return res.json({ journals });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Jurnal Umum.', error: err.message });
  }
});

// 2. Buku Besar (General Ledger)
router.get('/ledger', authenticateToken, async (req, res) => {
  try {
    const { account_id } = req.query;
    if (!account_id) return res.status(400).json({ message: 'account_id diperlukan.' });

    const { filterStr, params } = getDateFilter(req);
    const sql = `
      SELECT j.journal_id as id, j.transaction_date as date, j.amount, j.description, j.consultation_id,
             j.debit_account_id, j.credit_account_id
      FROM journals j
      WHERE (j.debit_account_id = ? OR j.credit_account_id = ?) ${filterStr}
      ORDER BY j.transaction_date ASC
    `;
    const entries = await query(sql, [account_id, account_id, ...params]);
    
    let balance = 0;
    const account = await query('SELECT id, code, name, category FROM accounts WHERE id = ?', [account_id]);
    const accCat = account[0]?.category;
    const isDebitNormal = accCat === 'Aset' || accCat === 'Beban';

    const ledger = entries.map(entry => {
      // Determine if this entry represents a debit or credit for the selected account
      let isDebitEntry = entry.debit_account_id === parseInt(account_id);
      
      // Calculate running balance based on normal balance rules
      if (isDebitNormal) {
         balance += isDebitEntry ? entry.amount : -entry.amount;
      } else {
         balance += !isDebitEntry ? entry.amount : -entry.amount;
      }
      
      return { 
        ...entry, 
        type: isDebitEntry ? 'debit' : 'credit', 
        balance 
      };
    });

    return res.json({ account: account[0], ledger });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Buku Besar.', error: err.message });
  }
});

// 3. Neraca Saldo (Trial Balance)
router.get('/trial-balance', authenticateToken, async (req, res) => {
  try {
    const { filterStr, params } = getDateFilter(req);
    // Combine debit sums and credit sums for each account using SUM and CASE
    const sql = `
      SELECT a.id, a.code, a.name, a.category,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      LEFT JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id) ${filterStr}
      GROUP BY a.id
      ORDER BY a.code ASC
    `;
    let tb = await query(sql, params);
    
    // Filter out accounts with zero balance, calculate net
    tb = tb.filter(acc => acc.total_debit > 0 || acc.total_credit > 0).map(acc => {
      const isDebitNormal = acc.category === 'Aset' || acc.category === 'Beban';
      const net = acc.total_debit - acc.total_credit;
      
      return { 
        ...acc, 
        debit_balance: net > 0 ? net : 0, 
        credit_balance: net < 0 ? Math.abs(net) : 0 
      };
    });

    return res.json({ trialBalance: tb });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Neraca Saldo.', error: err.message });
  }
});

// 4. Laporan Laba Rugi (Income Statement)
router.get('/income-statement', authenticateToken, async (req, res) => {
  try {
    const { filterStr, params } = getDateFilter(req);
    const sql = `
      SELECT a.id, a.code, a.name, a.category,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id)
      WHERE a.category IN ('Pendapatan', 'Beban') ${filterStr}
      GROUP BY a.id
      ORDER BY a.code ASC
    `;
    const records = await query(sql, params);
    
    const pendapatan = records.filter(r => r.category === 'Pendapatan').map(r => {
      // Normal balance credit
      return { ...r, amount: r.total_credit - r.total_debit };
    }).filter(r => r.amount !== 0);
    
    const beban = records.filter(r => r.category === 'Beban').map(r => {
      // Normal balance debit
      return { ...r, amount: r.total_debit - r.total_credit };
    }).filter(r => r.amount !== 0);
    
    const totalPendapatan = pendapatan.reduce((sum, item) => sum + item.amount, 0);
    const totalBeban = beban.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalPendapatan - totalBeban;

    return res.json({ pendapatan, beban, totalPendapatan, totalBeban, netIncome });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Laba Rugi.', error: err.message });
  }
});

// 5. Neraca (Balance Sheet)
router.get('/balance-sheet', authenticateToken, async (req, res) => {
  try {
    const { filterStr, params } = getDateFilter(req);
    const sql = `
      SELECT a.id, a.code, a.name, a.category,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id)
      WHERE a.category IN ('Aset', 'Kewajiban', 'Ekuitas') ${filterStr}
      GROUP BY a.id
      ORDER BY a.code ASC
    `;
    const records = await query(sql, params);

    const aset = records.filter(r => r.category === 'Aset').map(r => {
      return { ...r, amount: r.total_debit - r.total_credit };
    }).filter(r => r.amount !== 0);
    
    const kewajiban = records.filter(r => r.category === 'Kewajiban').map(r => {
      return { ...r, amount: r.total_credit - r.total_debit };
    }).filter(r => r.amount !== 0);
    
    const ekuitas = records.filter(r => r.category === 'Ekuitas').map(r => {
      return { ...r, amount: r.total_credit - r.total_debit };
    }).filter(r => r.amount !== 0);

    return res.json({ aset, kewajiban, ekuitas });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Neraca.', error: err.message });
  }
});

// 6. Summary for Dashboard Cards
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { filterStr, params } = getDateFilter(req);
    const sql = `
      SELECT a.category,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      LEFT JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id) ${filterStr}
      GROUP BY a.category
    `;
    const records = await query(sql, params);
    
    let summary = {
      assets: 0,
      liabilities: 0,
      equity: 0,
      revenue: 0,
      expenses: 0
    };

    records.forEach(r => {
      if (r.category === 'Aset') summary.assets = r.total_debit - r.total_credit;
      if (r.category === 'Kewajiban') summary.liabilities = r.total_credit - r.total_debit;
      if (r.category === 'Ekuitas') summary.equity = r.total_credit - r.total_debit;
      if (r.category === 'Pendapatan') summary.revenue = r.total_credit - r.total_debit;
      if (r.category === 'Beban') summary.expenses = r.total_debit - r.total_credit;
    });

    // 1. Monthly Trend (Konsultasi per bulan)
    // We will get the last 6 months of consultations for the user
    const isAdmin = req.user.role === 'Admin';
    const userId = req.user.id;
    const cFilterAnd = isAdmin ? '' : `AND user_id = ${userId}`;
    const jFilter = isAdmin ? '' : `WHERE consultation_id IN (SELECT id FROM consultations WHERE user_id = ${userId})`;

    const trendSql = `
      SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
      FROM consultations
      WHERE date >= date('now', '-6 months') ${cFilterAnd}
      GROUP BY month
      ORDER BY month ASC
    `;
    const monthlyTrend = await query(trendSql);

    // 2. Category Distribution (based on journal entries frequency)
    const debitSql = `
      SELECT a.category, COUNT(*) as count
      FROM journals j
      JOIN accounts a ON j.debit_account_id = a.id
      ${filterStr.replace('j.transaction_date', 'j.transaction_date')}
      GROUP BY a.category
      ORDER BY count DESC
    `;
    const debitDistData = await query(debitSql, params);
    const totalDebitCount = debitDistData.reduce((sum, row) => sum + row.count, 0);
    const debitDistribution = debitDistData.map(row => ({
      category: row.category,
      percentage: totalDebitCount > 0 ? Math.round((row.count / totalDebitCount) * 100) : 0
    })).sort((a, b) => b.percentage - a.percentage);

    const creditSql = `
      SELECT a.category, COUNT(*) as count
      FROM journals j
      JOIN accounts a ON j.credit_account_id = a.id
      ${filterStr.replace('j.transaction_date', 'j.transaction_date')}
      GROUP BY a.category
      ORDER BY count DESC
    `;
    const creditDistData = await query(creditSql, params);
    const totalCreditCount = creditDistData.reduce((sum, row) => sum + row.count, 0);
    const creditDistribution = creditDistData.map(row => ({
      category: row.category,
      percentage: totalCreditCount > 0 ? Math.round((row.count / totalCreditCount) * 100) : 0
    })).sort((a, b) => b.percentage - a.percentage);

    // 3. Top 5 Frequently Used Accounts
    const topSql = `
      SELECT a.id, a.code, a.name, a.category,
             (SELECT COUNT(*) FROM journals j WHERE (j.debit_account_id = a.id OR j.credit_account_id = a.id) ${isAdmin ? '' : `AND j.consultation_id IN (SELECT id FROM consultations WHERE user_id = ${userId})`}) as frequency,
             COALESCE((SELECT SUM(j.amount) FROM journals j WHERE j.debit_account_id = a.id ${isAdmin ? '' : `AND j.consultation_id IN (SELECT id FROM consultations WHERE user_id = ${userId})`}), 0) as total_debit,
             COALESCE((SELECT SUM(j.amount) FROM journals j WHERE j.credit_account_id = a.id ${isAdmin ? '' : `AND j.consultation_id IN (SELECT id FROM consultations WHERE user_id = ${userId})`}), 0) as total_credit
      FROM accounts a
      WHERE frequency > 0
      ORDER BY frequency DESC
      LIMIT 5
    `;
    const topAccountsRaw = await query(topSql);
    const topAccounts = topAccountsRaw.map(acc => {
      const isDebitNormal = acc.category === 'Aset' || acc.category === 'Beban';
      const balance = isDebitNormal ? (acc.total_debit - acc.total_credit) : (acc.total_credit - acc.total_debit);
      return {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        frequency: acc.frequency,
        balance: balance
      };
    });

    return res.json({ summary, monthlyTrend, debitDistribution, creditDistribution, topAccounts });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Summary.', error: err.message });
  }
});

// 7. Dashboard KPI & Stats
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const userId = req.user.id;

    // Filters for consultations
    const cFilter = isAdmin ? '' : `WHERE user_id = ${userId}`;
    const cFilterAnd = isAdmin ? '' : `AND user_id = ${userId}`;
    
    // Filters for journals (using consultation_id)
    const jFilter = isAdmin ? '' : `WHERE consultation_id IN (SELECT id FROM consultations WHERE user_id = ${userId})`;
    const jFilterAnd = isAdmin ? '' : `AND consultation_id IN (SELECT id FROM consultations WHERE user_id = ${userId})`;

    // Basic Counts
    const [totalConsultations] = await query(`SELECT COUNT(*) as count FROM consultations ${cFilter}`);
    const [totalRules] = await query('SELECT COUNT(*) as count FROM rules'); // Rules are global
    const [totalAccounts] = await query('SELECT COUNT(*) as count FROM accounts'); // Accounts are global
    
    // Accuracy & Confidence
    const [classified] = await query(`SELECT COUNT(DISTINCT consultation_id) as count FROM journals ${jFilter}`);
    const [confSum] = await query(`SELECT SUM(confidence_level) as sum FROM consultations WHERE id IN (SELECT consultation_id FROM journals) ${cFilterAnd}`);
    
    const countTotal = totalConsultations?.count || 0;
    const countClassified = classified?.count || 0;
    const accuracyRate = countTotal > 0 ? Math.round((countClassified / countTotal) * 100) : 0;
    const avgConfidence = countClassified > 0 ? Math.round((confSum?.sum || 0) / countClassified) : 0;

    // This Month Growth
    const [thisMonth] = await query(`SELECT COUNT(*) as count FROM consultations WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now') ${cFilterAnd}`);
    const [lastMonth] = await query(`SELECT COUNT(*) as count FROM consultations WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-1 month') ${cFilterAnd}`);
    
    const countThisMonth = thisMonth?.count || 0;
    const countLastMonth = lastMonth?.count || 0;
    let growthPct = 0;
    if (countLastMonth > 0) {
      growthPct = Math.round(((countThisMonth - countLastMonth) / countLastMonth) * 100);
    } else if (countThisMonth > 0) {
      growthPct = 100;
    }

    // Recent Consultations
    const recentConsultations = await query(`
      SELECT c.id, c.date, u.name as user_name, c.business_type, c.confidence_level
      FROM consultations c 
      JOIN users u ON c.user_id = u.id
      ${cFilter}
      ORDER BY c.date DESC 
      LIMIT 5
    `);

    for (let i = 0; i < recentConsultations.length; i++) {
      const journals = await query(`
        SELECT j.amount, 
               ad.code as debit_code, ad.name as debit_name, ad.category as debit_category,
               ac.code as credit_code, ac.name as credit_name, ac.category as credit_category
        FROM journals j
        JOIN accounts ad ON j.debit_account_id = ad.id
        JOIN accounts ac ON j.credit_account_id = ac.id
        WHERE j.consultation_id = ?
      `, [recentConsultations[i].id]);
      recentConsultations[i].journals = journals;
    }

    // Monthly Chart Data
    const monthlyTrend = await query(`
      SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
      FROM consultations
      WHERE date >= date('now', '-6 months') ${cFilterAnd}
      GROUP BY month
      ORDER BY month ASC
    `);

    return res.json({
      stats: {
        totalConsultations: countTotal,
        totalRules: totalRules?.count || 0,
        totalAccounts: totalAccounts?.count || 0,
        classifiedCount: countClassified,
        accuracyRate,
        avgConfidence,
        thisMonth: countThisMonth,
        growthPct
      },
      recentConsultations,
      charts: {
        monthly: monthlyTrend
      }
    });

  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Dashboard.', error: err.message });
  }
});

// 7. Business Health Diagnostics
router.get('/business-health', authenticateToken, async (req, res) => {
  try {
    const report = await HealthDiagnosticsEngine.evaluate(req.user.id);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Analisis Kesehatan Bisnis.', error: err.message });
  }
});

export default router;
