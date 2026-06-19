import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function runSimulation(businessType) {
  console.log(`\n================ SIMULATING WIZARD FOR ${businessType.toUpperCase()} ================`);
  
  let facts = {};
  let step = 1;
  let status = 'processing';
  
  // Target path for Hutang Dagang (Credit Purchase):
  // 1. is_inbound -> no
  // 2. is_outbound -> yes
  // 3. is_kredit -> yes
  // 4. is_dijual_kembali -> no (only for dagang)
  // 5. is_pembelian_aset -> no
  
  const answers = {
    is_inbound: 'no',
    is_outbound: 'yes',
    is_kredit: 'yes',
    is_dijual_kembali: 'no',
    is_pembelian_aset: 'no'
  };

  while (status === 'processing') {
    const res = await BackwardChainingEngine.evaluate(businessType, facts);
    status = res.status;
    
    if (res.status === 'proven') {
      console.log(`Step ${step}: proven! provenGoal: ${res.provenGoal.rule_code} (${res.provenGoal.rule_name})`);
      break;
    }
    
    const q = res.nextQuestion;
    if (!q) {
      console.log('No next question but status is processing.');
      break;
    }
    
    const ans = answers[q.fact_name];
    console.log(`Question ${step} (${q.code} - ${q.fact_name}): ${q.question_text}`);
    console.log(`> User answers: ${ans.toUpperCase()}`);
    
    facts[q.fact_name] = ans;
    step++;
  }
}

async function start() {
  await runSimulation('dagang');
  await runSimulation('jasa');
  process.exit(0);
}

start();
