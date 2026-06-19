import { query } from '../src/config/database.js';

async function run() {
  try {
    const accounts = await query('SELECT id, code, name, category, subcategory FROM accounts');
    console.log(JSON.stringify(accounts, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
