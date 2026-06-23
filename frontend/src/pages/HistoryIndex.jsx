import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { SearchIcon, PrintIcon, TrashIcon } from '../components/Icons';

const CATEGORY_COLORS = {
  'Aset':       { badge: 'badge-info',    dot: '#2563eb', bg: '#eff6ff' },
  'Kewajiban':  { badge: 'badge-warning', dot: '#f59e0b', bg: '#fffbeb' },
  'Liabilitas': { badge: 'badge-warning', dot: '#f59e0b', bg: '#fffbeb' },
  'Ekuitas':    { badge: 'badge-success', dot: '#7c3aed', bg: '#faf5ff' },
  'Pendapatan': { badge: 'badge-success', dot: '#10b981', bg: '#ecfdf5' },
  'Beban':      { badge: 'badge-danger',  dot: '#ef4444', bg: '#fef2f2' },
};
const getCatStyle = (cat = '') => {
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return { badge: 'badge-info', dot: '#64748b', bg: '#f8fafc' };
};

const PAGE_SIZE = 10;

export const HistoryIndex = () => {
  const { token, user, showToast, navigateTo } = useAuth();

  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState(null);

  // Filters
  const [search, setSearch]             = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [businessFilter, setBusinessFilter] = useState('');
  const [page, setPage]                 = useState(1);

  // Detail Modal
  const [showModal, setShowModal]         = useState(false);
  const [detail, setDetail]               = useState(null);
  const [detailAnswers, setDetailAnswers] = useState([]);
  const [detailJournals, setDetailJournals] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const isAdmin = user?.role === 'Admin';

  // ─── Fetch list ───
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/consultations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const list = data.history || [];
        setHistory(list);

        // Compute stats from real data
        const total       = list.length;
        const classified  = list.filter(h => h.journals && h.journals.length > 0).length;
        const avgConf     = total > 0
          ? (list.reduce((s, h) => s + (h.confidence_level || 0), 0) / total).toFixed(1)
          : 0;
        const accuracy    = total > 0 ? ((classified / total) * 100).toFixed(1) : 0;
        setStats({ total, classified, avgConf, accuracy });
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [summaryData, setSummaryData] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/reports/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSummaryData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchHistory(); 
    fetchSummary();
  }, []);

  // ─── View detail ───
  const handleViewDetail = async (con) => {
    setShowModal(true);
    setDetailLoading(true);
    setDetail(null);
    setDetailAnswers([]);
    setDetailJournals([]);
    try {
      const res  = await fetch(`/api/consultations/${con.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDetail(data.consultation);
        setDetailAnswers(data.answers || []);
        setDetailJournals(data.journals || []);
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Delete ───
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Hapus riwayat konsultasi ini?')) return;
    try {
      const res  = await fetch(`/api/consultations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setHistory(prev => {
          const newList = prev.filter(h => h.id !== id);
          const total       = newList.length;
          const classified  = newList.filter(h => h.journals && h.journals.length > 0).length;
          const avgConf     = total > 0
            ? (newList.reduce((s, h) => s + (h.confidence_level || 0), 0) / total).toFixed(1)
            : 0;
          const accuracy    = total > 0 ? ((classified / total) * 100).toFixed(1) : 0;
          setStats({ total, classified, avgConf, accuracy });
          return newList;
        });
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Filter & Paginate ───
  const filtered = useMemo(() => {
    let list = history;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        h.id.toString().includes(q) ||
        (h.account_name && h.account_name.toLowerCase().includes(q)) ||
        (h.user_name    && h.user_name.toLowerCase().includes(q)) ||
        (h.business_name && h.business_name.toLowerCase().includes(q))
      );
    }
    if (activeCategory !== 'Semua') {
      list = list.filter(h => h.account_category && h.account_category.toLowerCase().includes(activeCategory.toLowerCase()));
    }
    if (businessFilter) {
      list = list.filter(h => h.business_type === businessFilter);
    }
    return list;
  }, [history, search, activeCategory, businessFilter]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── KPI Cards (real data) ─── */}
      <div className="grid-cols-2">
        {[
          { label: 'Total Konsultasi',       value: stats?.total ?? '—',        sub: 'Semua riwayat tersimpan',         borderColor: '#2563eb' },
          { label: 'Berhasil Diklasifikasi', value: stats?.classified ?? '—',   sub: `${stats?.accuracy ?? 0}% tingkat keberhasilan`, borderColor: '#10b981', valueColor: '#10b981', subColor: '#10b981' },
        ].map((card, i) => (
          <div key={i} className="card" style={{
            padding: '1.75rem 2rem',
            borderRadius: '16px',
            borderLeft: `6px solid ${card.borderColor}`,
            boxShadow: `0 10px 25px -5px ${card.borderColor}22`,
            display: 'flex', flexDirection: 'column', gap: '0.35rem'
          }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</span>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.25rem 0', color: card.valueColor || 'var(--text-primary)', lineHeight: 1.1 }}>
              {loading ? '…' : card.value}
            </h2>
            <span style={{ fontSize: '0.9rem', color: card.subColor || 'var(--text-secondary)', fontWeight: card.subColor ? 700 : 500 }}>{card.sub}</span>
          </div>
        ))}
      </div>

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

      {/* ─── Filter + Search Bar ─── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <SearchIcon className="w-5 h-5" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari nama akun, pengguna..."
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              style={{ paddingLeft: '42px', fontSize: '0.95rem', paddingTop: '0.7rem', paddingBottom: '0.7rem', borderRadius: '10px' }}
            />
          </div>

          {/* Business type filter */}
          <select
            className="form-control"
            value={businessFilter}
            onChange={e => { setBusinessFilter(e.target.value); resetPage(); }}
            style={{ width: '180px', fontSize: '0.95rem', paddingTop: '0.7rem', paddingBottom: '0.7rem', borderRadius: '10px', fontWeight: 600 }}
          >
            <option value="">Semua Usaha</option>
            <option value="jasa">Usaha Jasa</option>
            <option value="dagang">Usaha Dagang</option>
          </select>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Semua', 'Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'].map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); resetPage(); }}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '999px',
                  border: '1.5px solid',
                  borderColor: activeCategory === cat ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--surface)',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                  transition: 'all 0.15s ease',
                  boxShadow: activeCategory === cat ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                }}
              >{cat}</button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{filtered.length}</span> hasil ditemukan
          </div>
        </div>
      </div>

      {/* ─── Card List ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" />
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Memuat riwayat konsultasi...</p>
          </div>
        ) : paginated.length > 0 ? (
          paginated.map(con => {
            const catStyle = getCatStyle(con.account_category || '');
            const initials = con.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
            const isPosted = con.journals && con.journals.length > 0;
            return (
              <div
                key={con.id}
                onClick={() => handleViewDetail(con)}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${isPosted ? '#10b981' : '#ef4444'}`,
                  borderRadius: '14px',
                  padding: '1.4rem 1.75rem',
                  display: 'flex', alignItems: 'center', gap: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                className="history-card"
              >
                {/* Avatar */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: isPosted
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontWeight: 800, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isPosted ? '0 4px 12px rgba(37,99,235,0.25)' : '0 4px 12px rgba(239,68,68,0.25)',
                  letterSpacing: '0.05em',
                }}>
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {con.user_name}
                    </span>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: con.business_type === 'jasa' ? '#2563eb' : '#7c3aed',
                      backgroundColor: con.business_type === 'jasa' ? '#eff6ff' : '#faf5ff',
                      padding: '0.2rem 0.65rem', borderRadius: '999px',
                      border: `1px solid ${con.business_type === 'jasa' ? '#bfdbfe' : '#ddd6fe'}`,
                      textTransform: 'capitalize',
                    }}>
                      {con.business_type}
                    </span>
                    {con.business_name && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>· {con.business_name}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {new Date(con.date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Account Result */}
                <div style={{ flexShrink: 0, minWidth: '190px', textAlign: 'right' }}>
                  {isPosted ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <div style={{
                        fontWeight: 800, fontSize: '0.78rem', color: '#059669',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }} />
                        Terposting
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.8rem', fontWeight: 700,
                          padding: '0.3rem 0.75rem', borderRadius: '8px',
                          backgroundColor: '#e0f2fe', color: '#0284c7',
                          border: '1px solid #bae6fd',
                        }}>
                          {con.journals[0].debit_category || 'Debit'}
                        </span>
                        <span style={{
                          fontSize: '0.8rem', fontWeight: 700,
                          padding: '0.3rem 0.75rem', borderRadius: '8px',
                          backgroundColor: '#fce7f3', color: '#db2777',
                          border: '1px solid #fbcfe8',
                        }}>
                          {con.journals[0].credit_category || 'Kredit'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      fontSize: '0.82rem', fontWeight: 700,
                      color: '#ef4444', backgroundColor: '#fef2f2',
                      padding: '0.35rem 0.85rem', borderRadius: '8px',
                      border: '1px solid #fecaca',
                    }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                      Tidak Terklasifikasi
                    </div>
                  )}
                </div>

                {/* Confidence */}
                <div style={{
                  flexShrink: 0, textAlign: 'center', minWidth: '80px',
                  padding: '0.5rem 0.75rem', borderRadius: '12px',
                  backgroundColor: con.confidence_level >= 80 ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${con.confidence_level >= 80 ? '#a7f3d0' : '#fde68a'}`,
                }}>
                  <div style={{
                    fontSize: '1.4rem', fontWeight: 800, lineHeight: 1,
                    color: con.confidence_level >= 80 ? '#10b981' : '#f59e0b',
                  }}>
                    {con.confidence_level}%
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>confidence</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => { e.stopPropagation(); handleViewDetail(con); }}
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700 }}
                    title="Lihat Detail"
                  >
                    Detail
                  </button>
                  <button
                    onClick={e => handleDelete(e, con.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.55rem 0.75rem', borderRadius: '10px', color: 'var(--danger)', border: '1px solid var(--border)' }}
                    title="Hapus"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📂</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Tidak ada riwayat ditemukan</h3>
            <p style={{ fontSize: '0.9rem' }}>Coba ubah filter pencarian atau mulai konsultasi baru.</p>
            <button onClick={() => navigateTo('consultation')} className="btn btn-primary" style={{ marginTop: '1.5rem', fontSize: '0.95rem', padding: '0.65rem 1.5rem' }}>
              Mulai Konsultasi →
            </button>
          </div>
        )}
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', opacity: page === 1 ? 0.4 : 1 }}
          >← Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: '36px', height: '36px', borderRadius: '8px',
                border: '1px solid',
                borderColor: page === p ? 'var(--primary)' : 'var(--border)',
                backgroundColor: page === p ? 'var(--primary)' : 'var(--surface)',
                color: page === p ? 'white' : 'var(--text-secondary)',
                fontWeight: page === p ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >{p}</button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', opacity: page === totalPages ? 0.4 : 1 }}
          >Next →</button>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {showModal && (
        <div className="modal-overlay-print" style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          animation: 'fadeInOverlay 0.2s ease'
        }}>
          <div className="modal-content-print" style={{
            width: '100%', maxWidth: '680px', margin: '1rem',
            borderRadius: '20px', backgroundColor: 'var(--surface)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
            maxHeight: '90vh', overflowY: 'auto',
            animation: 'slideUpModal 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Modal header */}
            <div className="no-print" style={{
              padding: '1.5rem 1.75rem', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.1rem' }}>Rincian Konsultasi</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {detail ? `#CON-${String(detail.id).padStart(4, '0')} · ${new Date(detail.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}` : '—'}
                </p>
              </div>
              <button
                className="no-print"
                onClick={() => setShowModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'var(--text-muted)' }}
              >✕</button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              {detailLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', flexDirection: 'column', gap: '1rem' }}>
                  <div className="spinner" />
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Memuat detail...</p>
                </div>
              ) : detail ? (
                <>
                  {(() => {
                    const journal = detailJournals && detailJournals.length > 0 ? detailJournals[0] : null;
                    const debitDisplay = journal ? `${journal.debit_account_code} — ${journal.debit_account_name}` : '';
                    const creditDisplay = journal ? `${journal.credit_account_code} — ${journal.credit_account_name}` : '';
                    const category = journal ? (journal.debit_category || journal.credit_category || 'Akuntansi') : '';
                    const specificAccount = journal ? (journal.debit_account_name || 'Akun') : '';
                    const amountFormatted = journal ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(journal.amount) : '';

                    return (
                      <>
                        {/* PRINT ONLY HEADER */}
                        <div className="print-header" style={{ display: 'none' }}>
                          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#111827' }}>
                            ACA Advisor - Lembar Hasil Audit Konsultasi
                          </h1>
                          <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0.25rem 0 1.5rem 0', borderBottom: '2px solid #111827', paddingBottom: '0.75rem' }}>
                            Sistem Pakar Klasifikasi Akun Akuntansi SAK EMKM Terotomatisasi
                          </p>
                        </div>

                        {/* Result banner */}
                        {journal ? (
                          <div style={{
                            borderRadius: '14px', padding: '1.25rem 1.5rem',
                            background: `linear-gradient(135deg, #eff6ff, #f8fafc)`,
                            border: `1px solid #bfdbfe`,
                            marginBottom: '1.5rem', textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Jurnal Berpasangan Terposting</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Terposting
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="badge" style={{ fontSize: '0.65rem', backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>{journal.debit_category || 'Debit'}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1d4ed8' }}>{debitDisplay}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="badge" style={{ fontSize: '0.65rem', backgroundColor: '#fce7f3', color: '#db2777', border: '1px solid #fbcfe8' }}>{journal.credit_category || 'Kredit'}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#be185d' }}>{creditDisplay}</span>
                              </div>
                            </div>
                            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{detail.confidence_level}%</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Confidence</div>
                              </div>
                              <div style={{ width: '1px', backgroundColor: 'var(--border)' }} />
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'capitalize' }}>{detail.business_type}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Jenis Usaha</div>
                              </div>
                              <div style={{ width: '1px', backgroundColor: 'var(--border)' }} />
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed' }}>{detailAnswers.length}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pertanyaan</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ borderRadius: '14px', padding: '1.25rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>❌</div>
                            <div style={{ fontWeight: 700, color: '#ef4444' }}>Tidak Terklasifikasi</div>
                            <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '0.25rem' }}>Sistem tidak menemukan aturan yang cocok</div>
                          </div>
                        )}

                        {/* Meta info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }} className="meta-grid-print">
                          {[
                            { label: 'Pengguna',     value: detail.user_name },
                            { label: 'Nama Usaha',   value: detail.business_name || '—' },
                            { label: 'Tanggal',      value: new Date(detail.date).toLocaleString('id-ID') },
                            { label: 'ID Konsultasi', value: `#CON-${String(detail.id).padStart(4,'0')}` },
                          ].map((item, i) => (
                            <div key={i} style={{ backgroundColor: 'var(--background)', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid var(--border)' }} className="meta-card-print">
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{item.label}</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Kesimpulan & Rekomendasi Akuntansi */}
                        <div style={{ marginBottom: '1.5rem' }} className="printable-section">
                          <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            Kesimpulan & Rekomendasi Akuntansi
                          </h4>
                          <div style={{
                            background: 'linear-gradient(135deg, var(--surface), var(--background))',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                          }} className="recommendation-box-print">
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Kesimpulan</div>
                              <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                                {journal ? (
                                  <>Berdasarkan hasil analisis sistem pakar, transaksi ini terklasifikasi ke dalam kelompok <strong>{category}</strong> dengan akun spesifik <strong>{specificAccount}</strong>.</>
                                ) : (
                                  <>Transaksi tidak dapat terklasifikasi ke dalam standar akun SAK EMKM karena tidak memenuhi kondisi logika dalam basis aturan pakar yang aktif.</>
                                )}
                              </p>
                            </div>
                            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }} className="rec-title-print">Rekomendasi Pencatatan (SAK EMKM)</div>
                              <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                                {journal ? (
                                  <>Jurnal entry yang direkomendasikan adalah mencatat penambahan/pengurangan di sisi <strong>Debit pada {debitDisplay}</strong> dan menyeimbangkannya di sisi <strong>Kredit pada {creditDisplay}</strong> sebesar <strong>{amountFormatted}</strong>. Perlakuan ini telah sepenuhnya sesuai dengan standar akuntansi keuangan entitas mikro (SAK EMKM) yang berlaku.</>
                                ) : (
                                  <>Silakan periksa kembali jawaban kuesioner Anda atau hubungi admin/senior akuntan untuk memperbarui basis pengetahuan aturan pakar jika transaksi ini seharusnya terklasifikasi.</>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Answers */}
                        {detailAnswers.length > 0 && (
                          <div style={{ marginBottom: '1.5rem' }} className="printable-section">
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                              Jawaban Kuesioner ({detailAnswers.length} fakta)
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="answers-list-print">
                              {detailAnswers.map((ans, i) => (
                                <div key={i} style={{
                                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                                  padding: '0.7rem 1rem',
                                  backgroundColor: ans.answer === 'yes' ? '#f0fdf4' : '#fef2f2',
                                  border: `1px solid ${ans.answer === 'yes' ? '#bbf7d0' : '#fecaca'}`,
                                  borderRadius: '10px'
                                }} className="answer-item-print">
                                  <span style={{ fontSize: '1rem', flexShrink: 0 }} className="no-print">{ans.answer === 'yes' ? '✅' : '❌'}</span>
                                  <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.35rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>{ans.question_code}</span>
                                    {ans.question_text}
                                  </div>
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
                                    color: ans.answer === 'yes' ? '#16a34a' : '#ef4444',
                                    backgroundColor: ans.answer === 'yes' ? '#dcfce7' : '#fee2e2',
                                    padding: '0.15rem 0.6rem', borderRadius: '999px'
                                  }} className="badge-print">
                                    {ans.answer === 'yes' ? 'YA' : 'TIDAK'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reasoning */}
                        {detail.reasoning_text && (
                          <div style={{ marginBottom: '1.5rem' }} className="printable-section">
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                              Penjelasan Logika Sistem
                            </h4>
                            <div style={{
                              background: 'linear-gradient(135deg, rgba(37,99,235,0.02), rgba(124,58,237,0.02))',
                              borderRadius: '12px',
                              padding: '1.25rem',
                              border: '1px solid var(--border)',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.65,
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.01)'
                            }} className="reasoning-box-print">
                              {detail.reasoning_text}
                            </div>
                          </div>
                        )}

                        {/* PRINT ONLY SIGNATURE */}
                        <div className="print-signature" style={{ display: 'none' }}>
                          <div className="print-signature-box">
                            <p style={{ margin: 0 }}>Pengguna / Pemilik UMKM</p>
                            <div className="print-signature-line" style={{ borderTop: '1px solid #111827', marginTop: '4.5rem', paddingTop: '0.4rem', fontWeight: 700 }}>
                              {detail.user_name}
                            </div>
                          </div>
                          <div className="print-signature-box">
                            <p style={{ margin: 0 }}>Sistem Inferensi Pakar ACA</p>
                            <div className="print-signature-line" style={{ borderTop: '1px dashed #4b5563', marginTop: '4.5rem', paddingTop: '0.4rem', fontWeight: 700, color: '#4b5563' }}>
                              Verified Digital Audit ✓
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                          <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ fontWeight: 600 }}>Tutup</button>
                          <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                            <PrintIcon className="w-4 h-4" /> Cetak Lembar Audit
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .history-card:hover {
          border-color: var(--primary) !important;
          box-shadow: 0 4px 16px rgba(37,99,235,0.1) !important;
          transform: translateY(-1px);
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media print {
          /* Hide sidebar, navbar, buttons, and backdrop shadows */
          aside, nav, header, .no-print, button, .sidebar-toggle {
            display: none !important;
          }
          .app-container, .main-content {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            display: block !important;
          }
          
          /* Stretch modal to full page */
          .modal-overlay-print {
            position: relative !important;
            display: block !important;
            background: none !important;
            backdrop-filter: none !important;
            z-index: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          .modal-content-print {
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }

          /* Show Print Only elements */
          .print-header {
            display: block !important;
          }
          .print-signature {
            display: flex !important;
            justify-content: space-between;
            margin-top: 4rem;
            page-break-inside: avoid;
          }
          .print-signature-box {
            text-align: center;
            width: 240px;
          }
          
          /* Style clean printable blocks */
          .recommendation-box-print {
            background: #f9fafb !important;
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            color: black !important;
          }
          .rec-title-print {
            color: #1d4ed8 !important;
          }
          .reasoning-box-print {
            background: #f9fafb !important;
            border: 1px solid #d1d5db !important;
            color: black !important;
          }
          .meta-grid-print {
            grid-template-columns: 1fr 1fr !important;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 1rem;
          }
          .meta-card-print {
            border: 1px solid #e5e7eb !important;
            background: #f9fafb !important;
          }
          .answer-item-print {
            border: 1px solid #e5e7eb !important;
            background: #ffffff !important;
            page-break-inside: avoid;
          }
          .badge-print {
            border: 1px solid #9ca3af !important;
            color: black !important;
            background: white !important;
          }
          .printable-section {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};
