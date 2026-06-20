# Dokumentasi Expert System: Backward Chaining

Dokumen ini berisi daftar lengkap pertanyaan (facts) dan rule base (aturan IF-THEN) untuk rancangan Backward Chaining yang diimplementasikan pada Sistem Informasi Akuntansi (SIA) UMKM. Dokumen ini dapat disalin secara langsung ke dalam Bab 3 atau Bab 4 draf skripsi Anda.

---

## 1. Daftar Pertanyaan (Facts)

Berikut adalah daftar variabel fakta dan padanan teks pertanyaan yang ditanyakan oleh sistem kepada pengguna secara dinamis:

| Kode Pertanyaan | Nama Variabel Fakta (Fact Name) | Teks Pertanyaan |
| :--- | :--- | :--- |
| **Q-001** | `is_inbound` | Apakah transaksi merupakan penerimaan uang? |
| **Q-002** | `is_outbound` | Apakah transaksi merupakan pengeluaran uang? |
| **Q-003** | `is_penjualan_barang` | Apakah transaksi berasal dari penjualan barang? |
| **Q-004** | `is_penjualan_jasa` | Apakah transaksi berasal dari penjualan jasa? |
| **Q-005** | `is_kredit` | Apakah transaksi dilakukan secara kredit? |
| **Q-006** | `is_dijual_kembali` | Apakah barang yang dibeli akan dijual kembali? |
| **Q-007** | `is_pembelian_aset` | Apakah transaksi merupakan pembelian aset? |
| **Q-008** | `is_manfaat_lebih_1_tahun` | Apakah aset memiliki masa manfaat lebih dari satu tahun? |
| **Q-009** | `is_setoran_modal` | Apakah penerimaan berasal dari setoran modal pemilik? |
| **Q-010** | `is_prive` | Apakah pengeluaran digunakan untuk kepentingan pribadi pemilik (prive)? |
| **Q-011** | `is_beban_gaji` | Apakah pengeluaran merupakan pembayaran gaji? |
| **Q-012** | `is_beban_utilitas` | Apakah pengeluaran merupakan pembayaran utilitas (listrik, air, internet)? |
| **Q-013** | `is_beban_sewa` | Apakah pengeluaran merupakan pembayaran sewa? |
| **Q-014** | `is_beban_atk` | Apakah pengeluaran merupakan pembelian alat tulis kantor (ATK)? |
| **Q-015** | `is_pinjaman_bank` | Apakah penerimaan berasal dari pinjaman bank? |
| **Q-110** | `is_beban_pemasaran` | Apakah pengeluaran merupakan biaya pemasaran atau promosi? |
| **Q-111** | `is_pelunasan_hutang_dagang` | Apakah transaksi merupakan pelunasan hutang dagang? |
| **Q-112** | `is_penerimaan_piutang` | Apakah transaksi merupakan penerimaan pembayaran piutang dari pelanggan? |
| **Q-113** | `is_pelunasan_hutang_bank` | Apakah transaksi merupakan pelunasan hutang bank? |

---

## 2. Aturan Penalaran (Rule Base IF-THEN)

Setiap aturan di bawah ini memiliki kesimpulan berupa akun yang akan didebit dan dikredit pada jurnal umum (Double-Entry).

### Goal G-01 : Modal Pemilik
```text
IF
    Apakah transaksi merupakan penerimaan uang? (is_inbound = YA)
    AND Apakah penerimaan berasal dari setoran modal pemilik? (is_setoran_modal = YA)

THEN
    Debit  = Kas Utama
    Kredit = Modal Pemilik
```

### Goal G-02 : Hutang Bank
```text
IF
    Apakah transaksi merupakan penerimaan uang? (is_inbound = YA)
    AND Apakah penerimaan berasal dari pinjaman bank? (is_pinjaman_bank = YA)

THEN
    Debit  = Kas Utama
    Kredit = Hutang Bank
```

### Goal G-03 : Penerimaan Piutang
```text
IF
    Apakah transaksi merupakan penerimaan uang? (is_inbound = YA)
    AND Apakah transaksi merupakan penerimaan pembayaran piutang dari pelanggan? (is_penerimaan_piutang = YA)

THEN
    Debit  = Kas Utama
    Kredit = Piutang Usaha
```

### Goal G-04 : Penjualan Barang Kredit
```text
IF
    Apakah transaksi merupakan penerimaan uang? (is_inbound = YA)
    AND Apakah transaksi berasal dari penjualan barang? (is_penjualan_barang = YA)
    AND Apakah transaksi dilakukan secara kredit? (is_kredit = YA)

THEN
    Debit  = Piutang Usaha
    Kredit = Pendapatan Penjualan
    (Triggers: Perhitungan Harga Pokok Penjualan (HPP))
```

