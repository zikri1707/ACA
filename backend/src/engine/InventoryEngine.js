import { query } from '../config/database.js';

export class InventoryEngine {
  /**
   * Calculates moving average and updates item stock and HPP
   * triggered by R-003 or R-004
   * @param {Array} items - Array of { itemId, qty, price }
   * @param {number} consultationId
   */
  static async calculateAndSaveMovingAverage(items, consultationId) {
    if (!items || !items.length) return;
    
    for (const item of items) {
      // 1. Get old item data
      const rows = await query('SELECT stock_qty, avg_hpp FROM items WHERE id = ?', [item.itemId]);
      if (rows.length === 0) continue;
      
      const oldQty = rows[0].stock_qty;
      const oldHpp = rows[0].avg_hpp;
      
      const newQty = Number(item.qty);
      const newPrice = Number(item.price);
      
      // 2. Calculate new Moving Average
      let newAvgHpp = oldHpp;
      if (oldQty + newQty > 0) {
        newAvgHpp = ((oldQty * oldHpp) + (newQty * newPrice)) / (oldQty + newQty);
      }
      
      // 3. Update DB
      await query('UPDATE items SET stock_qty = stock_qty + ?, avg_hpp = ? WHERE id = ?', [newQty, newAvgHpp, item.itemId]);
      
      // 4. Record transaction details
      if (consultationId) {
        await query('INSERT INTO transaction_details (consultation_id, item_id, qty, price) VALUES (?, ?, ?, ?)', [consultationId, item.itemId, newQty, newPrice]);
      }
    }
  }

  /**
   * Generates R-020 HPP Journal when selling items
   * triggered by R-002 or R-009
   * @param {Array} items - Array of { itemId, qty }
   * @param {number} consultationId
   */
  static async generateHppJournal(items, consultationId) {
    if (!items || !items.length || !consultationId) return;
    
    let totalHppValue = 0;
    
    for (const item of items) {
      const rows = await query('SELECT stock_qty, avg_hpp FROM items WHERE id = ?', [item.itemId]);
      if (rows.length === 0) continue;
      
      const currentHpp = rows[0].avg_hpp;
      const sellQty = Number(item.qty);
      
      totalHppValue += (sellQty * currentHpp);
      
      // 1. Update stock (decrease)
      await query('UPDATE items SET stock_qty = stock_qty - ? WHERE id = ?', [sellQty, item.itemId]);
      
      // 2. Record transaction details (negative qty for outbound)
      const sellPrice = item.price ? Number(item.price) : 0; 
      await query('INSERT INTO transaction_details (consultation_id, item_id, qty, price) VALUES (?, ?, ?, ?)', [consultationId, item.itemId, -sellQty, sellPrice]);
    }
    
    // 3. Insert Journal R-020 [Debit: 5-3000, Credit: 1-1300]
    if (totalHppValue > 0) {
      // Find account IDs
      const debits = await query("SELECT id FROM accounts WHERE code = '5-3000'"); // HPP
      const credits = await query("SELECT id FROM accounts WHERE code = '1-1300'"); // Persediaan
      
      if (debits.length > 0 && credits.length > 0) {
        await query(`
          INSERT INTO journals (consultation_id, debit_account_id, credit_account_id, amount, description) 
          VALUES (?, ?, ?, ?, 'Pencatatan HPP (Otomatis R-020)')
        `, [consultationId, debits[0].id, credits[0].id, totalHppValue]);
      }
    }
  }
}
