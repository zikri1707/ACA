import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT r.code, r.name, rc.fact_name, rc.expected_value
  FROM rules r
  LEFT JOIN rule_conditions rc ON r.id = rc.rule_id
  ORDER BY r.code ASC
`, [], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
