import { query } from '../config/database.js';

export class HealthDiagnosticsEngine {
  /**
   * Evaluates the business health status and ratios for a user
   * @param {number} userId 
   * @returns {Object} Diagnostics report
   */
  static async evaluate(userId) {
    // 1. Fetch account totals for this user's journal entries
    const accountsData = await query(`
      SELECT a.id, a.code, a.name, a.category, a.subcategory,
             COALESCE(SUM(CASE WHEN j.debit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_debit,
             COALESCE(SUM(CASE WHEN j.credit_account_id = a.id THEN j.amount ELSE 0 END), 0) as total_credit
      FROM accounts a
      JOIN journals j ON (a.id = j.debit_account_id OR a.id = j.credit_account_id)
      JOIN consultations c ON j.consultation_id = c.id
      WHERE c.user_id = ?
      GROUP BY a.id
    `, [userId]);

    // Handle new users or users with no transactions
    if (accountsData.length === 0) {
      return {
        status: 'BELUM ADA DATA',
        score: 0,
        color: 'secondary',
        recommendation: 'Belum ada transaksi usaha yang tercatat di pembukuan Anda. Silakan mulai lakukan konsultasi akuntansi dan simpan jurnal transaksi untuk menganalisis kesehatan keuangan bisnis.',
        ratios: {
          currentRatio: 0,
          cashRatio: 0,
          npm: 0,
          der: 0,
          oer: 0
        },
        facts: {
          currentRatioStatus: 'kurang',
          cashRatioStatus: 'kritis',
          npmStatus: 'rendah',
          expenseRatioStatus: 'boros',
          derStatus: 'aman'
        },
        financials: {
          currentAssets: 0,
          currentLiabilities: 0,
          cashAndBank: 0,
          totalLiabilities: 0,
          totalEquity: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netIncome: 0
        }
      };
    }

    let currentAssets = 0;
    let currentLiabilities = 0;
    let cashAndBank = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    accountsData.forEach(acc => {
      const debit = Number(acc.total_debit);
      const credit = Number(acc.total_credit);
      const cat = acc.category;
      const sub = acc.subcategory;

      // Normal balance calculations
      let balance = 0;
      if (cat === 'Aset' || cat === 'Beban') {
        balance = debit - credit;
      } else {
        balance = credit - debit;
      }

      if (cat === 'Aset') {
        if (sub !== 'Aset Tetap' && sub !== 'Akumulasi Penyusutan') {
          currentAssets += balance;
        }
        if (sub === 'Kas & Setara Kas' || sub === 'Bank') {
          cashAndBank += balance;
        }
      } else if (cat === 'Kewajiban') {
        totalLiabilities += balance;
        if (sub === 'Hutang Lancar') {
          currentLiabilities += balance;
        }
      } else if (cat === 'Ekuitas') {
        totalEquity += balance;
      } else if (cat === 'Pendapatan') {
        totalRevenue += balance;
      } else if (cat === 'Beban') {
        totalExpenses += balance;
      }
    });

    const netIncome = totalRevenue - totalExpenses;
    const adjustedEquity = totalEquity + netIncome;

    // Ratios calculations with safety division checks
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : (currentAssets > 0 ? 99.9 : 0);
    const cashRatio = currentLiabilities > 0 ? (cashAndBank / currentLiabilities) : (cashAndBank > 0 ? 99.9 : 0);
    const npm = totalRevenue > 0 ? (netIncome / totalRevenue) : 0;
    const der = adjustedEquity !== 0 ? (totalLiabilities / adjustedEquity) : (totalLiabilities > 0 ? 99.9 : 0);
    const oer = totalRevenue > 0 ? (totalExpenses / totalRevenue) : 0;

    // Convert numeric ratios to boolean/categorical status facts
    const currentRatioStatus = currentRatio >= 1.5 ? 'sehat' : 'kurang';
    const cashRatioStatus = cashRatio >= 0.5 ? 'aman' : 'kritis';
    const npmStatus = npm >= 0.10 ? 'sehat' : (npm >= 0 ? 'rendah' : 'rugi');
    const expenseRatioStatus = oer < 0.80 ? 'efisien' : 'boros';
    const derStatus = der < 1.0 ? 'aman' : 'tinggi';

    // Heuristics decision tree (Expert system)
    let status = 'RENTAN';
    let score = 60;
    let color = 'warning';
    let recommendation = 'Kondisi keuangan bisnis Anda berada dalam kategori rentan. Beberapa indikator rasio berada di bawah batas optimal. Disarankan untuk meninjau ulang alokasi pengeluaran kas dan meminimalkan biaya non-operasional.';

    if (npmStatus === 'sehat' && currentRatioStatus === 'sehat' && derStatus === 'aman') {
      status = 'SEHAT (PRIMA)';
      score = 95;
      color = 'success';
      recommendation = 'Kondisi keuangan bisnis Anda sangat prima. Seluruh rasio berada pada level sehat. Anda memiliki keleluasaan kas yang baik untuk melakukan ekspansi bisnis, menambah stok inventaris, atau berinvestasi pada peralatan baru.';
    } else if (npmStatus === 'rugi' && currentRatioStatus === 'kurang' && derStatus === 'tinggi') {
      status = 'KRITIS (DARURAT)';
      score = 25;
      color = 'danger';
      recommendation = 'Bisnis Anda berada dalam kondisi darurat keuangan (merugi, kas kritis, dan beban utang terlalu tinggi). Segera lakukan restrukturisasi operasional menyeluruh, tunda pengeluaran non-esensial, dan upayakan tambahan modal sendiri untuk menyelamatkan bisnis.';
    } else if (derStatus === 'tinggi' && cashRatioStatus === 'kritis') {
      status = 'BAHAYA HUTANG';
      score = 40;
      color = 'danger';
      recommendation = 'Tingkat utang bisnis Anda sangat tinggi dibandingkan modal yang disetor, ditambah cadangan kas Anda berada pada tingkat kritis. Sangat disarankan untuk menghentikan pengajuan utang baru dan memprioritaskan pelunasan pinjaman jangka pendek.';
    } else if (npmStatus === 'rendah' && expenseRatioStatus === 'boros') {
      status = 'TIDAK EFISIEN';
      score = 55;
      color = 'warning';
      recommendation = 'Laba bersih bisnis Anda sangat tipis akibat beban operasional yang tidak efisien dibandingkan dengan total penjualan. Evaluasi ulang pos pengeluaran seperti pemakaian utilitas (listrik/air), beban sewa ruko, atau pembelian ATK habis pakai.';
    } else if (npmStatus !== 'rugi' && currentRatioStatus === 'kurang') {
      status = 'RAWAN LIKUIDITAS';
      score = 50;
      color = 'warning';
      recommendation = 'Bisnis Anda membukukan laba, tetapi Anda menghadapi risiko likuiditas (kesulitan dana segar). Banyak modal kerja Anda tertahan di piutang pelanggan atau persediaan barang dagang. Fokuskan tindakan pada penagihan piutang dan batasi pembelian barang secara tunai.';
    }

    return {
      status,
      score,
      color,
      recommendation,
      ratios: {
        currentRatio,
        cashRatio,
        npm,
        der,
        oer
      },
      facts: {
        currentRatioStatus,
        cashRatioStatus,
        npmStatus,
        expenseRatioStatus,
        derStatus
      },
      financials: {
        currentAssets,
        currentLiabilities,
        cashAndBank,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpenses,
        netIncome
      }
    };
  }
}
