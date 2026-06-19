import { query, run } from '../src/config/database.js';

async function execute() {
  try {
    await run('BEGIN TRANSACTION');

    const additions = [
      // 1. R-009 (Pendapatan Penjualan) - priority 80
      { ruleCode: 'R-009', fact: 'is_setoran_modal', val: 'no' },
      { ruleCode: 'R-009', fact: 'is_pinjaman_bank', val: 'no' },

      // 2. R-010 (Pendapatan Jasa) - priority 80
      { ruleCode: 'R-010', fact: 'is_setoran_modal', val: 'no' },
      { ruleCode: 'R-010', fact: 'is_pinjaman_bank', val: 'no' },

      // 3. R-019 (Penerimaan Piutang) - priority 0
      { ruleCode: 'R-019', fact: 'is_setoran_modal', val: 'no' },
      { ruleCode: 'R-019', fact: 'is_pinjaman_bank', val: 'no' },
      { ruleCode: 'R-019', fact: 'is_penjualan_barang', val: 'no' },
      { ruleCode: 'R-019', fact: 'is_penjualan_jasa', val: 'no' },

      // 4. R-006 (Peralatan Kantor) - priority 90
      { ruleCode: 'R-006', fact: 'is_dijual_kembali', val: 'no' },

      // 5. R-017 (Pembelian Perlengkapan) - priority 0 (in database, R-017 has priority 0)
      { ruleCode: 'R-017', fact: 'is_dijual_kembali', val: 'no' }
    ];

    for (const add of additions) {
      const ruleRow = await query("SELECT id FROM rules WHERE code = ?", [add.ruleCode]);
      if (ruleRow.length === 0) continue;
      const ruleId = ruleRow[0].id;

      // Delete if existing to avoid duplication
      await run(`
        DELETE FROM rule_conditions 
        WHERE rule_id = ? AND fact_name = ?
      `, [ruleId, add.fact]);

      // Insert new condition
      await run(`
        INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
        VALUES (?, ?, 'equals', ?)
      `, [ruleId, add.fact, add.val]);

      console.log(`Added condition ${add.fact} = ${add.val} for rule ${add.ruleCode}`);
    }

    await run('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await run('ROLLBACK');
    console.error('Migration failed, rolled back changes:', err);
  }
  process.exit(0);
}

execute();
