import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function test(businessType) {
  console.log(`\n================ TEST FOR ${businessType.toUpperCase()} ================`);
  
  // Step 1: user answers Q-002 (is_outbound) = yes
  let facts = { is_outbound: 'yes' };
  let res = await BackwardChainingEngine.evaluate(businessType, facts);
  console.log(`Step 1: is_outbound=yes -> status: ${res.status}, nextQuestion: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
  
  // Step 2: user answers Q-005 (is_kredit) = yes
  facts.is_kredit = 'yes';
  res = await BackwardChainingEngine.evaluate(businessType, facts);
  console.log(`Step 2: is_kredit=yes -> status: ${res.status}, nextQuestion: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
  if (res.provenGoal) {
    console.log(`PROVEN: ${res.provenGoal.rule_code} (${res.provenGoal.rule_name})`);
  }

  // Step 3: user answers Q-006 (is_dijual_kembali) = no (if asked)
  if (res.nextQuestion && res.nextQuestion.fact_name === 'is_dijual_kembali') {
    facts.is_dijual_kembali = 'no';
    res = await BackwardChainingEngine.evaluate(businessType, facts);
    console.log(`Step 3: is_dijual_kembali=no -> status: ${res.status}, nextQuestion: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
    if (res.provenGoal) {
      console.log(`PROVEN: ${res.provenGoal.rule_code} (${res.provenGoal.rule_name})`);
    }
  }

  // Step 4: user answers Q-007 (is_pembelian_aset) = no (if asked)
  if (res.nextQuestion && res.nextQuestion.fact_name === 'is_pembelian_aset') {
    facts.is_pembelian_aset = 'no';
    res = await BackwardChainingEngine.evaluate(businessType, facts);
    console.log(`Step 4: is_pembelian_aset=no -> status: ${res.status}, nextQuestion: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
    if (res.provenGoal) {
      console.log(`PROVEN: ${res.provenGoal.rule_code} (${res.provenGoal.rule_name})`);
    }
  }
}

async function run() {
  await test('dagang');
  await test('jasa');
  process.exit(0);
}

run();
