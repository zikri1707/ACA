import { query } from '../config/database.js';

export class BackwardChainingEngine {
  /**
   * Run the backward chaining inference.
   * @param {string} businessType - 'jasa' or 'dagang'
   * @param {Object} facts - User answers (e.g. { is_penerimaan: 'yes', is_kredit: 'no' })
   * @returns {Promise<Object>}
   */
  static async evaluate(businessType, facts = {}) {
    // 1. Fetch rules and their details
    const rulesRows = await query(`
      SELECT r.id, r.code, r.name, r.business_type, r.description,
             a.id as account_id, a.code as account_code, a.name as account_name, 
             a.category as account_category, a.subcategory as account_subcategory, a.description as account_desc
      FROM rules r
      JOIN accounts a ON r.conclusion_account_id = a.id
      WHERE r.is_active = 1 AND (r.business_type = 'semua' OR r.business_type = ?)
      ORDER BY r.code ASC
    `, [businessType]);

    // 2. Fetch all conditions for these rules
    const conditionsRows = await query(`
      SELECT rc.rule_id, rc.fact_name, rc.operator, rc.expected_value
      FROM rule_conditions rc
      JOIN rules r ON rc.rule_id = r.id
      WHERE r.is_active = 1
    `);

    // Group conditions by rule_id
    const conditionsByRule = {};
    conditionsRows.forEach(cond => {
      if (!conditionsByRule[cond.rule_id]) {
        conditionsByRule[cond.rule_id] = [];
      }
      conditionsByRule[cond.rule_id].push(cond);
    });

    // 3. Fetch all questions to map fact names to user questions
    const questionsRows = await query('SELECT code, question_text, fact_name FROM questions');
    const questionsMap = {};
    questionsRows.forEach(q => {
      questionsMap[q.fact_name] = q;
    });

    // 4. Inference loop
    let provenGoal = null;
    let nextQuestion = null;
    const ruleTrace = [];
    const verifiedFacts = [];

    // Track which facts were used/verified
    for (const [key, val] of Object.entries(facts)) {
      verifiedFacts.push({ fact_name: key, value: val });
    }

    for (const rule of rulesRows) {
      const conditions = conditionsByRule[rule.id] || [];
      let ruleStatus = 'passed'; // Default to passed, will downgrade
      const conditionTraces = [];

      for (const cond of conditions) {
        const factValue = facts[cond.fact_name];

        if (factValue !== undefined) {
          // Fact is known
          if (factValue === cond.expected_value) {
            conditionTraces.push({
              fact_name: cond.fact_name,
              expected: cond.expected_value,
              actual: factValue,
              status: 'satisfied'
            });
          } else {
            conditionTraces.push({
              fact_name: cond.fact_name,
              expected: cond.expected_value,
              actual: factValue,
              status: 'violated'
            });
            ruleStatus = 'failed';
          }
        } else {
          // Fact is unknown
          conditionTraces.push({
            fact_name: cond.fact_name,
            expected: cond.expected_value,
            status: 'unknown'
          });

          if (ruleStatus !== 'failed') {
            ruleStatus = 'blocked';
          }
        }
      }

      // Record rule trace
      ruleTrace.push({
        rule_code: rule.code,
        rule_name: rule.name,
        status: ruleStatus,
        conditions: conditionTraces,
        conclusion: {
          code: rule.account_code,
          name: rule.account_name,
          category: rule.account_category
        }
      });

      // If we proved a rule and don't have a proven goal yet
      if (ruleStatus === 'passed' && !provenGoal) {
        provenGoal = {
          account_id: rule.account_id,
          code: rule.account_code,
          name: rule.account_name,
          category: rule.account_category,
          subcategory: rule.account_subcategory,
          description: rule.account_desc,
          rule_code: rule.code,
          rule_name: rule.name,
          rule_desc: rule.description
        };
      }

      // If the rule is blocked and we haven't selected a next question yet
      if (ruleStatus === 'blocked' && !nextQuestion && !provenGoal) {
        // Find the first unknown condition in this blocked rule
        const firstUnknown = conditions.find(c => facts[c.fact_name] === undefined);
        if (firstUnknown && questionsMap[firstUnknown.fact_name]) {
          nextQuestion = questionsMap[firstUnknown.fact_name];
        }
      }
    }

    if (provenGoal) {
      return {
        status: 'proven',
        nextQuestion: null,
        provenGoal,
        ruleTrace,
        verifiedFacts,
        confidence: 95 // Preset high-confidence score for validated logic paths
      };
    } else if (nextQuestion) {
      return {
        status: 'processing',
        nextQuestion,
        provenGoal: null,
        ruleTrace,
        verifiedFacts,
        confidence: 0
      };
    } else {
      return {
        status: 'unproven',
        nextQuestion: null,
        provenGoal: null,
        ruleTrace,
        verifiedFacts,
        confidence: 0
      };
    }
  }
}
