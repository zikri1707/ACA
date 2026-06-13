import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper for date filtering
const getDateFilter = (req, dateColumn = 'j.transaction_date') => {
  const { startDate, endDate } = req.query;
  let filterStr = '';
  const params = [];
  
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
    // We will get the last 6 months of consultations
    const trendSql = `
      SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
      FROM consultations
      WHERE date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `;
    const monthlyTrend = await query(trendSql);

    // 2. Category Distribution (based on journal entries frequency)
    const catSql = `
      SELECT a.category, COUNT(*) as count
      FROM journals j
      JOIN accounts a ON (j.debit_account_id = a.id OR j.credit_account_id = a.id)
      ${filterStr.replace('j.transaction_date', 'j.transaction_date')}
      GROUP BY a.category
    `;
    const catDistData = await query(catSql, params);
    const totalCatCount = catDistData.reduce((sum, row) => sum + row.count, 0);
    const categoryDistribution = catDistData.map(row => ({
      category: row.category,
      percentage: totalCatCount > 0 ? Math.round((row.count / totalCatCount) * 100) : 0
    }));

    // 3. Top 5 Frequently Used Accounts
    const topSql = `
      SELECT a.id, a.code, a.name, a.category,
             (SELECT COUNT(*) FROM journals j WHERE j.debit_account_id = a.id OR j.credit_account_id = a.id) as frequency,
             COALESCE(SUM(CASE WHEN j2.debit_account_id = a.id THEN j2.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j2.credit_account_id = a.id THEN j2.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      LEFT JOIN journals j2 ON (j2.debit_account_id = a.id OR j2.credit_account_id = a.id)
      GROUP BY a.id
      HAVING frequency > 0
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

    return res.json({ summary, monthlyTrend, categoryDistribution, topAccounts });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat Summary.', error: err.message });
  }
});

export default router;
