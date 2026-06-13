import { query } from '../config/database.js';

export class BackwardChainingEngine {
  static async evaluate(businessType, facts = {}) {
    // 1. Fetch rules and their details
    const rulesRows = await query(`
      SELECT id, code, name, business_type, description, debit_account_id, credit_account_id
      FROM rules
      WHERE is_active = 1 AND (business_type = 'semua' OR business_type = ?)
      ORDER BY code ASC
    `, [businessType]);

    // 2. Fetch all conditions
    const conditionsRows = await query(`
      SELECT rc.rule_id, rc.fact_name, rc.operator, rc.expected_value
      FROM rule_conditions rc
      JOIN rules r ON rc.rule_id = r.id
      WHERE r.is_active = 1
    `);

    const conditionsByRule = {};
    conditionsRows.forEach(cond => {
      if (!conditionsByRule[cond.rule_id]) {
        conditionsByRule[cond.rule_id] = [];
      }
      conditionsByRule[cond.rule_id].push(cond);
    });

    // 3. Fetch questions map
    const questionsRows = await query('SELECT id as question_id, code, question_text, fact_name FROM questions');
    const questionsMap = {};
    questionsRows.forEach(q => {
      questionsMap[q.fact_name] = q;
    });

    // 4. Fetch accounts map
    const accountsRows = await query('SELECT id, code, name, category, subcategory FROM accounts');
    const accountsMapById = {};
    const accountsMapByCode = {};
    accountsRows.forEach(acc => {
      accountsMapById[acc.id] = acc;
      accountsMapByCode[acc.code] = acc;
    });

    let provenGoal = null;
    let nextQuestion = null;
    const ruleTrace = [];
    const verifiedFacts = Object.entries(facts).map(([k, v]) => ({ fact_name: k, value: v }));

    // Create a copy of facts to inject logical defaults based on business type
    // This prevents rules from being permanently blocked by skipped questions
    const effectiveFacts = { ...facts };
    if (businessType === 'jasa') {
      if (effectiveFacts['is_penjualan_barang'] === undefined) effectiveFacts['is_penjualan_barang'] = 'no';
      if (effectiveFacts['is_dijual_kembali'] === undefined) effectiveFacts['is_dijual_kembali'] = 'no';
    } else if (businessType === 'dagang') {
      if (effectiveFacts['is_penjualan_jasa'] === undefined) effectiveFacts['is_penjualan_jasa'] = 'no';
    }

    // Mutual exclusivity for cash flows
    if (effectiveFacts['is_penerimaan'] === 'yes') {
      effectiveFacts['is_pengeluaran'] = 'no';
    } else if (effectiveFacts['is_pengeluaran'] === 'yes') {
      effectiveFacts['is_penerimaan'] = 'no';
    }

    // Mutual exclusivity for Penerimaan subtypes
    const penerimaanTypes = ['is_penjualan_barang', 'is_penjualan_jasa', 'is_pinjaman_bank', 'is_setoran_modal'];
    for (const type of penerimaanTypes) {
      if (effectiveFacts[type] === 'yes') {
        for (const other of penerimaanTypes) {
          if (other !== type && effectiveFacts[other] === undefined) {
            effectiveFacts[other] = 'no';
          }
        }
      }
    }

    // Mutual exclusivity for Pengeluaran subtypes
    const pengeluaranTypes = ['is_pembelian_aset', 'is_prive', 'is_beban_gaji', 'is_beban_utilitas', 'is_beban_sewa', 'is_beban_atk'];
    for (const type of pengeluaranTypes) {
      if (effectiveFacts[type] === 'yes') {
        for (const other of pengeluaranTypes) {
          if (other !== type && effectiveFacts[other] === undefined) {
            effectiveFacts[other] = 'no';
          }
        }
      }
    }

    for (const rule of rulesRows) {
      const conditions = conditionsByRule[rule.id] || [];
      let ruleStatus = 'passed';
      const conditionTraces = [];

      for (const cond of conditions) {
        const factValue = effectiveFacts[cond.fact_name];
        if (factValue !== undefined) {
          if (factValue === cond.expected_value) {
            conditionTraces.push({ fact_name: cond.fact_name, expected: cond.expected_value, actual: factValue, status: 'satisfied' });
          } else {
            conditionTraces.push({ fact_name: cond.fact_name, expected: cond.expected_value, actual: factValue, status: 'violated' });
            ruleStatus = 'failed';
          }
        } else {
          conditionTraces.push({ fact_name: cond.fact_name, expected: cond.expected_value, status: 'unknown' });
          if (ruleStatus !== 'failed') ruleStatus = 'blocked';
        }
      }

      // Dynamic Resolvers if passed
      let resolvedDebit = accountsMapById[rule.debit_account_id] || null;
      let resolvedCredit = accountsMapById[rule.credit_account_id] || null;
      let requiresUserInput = null;

      if (ruleStatus === 'passed') {
        if (rule.code === 'R-002' && !resolvedCredit) {
          resolvedCredit = businessType === 'dagang' ? accountsMapByCode['4-1000'] : accountsMapByCode['4-1100'];
        }
        if (rule.code === 'R-006' && !resolvedCredit) {
          resolvedCredit = facts['is_kredit'] === 'yes' ? accountsMapByCode['2-1000'] : accountsMapByCode['1-1000'];
        }
        if (rule.code === 'R-005' && !resolvedDebit) {
          // This one explicitly needs user input based on requirements
          requiresUserInput = 'debit';
          resolvedDebit = { id: null, code: 'DYNAMIC_BEBAN', name: 'Pilih Jenis Beban', category: 'Beban', isDynamic: true };
        }
      }

      ruleTrace.push({
        rule_code: rule.code,
        rule_name: rule.name,
        status: ruleStatus,
        conditions: conditionTraces,
        conclusion: { debit: resolvedDebit, credit: resolvedCredit }
      });

      if (ruleStatus === 'passed' && !provenGoal) {
        provenGoal = {
          rule_id: rule.id,
          rule_code: rule.code,
          rule_name: rule.name,
          rule_desc: rule.description,
          debit: resolvedDebit,
          credit: resolvedCredit,
          requiresUserInput
        };
        break; // STOP: We found the highest priority passed rule!
      }

      if (ruleStatus === 'blocked' && !nextQuestion && !provenGoal) {
        const firstUnknown = conditions.find(c => {
          if (effectiveFacts[c.fact_name] !== undefined) return false;
          // Skip irrelevant questions based on business type
          if (businessType === 'jasa' && c.fact_name === 'is_penjualan_barang') return false;
          if (businessType === 'dagang' && c.fact_name === 'is_penjualan_jasa') return false;
          if (businessType === 'jasa' && c.fact_name === 'is_dijual_kembali') return false;
          return true;
        });
        
        if (firstUnknown && questionsMap[firstUnknown.fact_name]) {
          nextQuestion = questionsMap[firstUnknown.fact_name];
          break; // STOP: We must ask this question before evaluating lower priority rules!
        }
      }
    }

    if (provenGoal) {
      return { status: 'proven', nextQuestion: null, provenGoal, ruleTrace, verifiedFacts, confidence: 95 };
    } else if (nextQuestion) {
      return { status: 'processing', nextQuestion, provenGoal: null, ruleTrace, verifiedFacts, confidence: 0 };
    } else {
      return { status: 'unproven', nextQuestion: null, provenGoal: null, ruleTrace, verifiedFacts, confidence: 0 };
    }
  }
}
