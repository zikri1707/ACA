-- Menggeser R-005 menjadi R-099 (Ultimate Fallback) agar semua rule spesifik dievaluasi terlebih dahulu
UPDATE rules SET code = 'R-099' WHERE code = 'R-005';

-- Memperjelas perbedaan pertanyaan antara ATK (Pendekatan Beban) dan Aset Fisik
UPDATE questions SET question_text = 'Apakah transaksi ditujukan untuk pembelian Perlengkapan/ATK yang langsung habis pakai (Pendekatan Beban)?' WHERE fact_name = 'is_beban_atk';
UPDATE questions SET question_text = 'Apakah transaksi terkait pembelian aset fisik berwujud (seperti peralatan, mesin, kendaraan) di luar ATK?' WHERE fact_name = 'is_pembelian_aset';
