import { run, get } from '../src/config/database.js';

async function main() {
  try {
    console.log('Deleting rule R-020 (Pencatatan HPP (Otomatis)) from database...');
    const ruleRow = await get("SELECT id FROM rules WHERE code = 'R-020'");
    if (ruleRow) {
      const condDel = await run("DELETE FROM rule_conditions WHERE rule_id = ?", [ruleRow.id]);
      console.log('Deleted conditions:', condDel.changes);
    }
    const result = await run("DELETE FROM rules WHERE code = 'R-020'");
    console.log('Rule deleted successfully:', result.changes, 'rows affected.');
  } catch (err) {
    console.error('Error deleting rule:', err);
  }
}

main();
