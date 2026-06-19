import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./backend/ACA_Expert_System.db');
const engine = new BackwardChainingEngine(db);

async function runSimulation() {
  let facts = {};
  let status = 'processing';
  const answers = { is_inbound: 'yes', is_kredit: 'no', is_setoran_modal: 'no', is_pinjaman_bank: 'no', is_penjualan_barang: 'no', is_penerimaan_piutang: 'yes' };
  while (status === 'processing') {
    const res = await BackwardChainingEngine.evaluate('dagang', facts);
    status = res.status;
    if (res.status === 'proven') {
      console.log(`Proven Goal: ${res.provenGoal.rule_code}`);
      break;
    }
    const q = res.nextQuestion;
    if (!q) break;
    let ans = answers[q.fact_name] || 'no';
    console.log(`Asked: ${q.fact_name} -> ${ans}`);
    facts[q.fact_name] = ans;
  }
}
runSimulation();
