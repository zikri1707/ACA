import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function trace() {
  const businessTypes = ['dagang', 'jasa'];
  
  for (const businessType of businessTypes) {
    console.log(`\n================ BUSINESS TYPE: ${businessType} ================`);
    let facts = {};
    
    // Step 1: user answers Q-002 (is_outbound) = yes
    facts.is_outbound = 'yes';
    let res = await BackwardChainingEngine.evaluate(businessType, facts);
    console.log(`After is_outbound=yes -> status: ${res.status}, nextQuestion: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
    if (res.provenGoal) console.log('Proven:', res.provenGoal.rule_code, res.provenGoal.rule_name);
    
    // Step 2: user answers nextQuestion = yes
    if (res.nextQuestion) {
      facts[res.nextQuestion.fact_name] = 'yes';
      res = await BackwardChainingEngine.evaluate(businessType, facts);
      console.log(`After ${res.nextQuestion ? 'next' : 'final'} step -> status: ${res.status}, nextQuestion: ${res.nextQuestion?.code} (${res.nextQuestion?.fact_name})`);
      if (res.provenGoal) console.log('Proven:', res.provenGoal.rule_code, res.provenGoal.rule_name);
    }
  }
}

trace().catch(console.error);
