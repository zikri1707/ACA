const { BackwardChainingEngine } = require('../src/engine/BackwardChainingEngine');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/ACA_Expert_System.db');
const engine = new BackwardChainingEngine(db);

async function run() {
  const responses = {
    is_inbound: 'no',
    is_outbound: 'yes',
    is_kredit: 'no',
    is_dijual_kembali: 'no',
    is_pembelian_aset: 'yes',
    is_manfaat_lebih_1_tahun: 'no'
  };
  let result = await engine.evaluate('dagang', {});
  while (result.status === 'question') {
    console.log(`Question: ${result.question.fact_name}`);
    if (responses[result.question.fact_name] !== undefined) {
      console.log(`> Answering: ${responses[result.question.fact_name]}`);
      result = await engine.evaluate('dagang', { [result.question.fact_name]: responses[result.question.fact_name] });
    } else {
      console.log(`> Unexpected question! Answering NO`);
      result = await engine.evaluate('dagang', { [result.question.fact_name]: 'no' });
    }
  }
  console.log('Final Result:', result.goal ? result.goal.name : 'Unknown');
}
run();
