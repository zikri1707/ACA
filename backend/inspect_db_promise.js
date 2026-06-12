import { query } from './src/config/database.js';

try {
  const rows = await query(`
    SELECT r.code, r.name, rc.fact_name, rc.expected_value
    FROM rules r
    LEFT JOIN rule_conditions rc ON r.id = rc.rule_id
    ORDER BY r.code ASC
  `);
  console.log(JSON.stringify(rows, null, 2));
} catch (err) {
  console.error(err);
}
process.exit(0);
