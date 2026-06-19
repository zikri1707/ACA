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
      else if (activeTab === 'kesehatan-bisnis') endpoint = '/api/reports/business-health';

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
    { id: 'neraca', label: 'Neraca (Posisi Keuangan)' },
    { id: 'kesehatan-bisnis', label: 'Kesehatan Bisnis' }
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

            {/* KESEHATAN BISNIS VIEW */}
            {activeTab === 'kesehatan-bisnis' && data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Row 1: Overall Health Gauge and Recommendation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'stretch' }}>
                  {/* Health Gauge Card */}
                  <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--background)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kesehatan Finansial</span>
                    
                    {/* Circle Progress Meter */}
                    <div style={{ position: 'relative', width: '130px', height: '130px', margin: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="65" cy="65" r="55" fill="none" stroke="var(--border)" strokeWidth="10" />
                        <circle cx="65" cy="65" r="55" fill="none" 
                                stroke={data.color === 'success' ? '#10b981' : data.color === 'danger' ? '#ef4444' : data.color === 'warning' ? '#f59e0b' : '#94a3b8'} 
                                strokeWidth="10" 
                                strokeDasharray={2 * Math.PI * 55}
                                strokeDashoffset={2 * Math.PI * 55 * (1 - (data.score || 0) / 100)}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.score}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>Skor / 100</span>
                      </div>
                    </div>

                    <span style={{ 
                      display: 'inline-block',
                      backgroundColor: data.color === 'success' ? 'var(--success-light)' : data.color === 'danger' ? 'var(--danger-light)' : data.color === 'warning' ? '#fef3c7' : 'var(--background)',
                      color: data.color === 'success' ? 'var(--success)' : data.color === 'danger' ? 'var(--danger)' : data.color === 'warning' ? '#d97706' : 'var(--text-secondary)',
                      padding: '0.4rem 1.25rem',
                      borderRadius: '2rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      border: `1px solid ${data.color === 'success' ? 'rgba(16, 185, 129, 0.2)' : data.color === 'danger' ? 'rgba(239, 68, 68, 0.2)' : data.color === 'warning' ? 'rgba(217, 119, 6, 0.2)' : 'var(--border)'}`
                    }}>
                      {data.status}
                    </span>
                  </div>

                  {/* Recommendation Card */}
                  <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '12px', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      💡 Rekomendasi Sistem Pakar (SAK EMKM)
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {data.recommendation}
                    </p>
                  </div>
                </div>

                {/* Row 2: Ratios cards grid */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', color: 'var(--text-primary)' }}>Indikator Rasio Keuangan Utama</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    
                    {/* Current Ratio Card */}
                    <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rasio Lancar (Current Ratio)</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Aset Lancar / Kewajiban Lancar</span>
                        </div>
                        <span className="badge" style={{ 
                          backgroundColor: data.facts.currentRatioStatus === 'sehat' ? 'var(--success-light)' : 'var(--danger-light)', 
                          color: data.facts.currentRatioStatus === 'sehat' ? 'var(--success)' : 'var(--danger)',
                          fontSize: '0.68rem', fontWeight: 700 
                        }}>
                          {data.facts.currentRatioStatus === 'sehat' ? 'Sehat' : 'Kurang'}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{Number(data.ratios.currentRatio).toFixed(2)}x</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &ge; 1.50x</span>
                      </div>
                    </div>

                    {/* Cash Ratio Card */}
                    <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rasio Kas (Cash Ratio)</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Kas & Bank / Kewajiban Lancar</span>
                        </div>
                        <span className="badge" style={{ 
                          backgroundColor: data.facts.cashRatioStatus === 'aman' ? 'var(--success-light)' : 'var(--danger-light)', 
                          color: data.facts.cashRatioStatus === 'aman' ? 'var(--success)' : 'var(--danger)',
                          fontSize: '0.68rem', fontWeight: 700 
                        }}>
                          {data.facts.cashRatioStatus === 'aman' ? 'Aman' : 'Kritis'}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{Number(data.ratios.cashRatio).toFixed(2)}x</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &ge; 0.50x</span>
                      </div>
                    </div>

                    {/* NPM Card */}
                    <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Margin Laba Bersih (NPM)</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Laba Bersih / Total Pendapatan</span>
                        </div>
                        <span className="badge" style={{ 
                          backgroundColor: data.facts.npmStatus === 'sehat' ? 'var(--success-light)' : data.facts.npmStatus === 'rendah' ? '#fef3c7' : 'var(--danger-light)', 
                          color: data.facts.npmStatus === 'sehat' ? 'var(--success)' : data.facts.npmStatus === 'rendah' ? '#d97706' : 'var(--danger)',
                          fontSize: '0.68rem', fontWeight: 700 
                        }}>
                          {data.facts.npmStatus === 'sehat' ? 'Sehat' : data.facts.npmStatus === 'rendah' ? 'Rendah' : 'Rugi'}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{(Number(data.ratios.npm) * 100).toFixed(1)}%</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &ge; 10.0%</span>
                      </div>
                    </div>

                    {/* OER Card */}
                    <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rasio Efisiensi Beban (OER)</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Beban / Pendapatan</span>
                        </div>
                        <span className="badge" style={{ 
                          backgroundColor: data.facts.expenseRatioStatus === 'efisien' ? 'var(--success-light)' : 'var(--danger-light)', 
                          color: data.facts.expenseRatioStatus === 'efisien' ? 'var(--success)' : 'var(--danger)',
                          fontSize: '0.68rem', fontWeight: 700 
                        }}>
                          {data.facts.expenseRatioStatus === 'efisien' ? 'Efisien' : 'Boros'}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{(Number(data.ratios.oer) * 100).toFixed(1)}%</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &lt; 80.0%</span>
                      </div>
                    </div>

                    {/* DER Card */}
                    <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Debt-to-Equity Ratio (DER)</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Kewajiban / Ekuitas</span>
                        </div>
                        <span className="badge" style={{ 
                          backgroundColor: data.facts.derStatus === 'aman' ? 'var(--success-light)' : 'var(--danger-light)', 
                          color: data.facts.derStatus === 'aman' ? 'var(--success)' : 'var(--danger)',
                          fontSize: '0.68rem', fontWeight: 700 
                        }}>
                          {data.facts.derStatus === 'aman' ? 'Aman' : 'Tinggi'}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{Number(data.ratios.der).toFixed(2)}x</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target: &lt; 1.00x</span>
                      </div>
                    </div>

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
