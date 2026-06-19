import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT r.id, r.code, r.name, r.business_type, r.debit_account_id, r.credit_account_id,
         da.code as debit_code, da.name as debit_name,
         ca.code as credit_code, ca.name as credit_name,
         rc.fact_name, rc.expected_value
  FROM rules r
  LEFT JOIN accounts da ON r.debit_account_id = da.id
  LEFT JOIN accounts ca ON r.credit_account_id = ca.id
  LEFT JOIN rule_conditions rc ON r.id = rc.rule_id
  ORDER BY r.code ASC
`, [], (err, rows) => {
  if (err) {
    console.error(err);
    db.close();
    return;
  }
  
  const rulesMap = {};
  for (const row of rows) {
    if (!rulesMap[row.code]) {
      rulesMap[row.code] = {
        code: row.code,
        name: row.name,
        business_type: row.business_type,
        debit: row.debit_code ? `${row.debit_code} - ${row.debit_name}` : null,
        credit: row.credit_code ? `${row.credit_code} - ${row.credit_name}` : null,
        conditions: []
      };
    }
    if (row.fact_name) {
      rulesMap[row.code].conditions.push({
        fact_name: row.fact_name,
        expected_value: row.expected_value
      });
    }
  }
  
  const rulesList = Object.values(rulesMap);
  fs.writeFileSync('rules_dump.json', JSON.stringify(rulesList, null, 2));
  console.log('Dumped ' + rulesList.length + ' rules to rules_dump.json');
  db.close();
});
