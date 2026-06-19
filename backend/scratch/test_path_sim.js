import { BackwardChainingEngine } from '../src/engine/BackwardChainingEngine.js';
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./backend/ACA_Expert_System.db');

async function testSimulate() {
  const allRules = await new Promise((resolve) => {
    db.all('SELECT * FROM rules ORDER BY priority DESC, code ASC', async (err, rows) => {
      const result = [];
      for(let r of rows) {
        const conds = await new Promise(res => db.all('SELECT * FROM rule_conditions WHERE rule_id = ?', [r.id], (err, c) => res(c)));
        result.push({...r, conditions: conds, is_active: 1});
      }
      resolve(result);
    });
  });

  const questions = [
    { fact_name: 'is_inbound', question_text: 'Q Inbound' },
    { fact_name: 'is_outbound', question_text: 'Q Outbound' },
    { fact_name: 'is_kredit', question_text: 'Q Kredit' },
    { fact_name: 'is_dijual_kembali', question_text: 'Q Jual' },
    { fact_name: 'is_pembelian_aset', question_text: 'Q Aset' },
    { fact_name: 'is_prive', question_text: 'Q Prive' },
    { fact_name: 'is_beban_gaji', question_text: 'Q Gaji' },
  ];

  const generateQuestionSequence = (targetRule, rules) => {
    if (!targetRule || !targetRule.conditions) return [];
    
    const activeRules = [...rules]
      .filter(r => r.is_active === 1)
      .sort((a, b) => b.priority - a.priority);
    
    const targetAnswers = {};
    targetRule.conditions.forEach(c => {
      targetAnswers[c.fact_name] = c.expected_value;
    });

    const FACT_ORDER = [
      'is_inbound', 'is_outbound', 'is_kredit', 'is_dijual_kembali',
      'is_setoran_modal', 'is_pinjaman_bank', 'is_penjualan_barang', 'is_penjualan_jasa',
      'is_penerimaan_piutang', 'is_pembelian_aset', 'is_manfaat_lebih_1_tahun',
      'is_prive', 'is_beban_gaji', 'is_beban_utilitas', 'is_beban_sewa',
      'is_beban_atk', 'is_beban_pemasaran', 'is_pelunasan_hutang_dagang', 'is_pelunasan_hutang_bank'
    ];

    const businessType = targetRule.business_type === 'jasa' ? 'jasa' : 'dagang';
    let facts = {};
    if (businessType === 'jasa') {
      facts['is_penjualan_barang'] = 'no';
      facts['is_dijual_kembali'] = 'no';
    } else if (businessType === 'dagang') {
      facts['is_penjualan_jasa'] = 'no';
    }

    const sequence = [];
    let status = 'processing';
    let safetyCounter = 0;

    while (status === 'processing' && safetyCounter < 50) {
      safetyCounter++;
      let nextQuestion = null;
      let provenRule = null;

      if (facts['is_inbound'] === 'yes') facts['is_outbound'] = 'no';
      else if (facts['is_outbound'] === 'yes') facts['is_inbound'] = 'no';

      const penerimaanTypes = ['is_penjualan_barang', 'is_penjualan_jasa', 'is_pinjaman_bank', 'is_setoran_modal', 'is_penerimaan_piutang'];
      for (const type of penerimaanTypes) {
        if (facts[type] === 'yes') {
          for (const other of penerimaanTypes) {
            if (other !== type && facts[other] === undefined) facts[other] = 'no';
          }
        }
      }

      const pengeluaranTypes = ['is_pembelian_aset', 'is_prive', 'is_beban_gaji', 'is_beban_utilitas', 'is_beban_sewa', 'is_beban_atk', 'is_beban_pemasaran', 'is_pelunasan_hutang_dagang', 'is_pelunasan_hutang_bank'];
      for (const type of pengeluaranTypes) {
        if (facts[type] === 'yes') {
          for (const other of pengeluaranTypes) {
            if (other !== type && facts[other] === undefined) facts[other] = 'no';
          }
        }
      }

      for (const rule of activeRules) {
        let ruleStatus = 'passed';
        
        const sortedConds = [...rule.conditions].sort((a, b) => {
          const idxA = FACT_ORDER.indexOf(a.fact_name);
          const idxB = FACT_ORDER.indexOf(b.fact_name);
          return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
        });

        for (const cond of sortedConds) {
          const factValue = facts[cond.fact_name];
          if (factValue !== undefined) {
            if (factValue !== cond.expected_value) {
              ruleStatus = 'failed';
              break;
            }
          } else {
            ruleStatus = 'blocked';
            if (!nextQuestion) {
               nextQuestion = cond.fact_name;
            }
            break; 
          }
        }

        if (ruleStatus === 'passed') {
          provenRule = rule;
          break;
        } else if (ruleStatus === 'blocked') {
          break; 
        }
      }

      if (provenRule) {
        status = 'proven';
        break;
      }

      if (nextQuestion) {
        let ans = targetAnswers[nextQuestion];
        if (ans === undefined) ans = 'no'; 
        
        const qObj = questions.find(x => x.fact_name === nextQuestion);
        sequence.push({
          q: qObj?.question_text || nextQuestion,
          a: ans.toUpperCase(),
          fact_name: nextQuestion,
          code: qObj?.code || ''
        });
        facts[nextQuestion] = ans;
      } else {
        break;
      }
    }

    return sequence;
  };

  const r11 = allRules.find(r => r.code === 'R-011');
  console.log('Path for R-011 Beban Gaji:', generateQuestionSequence(r11, allRules));
}

testSimulate();
