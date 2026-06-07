import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath);

// Helper function to execute run command as promise
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Helper function to query all rows as promise
const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function init() {
  try {
    console.log('Starting DB initialization...');
    await runAsync('PRAGMA foreign_keys = OFF');

    const tables = [
      'activity_logs', 'consultation_answers', 'consultations', 
      'rule_conditions', 'rules', 'questions', 'accounts', 
      'users', 'roles'
    ];
    for (const table of tables) {
      await runAsync(`DROP TABLE IF EXISTS ${table}`);
    }

    await runAsync('PRAGMA foreign_keys = ON');

    // 1. Roles table
    await runAsync(`
      CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // 2. Users table
    await runAsync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        business_name TEXT,
        business_type TEXT CHECK(business_type IN ('jasa', 'dagang')),
        role_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    // 3. Accounts table
    await runAsync(`
      CREATE TABLE accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Questions table
    await runAsync(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        question_text TEXT NOT NULL,
        fact_name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Rules table
    await runAsync(`
      CREATE TABLE rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        business_type TEXT NOT NULL CHECK(business_type IN ('jasa', 'dagang', 'semua')),
        conclusion_account_id INTEGER NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conclusion_account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);

    // 6. Rule Conditions table
    await runAsync(`
      CREATE TABLE rule_conditions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id INTEGER NOT NULL,
        fact_name TEXT NOT NULL,
        operator TEXT NOT NULL DEFAULT 'equals',
        expected_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
      )
    `);

    // 7. Consultations table
    await runAsync(`
      CREATE TABLE consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        business_type TEXT NOT NULL,
        result_account_id INTEGER,
        confidence_level INTEGER DEFAULT 100,
        reasoning_text TEXT,
        rule_trace_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (result_account_id) REFERENCES accounts(id)
      )
    `);

    // 8. Consultation Answers table
    await runAsync(`
      CREATE TABLE consultation_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultation_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        answer TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )
    `);

    // 9. Activity Logs table
    await runAsync(`
      CREATE TABLE activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('Database tables created successfully.');

    // Seeding Roles
    await runAsync("INSERT INTO roles (name, description) VALUES ('Admin', 'Administrator access')");
    await runAsync("INSERT INTO roles (name, description) VALUES ('User', 'Standard user access')");

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const userHash = await bcrypt.hash('user123', salt);

    // Seeding Users
    await runAsync(`
      INSERT INTO users (name, email, password_hash, business_name, business_type, role_id) 
      VALUES ('Budi Santoso', 'admin@aca.com', ?, 'ACA Consultant', 'jasa', 1)
    `, [adminHash]);

    await runAsync(`
      INSERT INTO users (name, email, password_hash, business_name, business_type, role_id) 
      VALUES ('John Doe', 'owner@umkm.com', ?, 'Toko Berkah', 'dagang', 2)
    `, [userHash]);

    // Seeding Accounts (COA)
    const defaultAccounts = [
      { code: '1-1000', name: 'Kas Utama', category: 'Aset', subcategory: 'Kas & Setara Kas', description: 'Uang tunai yang tersedia di brankas kantor.' },
      { code: '1-1100', name: 'Bank BCA (Operasional)', category: 'Aset', subcategory: 'Bank', description: 'Saldo rekening bank untuk transaksi harian.' },
      { code: '1-1200', name: 'Piutang Usaha', category: 'Aset', subcategory: 'Piutang Usaha', description: 'Tagihan kepada pelanggan atas penjualan kredit.' },
      { code: '1-1300', name: 'Persediaan Barang Dagang', category: 'Aset', subcategory: 'Persediaan', description: 'Barang dibeli untuk dijual kembali kepada konsumen.' },
      { code: '1-2100', name: 'Peralatan Kantor', category: 'Aset', subcategory: 'Peralatan', description: 'Aset berwujud dengan masa manfaat > 1 tahun untuk operasional.' },
      { code: '1-2200', name: 'Kendaraan', category: 'Aset', subcategory: 'Kendaraan', description: 'Kendaraan operasional perusahaan.' },
      { code: '2-1000', name: 'Hutang Dagang', category: 'Kewajiban', subcategory: 'Hutang Usaha', description: 'Kewajiban pembayaran atas pembelian kredit kepada supplier.' },
      { code: '2-1100', name: 'Hutang Pajak', category: 'Kewajiban', subcategory: 'Hutang Pajak', description: 'Kewajiban pajak yang belum disetorkan ke kas negara.' },
      { code: '2-2000', name: 'Hutang Bank', category: 'Kewajiban', subcategory: 'Hutang Bank', description: 'Pinjaman jangka panjang dari institusi keuangan.' },
      { code: '3-1000', name: 'Modal Pemilik', category: 'Ekuitas', subcategory: 'Modal Pemilik', description: 'Investasi awal dan tambahan modal dari pemilik.' },
      { code: '3-2000', name: 'Prive Pemilik', category: 'Ekuitas', subcategory: 'Prive', description: 'Pengambilan aset perusahaan untuk keperluan pribadi pemilik.' },
      { code: '4-1000', name: 'Pendapatan Penjualan', category: 'Pendapatan', subcategory: 'Pendapatan Penjualan', description: 'Hasil penjualan barang dagang kepada pelanggan.' },
      { code: '4-1100', name: 'Pendapatan Jasa', category: 'Pendapatan', subcategory: 'Pendapatan Jasa', description: 'Hasil penyerahan jasa kepada pelanggan.' },
      { code: '5-1000', name: 'Beban Gaji', category: 'Beban', subcategory: 'Beban Gaji', description: 'Pembayaran upah dan tunjangan karyawan.' },
      { code: '5-1100', name: 'Beban Listrik & Air', category: 'Beban', subcategory: 'Beban Listrik', description: 'Biaya operasional utilitas kantor.' },
      { code: '5-1200', name: 'Beban Sewa Kantor', category: 'Beban', subcategory: 'Beban Sewa', description: 'Biaya sewa ruang atau gedung operasional.' },
      { code: '5-1300', name: 'Beban Internet', category: 'Beban', subcategory: 'Beban Internet', description: 'Biaya langganan jaringan internet operasional.' },
      { code: '5-1400', name: 'Beban Transportasi', category: 'Beban', subcategory: 'Beban Transportasi', description: 'Biaya bensin, tol, dan perjalanan dinas.' },
      { code: '5-1500', name: 'Beban ATK', category: 'Beban', subcategory: 'Beban ATK', description: 'Pembelian barang habis pakai kantor.' },
      { code: '5-1600', name: 'Beban Promosi', category: 'Beban', subcategory: 'Beban Promosi', description: 'Biaya pemasaran dan iklan produk/jasa.' }
    ];

    for (const acc of defaultAccounts) {
      await runAsync(
        'INSERT INTO accounts (code, name, category, subcategory, description) VALUES (?, ?, ?, ?, ?)',
        [acc.code, acc.name, acc.category, acc.subcategory, acc.description]
      );
    }
    console.log('COA seeded.');

    // Seeding Questions
    const defaultQuestions = [
      { code: 'Q-001', question_text: 'Apakah transaksi berupa penerimaan uang tunai atau masuk ke rekening bank?', fact_name: 'is_penerimaan' },
      { code: 'Q-002', question_text: 'Apakah transaksi berupa pengeluaran uang tunai atau transfer keluar?', fact_name: 'is_pengeluaran' },
      { code: 'Q-003', question_text: 'Apakah transaksi terkait penjualan barang dagang?', fact_name: 'is_penjualan_barang' },
      { code: 'Q-004', question_text: 'Apakah transaksi terkait penyerahan jasa?', fact_name: 'is_penjualan_jasa' },
      { code: 'Q-005', question_text: 'Apakah pembayaran dilakukan secara kredit (tempo)?', fact_name: 'is_kredit' },
      { code: 'Q-006', question_text: 'Apakah barang yang dibeli ditujukan untuk dijual kembali kepada pelanggan?', fact_name: 'is_dijual_kembali' },
      { code: 'Q-007', question_text: 'Apakah transaksi terkait pembelian aset tetap (peralatan, mesin, kendaraan)?', fact_name: 'is_pembelian_aset' },
      { code: 'Q-008', question_text: 'Apakah aset yang dibeli memiliki masa manfaat lebih dari satu tahun?', fact_name: 'is_manfaat_lebih_1_tahun' },
      { code: 'Q-009', question_text: 'Apakah transaksi berupa penyetoran modal investasi oleh pemilik?', fact_name: 'is_setoran_modal' },
      { code: 'Q-010', question_text: 'Apakah transaksi berupa penarikan uang/aset perusahaan untuk keperluan pribadi pemilik?', fact_name: 'is_prive' },
      { code: 'Q-011', question_text: 'Apakah transaksi ditujukan untuk pembayaran gaji karyawan?', fact_name: 'is_beban_gaji' },
      { code: 'Q-012', question_text: 'Apakah transaksi ditujukan untuk pembayaran tagihan listrik, air, atau telepon?', fact_name: 'is_beban_utilitas' },
      { code: 'Q-013', question_text: 'Apakah transaksi ditujukan untuk pembayaran sewa gedung atau ruko usaha?', fact_name: 'is_beban_sewa' },
      { code: 'Q-014', question_text: 'Apakah transaksi ditujukan untuk pembelian Alat Tulis Kantor (ATK) / perlengkapan habis pakai?', fact_name: 'is_beban_atk' },
      { code: 'Q-015', question_text: 'Apakah transaksi berupa pencairan dana pinjaman dari pihak bank?', fact_name: 'is_pinjaman_bank' }
    ];

    for (const q of defaultQuestions) {
      await runAsync(
        'INSERT INTO questions (code, question_text, fact_name) VALUES (?, ?, ?)',
        [q.code, q.question_text, q.fact_name]
      );
    }
    console.log('Questions seeded.');

    // Get all inserted accounts to map their database IDs
    const accountsRows = await allAsync('SELECT id, code FROM accounts');
    const accountsMap = {};
    accountsRows.forEach(row => {
      accountsMap[row.code] = row.id;
    });

    const defaultRules = [
      {
        code: 'R-001',
        name: 'Kas Utama (Penerimaan Tunai)',
        business_type: 'semua',
        conclusion_code: '1-1000',
        description: 'Penerimaan uang tunai dari operasional atau non-operasional.',
        conditions: [
          { fact_name: 'is_penerimaan', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'no' },
          { fact_name: 'is_setoran_modal', expected_value: 'no' },
          { fact_name: 'is_pinjaman_bank', expected_value: 'no' }
        ]
      },
      {
        code: 'R-002',
        name: 'Piutang Usaha (Penjualan Kredit)',
        business_type: 'semua',
        conclusion_code: '1-1200',
        description: 'Penjualan barang atau penyerahan jasa secara kredit/tempo.',
        conditions: [
          { fact_name: 'is_penerimaan', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-003',
        name: 'Persediaan Barang Dagang (Pembelian Tunai)',
        business_type: 'dagang',
        conclusion_code: '1-1300',
        description: 'Pembelian barang dagang secara tunai untuk dijual kembali.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_dijual_kembali', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'no' }
        ]
      },
      {
        code: 'R-004',
        name: 'Persediaan Barang Dagang (Pembelian Kredit)',
        business_type: 'dagang',
        conclusion_code: '1-1300',
        description: 'Pembelian barang dagang secara kredit/tempo dari supplier.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_dijual_kembali', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-005',
        name: 'Hutang Dagang',
        business_type: 'semua',
        conclusion_code: '2-1000',
        description: 'Kewajiban atas pembelian barang atau jasa secara kredit.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'yes' },
          { fact_name: 'is_pembelian_aset', expected_value: 'no' }
        ]
      },
      {
        code: 'R-006',
        name: 'Peralatan Kantor (Aset Tetap)',
        business_type: 'semua',
        conclusion_code: '1-2100',
        description: 'Pembelian peralatan dengan masa manfaat lebih dari satu tahun.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_pembelian_aset', expected_value: 'yes' },
          { fact_name: 'is_manfaat_lebih_1_tahun', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-007',
        name: 'Modal Pemilik',
        business_type: 'semua',
        conclusion_code: '3-1000',
        description: 'Penyetoran modal investasi ke perusahaan oleh pemilik.',
        conditions: [
          { fact_name: 'is_penerimaan', expected_value: 'yes' },
          { fact_name: 'is_setoran_modal', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-008',
        name: 'Prive Pemilik',
        business_type: 'semua',
        conclusion_code: '3-2000',
        description: 'Pengambilan uang perusahaan untuk keperluan pribadi pemilik.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_prive', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-009',
        name: 'Pendapatan Penjualan',
        business_type: 'dagang',
        conclusion_code: '4-1000',
        description: 'Penjualan produk atau barang dagang secara tunai.',
        conditions: [
          { fact_name: 'is_penerimaan', expected_value: 'yes' },
          { fact_name: 'is_penjualan_barang', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'no' }
        ]
      },
      {
        code: 'R-010',
        name: 'Pendapatan Jasa',
        business_type: 'jasa',
        conclusion_code: '4-1100',
        description: 'Pendapatan yang didapatkan dari penyerahan jasa secara tunai.',
        conditions: [
          { fact_name: 'is_penerimaan', expected_value: 'yes' },
          { fact_name: 'is_penjualan_jasa', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'no' }
        ]
      },
      {
        code: 'R-011',
        name: 'Beban Gaji',
        business_type: 'semua',
        conclusion_code: '5-1000',
        description: 'Pembayaran upah rutin karyawan.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_beban_gaji', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-012',
        name: 'Beban Listrik & Air (Utilitas)',
        business_type: 'semua',
        conclusion_code: '5-1100',
        description: 'Biaya operasional bulanan listrik dan air.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_beban_utilitas', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-013',
        name: 'Beban Sewa Ruko',
        business_type: 'semua',
        conclusion_code: '5-1200',
        description: 'Biaya sewa gedung atau ruko usaha bulanan/tahunan.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_beban_sewa', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-014',
        name: 'Beban Alat Tulis Kantor (ATK)',
        business_type: 'semua',
        conclusion_code: '5-1500',
        description: 'Biaya pembelian supplies habis pakai kantor.',
        conditions: [
          { fact_name: 'is_pengeluaran', expected_value: 'yes' },
          { fact_name: 'is_beban_atk', expected_value: 'yes' }
        ]
      },
      {
        code: 'R-015',
        name: 'Hutang Bank (Pinjaman)',
        business_type: 'semua',
        conclusion_code: '2-2000',
        description: 'Penerimaan dana pinjaman modal dari bank.',
        conditions: [
          { fact_name: 'is_penerimaan', expected_value: 'yes' },
          { fact_name: 'is_pinjaman_bank', expected_value: 'yes' }
        ]
      }
    ];

    for (const rule of defaultRules) {
      const accountId = accountsMap[rule.conclusion_code];
      if (!accountId) {
        console.error(`Account not found for code: ${rule.conclusion_code}`);
        continue;
      }

      const ruleResult = await runAsync(`
        INSERT INTO rules (code, name, business_type, conclusion_account_id, description) 
        VALUES (?, ?, ?, ?, ?)
      `, [rule.code, rule.name, rule.business_type, accountId, rule.description]);

      const ruleId = ruleResult.lastID;

      for (const cond of rule.conditions) {
        await runAsync(`
          INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
          VALUES (?, ?, 'equals', ?)
        `, [ruleId, cond.fact_name, cond.expected_value]);
      }
    }

    console.log('Rules and conditions seeded successfully.');
    db.close();
  } catch (err) {
    console.error('Initialization error:', err);
    process.exit(1);
  }
}

init();
