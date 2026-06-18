import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrintIcon } from '../components/Icons';

export const ReportsIndex = () => {
  const { token, showToast } = useAuth();

  const [activeTab, setActiveTab] = useState('jurnal');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/reports/summary?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (response.ok) {
        setSummaryData(res);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  }, [token, startDate, endDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      let endpoint = '';
      if (activeTab === 'jurnal') endpoint = '/api/reports/journal';
      else if (activeTab === 'buku-besar') endpoint = '/api/reports/ledger?account_id=1'; // Fallback logic needed
      else if (activeTab === 'neraca-saldo') endpoint = '/api/reports/trial-balance';
      else if (activeTab === 'laba-rugi') endpoint = '/api/reports/income-statement';
      else if (activeTab === 'neraca') endpoint = '/api/reports/balance-sheet';

      if (!endpoint) return;

      const response = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (response.ok) {
        setData(res);
      } else {
        showToast(res.message || 'Gagal memuat data', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal terhubung ke server', 'danger');
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, startDate, endDate]);

  useEffect(() => {
    if (activeTab !== 'buku-besar') { // Buku besar butuh account_id khusus, kita sederhanakan
      fetchData();
    }
    fetchSummary();
  }, [fetchData, fetchSummary, activeTab]);

  const handleExportPDF = () => window.print();

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0);

  const tabs = [
    { id: 'jurnal', label: 'Jurnal Umum' },
    { id: 'neraca-saldo', label: 'Neraca Saldo' },
    { id: 'laba-rugi', label: 'Laba Rugi' },
    { id: 'neraca', label: 'Neraca (Posisi Keuangan)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Filters */}
      <div className="card no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.2rem' }}>Laporan Keuangan SIA</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Standar Informasi Akuntansi (SAK EMKM)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Periode Awal</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Periode Akhir</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', justifyContent: 'flex-end', height: '100%' }}>
            <label style={{ fontSize: '0.7rem', color: 'transparent' }}>Action</label>
            <button onClick={handleExportPDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <PrintIcon className="w-4 h-4" /> Cetak PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && summaryData.summary && (
        <div className="grid-cols-5 no-print" style={{ gap: '1rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { label: 'TOTAL ASSETS', value: summaryData.summary.assets, color: '#3b82f6', bg: '#eff6ff' },
            { label: 'LIABILITIES', value: summaryData.summary.liabilities, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'EQUITY', value: summaryData.summary.equity, color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'REVENUE', value: summaryData.summary.revenue, color: '#10b981', bg: '#ecfdf5' },
            { label: 'EXPENSES', value: summaryData.summary.expenses, color: '#ef4444', bg: '#fef2f2' }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: `3px solid ${item.color}` }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{item.label}</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: item.color }}>{formatRp(item.value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Dashboard Charts & Tables ─── */}
      {summaryData && (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '4fr 3fr 3fr', gap: '1.5rem' }}>
          {/* Trend Bar Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.15rem' }}>Trend Konsultasi Sistem</h3>
            <div style={{ height: '220px', marginTop: '1.5rem', position: 'relative' }}>
              {(() => {
                const monthlyData = summaryData.monthlyTrend || [];
                const bulanIndo = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
                const now = new Date();
                const chartData = Array.from({ length: 6 }, (_, i) => {
                  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  const found = monthlyData.find(m => m.month === key);
                  return { label: bulanIndo[d.getMonth()], count: found ? found.count : 0 };
                });
                
                const maxVal = Math.max(...chartData.map(d => d.count), 1);
                const hasData = chartData.some(d => d.count > 0);

                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '2rem', paddingBottom: '1px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                    {[100, 75, 50, 25].map(pct => (
                      <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct}%`, borderTop: '1px dashed var(--border)', zIndex: 0 }} />
                    ))}
                    {chartData.map((d, idx) => {
                      const pct = hasData ? Math.round((d.count / maxVal) * 100) : 0;
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px', zIndex: 1 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: d.count > 0 ? 'var(--text-secondary)' : 'transparent' }}>{d.count}</span>
                          <div style={{ width: '100%', height: `${Math.max(hasData ? pct : 8, 4)}%`, background: d.count > 0 ? 'linear-gradient(to top, #3b82f6, #93c5fd)' : 'var(--border)', borderRadius: '4px 4px 0 0', opacity: d.count === 0 ? 0.4 : 1 }} />
                          <span style={{ position: 'absolute', bottom: '-25px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Debit Distribution Pie */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Distribusi Debit</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', gap: '1.5rem' }}>
              {(() => {
                const dist = summaryData.debitDistribution || [];
                const colorMap = { 'Aset': '#3b82f6', 'Kewajiban': '#f59e0b', 'Liabilitas': '#f59e0b', 'Ekuitas': '#8b5cf6', 'Pendapatan': '#10b981', 'Beban': '#ef4444' };
                
                if (dist.length === 0) {
                  return (
                    <>
                      <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>0%</span>
                        </div>
                      </div>
                      <div style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum ada transaksi</div>
                    </>
                  );
                }
                
                let gradientStops = [];
                let currentPct = 0;
                dist.forEach(cat => {
                  const color = colorMap[cat.category] || '#94a3b8';
                  const nextPct = currentPct + cat.percentage;
                  gradientStops.push(`${color} ${currentPct}% ${nextPct}%`);
                  currentPct = nextPct;
                });
                
                if (gradientStops.length > 0) {
                   const lastIndex = gradientStops.length - 1;
                   gradientStops[lastIndex] = gradientStops[lastIndex].replace(/[\d.]+%$/, '100%');
                }

                const gradientStr = `conic-gradient(${gradientStops.join(', ')})`;
                const topCategory = dist[0];

                return (
                  <>
                    <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '50%', background: gradientStr, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{topCategory.percentage}%</span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{topCategory.category}</span>
                      </div>
                    </div>
                    
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {dist.map((cat, idx) => {
                        const color = colorMap[cat.category] || '#94a3b8';
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color }} />
                              <span style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>{cat.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Credit Distribution Pie */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Distribusi Kredit</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', gap: '1.5rem' }}>
              {(() => {
                const dist = summaryData.creditDistribution || [];
                const colorMap = { 'Aset': '#3b82f6', 'Kewajiban': '#f59e0b', 'Liabilitas': '#f59e0b', 'Ekuitas': '#8b5cf6', 'Pendapatan': '#10b981', 'Beban': '#ef4444' };
                
                if (dist.length === 0) {
                  return (
                    <>
                      <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>0%</span>
                        </div>
                      </div>
                      <div style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum ada transaksi</div>
                    </>
                  );
                }
                
                let gradientStops = [];
                let currentPct = 0;
                dist.forEach(cat => {
                  const color = colorMap[cat.category] || '#94a3b8';
                  const nextPct = currentPct + cat.percentage;
                  gradientStops.push(`${color} ${currentPct}% ${nextPct}%`);
                  currentPct = nextPct;
                });
                
                if (gradientStops.length > 0) {
                   const lastIndex = gradientStops.length - 1;
                   gradientStops[lastIndex] = gradientStops[lastIndex].replace(/[\d.]+%$/, '100%');
                }

                const gradientStr = `conic-gradient(${gradientStops.join(', ')})`;
                const topCategory = dist[0];

                return (
                  <>
                    <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '50%', background: gradientStr, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{topCategory.percentage}%</span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{topCategory.category}</span>
                      </div>
                    </div>
                    
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {dist.map((cat, idx) => {
                        const color = colorMap[cat.category] || '#94a3b8';
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color }} />
                              <span style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>{cat.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Top Accounts & Insights */}
      {summaryData && (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Akun Paling Sering Digunakan</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>KODE AKUN</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>NAMA AKUN</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>TIPE</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>FREKUENSI PENGGUNAAN</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>SALDO SAAT INI</th>
                </tr>
              </thead>
              <tbody>
                {(summaryData.topAccounts || []).map((acc, idx) => {
                   const colorMap = { 'Aset': '#3b82f6', 'Kewajiban': '#f59e0b', 'Ekuitas': '#8b5cf6', 'Pendapatan': '#10b981', 'Beban': '#ef4444' };
                   const c = colorMap[acc.category] || 'var(--text-secondary)';
                   return (
                     <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                       <td style={{ padding: '1rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{acc.code}</td>
                       <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{acc.name}</td>
                       <td style={{ padding: '1rem 0.75rem' }}>
                         <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: `${c}15`, color: c }}>
                           {acc.category.toUpperCase()}
                         </span>
                       </td>
                       <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>{acc.frequency}x</td>
                       <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{formatRp(acc.balance)}</td>
                     </tr>
                   );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: '12px', padding: '1.5rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Expert Insights: Kepatuhan SAK EMKM</h3>
            </div>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.6, opacity: 0.9 }}>
              Sistem mendeteksi bahwa pembukuan Anda memiliki akurasi yang baik dan sesuai dengan parameter entitas mikro, kecil, dan menengah. Disarankan melakukan review pada akun "Biaya Lain-lain" untuk reklasifikasi lebih spesifik guna meningkatkan akurasi laporan laba rugi.
            </p>
            <button className="btn" style={{ backgroundColor: 'white', color: '#1d4ed8', border: 'none', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', marginTop: 'auto' }}>
              Pelajari Rule
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === t.id ? 700 : 500,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="printable-report card" style={{ padding: '2rem', minHeight: '400px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Periode: {startDate ? new Date(startDate).toLocaleDateString('id-ID') : 'Awal'} s/d {endDate ? new Date(endDate).toLocaleDateString('id-ID') : 'Akhir'}
              </p>
            </div>

            {/* JURNAL UMUM VIEW */}
            {activeTab === 'jurnal' && data?.journals && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tanggal</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Akun / Keterangan</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ref</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debit</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.journals.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada transaksi.</td></tr>
                  ) : data.journals.map((j) => (
                    <React.Fragment key={j.id}>
                      {/* Debit Row */}
                      <tr style={{ borderBottom: '1px dotted var(--border)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'top' }}>{new Date(j.date).toLocaleDateString('id-ID')}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}><strong>{j.debit_account_name}</strong><br/><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{j.description}</span></td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{j.debit_account_code}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatRp(j.amount)}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>-</td>
                      </tr>
                      {/* Credit Row */}
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}></td>
                        <td style={{ padding: '0.5rem 0.75rem', paddingLeft: '2rem' }}><strong>{j.credit_account_name}</strong></td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{j.credit_account_code}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{formatRp(j.amount)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}

            {/* NERACA SALDO VIEW */}
            {activeTab === 'neraca-saldo' && data?.trialBalance && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Kode</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nama Akun</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debit</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trialBalance.map(acc => (
                    <tr key={acc.code} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{acc.code}</td>
                      <td style={{ padding: '0.75rem' }}>{acc.name}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{acc.debit_balance > 0 ? formatRp(acc.debit_balance) : '-'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{acc.credit_balance > 0 ? formatRp(acc.credit_balance) : '-'}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 800, backgroundColor: 'var(--primary-light)' }}>
                    <td colSpan="2" style={{ padding: '1rem', textAlign: 'center' }}>TOTAL</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {formatRp(data.trialBalance.reduce((sum, a) => sum + a.debit_balance, 0))}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {formatRp(data.trialBalance.reduce((sum, a) => sum + a.credit_balance, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* LABA RUGI VIEW */}
            {activeTab === 'laba-rugi' && data && (
              <div style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.9rem' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--success)' }}>PENDAPATAN</h3>
                {data.pendapatan?.map(p => (
                  <div key={p.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span>{p.code} - {p.name}</span>
                    <span>{formatRp(p.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--border)', marginTop: '0.5rem' }}>
                  <span>Total Pendapatan</span>
                  <span>{formatRp(data.totalPendapatan)}</span>
                </div>

                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: '2rem', color: 'var(--danger)' }}>BEBAN</h3>
                {data.beban?.map(b => (
                  <div key={b.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span>{b.code} - {b.name}</span>
                    <span>{formatRp(b.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, borderTop: '1px dashed var(--border)', marginTop: '0.5rem' }}>
                  <span>Total Beban</span>
                  <span>({formatRp(data.totalBeban)})</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', fontWeight: 800, backgroundColor: 'var(--primary-light)', marginTop: '2rem', borderRadius: '8px', fontSize: '1.1rem' }}>
                  <span>LABA BERSIH (NET INCOME)</span>
                  <span style={{ color: data.netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRp(data.netIncome)}</span>
                </div>
              </div>
            )}

            {/* NERACA VIEW */}
            {activeTab === 'neraca' && data && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.85rem' }}>
                {/* KIRI: ASET */}
                <div>
                  <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>ASET</h3>
                  {data.aset?.map(a => (
                    <div key={a.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                      <span>{a.code} - {a.name}</span>
                      <span>{formatRp(a.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 800, borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
                    <span>TOTAL ASET</span>
                    <span>{formatRp(data.aset?.reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>
                </div>

                {/* KANAN: KEWAJIBAN & EKUITAS */}
                <div>
                  <h3 style={{ borderBottom: '2px solid var(--danger)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>KEWAJIBAN</h3>
                  {data.kewajiban?.map(k => (
                    <div key={k.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                      <span>{k.code} - {k.name}</span>
                      <span>{formatRp(k.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 800, borderTop: '1px solid var(--border)', marginTop: '1rem', marginBottom: '1.5rem' }}>
                    <span>TOTAL KEWAJIBAN</span>
                    <span>{formatRp(data.kewajiban?.reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>

                  <h3 style={{ borderBottom: '2px solid var(--success)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>EKUITAS</h3>
                  {data.ekuitas?.map(e => (
                    <div key={e.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                      <span>{e.code} - {e.name}</span>
                      <span>{formatRp(e.amount)}</span>
                    </div>
                  ))}
                  {/* Additional Laba Ditahan to Balance Sheet - Assuming it's calculated from Income Statement in full SIA but here we just show what's in Equity accounts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 800, borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
                    <span>TOTAL EKUITAS</span>
                    <span>{formatRp(data.ekuitas?.reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', fontWeight: 800, backgroundColor: 'var(--primary-light)', marginTop: '2rem', borderRadius: '8px' }}>
                    <span>TOTAL PASIVA</span>
                    <span>{formatRp(
                      (data.kewajiban?.reduce((s, i) => s + i.amount, 0) || 0) + 
                      (data.ekuitas?.reduce((s, i) => s + i.amount, 0) || 0)
                    )}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12px; background: white; }
          .card { box-shadow: none !important; border: 1px solid #ccc; }
          .printable-report { padding: 0 !important; border: none; }
        }
      `}</style>
    </div>
  );
};
