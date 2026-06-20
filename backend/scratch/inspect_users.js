import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT id, name, email, business_name, business_type, role_id, created_at
  FROM users
`, [], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('--- Registered Users ---');
    console.log(rows);
  }
  db.close();
});
