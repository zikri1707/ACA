import { query } from '../src/config/database.js';

async function test() {
  try {
    const userId = 1;
    console.log('Testing summary queries for User ID:', userId);

    // Filters for User ID 1
    const filterStr = ' AND j.consultation_id IN (SELECT id FROM consultations WHERE user_id = ?)';
    const params = [userId];

    // Simulating /summary SQL
    const sql = `
      SELECT a.category,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      LEFT JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id) ${filterStr}
      GROUP BY a.category
    `;
    const records = await query(sql, params);
    console.log('Summary records:', records);

    // Test debitDistribution
    const debitSql = `
      SELECT a.category, COUNT(*) as count
      FROM journals j
      JOIN accounts a ON j.debit_account_id = a.id
      ${filterStr}
      GROUP BY a.category
      ORDER BY count DESC
    `;
    const debitDistData = await query(debitSql, params);
    console.log('Debit distribution count:', debitDistData.length);

    // Test creditDistribution
    const creditSql = `
      SELECT a.category, COUNT(*) as count
      FROM journals j
      JOIN accounts a ON j.credit_account_id = a.id
      ${filterStr}
      GROUP BY a.category
      ORDER BY count DESC
    `;
    const creditDistData = await query(creditSql, params);
    console.log('Credit distribution count:', creditDistData.length);

    // Test topAccounts
    const topSql = `
      SELECT a.id, a.code, a.name, a.category,
             (SELECT COUNT(*) FROM journals j WHERE (j.debit_account_id = a.id OR j.credit_account_id = a.id) AND j.consultation_id IN (SELECT id FROM consultations WHERE user_id = ?)) as frequency,
             COALESCE((SELECT SUM(j.amount) FROM journals j WHERE j.debit_account_id = a.id AND j.consultation_id IN (SELECT id FROM consultations WHERE user_id = ?)), 0) as total_debit,
             COALESCE((SELECT SUM(j.amount) FROM journals j WHERE j.credit_account_id = a.id AND j.consultation_id IN (SELECT id FROM consultations WHERE user_id = ?)), 0) as total_credit
      FROM accounts a
      WHERE frequency > 0
      ORDER BY frequency DESC
      LIMIT 5
    `;
    const topAccountsRaw = await query(topSql, [userId, userId, userId]);
    console.log('Top accounts count:', topAccountsRaw.length);

  } catch (err) {
    console.error('Error during summary testing:', err);
  }
  process.exit(0);
}

test();
