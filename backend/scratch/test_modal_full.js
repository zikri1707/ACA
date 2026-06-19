import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function testFlow(businessType, answers) {
  console.log(`\n================ SIMULATING FOR ${businessType.toUpperCase()} ================`);
  let facts = {};
  let status = 'processing';
  let step = 1;

  while (status === 'processing') {
    const res = await BackwardChainingEngine.evaluate(businessType, facts);
    status = res.status;
    if (res.status === 'proven') {
      console.log(`Step ${step}: PROVEN! -> ${res.provenGoal.rule_code} (${res.provenGoal.rule_name})`);
      break;
    }
    const q = res.nextQuestion;
    if (!q) {
      console.log('No next question but status is processing.');
      break;
    }
    const ans = answers[q.fact_name] || 'no';
    console.log(`Question ${step} (${q.code} - ${q.fact_name}): ${q.question_text}`);
    console.log(`> User answers: ${ans.toUpperCase()}`);
    facts[q.fact_name] = ans;
    step++;
  }
}

async function run() {
  // Case 1: Modal Pemilik (expected YES)
  console.log('--- CASE 1: Setoran Modal Pemilik (YES) ---');
  await testFlow('dagang', {
    is_inbound: 'yes',
    is_kredit: 'no',
    is_setoran_modal: 'yes'
  });

  // Case 2: Penjualan Tunai (expected YES)
  console.log('\n--- CASE 2: Penjualan Barang Tunai ---');
  await testFlow('dagang', {
    is_inbound: 'yes',
    is_kredit: 'no',
    is_setoran_modal: 'no',
    is_penjualan_barang: 'yes'
  });

  // Case 3: Kas Utama (Fallback)
  console.log('\n--- CASE 3: Penerimaan Kas Lainnya (Fallback) ---');
  await testFlow('dagang', {
    is_inbound: 'yes',
    is_kredit: 'no',
    is_setoran_modal: 'no',
    is_penjualan_barang: 'no',
    is_penjualan_jasa: 'no',
    is_pinjaman_bank: 'no',
    is_penerimaan_piutang: 'no'
  });

  process.exit(0);
}

run();
