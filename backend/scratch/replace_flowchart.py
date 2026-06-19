import re

file_path = r'c:\xampp\src\ACA\frontend\src\pages\RuleBaseIndex.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old block to match
old_block_regex = re.escape('graph TD\n    Start([Mulai Transaksi]) --> Q000{Jenis Usaha?}') + r'.*?' + re.escape('Q005U -- Tidak --> Drop([Cek Kembali Transaksi])')

# The new flowchart content
new_flowchart = """graph TD
    Start([Mulai Transaksi]) --> Q001{Arah Transaksi?<br/>(is_inbound)}
    
    %% CABANG INBOUND (PENERIMAAN)
    Q001 -- TERIMA --> Q005In{Pembayaran Kredit?<br/>(is_kredit)}
    
    %% Inbound Kredit (Piutang)
    Q005In -- Ya --> R002[1-1200 Piutang Usaha]
    
    %% Inbound Tunai
    Q005In -- Tidak --> Q009{Setoran Modal?<br/>(is_setoran_modal)}
    Q009 -- Ya --> R007[3-1000 Modal Pemilik]
    
    Q009 -- Tidak --> Q015{Pinjaman Bank?<br/>(is_pinjaman_bank)}
    Q015 -- Ya --> R015[2-2000 Hutang Bank]
    
    Q015 -- Tidak --> Q112{Terima Piutang?<br/>(is_penerimaan_piutang)}
    Q112 -- Ya --> R019[1-1000 Kas Utama]
    
    Q112 -- Tidak --> Q000{Jenis Usaha?}
    
    %% Dagang - Penjualan Barang
    Q000 -- Dagang --> Q003{Penjualan Barang?<br/>(is_penjualan_barang)}
    Q003 -- Ya --> R009[4-1000 Pendapatan Penjualan]
    Q003 -- Tidak --> R001[1-1000 Kas Utama]
    
    %% Jasa - Penjualan Jasa
    Q000 -- Jasa --> Q004{Penjualan Jasa?<br/>(is_penjualan_jasa)}
    Q004 -- Ya --> R010[4-1100 Pendapatan Jasa]
    Q004 -- Tidak --> R001
    
    %% CABANG OUTBOUND (PENGELUARAN)
    Q001 -- KELUAR --> Q005Out{Pembayaran Kredit?<br/>(is_kredit)}
    
    %% Outbound Kredit
    Q005Out -- Ya --> Q000Out{Jenis Usaha?}
    Q000Out -- Dagang --> Q006K{Beli utk Dijual Kembali?<br/>(is_dijual_kembali)}
    Q006K -- Ya --> R004[1-1300 Persediaan & Hutang]
    Q006K -- Tidak --> R099[2-1000 Hutang Dagang]
    Q000Out -- Jasa --> R099
    
    %% Outbound Tunai
    Q005Out -- Tidak --> Q000Tun{Jenis Usaha?}
    Q000Tun -- Dagang --> Q006T{Beli utk Dijual Kembali?<br/>(is_dijual_kembali)}
    Q006T -- Ya --> R003[1-1300 Persediaan Tunai]
    Q006T -- Tidak --> BebanUmum
    Q000Tun -- Jasa --> BebanUmum
    
    %% BLOK BEBAN/ASET/PRIVE
    BebanUmum --> Q007{Beli Aset Tetap?<br/>(is_pembelian_aset)}
    Q007 -- Ya --> Q008{Manfaat > 1 Thn?<br/>(is_manfaat_lebih_1_tahun)}
    Q008 -- Ya --> R006[1-2100 Aset Tetap]
    Q008 -- Tidak --> BebanLainnya
    Q007 -- Tidak --> BebanLainnya
    
    BebanLainnya --> Q010{Ambil Prive?<br/>(is_prive)}
    Q010 -- Ya --> R008[3-2000 Prive Pemilik]
    
    Q010 -- Tidak --> Q011{Bayar Gaji?<br/>(is_beban_gaji)}
    Q011 -- Ya --> R011[5-1000 Beban Gaji]
    
    Q011 -- Tidak --> Q012{Bayar Utilitas?<br/>(is_beban_utilitas)}
    Q012 -- Ya --> R012[5-1100 Beban Utilitas]
    
    Q012 -- Tidak --> Q013{Bayar Sewa?<br/>(is_beban_sewa)}
    Q013 -- Ya --> R013[5-1200 Beban Sewa]
    
    Q013 -- Tidak --> Q014{Beli ATK?<br/>(is_beban_atk)}
    Q014 -- Ya --> R014[5-1500 Beban ATK]
    
    Q014 -- Tidak --> Q110{Bayar Pemasaran?<br/>(is_beban_pemasaran)}
    Q110 -- Ya --> R016[5-1300 Beban Pemasaran]
    
    Q110 -- Tidak --> Q111{Pelunasan Hutang?<br/>(is_pelunasan_hutang_dagang)}
    Q111 -- Ya --> R018A[2-1000 Hutang Dagang]
    
    Q111 -- Tidak --> Q113{Cicilan Bank?<br/>(is_pelunasan_hutang_bank)}
    Q113 -- Ya --> R018B[2-2000 Hutang Bank]
    Q113 -- Tidak --> R098[1-1000 Kas Utama]"""

# Perform case-insensitive, dotall replace
new_content, count = re.subn(old_block_regex, new_flowchart, content, flags=re.DOTALL)

print(f"Substituted {count} matches.")

if count > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced flowchart.")
else:
    print("Could not match the old flowchart.")
