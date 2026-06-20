import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.resolve('database.sqlite');
const db = new sqlite3.Database(dbPath);

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function testRegister() {
  const name = 'Test User';
  const email = 'test_user_' + Date.now() + '@example.com';
  const business_name = 'Toko Test';
  const business_type = 'dagang';
  const password = 'mysecretpassword';

  try {
    console.log(`[TEST] Checking if email ${email} exists...`);
    const existingUser = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      console.log('[TEST] Email already registered.');
      return;
    }

    console.log('[TEST] Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('[TEST] Inserting user into database...');
    const result = await runAsync(`
      INSERT INTO users (name, email, password_hash, business_name, business_type, role_id)
      VALUES (?, ?, ?, ?, ?, 2)
    `, [name, email, passwordHash, business_name, business_type]);
    
    console.log(`[TEST] User inserted successfully with ID: ${result.lastID}`);

    console.log('[TEST] Retrieving user details from database...');
    const user = await getAsync(`
      SELECT u.id, u.name, u.email, u.business_name, u.business_type, u.password_hash, r.name as role 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [result.lastID]);

    console.log('[TEST] Retrieved User:', user);

    console.log('[TEST] Verifying password match with bcrypt...');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`[TEST] Password verification result: ${isMatch ? 'PASSED (Match)' : 'FAILED (Mismatch)'}`);

  } catch (err) {
    console.error('[TEST] Error during registration test:', err);
  } finally {
    db.close();
  }
}

testRegister();
