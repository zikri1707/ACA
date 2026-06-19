import { query, run } from '../src/config/database.js';

async function execute() {
  try {
    await run('BEGIN TRANSACTION');

    console.log('1. Deactivating R-020 (Pencatatan HPP (Otomatis)) for consultations...');
    await run("UPDATE rules SET is_active = 0 WHERE code = 'R-020'");

    console.log('2. Updating Q-001 and Q-002 question texts for clarity...');
    await run(`
      UPDATE questions 
      SET question_text = 'Apakah transaksi ini terkait dengan penerimaan atau pendapatan perusahaan (seperti penjualan, setoran modal, pinjaman masuk, atau penerimaan piutang)?' 
      WHERE code = 'Q-001'
    `);
    await run(`
      UPDATE questions 
      SET question_text = 'Apakah transaksi ini terkait dengan pengeluaran, pembelian, atau beban perusahaan (seperti pembelian barang, aset, pembayaran beban, pelunasan hutang, atau prive)?' 
      WHERE code = 'Q-002'
    `);

    console.log('3. Inserting is_kredit = no condition for cash-only rules...');
    const cashRules = [
      'R-007', // Modal Pemilik
      'R-008', // Prive Pemilik
      'R-011', // Beban Gaji
      'R-012', // Beban Listrik & Air
      'R-013', // Beban Sewa Ruko
      'R-014', // Beban ATK
      'R-015', // Hutang Bank (Pinjaman)
      'R-016', // Beban Pemasaran
      'R-018A', // Pelunasan Hutang Dagang
      'R-018B', // Pelunasan Hutang Bank
      'R-019'  // Penerimaan Piutang
    ];

    for (const code of cashRules) {
      // Get the rule ID first
      const ruleRow = await query("SELECT id FROM rules WHERE code = ?", [code]);
      if (ruleRow.length === 0) {
        console.warn(`Warning: Rule ${code} not found!`);
        continue;
      }
      const ruleId = ruleRow[0].id;

      // Delete existing is_kredit condition to avoid duplicates
      await run("DELETE FROM rule_conditions WHERE rule_id = ? AND fact_name = 'is_kredit'", [ruleId]);

      // Insert new is_kredit condition
      await run(`
        INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
        VALUES (?, 'is_kredit', 'equals', 'no')
      `, [ruleId]);

      console.log(`   - Condition is_kredit = no added for ${code}`);
    }

    await run('COMMIT');
    console.log('Migration successfully completed!');
  } catch (err) {
    await run('ROLLBACK');
    console.error('Migration failed, rolled back changes:', err);
  }
  process.exit(0);
}

execute();
