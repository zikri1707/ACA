import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';

async function simulate() {
  const businessTypes = ['dagang', 'jasa'];
  
  for (const businessType of businessTypes) {
    console.log(`\n================ SIMULATING BUSINESS TYPE: ${businessType} ================`);
    
    // We want to simulate a walk through the engine questions starting with is_outbound = 'yes' and is_kredit = 'yes'.
    // Let's do a depth-first search of the question space.
    let pathCount = 0;
    
    async function dfs(facts, stepNum) {
      const res = await BackwardChainingEngine.evaluate(businessType, facts);
      if (res.status === 'proven') {
        pathCount++;
        console.log(`Path ${pathCount}: Facts:`, JSON.stringify(facts), `=> Proven: ${res.provenGoal.rule_code} (${res.provenGoal.rule_name})`);
        return;
      }
      if (res.status === 'unproven') {
        pathCount++;
        console.log(`Path ${pathCount}: Facts:`, JSON.stringify(facts), `=> Unproven`);
        return;
      }
      
      const q = res.nextQuestion;
      if (!q) {
        console.log('Error: No next question but status is processing');
        return;
      }
      
      // Try YES
      await dfs({ ...facts, [q.fact_name]: 'yes' }, stepNum + 1);
      // Try NO
      await dfs({ ...facts, [q.fact_name]: 'no' }, stepNum + 1);
    }
    
    // Start with is_outbound = 'yes' and is_kredit = 'yes'
    await dfs({ is_outbound: 'yes', is_kredit: 'yes' }, 1);
  }
}

simulate().catch(console.error);
