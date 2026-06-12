import express from 'express';
import { query, get } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get Dashboard Overview Statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const isUser = req.user.role !== 'Admin';
    const userId = req.user.id;

    // 1. Stats Card counts
    const totalConsultationsRow = isUser
      ? await get('SELECT COUNT(*) as count FROM consultations WHERE user_id = ?', [userId])
      : await get('SELECT COUNT(*) as count FROM consultations');

    const totalRulesRow = await get('SELECT COUNT(*) as count FROM rules WHERE is_active = 1');
    const totalAccountsRow = await get('SELECT COUNT(*) as count FROM accounts');
    const totalUsersRow = await get('SELECT COUNT(*) as count FROM users');

    // Classified (has result account) count
    const classifiedRow = isUser
      ? await get('SELECT COUNT(*) as count FROM consultations WHERE user_id = ? AND result_account_id IS NOT NULL', [userId])
      : await get('SELECT COUNT(*) as count FROM consultations WHERE result_account_id IS NOT NULL');

    // Average confidence
    const avgConfRow = isUser
      ? await get('SELECT AVG(confidence_level) as avg FROM consultations WHERE user_id = ? AND result_account_id IS NOT NULL', [userId])
      : await get('SELECT AVG(confidence_level) as avg FROM consultations WHERE result_account_id IS NOT NULL');

    // Consultations this month vs last month
    const thisMonthRow = isUser
      ? await get("SELECT COUNT(*) as count FROM consultations WHERE user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')", [userId])
      : await get("SELECT COUNT(*) as count FROM consultations WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')");
    const lastMonthRow = isUser
      ? await get("SELECT COUNT(*) as count FROM consultations WHERE user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', date('now', '-1 month'))", [userId])
      : await get("SELECT COUNT(*) as count FROM consultations WHERE strftime('%Y-%m', date) = strftime('%Y-%m', date('now', '-1 month'))");

    // 2. Recent consultations (Limit 5)
    let recentConsultationsSql = `
      SELECT c.id, c.date, c.business_type, c.confidence_level, c.reasoning_text,
             u.name as user_name,
             a.code as account_code, a.name as account_name, a.category as account_category
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN accounts a ON c.result_account_id = a.id
    `;
    const recentParams = [];
    if (isUser) {
      recentConsultationsSql += ' WHERE c.user_id = ?';
      recentParams.push(userId);
    }
    recentConsultationsSql += ' ORDER BY c.date DESC LIMIT 5';
    const recentConsultations = await query(recentConsultationsSql, recentParams);

    // 3. Logic Engine Activity Chart (Grouped by Date)
    let monthlySql = `
      SELECT strftime('%Y-%m', date) as month, COUNT(*) as count 
      FROM consultations 
    `;
    const monthlyParams = [];
    if (isUser) {
      monthlySql += ' WHERE user_id = ? ';
      monthlyParams.push(userId);
    }
    monthlySql += ' GROUP BY month ORDER BY month DESC LIMIT 6';
    const monthlyData = await query(monthlySql, monthlyParams);

    // 4. Most Common Accounts Chart
    let accountsSql = `
      SELECT a.name as account_name, COUNT(*) as count
      FROM consultations c
      JOIN accounts a ON c.result_account_id = a.id
    `;
    const accountsParams = [];
    if (isUser) {
      accountsSql += ' WHERE c.user_id = ?';
      accountsParams.push(userId);
    }
    accountsSql += ' GROUP BY a.name ORDER BY count DESC LIMIT 5';
    const accountsData = await query(accountsSql, accountsParams);

    // 5. Business Type distribution
    const businessSql = isUser
      ? 'SELECT business_type, COUNT(*) as count FROM consultations WHERE user_id = ? GROUP BY business_type'
      : 'SELECT business_type, COUNT(*) as count FROM users GROUP BY business_type';
    const businessParams = isUser ? [userId] : [];
    const businessDistribution = await query(businessSql, businessParams);

    const totalCount = totalConsultationsRow.count;
    const classifiedCount = classifiedRow.count;
    const avgConf = avgConfRow.avg ? parseFloat(avgConfRow.avg).toFixed(1) : 95;
    const thisMonth = thisMonthRow.count;
    const lastMonth = lastMonthRow.count;
    const growthPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0);
    const accuracyRate = totalCount > 0 ? parseFloat((classifiedCount / totalCount * 100).toFixed(1)) : 0;

    return res.json({
      stats: {
        totalConsultations: totalCount,
        totalRules: totalRulesRow.count,
        totalAccounts: totalAccountsRow.count,
        totalUsers: totalUsersRow.count,
        classifiedCount,
        accuracyRate,
        avgConfidence: avgConf,
        thisMonth,
        lastMonth,
        growthPct
      },
      recentConsultations,
      charts: {
        monthly: monthlyData.reverse(),
        accounts: accountsData,
        business: businessDistribution
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil data dashboard.', error: err.message });
  }
});

// Get Detailed Analytics and Filtered Reports
router.get('/analytics', authenticateToken, async (req, res) => {
  const { start_date, end_date, business_type, user_id } = req.query;
  const isUser = req.user.role !== 'Admin';

  let sql = `
    SELECT c.id, c.date, c.business_type, c.confidence_level, c.reasoning_text,
           u.name as user_name, u.business_name,
           a.code as account_code, a.name as account_name, a.category as account_category
    FROM consultations c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN accounts a ON c.result_account_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (isUser) {
    sql += ' AND c.user_id = ?';
    params.push(req.user.id);
  } else if (user_id) {
    sql += ' AND c.user_id = ?';
    params.push(user_id);
  }

  if (start_date) {
    sql += ' AND date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    sql += ' AND date <= ?';
    params.push(end_date);
  }

  if (business_type) {
    sql += ' AND c.business_type = ?';
    params.push(business_type);
  }

  sql += ' ORDER BY c.date DESC';

  try {
    const consultations = await query(sql, params);

    // Calculate aggregated results
    const categoryCounts = {};
    const accountCounts = {};
    let totalConfidence = 0;
    let classifiedCount = 0;

    consultations.forEach(c => {
      if (c.account_category) {
        categoryCounts[c.account_category] = (categoryCounts[c.account_category] || 0) + 1;
      }
      if (c.account_name) {
        accountCounts[c.account_name] = (accountCounts[c.account_name] || 0) + 1;
        classifiedCount++;
        totalConfidence += c.confidence_level;
      }
    });

    const averageConfidence = classifiedCount > 0 ? (totalConfidence / classifiedCount).toFixed(1) : 100;

    return res.json({
      consultations,
      aggregates: {
        total: consultations.length,
        classifiedCount,
        unclassifiedCount: consultations.length - classifiedCount,
        averageConfidence,
        categories: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
        accounts: Object.entries(accountCounts).map(([name, count]) => ({ name, count }))
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil data analitik.', error: err.message });
  }
});

// Get User lists (Admin only, for reports filter dropdown)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await query('SELECT id, name, business_name FROM users ORDER BY name ASC');
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil data user.', error: err.message });
  }
});

export default router;