### Goal G-05 : Penjualan Barang Tunai
```text
IF
    Apakah transaksi merupakan penerimaan uang? (is_inbound = YA)
    AND Apakah transaksi berasal dari penjualan barang? (is_penjualan_barang = YA)
    AND Apakah transaksi dilakukan secara kredit? (is_kredit = TIDAK)

THEN
    Debit  = Kas Utama
    Kredit = Pendapatan Penjualan
    (Triggers: Perhitungan Harga Pokok Penjualan (HPP))
```

### Goal G-06 : Penjualan Jasa Kredit
```text
IF
    Apakah transaksi merupakan penerimaan uang? (is_inbound = YA)
    AND Apakah transaksi berasal dari penjualan jasa? (is_penjualan_jasa = YA)
    AND Apakah transaksi dilakukan secara kredit? (is_kredit = YA)

THEN
    Debit  = Piutang Usaha
    Kredit = Pendapatan Jasa
```

### Goal G-07 : Penjualan Jasa Tunai
```text
IF
    Apakah transaksi merupakan penerimaan uang? (is_inbound = YA)
    AND Apakah transaksi berasal dari penjualan jasa? (is_penjualan_jasa = YA)
    AND Apakah transaksi dilakukan secara kredit? (is_kredit = TIDAK)

THEN
    Debit  = Kas Utama
    Kredit = Pendapatan Jasa
```

### Goal G-08 : Pembelian Persediaan Kredit
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah barang yang dibeli akan dijual kembali? (is_dijual_kembali = YA)
    AND Apakah transaksi dilakukan secara kredit? (is_kredit = YA)

THEN
    Debit  = Persediaan
    Kredit = Hutang Dagang
    (Triggers: Perhitungan Harga Pokok dengan Moving Average)
```

### Goal G-09 : Pembelian Persediaan Tunai
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah barang yang dibeli akan dijual kembali? (is_dijual_kembali = YA)
    AND Apakah transaksi dilakukan secara kredit? (is_kredit = TIDAK)

THEN
    Debit  = Persediaan
    Kredit = Kas Utama
    (Triggers: Perhitungan Harga Pokok dengan Moving Average)
```

### Goal G-10 : Pembelian Aset Tetap
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah transaksi merupakan pembelian aset? (is_pembelian_aset = YA)
    AND Apakah aset memiliki masa manfaat lebih dari satu tahun? (is_manfaat_lebih_1_tahun = YA)

THEN
    Debit  = Peralatan
    Kredit = Kas Utama
```

### Goal G-11 : Prive
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah pengeluaran digunakan untuk kepentingan pribadi pemilik (prive)? (is_prive = YA)

THEN
    Debit  = Prive
    Kredit = Kas Utama
```

### Goal G-12 : Beban Gaji
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah pengeluaran merupakan pembayaran gaji? (is_beban_gaji = YA)

THEN
    Debit  = Beban Gaji
    Kredit = Kas Utama
```

### Goal G-13 : Beban Utilitas
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah pengeluaran merupakan pembayaran utilitas (listrik, air, internet)? (is_beban_utilitas = YA)

THEN
    Debit  = Beban Utilitas
    Kredit = Kas Utama
```

### Goal G-14 : Beban Sewa
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah pengeluaran merupakan pembayaran sewa? (is_beban_sewa = YA)

THEN
    Debit  = Beban Sewa
    Kredit = Kas Utama
```

### Goal G-15 : Beban Pemasaran
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah pengeluaran merupakan biaya pemasaran atau promosi? (is_beban_pemasaran = YA)

THEN
    Debit  = Beban Pemasaran
    Kredit = Kas Utama
```

### Goal G-16 : Pelunasan Hutang Dagang
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah transaksi merupakan pelunasan hutang dagang? (is_pelunasan_hutang_dagang = YA)

THEN
    Debit  = Hutang Dagang
    Kredit = Kas Utama
```

### Goal G-17 : Pelunasan Hutang Bank
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah transaksi merupakan pelunasan hutang bank? (is_pelunasan_hutang_bank = YA)

THEN
    Debit  = Hutang Bank
    Kredit = Kas Utama
```

### Goal G-18 : Beban ATK
```text
IF
    Apakah transaksi merupakan pengeluaran uang? (is_outbound = YA)
    AND Apakah pengeluaran merupakan pembelian alat tulis kantor (ATK)? (is_beban_atk = YA)

THEN
    Debit  = Beban ATK
    Kredit = Kas Utama
```
