INSERT INTO rules (code, name, business_type, description, debit_account_id, credit_account_id, is_active, priority) 
VALUES ('R-098', 'Pengeluaran Kas Lainnya', 'semua', 'Fallback untuk pengeluaran tunai tak terduga', NULL, 1, 1, 0);

INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-098'), 'is_outbound', 'equals', 'yes');
INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-098'), 'is_kredit', 'equals', 'no');
INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-098'), 'is_pembelian_aset', 'equals', 'no');
INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
VALUES ((SELECT id FROM rules WHERE code = 'R-098'), 'is_dijual_kembali', 'equals', 'no');
