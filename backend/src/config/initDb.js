import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath);

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

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
      'activity_logs', 'consultation_answers', 'journals', 'consultations', 
      'rule_conditions', 'rules', 'questions', 'accounts', 
      'users', 'roles'
    ];
    for (const table of tables) {
      await runAsync(`DROP TABLE IF EXISTS ${table}`);
    }

    await runAsync('PRAGMA foreign_keys = ON');

    // 1. Roles
    await runAsync(`
      CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // 2. Users
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

    // 3. Accounts
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

    // 4. Questions
    await runAsync(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        question_text TEXT NOT NULL,
        fact_name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Rules (Single-Row Double-Entry Schema)
    await runAsync(`
      CREATE TABLE rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        business_type TEXT NOT NULL CHECK(business_type IN ('jasa', 'dagang', 'semua')),
        debit_account_id INTEGER,
        credit_account_id INTEGER,
        description TEXT,
        priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (debit_account_id) REFERENCES accounts(id),
        FOREIGN KEY (credit_account_id) REFERENCES accounts(id)
      )
    `);

    // 6. Rule Conditions
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

    // 7. Consultations
    await runAsync(`
      CREATE TABLE consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        business_type TEXT NOT NULL,
        confidence_level INTEGER DEFAULT 100,
        reasoning_text TEXT,
        rule_trace_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 8. Consultation Answers
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

    // 9. Activity Logs
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

    // 10. Journals (Single-Row Journal)
    await runAsync(`
      CREATE TABLE journals (
        journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultation_id INTEGER,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        debit_account_id INTEGER NOT NULL,
        credit_account_id INTEGER NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (debit_account_id) REFERENCES accounts(id),
        FOREIGN KEY (credit_account_id) REFERENCES accounts(id)
      )
    `);

    console.log('Database tables created successfully.');

    // Seeding Roles & Users
    await runAsync("INSERT INTO roles (name, description) VALUES ('Admin', 'Administrator access')");
    await runAsync("INSERT INTO roles (name, description) VALUES ('User', 'Standard user access')");

    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const userHash = await bcrypt.hash('user123', salt);

    await runAsync("INSERT INTO users (name, email, password_hash, business_name, business_type, role_id) VALUES ('Budi Santoso', 'admin@aca.com', ?, 'ACA Consultant', 'jasa', 1)", [adminHash]);
    await runAsync("INSERT INTO users (name, email, password_hash, business_name, business_type, role_id) VALUES ('John Doe', 'owner@umkm.com', ?, 'Toko Berkah', 'dagang', 2)", [userHash]);

    // Seeding Accounts (COA)
    const defaultAccounts = [
      { code: '1-1000', name: 'Kas Utama', category: 'Aset', subcategory: 'Kas & Setara Kas' },
      { code: '1-1100', name: 'Bank BCA (Operasional)', category: 'Aset', subcategory: 'Bank' },
      { code: '1-1200', name: 'Piutang Usaha', category: 'Aset', subcategory: 'Piutang Usaha' },
      { code: '1-1300', name: 'Persediaan', category: 'Aset', subcategory: 'Persediaan' },
      { code: '1-1400', name: 'Sewa Dibayar Dimuka', category: 'Aset', subcategory: 'Uang Muka' },
      { code: '1-1500', name: 'Perlengkapan', category: 'Aset', subcategory: 'Perlengkapan' },
      { code: '1-2100', name: 'Peralatan', category: 'Aset', subcategory: 'Aset Tetap' },
      { code: '1-2110', name: 'Akumulasi Penyusutan Peralatan', category: 'Aset', subcategory: 'Akumulasi Penyusutan' },
      { code: '1-9000', name: 'Aset Lain-lain', category: 'Aset', subcategory: 'Aset Lain-lain' },
      
      { code: '2-1000', name: 'Hutang Dagang', category: 'Kewajiban', subcategory: 'Hutang Lancar' },
      { code: '2-2000', name: 'Hutang Bank', category: 'Kewajiban', subcategory: 'Hutang Jangka Panjang' },
      
      { code: '3-1000', name: 'Modal Pemilik', category: 'Ekuitas', subcategory: 'Modal' },
      { code: '3-2000', name: 'Prive', category: 'Ekuitas', subcategory: 'Prive' },
      { code: '3-9000', name: 'Ikhtisar Laba Rugi', category: 'Ekuitas', subcategory: 'Laba Ditahan' },
      
      { code: '4-1000', name: 'Pendapatan Penjualan', category: 'Pendapatan', subcategory: 'Pendapatan Usaha' },
      { code: '4-1100', name: 'Pendapatan Jasa', category: 'Pendapatan', subcategory: 'Pendapatan Usaha' },
      { code: '4-9000', name: 'Pendapatan Lain-lain', category: 'Pendapatan', subcategory: 'Pendapatan Lain' },
      
      { code: '5-1000', name: 'Beban Gaji', category: 'Beban', subcategory: 'Beban Operasional' },
      { code: '5-1100', name: 'Beban Utilitas', category: 'Beban', subcategory: 'Beban Operasional' },
      { code: '5-1200', name: 'Beban Sewa', category: 'Beban', subcategory: 'Beban Operasional' },
      { code: '5-1300', name: 'Beban Pemasaran', category: 'Beban', subcategory: 'Beban Operasional' },
      { code: '5-1500', name: 'Beban ATK', category: 'Beban', subcategory: 'Beban Operasional' },
      { code: '5-2000', name: 'Beban Penyusutan', category: 'Beban', subcategory: 'Beban Non-Tunai' },
      { code: '5-3000', name: 'Harga Pokok Penjualan', category: 'Beban', subcategory: 'Harga Pokok Penjualan' },
      { code: '2-9000', name: 'Hutang Lain-lain', category: 'Kewajiban', subcategory: 'Hutang Lancar' },
      { code: '5-9000', name: 'Beban Lain-lain', category: 'Beban', subcategory: 'Beban Operasional' }
    ];

    for (const acc of defaultAccounts) {
      await runAsync(
        'INSERT INTO accounts (code, name, category, subcategory, description) VALUES (?, ?, ?, ?, ?)',
        [acc.code, acc.name, acc.category, acc.subcategory, '']
      );
    }
    console.log('COA seeded.');

    // Seeding Questions (22 pertanyaan sesuai dokumentasi backward chaining dan flowchart)
    const defaultQuestions = [
      { code: 'Q-001', question_text: 'Apakah transaksi merupakan penerimaan uang?', fact_name: 'is_inbound' },
      { code: 'Q-002', question_text: 'Apakah transaksi merupakan pengeluaran uang?', fact_name: 'is_outbound' },
      { code: 'Q-003', question_text: 'Apakah transaksi berasal dari penjualan barang?', fact_name: 'is_penjualan_barang' },
      { code: 'Q-004', question_text: 'Apakah transaksi berasal dari penjualan jasa?', fact_name: 'is_penjualan_jasa' },
      { code: 'Q-005', question_text: 'Apakah transaksi dilakukan secara kredit?', fact_name: 'is_kredit' },
      { code: 'Q-006', question_text: 'Apakah barang yang dibeli akan dijual kembali?', fact_name: 'is_dijual_kembali' },
      { code: 'Q-007', question_text: 'Apakah transaksi merupakan pembelian aset?', fact_name: 'is_pembelian_aset' },
      { code: 'Q-008', question_text: 'Apakah aset memiliki masa manfaat lebih dari satu tahun?', fact_name: 'is_manfaat_lebih_1_tahun' },
      { code: 'Q-009', question_text: 'Apakah penerimaan berasal dari setoran modal pemilik?', fact_name: 'is_setoran_modal' },
      { code: 'Q-010', question_text: 'Apakah pengeluaran digunakan untuk kepentingan pribadi pemilik (prive)?', fact_name: 'is_prive' },
      { code: 'Q-011', question_text: 'Apakah pengeluaran merupakan pembayaran gaji?', fact_name: 'is_beban_gaji' },
      { code: 'Q-012', question_text: 'Apakah pengeluaran merupakan pembayaran utilitas (listrik, air, internet)?', fact_name: 'is_beban_utilitas' },
      { code: 'Q-013', question_text: 'Apakah pengeluaran merupakan pembayaran sewa?', fact_name: 'is_beban_sewa' },
      { code: 'Q-014', question_text: 'Apakah pengeluaran ini termasuk biaya ATK (alat tulis kantor)?', fact_name: 'is_beban_atk' },
      { code: 'Q-015', question_text: 'Apakah penerimaan berasal dari pinjaman bank?', fact_name: 'is_pinjaman_bank' },
      { code: 'Q-016', question_text: 'Apakah pembelian ini termasuk perlengkapan (Seperti ATK kantor)?', fact_name: 'is_pembelian_perlengkapan' },
      { code: 'Q-017', question_text: 'Apakah pengeluaran ditujukan untuk pelunasan kewajiban/hutang?', fact_name: 'is_pelunasan_hutang' },
      { code: 'Q-018', question_text: 'Apakah pengeluaran ditujukan untuk pembayaran beban?', fact_name: 'is_beban' },
      { code: 'Q-110', question_text: 'Apakah pengeluaran merupakan biaya pemasaran atau promosi?', fact_name: 'is_beban_pemasaran' },
      { code: 'Q-111', question_text: 'Apakah transaksi merupakan pelunasan hutang dagang?', fact_name: 'is_pelunasan_hutang_dagang' },
      { code: 'Q-112', question_text: 'Apakah transaksi merupakan penerimaan pembayaran piutang dari pelanggan?', fact_name: 'is_penerimaan_piutang' },
      { code: 'Q-113', question_text: 'Apakah transaksi merupakan pelunasan hutang bank?', fact_name: 'is_pelunasan_hutang_bank' },
      { code: 'Q-019', question_text: 'Apakah pengeluaran ini termasuk beban lainnya?', fact_name: 'is_beban_lainnya' },
      { code: 'Q-020', question_text: 'Apakah pembelian ini termasuk aset lainnya?', fact_name: 'is_pembelian_aset_lainnya' }
    ];

    for (const q of defaultQuestions) {
      await runAsync('INSERT INTO questions (code, question_text, fact_name) VALUES (?, ?, ?)', [q.code, q.question_text, q.fact_name]);
    }
    console.log('Questions seeded.');

    // Fetch accounts to get IDs
    const accountsRows = await allAsync('SELECT id, code FROM accounts');
    const accMap = {};
    accountsRows.forEach(a => accMap[a.code] = a.id);

    // 22 Rules (G-01 s.d. G-22) sesuai dokumentasi backward chaining
    // Priority menentukan urutan evaluasi (tinggi = dievaluasi duluan)
    const defaultRules = [
      // ========== INBOUND (Penerimaan) ==========
      {
        code: 'G-01', name: 'Modal Pemilik', business_type: 'semua',
        debit: accMap['1-1000'], credit: accMap['3-1000'],
        description: 'Penyetoran modal investasi oleh pemilik.',
        priority: 220,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' },
          { fact_name: 'is_setoran_modal', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-02', name: 'Hutang Bank', business_type: 'semua',
        debit: accMap['1-1000'], credit: accMap['2-2000'],
        description: 'Pencairan dana pinjaman bank.',
        priority: 210,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' },
          { fact_name: 'is_setoran_modal', expected_value: 'no' },
          { fact_name: 'is_pinjaman_bank', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-03', name: 'Penerimaan Piutang', business_type: 'semua',
        debit: accMap['1-1000'], credit: accMap['1-1200'],
        description: 'Penerimaan pembayaran piutang dari pelanggan.',
        priority: 200,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' },
          { fact_name: 'is_setoran_modal', expected_value: 'no' },
          { fact_name: 'is_pinjaman_bank', expected_value: 'no' },
          { fact_name: 'is_penerimaan_piutang', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-04', name: 'Penjualan Barang Kredit', business_type: 'dagang',
        debit: accMap['1-1200'], credit: accMap['4-1000'],
        description: 'Penjualan barang secara kredit. Trigger: Perhitungan HPP.',
        priority: 190,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' },
          { fact_name: 'is_penjualan_barang', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-05', name: 'Penjualan Barang Tunai', business_type: 'dagang',
        debit: accMap['1-1000'], credit: accMap['4-1000'],
        description: 'Penjualan barang secara tunai. Trigger: Perhitungan HPP.',
        priority: 185,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' },
          { fact_name: 'is_penjualan_barang', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'no' }
        ]
      },
      {
        code: 'G-06', name: 'Penjualan Jasa Kredit', business_type: 'jasa',
        debit: accMap['1-1200'], credit: accMap['4-1100'],
        description: 'Penjualan jasa secara kredit.',
        priority: 180,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' },
          { fact_name: 'is_penjualan_jasa', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-07', name: 'Penjualan Jasa Tunai', business_type: 'jasa',
        debit: accMap['1-1000'], credit: accMap['4-1100'],
        description: 'Penjualan jasa secara tunai.',
        priority: 175,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' },
          { fact_name: 'is_penjualan_jasa', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'no' }
        ]
      },
      {
        code: 'G-08', name: 'Penerimaan Tunai Lainnya', business_type: 'semua',
        debit: accMap['1-1000'], credit: accMap['4-9000'],
        description: 'Penerimaan kas lain yang tidak terklasifikasi pada goal sebelumnya.',
        priority: 5,
        conditions: [
          { fact_name: 'is_inbound', expected_value: 'yes' }
        ]
      },
      // ========== OUTBOUND (Pengeluaran) ==========
      {
        code: 'G-09', name: 'Pembelian Persediaan Kredit', business_type: 'dagang',
        debit: accMap['1-1300'], credit: accMap['2-1000'],
        description: 'Pembelian barang dagang secara kredit. Trigger: Moving Average.',
        priority: 170,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_dijual_kembali', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-10', name: 'Pembelian Persediaan Tunai', business_type: 'dagang',
        debit: accMap['1-1300'], credit: accMap['1-1000'],
        description: 'Pembelian barang dagang secara tunai. Trigger: Moving Average.',
        priority: 165,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_dijual_kembali', expected_value: 'yes' },
          { fact_name: 'is_kredit', expected_value: 'no' }
        ]
      },
      {
        code: 'G-11', name: 'Pembelian Aset Tetap', business_type: 'semua',
        debit: accMap['1-2100'], credit: accMap['1-1000'],
        description: 'Pembelian peralatan / aset tetap.',
        priority: 160,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_pembelian_aset', expected_value: 'yes' },
          { fact_name: 'is_manfaat_lebih_1_tahun', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-12', name: 'Prive', business_type: 'semua',
        debit: accMap['3-2000'], credit: accMap['1-1000'],
        description: 'Penarikan dana untuk keperluan pribadi pemilik.',
        priority: 150,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_prive', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-13', name: 'Pelunasan Hutang Dagang', business_type: 'semua',
        debit: accMap['2-1000'], credit: accMap['1-1000'],
        description: 'Pembayaran pelunasan hutang kepada supplier.',
        priority: 140,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_pelunasan_hutang_dagang', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-14', name: 'Pelunasan Hutang Bank', business_type: 'semua',
        debit: accMap['2-2000'], credit: accMap['1-1000'],
        description: 'Pembayaran angsuran atau pelunasan hutang bank.',
        priority: 135,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_pelunasan_hutang_bank', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-15', name: 'Pelunasan Hutang Lainnya', business_type: 'semua',
        debit: accMap['2-9000'], credit: accMap['1-1000'],
        description: 'Pelunasan hutang selain hutang dagang dan hutang bank.',
        priority: 2,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_pelunasan_hutang_dagang', expected_value: 'no' },
          { fact_name: 'is_pelunasan_hutang_bank', expected_value: 'no' }
        ]
      },
      {
        code: 'G-16', name: 'Beban Gaji', business_type: 'semua',
        debit: accMap['5-1000'], credit: accMap['1-1000'],
        description: 'Pembayaran gaji karyawan.',
        priority: 120,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_beban_gaji', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-17', name: 'Beban Utilitas', business_type: 'semua',
        debit: accMap['5-1100'], credit: accMap['1-1000'],
        description: 'Pembayaran utilitas (listrik, air, internet).',
        priority: 115,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_beban_utilitas', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-18', name: 'Beban Sewa', business_type: 'semua',
        debit: accMap['5-1200'], credit: accMap['1-1000'],
        description: 'Pembayaran sewa gedung / tempat usaha.',
        priority: 110,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_beban_sewa', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-19', name: 'Beban Pemasaran', business_type: 'semua',
        debit: accMap['5-1300'], credit: accMap['1-1000'],
        description: 'Biaya pemasaran, iklan, dan promosi.',
        priority: 105,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_beban_pemasaran', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-20', name: 'Beban ATK', business_type: 'semua',
        debit: accMap['5-1500'], credit: accMap['1-1000'],
        description: 'Pembelian ATK dicatat langsung sebagai beban (pendekatan beban).',
        priority: 100,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_beban_atk', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-21', name: 'Perlengkapan', business_type: 'semua',
        debit: accMap['1-1500'], credit: accMap['1-1000'],
        description: 'Pembelian ATK dicatat sebagai aset perlengkapan (pendekatan aset).',
        priority: 95,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_pembelian_aset', expected_value: 'yes' },
          { fact_name: 'is_manfaat_lebih_1_tahun', expected_value: 'no' },
          { fact_name: 'is_pembelian_perlengkapan', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-22', name: 'Pengeluaran Kas Lainnya', business_type: 'semua',
        debit: accMap['5-9000'], credit: accMap['1-1000'],
        description: 'Pengeluaran kas lain yang tidak terklasifikasi pada goal sebelumnya.',
        priority: 1,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' }
        ]
      },
      {
        code: 'G-23', name: 'Pembelian Aset Lainnya', business_type: 'semua',
        debit: accMap['1-9000'], credit: accMap['1-1000'],
        description: 'Pembelian aset lain selain peralatan dan perlengkapan.',
        priority: 90,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' },
          { fact_name: 'is_pembelian_aset', expected_value: 'yes' },
          { fact_name: 'is_manfaat_lebih_1_tahun', expected_value: 'no' },
          { fact_name: 'is_pembelian_perlengkapan', expected_value: 'no' }
        ]
      },
      {
        code: 'G-24', name: 'Beban Lain-lain', business_type: 'semua',
        debit: accMap['5-9000'], credit: accMap['1-1000'],
        description: 'Pembayaran beban operasional lainnya yang tidak terklasifikasi.',
        priority: 85,
        conditions: [
          { fact_name: 'is_outbound', expected_value: 'yes' }
        ]
      }
    ];

    for (const rule of defaultRules) {
      const ruleResult = await runAsync(`
        INSERT INTO rules (code, name, business_type, debit_account_id, credit_account_id, description, priority) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [rule.code, rule.name, rule.business_type, rule.debit, rule.credit, rule.description, rule.priority || 0]);

      const ruleId = ruleResult.lastID;

      for (const cond of rule.conditions) {
        await runAsync(`
          INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
          VALUES (?, ?, 'equals', ?)
        `, [ruleId, cond.fact_name, cond.expected_value]);
      }
    }

    console.log('Rules seeded successfully.');
    db.close();
  } catch (err) {
    console.error('Initialization error:', err);
    process.exit(1);
  }
}

init();
