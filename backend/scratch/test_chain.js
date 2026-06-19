import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function test() {
  const businessType = 'jasa';
  const facts = {
    is_outbound: 'yes',
    is_kredit: 'yes',
    is_pembelian_aset: 'no'
  };

  console.log('--- Evaluating with facts:', facts);
  let result = await BackwardChainingEngine.evaluate(businessType, facts);
  console.log('Result status:', result.status);
  console.log('Next Question:', result.nextQuestion);
  if (result.provenGoal) {
    console.log('Proven Goal:', result.provenGoal.rule_code, result.provenGoal.rule_name);
  }
  
  console.log('\nFull Rule Trace:');
  result.ruleTrace.forEach(r => {
    console.log(`- Rule ${r.rule_code} (${r.rule_name}): ${r.status}`);
    r.conditions.forEach(c => {
      console.log(`   * ${c.fact_name} (expected: ${c.expected}, actual: ${c.actual}): ${c.status}`);
    });
    if (r.conclusion) {
      console.log(`   * Conclusion: Debit: ${r.conclusion.debit?.code} (${r.conclusion.debit?.name}), Credit: ${r.conclusion.credit?.code} (${r.conclusion.credit?.name})`);
    }
  });
}

test().catch(console.error);
