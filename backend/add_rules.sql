INSERT INTO accounts (code, name, category, subcategory) VALUES ('5-1300', 'Beban Pemasaran', 'Beban', 'Beban Operasional');

INSERT INTO questions (code, fact_name, question_text) VALUES ('Q-110', 'is_beban_pemasaran', 'Apakah transaksi ditujukan untuk biaya pemasaran, iklan, atau promosi?');

INSERT INTO rules (code, name, business_type, description, debit_account_id, credit_account_id, is_active) 
VALUES ('R-016', 'Beban Pemasaran', 'semua', 'Pengeluaran untuk pemasaran dan iklan', (SELECT id FROM accounts WHERE code = '5-1300'), 1, 1);

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-016'), 'is_pengeluaran', 'equals', 'yes');

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-016'), 'is_beban_pemasaran', 'equals', 'yes');

INSERT INTO rules (code, name, business_type, description, debit_account_id, credit_account_id, is_active) 
VALUES ('R-017', 'Pembelian Perlengkapan (Aset < 1 Tahun)', 'semua', 'Pembelian aset dengan masa manfaat kurang dari 1 tahun', 6, 1, 1);

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-017'), 'is_pengeluaran', 'equals', 'yes');

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-017'), 'is_pembelian_aset', 'equals', 'yes');

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-017'), 'is_manfaat_lebih_1_tahun', 'equals', 'no');
