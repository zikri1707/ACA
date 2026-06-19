import { query } from '../src/config/database.js';

async function test() {
  try {
    const userId = 1;
    console.log('Testing income-statement query for User ID:', userId);
    
    // Simulating Laba Rugi SQL
    const sqlLabaRugi = `
      SELECT a.id, a.code, a.name, a.category,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id)
      JOIN consultations c ON j.consultation_id = c.id
      WHERE a.category IN ('Pendapatan', 'Beban') AND c.user_id = ?
      GROUP BY a.id
      ORDER BY a.code ASC
    `;
    const records = await query(sqlLabaRugi, [userId]);
    console.log('Laba Rugi records count:', records.length);
    console.log('Sample records:', records.slice(0, 3));

    // Simulating Neraca SQL
    const sqlNeraca = `
      SELECT a.id, a.code, a.name, a.category,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id)
      JOIN consultations c ON j.consultation_id = c.id
      WHERE a.category IN ('Aset', 'Kewajiban', 'Ekuitas') AND c.user_id = ?
      GROUP BY a.id
      ORDER BY a.code ASC
    `;
    const neracaRecords = await query(sqlNeraca, [userId]);
    console.log('Neraca records count:', neracaRecords.length);
    console.log('Sample neraca records:', neracaRecords.slice(0, 3));

  } catch (err) {
    console.error('Error during testing:', err);
  }
  process.exit(0);
}

test();
