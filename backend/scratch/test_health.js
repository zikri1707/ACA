import { query } from '../src/config/database.js';
import { HealthDiagnosticsEngine } from '../src/engine/HealthDiagnosticsEngine.js';

async function run() {
  try {
    const users = await query('SELECT id, name, business_name FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found in database.');
      process.exit(0);
    }

    const user = users[0];
    console.log(`Evaluating business health for: ${user.name} (${user.business_name || 'No Business Name'}), User ID: ${user.id}`);
    
    const diagnostics = await HealthDiagnosticsEngine.evaluate(user.id);
    console.log('--- DIAGNOSTICS REPORT ---');
    console.log(JSON.stringify(diagnostics, null, 2));

  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
