import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./backend/ACA_Expert_System.db');
db.all("SELECT code, name, priority FROM rules WHERE code IN ('R-001', 'R-019')", (err, rows) => {
  console.log(rows);
});
