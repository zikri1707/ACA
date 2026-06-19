import { query } from '../src/config/database.js';

async function check() {
  try {
    const rules = await query('SELECT id, code, name FROM rules WHERE is_active = 1');
    console.log('Total active rules:', rules.length);

    for (const rule of rules) {
      const conditions = await query('SELECT fact_name, expected_value FROM rule_conditions WHERE rule_id = ?', [rule.id]);
      const hasInbound = conditions.some(c => c.fact_name === 'is_inbound');
      const hasOutbound = conditions.some(c => c.fact_name === 'is_outbound');
      const hasKredit = conditions.some(c => c.fact_name === 'is_kredit');

      console.log(`Rule ${rule.code}: hasInbound=${hasInbound}, hasOutbound=${hasOutbound}, hasKredit=${hasKredit}, conditions=[${conditions.map(c => `${c.fact_name}=${c.expected_value}`).join(', ')}]`);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
