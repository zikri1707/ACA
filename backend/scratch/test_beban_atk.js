import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function verify(description, businessType, facts) {
  console.log(`\n--- Test: ${description} (${businessType}) ---`);
  const res = await BackwardChainingEngine.evaluate(businessType, facts);
  console.log(`Status: ${res.status}`);
  if (res.provenGoal) {
    const goal = res.provenGoal;
    console.log(`Proven Rule: ${goal.rule_code} (${goal.rule_name})`);
    console.log(`Debit: ${goal.debit?.code} - ${goal.debit?.name}`);
    console.log(`Credit: ${goal.credit?.code} - ${goal.credit?.name}`);
  } else {
    console.log(`Blocked! Next Question: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
  }
}

async function run() {
  // Test case 1: Beban ATK (G-20)
  // Path: is_outbound = yes, is_dijual_kembali = no, is_pembelian_aset = no, is_prive = no, is_pelunasan_hutang = no, is_beban = yes, is_beban_gaji = no, is_beban_utilitas = no, is_beban_sewa = no, is_beban_pemasaran = no, is_beban_atk = yes
  await verify(
    'Beban ATK (G-20)',
    'dagang',
    {
      is_outbound: 'yes',
      is_dijual_kembali: 'no',
      is_pembelian_aset: 'no',
      is_prive: 'no',
      is_pelunasan_hutang: 'no',
      is_beban: 'yes',
      is_beban_gaji: 'no',
      is_beban_utilitas: 'no',
      is_beban_sewa: 'no',
      is_beban_pemasaran: 'no',
      is_beban_atk: 'yes'
    }
  );

  // Test case 2: Perlengkapan - Tunai (G-21 Variant)
  // Path: is_outbound = yes, is_dijual_kembali = no, is_pembelian_aset = yes, is_manfaat_lebih_1_tahun = no, is_pembelian_perlengkapan = yes, is_kredit = no
  await verify(
    'Perlengkapan Tunai (G-21)',
    'dagang',
    {
      is_outbound: 'yes',
      is_dijual_kembali: 'no',
      is_pembelian_aset: 'yes',
      is_manfaat_lebih_1_tahun: 'no',
      is_pembelian_perlengkapan: 'yes',
      is_kredit: 'no'
    }
  );

  // Test case 3: Perlengkapan - Kredit (G-21 Variant)
  // Path: is_outbound = yes, is_dijual_kembali = no, is_pembelian_aset = yes, is_manfaat_lebih_1_tahun = no, is_pembelian_perlengkapan = yes, is_kredit = yes
  await verify(
    'Perlengkapan Kredit (G-21)',
    'dagang',
    {
      is_outbound: 'yes',
      is_dijual_kembali: 'no',
      is_pembelian_aset: 'yes',
      is_manfaat_lebih_1_tahun: 'no',
      is_pembelian_perlengkapan: 'yes',
      is_kredit: 'yes'
    }
  );

  // Test case 4: Pembelian Aset Lainnya - Tunai (G-23 Variant)
  // Path: is_outbound = yes, is_dijual_kembali = no, is_pembelian_aset = yes, is_manfaat_lebih_1_tahun = no, is_pembelian_perlengkapan = no, is_kredit = no
  await verify(
    'Aset Lainnya Tunai (G-23)',
    'dagang',
    {
      is_outbound: 'yes',
      is_dijual_kembali: 'no',
      is_pembelian_aset: 'yes',
      is_manfaat_lebih_1_tahun: 'no',
      is_pembelian_perlengkapan: 'no',
      is_kredit: 'no'
    }
  );

  // Test case 5: Beban Lain-lain (G-24)
  // Path: is_outbound = yes, is_dijual_kembali = no, is_pembelian_aset = no, is_prive = no, is_pelunasan_hutang = no, is_beban = yes, all specific beban = no
  await verify(
    'Beban Lain-lain (G-24)',
    'dagang',
    {
      is_outbound: 'yes',
      is_dijual_kembali: 'no',
      is_pembelian_aset: 'no',
      is_prive: 'no',
      is_pelunasan_hutang: 'no',
      is_beban: 'yes',
      is_beban_gaji: 'no',
      is_beban_utilitas: 'no',
      is_beban_sewa: 'no',
      is_beban_pemasaran: 'no',
      is_beban_atk: 'no'
    }
  );

  process.exit(0);
}

run().catch(console.error);
