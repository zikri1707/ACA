import { query } from '../config/database.js';

export class BackwardChainingEngine {
  static async evaluate(businessType, facts = {}) {
    // 1. Fetch rules and their details (load all rules for dynamic unified flow)
    const rulesRows = await query(`
      SELECT id, code, name, business_type, description, debit_account_id, credit_account_id, priority
      FROM rules
      WHERE is_active = 1
      ORDER BY priority DESC, code ASC
    `);

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

    // Mutual exclusivity for main categories of pengeluaran
    const mainPengeluaranCategories = ['is_dijual_kembali', 'is_pembelian_aset', 'is_prive', 'is_pelunasan_hutang', 'is_beban'];
    for (const type of mainPengeluaranCategories) {
      if (effectiveFacts[type] === 'yes') {
        for (const other of mainPengeluaranCategories) {
          if (other !== type && effectiveFacts[other] === undefined) {
            effectiveFacts[other] = 'no';
          }
        }
        // Also set is_pengeluaran_atk to no for non-beban categories
        if (type !== 'is_beban' && effectiveFacts['is_pengeluaran_atk'] === undefined) {
          effectiveFacts['is_pengeluaran_atk'] = 'no';
        }
      }
    }

    // Mutual exclusivity for specific subtypes of pelunasan hutang
    const pelunasanSubtypes = ['is_pelunasan_hutang_dagang', 'is_pelunasan_hutang_bank'];
    for (const type of pelunasanSubtypes) {
      if (effectiveFacts[type] === 'yes') {
        for (const other of pelunasanSubtypes) {
          if (other !== type && effectiveFacts[other] === undefined) {
            effectiveFacts[other] = 'no';
          }
        }
      }
    }

    // Mutual exclusivity for specific subtypes of beban
    const bebanSubtypes = ['is_beban_gaji', 'is_beban_utilitas', 'is_beban_sewa', 'is_beban_pemasaran'];
    for (const type of bebanSubtypes) {
      if (effectiveFacts[type] === 'yes') {
        for (const other of bebanSubtypes) {
          if (other !== type && effectiveFacts[other] === undefined) {
            effectiveFacts[other] = 'no';
          }
        }
      }
    }

    // Logical implications for pelunasan hutang
    if (effectiveFacts['is_pelunasan_hutang'] === 'no') {
      if (effectiveFacts['is_pelunasan_hutang_dagang'] === undefined) effectiveFacts['is_pelunasan_hutang_dagang'] = 'no';
      if (effectiveFacts['is_pelunasan_hutang_bank'] === undefined) effectiveFacts['is_pelunasan_hutang_bank'] = 'no';
    } else if (effectiveFacts['is_pelunasan_hutang_dagang'] === 'yes' || effectiveFacts['is_pelunasan_hutang_bank'] === 'yes') {
      effectiveFacts['is_pelunasan_hutang'] = 'yes';
    }

    // Logical implications for beban
    if (effectiveFacts['is_beban'] === 'no') {
      if (effectiveFacts['is_beban_gaji'] === undefined) effectiveFacts['is_beban_gaji'] = 'no';
      if (effectiveFacts['is_beban_utilitas'] === undefined) effectiveFacts['is_beban_utilitas'] = 'no';
      if (effectiveFacts['is_beban_sewa'] === undefined) effectiveFacts['is_beban_sewa'] = 'no';
      if (effectiveFacts['is_beban_pemasaran'] === undefined) effectiveFacts['is_beban_pemasaran'] = 'no';
    } else if (
      effectiveFacts['is_beban_gaji'] === 'yes' ||
      effectiveFacts['is_beban_utilitas'] === 'yes' ||
      effectiveFacts['is_beban_sewa'] === 'yes' ||
      effectiveFacts['is_beban_pemasaran'] === 'yes'
    ) {
      effectiveFacts['is_beban'] = 'yes';
    }

    // Logical implications for pengeluaran atk
    if (effectiveFacts['is_pengeluaran_atk'] === 'yes') {
      if (effectiveFacts['is_dijual_kembali'] === undefined) effectiveFacts['is_dijual_kembali'] = 'no';
      if (effectiveFacts['is_pembelian_aset'] === undefined) effectiveFacts['is_pembelian_aset'] = 'no';
      if (effectiveFacts['is_prive'] === undefined) effectiveFacts['is_prive'] = 'no';
      if (effectiveFacts['is_pelunasan_hutang'] === undefined) effectiveFacts['is_pelunasan_hutang'] = 'no';
    }

    // Logical priority order of facts for questioning flow consistency
    // Urutan ini menentukan pertanyaan mana yang ditanyakan lebih dulu
    // ketika sebuah rule memiliki beberapa kondisi yang belum diketahui
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
      'is_pelunasan_hutang',
      'is_pelunasan_hutang_dagang',
      'is_pelunasan_hutang_bank',
      'is_beban',
      'is_beban_gaji',
      'is_beban_utilitas',
      'is_beban_sewa',
      'is_beban_pemasaran',
      'is_pengeluaran_atk',
      'is_pendekatan_beban'
    ];

    const memoryRules = [];
    for (const rule of rulesRows) {
      if (rule.code === 'G-21') {
        // Perlengkapan Kredit (priority higher)
        memoryRules.push({
          ...rule,
          variant: 'kredit',
          priority: rule.priority + 1,
          credit_account_id: accountsMapByCode['2-1000']?.id || rule.credit_account_id
        });
        // Perlengkapan Tunai
        memoryRules.push({
          ...rule,
          variant: 'tunai',
          credit_account_id: accountsMapByCode['1-1000']?.id || rule.credit_account_id
        });
      } else {
        memoryRules.push(rule);
      }
    }

    // Re-sort rules in memory by priority DESC
    memoryRules.sort((a, b) => b.priority - a.priority);

    for (const rule of memoryRules) {
      const conditions = [...(conditionsByRule[rule.id] || [])];

      // Inject gateway conditions dynamically
      if (rule.code === 'G-13' || rule.code === 'G-14' || rule.code === 'G-15') {
        conditions.push({ fact_name: 'is_pelunasan_hutang', expected_value: 'yes' });
      } else if (rule.code === 'G-16' || rule.code === 'G-17' || rule.code === 'G-18' || rule.code === 'G-19') {
        conditions.push({ fact_name: 'is_beban', expected_value: 'yes' });
      }

      // Inject kredit condition for G-21 variants
      if (rule.code === 'G-21') {
        if (rule.variant === 'kredit') {
          conditions.push({ fact_name: 'is_kredit', expected_value: 'yes' });
        } else if (rule.variant === 'tunai') {
          conditions.push({ fact_name: 'is_kredit', expected_value: 'no' });
        }
      }

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
      // G-04, G-05 = Penjualan Barang (Kredit/Tunai) → Trigger HPP
      if (provenGoal.rule_code === 'G-04' || provenGoal.rule_code === 'G-05') {
        provenGoal.triggerHpp = true;
      }
      // G-09, G-10 = Pembelian Persediaan (Kredit/Tunai) → Trigger Moving Average
      if (provenGoal.rule_code === 'G-09' || provenGoal.rule_code === 'G-10') {
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
