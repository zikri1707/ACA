import { query } from '../src/config/database.js';

async function run() {
  try {
    const questions = await query('SELECT * FROM questions');
    console.log('--- QUESTIONS ---');
    console.log(JSON.stringify(questions, null, 2));

    const rules = await query('SELECT * FROM rules');
    console.log('--- RULES ---');
    console.log(JSON.stringify(rules, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
