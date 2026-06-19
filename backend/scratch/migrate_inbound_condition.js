import { query, run } from '../src/config/database.js';

async function execute() {
  try {
    await run('BEGIN TRANSACTION');

    console.log('Fetching rules with is_outbound = yes condition...');
    const outboundConditions = await query(`
      SELECT DISTINCT rule_id 
      FROM rule_conditions 
      WHERE fact_name = 'is_outbound' AND expected_value = 'yes'
    `);

    console.log(`Found ${outboundConditions.length} outbound rules.`);

    for (const cond of outboundConditions) {
      const ruleId = cond.rule_id;
      
      // Get rule code for logging
      const ruleRow = await query("SELECT code, name FROM rules WHERE id = ?", [ruleId]);
      const ruleCode = ruleRow[0].code;
      const ruleName = ruleRow[0].name;

      // Check if it already has is_inbound condition
      const existingInbound = await query(`
        SELECT id FROM rule_conditions 
        WHERE rule_id = ? AND fact_name = 'is_inbound'
      `, [ruleId]);

      if (existingInbound.length === 0) {
        console.log(`Adding is_inbound = no for rule ${ruleCode} (${ruleName})...`);
        await run(`
          INSERT INTO rule_conditions (rule_id, fact_name, operator, expected_value)
          VALUES (?, 'is_inbound', 'equals', 'no')
        `, [ruleId]);
      } else {
        console.log(`Rule ${ruleCode} already has is_inbound condition.`);
      }
    }

    await run('COMMIT');
    console.log('Migration successfully completed!');
  } catch (err) {
    await run('ROLLBACK');
    console.error('Migration failed, rolled back changes:', err);
  }
  process.exit(0);
}

execute();
