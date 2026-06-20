import { query } from '../config/database.js';

export class BackwardChainingEngine {
  static async evaluate(businessType, facts = {}) {
    // 1. Fetch rules and their details
    const rulesRows = await query(`
      SELECT id, code, name, business_type, description, debit_account_id, credit_account_id, priority
      FROM rules
      WHERE is_active = 1 AND (business_type = 'semua' OR business_type = ?)
      ORDER BY priority DESC, code ASC
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
    if (effectiveFacts['is_inbound'] === 'yes') {
      effectiveFacts['is_outbound'] = 'no';
    } else if (effectiveFacts['is_outbound'] === 'yes') {
      effectiveFacts['is_inbound'] = 'no';
    }

    // Mutual exclusivity for Penerimaan subtypes
    const penerimaanTypes = ['is_penjualan_barang', 'is_penjualan_jasa', 'is_pinjaman_bank', 'is_setoran_modal', 'is_penerimaan_piutang'];
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
    const pengeluaranTypes = ['is_pembelian_aset', 'is_prive', 'is_beban_gaji', 'is_beban_utilitas', 'is_beban_sewa', 'is_beban_atk', 'is_beban_pemasaran', 'is_pelunasan_hutang_dagang', 'is_pelunasan_hutang_bank'];
    for (const type of pengeluaranTypes) {
      if (effectiveFacts[type] === 'yes') {
        for (const other of pengeluaranTypes) {
          if (other !== type && effectiveFacts[other] === undefined) {
            effectiveFacts[other] = 'no';
          }
        }
      }
    }

    // Logical priority order of facts for questioning flow consistency
    const FACT_ORDER = [
      'is_inbound',
      'is_outbound',
      'is_setoran_modal',
      'is_pinjaman_bank',
      'is_penerimaan_piutang',
      'is_penjualan_barang',
      'is_penjualan_jasa',
      'is_dijual_kembali',
      'is_kredit',
      'is_pembelian_aset',
      'is_manfaat_lebih_1_tahun',
      'is_prive',
      'is_beban_gaji',
      'is_beban_utilitas',
      'is_beban_sewa',
      'is_beban_atk',
      'is_beban_pemasaran',
      'is_pelunasan_hutang_dagang',
      'is_pelunasan_hutang_bank'
    ];

    for (const rule of rulesRows) {
      const conditions = conditionsByRule[rule.id] || [];
      
      // Sort conditions using logical priority order
      conditions.sort((a, b) => {
        const idxA = FACT_ORDER.indexOf(a.fact_name);
        const idxB = FACT_ORDER.indexOf(b.fact_name);
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
      });

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
      // INJEKSI HPP & MOVING AVERAGE FLAGS
      if (provenGoal.rule_code === 'R-004' || provenGoal.rule_code === 'R-005') {
        provenGoal.triggerHpp = true;
      }
      if (provenGoal.rule_code === 'R-008' || provenGoal.rule_code === 'R-009') {
        provenGoal.triggerMovingAverage = true;
      }
      return { status: 'proven', nextQuestion: null, provenGoal, ruleTrace, verifiedFacts, confidence: 95 };
    } else if (nextQuestion) {
      return { status: 'processing', nextQuestion, provenGoal: null, ruleTrace, verifiedFacts, confidence: 0 };
    } else {
      return { status: 'unproven', nextQuestion: null, provenGoal: null, ruleTrace, verifiedFacts, confidence: 0 };
    }
  }
}
