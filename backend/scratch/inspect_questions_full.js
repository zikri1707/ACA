import { query } from '../src/config/database.js';

async function run() {
  try {
    const questions = await query('SELECT id, code, question_text, fact_name FROM questions');
    questions.forEach(q => {
      console.log(`${q.code} (${q.fact_name}): ${q.question_text}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
