import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function verify(description, businessType, facts) {
  console.log(`\n--- Test Case: ${description} (${businessType}) ---`);
  const res = await BackwardChainingEngine.evaluate(businessType, facts);
  console.log(`Status: ${res.status}`);
  if (res.provenGoal) {
    const goal = res.provenGoal;
    console.log(`Proven Rule: ${goal.rule_code} (${goal.rule_name})`);
    console.log(`Debit: ${goal.debit?.code} - ${goal.debit?.name}`);
    console.log(`Credit: ${goal.credit?.code} - ${goal.credit?.name}`);
    console.log(`Triggers -> triggerHpp: ${goal.triggerHpp || false}, triggerMovingAverage: ${goal.triggerMovingAverage || false}`);
  } else {
    console.log(`Blocked! Next Question: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
  }
}

async function run() {
  // 1. Setoran Modal (R-001)
  await verify(
    'Setoran Modal oleh Pemilik',
    'dagang',
    { is_inbound: 'yes', is_setoran_modal: 'yes' }
  );

  // 2. Penjualan Barang Kredit (R-004)
  await verify(
    'Penjualan Barang Dagang secara Kredit',
    'dagang',
    { is_inbound: 'yes', is_penjualan_barang: 'yes', is_kredit: 'yes' }
  );

  // 3. Pembelian Persediaan Kredit (R-008)
  await verify(
    'Pembelian Persediaan Barang secara Kredit',
    'dagang',
    { is_outbound: 'yes', is_dijual_kembali: 'yes', is_kredit: 'yes' }
  );

  // 4. Beban Pemasaran (R-015) - Step 1: without any intermediate question
  await verify(
    'Pembayaran Beban Pemasaran (Tanpa info pelunasan)',
    'jasa',
    { is_outbound: 'yes', is_beban_pemasaran: 'yes' }
  );

  // 4b. Beban Pemasaran (R-015) - Step 2: not pelunasan, but without bayar_beban info
  await verify(
    'Pembayaran Beban Pemasaran (Ditentukan bukan pelunasan, tanpa info bayar beban)',
    'jasa',
    { is_outbound: 'yes', is_pelunasan_hutang: 'no', is_beban_pemasaran: 'yes' }
  );

  // 4c. Beban Pemasaran (R-015) - Step 3: not pelunasan, and confirmed bayar_beban
  await verify(
    'Pembayaran Beban Pemasaran (Bukan pelunasan & untuk bayar beban)',
    'jasa',
    { is_outbound: 'yes', is_pelunasan_hutang: 'no', is_bayar_beban: 'yes', is_beban_pemasaran: 'yes' }
  );

  // 5. Beban ATK (R-018)
  await verify(
    'Pembelian Alat Tulis Kantor (ATK)',
    'semua',
    { is_outbound: 'yes', is_pelunasan_hutang: 'no', is_bayar_beban: 'yes', is_beban_atk: 'yes' }
  );

  // 6. Pelunasan Hutang Dagang (R-016)
  await verify(
    'Pelunasan Hutang Dagang kepada Supplier',
    'semua',
    { is_outbound: 'yes', is_pelunasan_hutang: 'yes', is_pelunasan_hutang_dagang: 'yes' }
  );

  process.exit(0);
}

run().catch(console.error);
