INSERT INTO questions (code, fact_name, question_text) VALUES ('Q-111', 'is_pelunasan_hutang', 'Apakah transaksi ini ditujukan untuk melunasi hutang perusahaan (kepada supplier/pihak lain)?');
INSERT INTO questions (code, fact_name, question_text) VALUES ('Q-112', 'is_penerimaan_piutang', 'Apakah transaksi ini merupakan penerimaan pembayaran piutang dari pelanggan/klien?');

INSERT INTO rules (code, name, business_type, description, debit_account_id, credit_account_id, is_active) 
VALUES ('R-018', 'Pelunasan Hutang', 'semua', 'Pengeluaran untuk melunasi hutang dagang atau hutang lainnya', 9, 1, 1);

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-018'), 'is_pengeluaran', 'equals', 'yes');
INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-018'), 'is_pelunasan_hutang', 'equals', 'yes');

INSERT INTO rules (code, name, business_type, description, debit_account_id, credit_account_id, is_active) 
VALUES ('R-019', 'Penerimaan Piutang', 'semua', 'Penerimaan pembayaran piutang dari pelanggan', 1, 3, 1);

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-019'), 'is_penerimaan', 'equals', 'yes');
INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-019'), 'is_penerimaan_piutang', 'equals', 'yes');
