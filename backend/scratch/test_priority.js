import { query } from '../src/config/database.js';
import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function testWithPriorityOrder() {
  const businessType = 'dagang';
  const facts = {
    is_inbound: 'yes',
    is_kredit: 'no'
  };

  console.log('--- Current engine behavior with facts:', facts);
  let res = await BackwardChainingEngine.evaluate(businessType, facts);
  console.log('Next question:', res.nextQuestion?.code, '-', res.nextQuestion?.fact_name);
}

testWithPriorityOrder().catch(console.error);
