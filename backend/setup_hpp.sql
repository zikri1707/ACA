CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  avg_hpp REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consultation_id INTEGER,
  item_id INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  price REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

INSERT INTO accounts (code, name, category, subcategory) VALUES ('5-3000', 'Harga Pokok Penjualan', 'Beban', 'Harga Pokok Penjualan');

INSERT INTO rules (code, name, business_type, description, debit_account_id, credit_account_id, is_active) 
VALUES ('R-020', 'Pencatatan HPP (Otomatis)', 'dagang', 'Pencatatan Harga Pokok Penjualan secara otomatis saat barang terjual', (SELECT id FROM accounts WHERE code = '5-3000'), 4, 1);

UPDATE questions SET fact_name = 'is_inbound' WHERE fact_name = 'is_penerimaan';
UPDATE questions SET fact_name = 'is_outbound' WHERE fact_name = 'is_pengeluaran';
UPDATE rule_conditions SET fact_name = 'is_inbound' WHERE fact_name = 'is_penerimaan';
UPDATE rule_conditions SET fact_name = 'is_outbound' WHERE fact_name = 'is_pengeluaran';

UPDATE rules SET code = 'R-018A', name = 'Pelunasan Hutang Dagang' WHERE code = 'R-018';
UPDATE questions SET fact_name = 'is_pelunasan_hutang_dagang' WHERE fact_name = 'is_pelunasan_hutang';
UPDATE rule_conditions SET fact_name = 'is_pelunasan_hutang_dagang' WHERE fact_name = 'is_pelunasan_hutang';

INSERT INTO questions (code, fact_name, question_text) VALUES ('Q-113', 'is_pelunasan_hutang_bank', 'Apakah transaksi ini ditujukan untuk membayar angsuran/pelunasan hutang bank?');

INSERT INTO rules (code, name, business_type, description, debit_account_id, credit_account_id, is_active) 
VALUES ('R-018B', 'Pelunasan Hutang Bank', 'semua', 'Pengeluaran untuk melunasi hutang bank', 10, 1, 1);

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-018B'), 'is_outbound', 'equals', 'yes');
INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-018B'), 'is_pelunasan_hutang_bank', 'equals', 'yes');

INSERT INTO items (code, name, stock_qty, avg_hpp) VALUES ('ITM-001', 'Barang Contoh A', 0, 0);
