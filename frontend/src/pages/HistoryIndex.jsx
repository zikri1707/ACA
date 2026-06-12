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
        const classified  = list.filter(h => h.account_code).length;
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

  useEffect(() => { fetchHistory(); }, []);

  // ─── View detail ───
  const handleViewDetail = async (con) => {
    setShowModal(true);
    setDetailLoading(true);
    setDetail(null);
    setDetailAnswers([]);
    try {
      const res  = await fetch(`/api/consultations/${con.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDetail(data.consultation);
        setDetailAnswers(data.answers || []);
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
        setHistory(prev => prev.filter(h => h.id !== id));
        setStats(prev => {
          if (!prev) return prev;
          const wasClassified = history.find(h => h.id === id)?.account_code;
          const total      = prev.total - 1;
          const classified = wasClassified ? prev.classified - 1 : prev.classified;
          const accuracy   = total > 0 ? ((classified / total) * 100).toFixed(1) : 0;
          return { ...prev, total, classified, accuracy };
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
      <div className="grid-cols-4">
        {[
          { label: 'Total Konsultasi',      value: stats?.total ?? '—',        sub: 'Semua riwayat tersimpan',         color: '#2563eb', icon: '📋' },
          { label: 'Berhasil Diklasifikasi',value: stats?.classified ?? '—',   sub: `${stats?.accuracy ?? 0}% tingkat keberhasilan`, color: '#10b981', icon: '✅' },
          { label: 'Rata-rata Keyakinan',   value: `${stats?.avgConf ?? 0}%`,  sub: 'Confidence score rata-rata',      color: '#7c3aed', icon: '🎯' },
          { label: 'Akurasi Klasifikasi',   value: `${stats?.accuracy ?? 0}%`, sub: 'Berdasarkan SAK EMKM',            color: '#f59e0b', icon: '📊' },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: card.color + '18' }} />
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{loading ? '...' : card.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Filter + Search Bar ─── */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari nama akun, pengguna..."
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Business type filter */}
          <select
            className="form-control"
            value={businessFilter}
            onChange={e => { setBusinessFilter(e.target.value); resetPage(); }}
            style={{ width: '160px', fontSize: '0.85rem' }}
          >
            <option value="">Semua Usaha</option>
            <option value="jasa">Usaha Jasa</option>
            <option value="dagang">Usaha Dagang</option>
          </select>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['Semua', 'Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'].map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); resetPage(); }}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: activeCategory === cat ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--surface)',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >{cat}</button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {filtered.length} hasil ditemukan
          </div>
        </div>
      </div>

      {/* ─── Card List ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Memuat riwayat konsultasi...</p>
          </div>
        ) : paginated.length > 0 ? (
          paginated.map(con => {
            const catStyle = getCatStyle(con.account_category || '');
            const initials = con.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
            return (
              <div
                key={con.id}
                onClick={() => handleViewDetail(con)}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '1.1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
                className="history-card"
              >
                {/* Avatar */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: con.account_code
                    ? `linear-gradient(135deg, ${catStyle.dot}cc, ${catStyle.dot})`
                    : 'linear-gradient(135deg, #94a3b8, #64748b)',
                  color: 'white', fontWeight: 800, fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: `0 2px 8px ${catStyle.dot}40`
                }}>
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {con.user_name}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--background)', padding: '0.1rem 0.5rem', borderRadius: '999px', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                      {con.business_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(con.date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {con.business_name && ` · ${con.business_name}`}
                  </div>
                </div>

                {/* Account Result */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '160px' }}>
                  {con.account_code ? (
                    <>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: catStyle.dot }}>{con.account_name}</div>
                      <span className={`badge ${catStyle.badge}`} style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                        {con.account_code} · {con.account_category}
                      </span>
                    </>
                  ) : (
                    <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>Tidak Terklasifikasi</span>
                  )}
                </div>

                {/* Confidence */}
                <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '60px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: con.confidence_level >= 80 ? '#10b981' : '#f59e0b' }}>
                    {con.confidence_level}%
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>confidence</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => { e.stopPropagation(); handleViewDetail(con); }}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600 }}
                    title="Lihat Detail"
                  >
                    Detail
                  </button>
                  <button
                    onClick={e => handleDelete(e, con.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--danger)' }}
                    title="Hapus"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tidak ada riwayat ditemukan</h3>
            <p style={{ fontSize: '0.82rem' }}>Coba ubah filter pencarian atau mulai konsultasi baru.</p>
            <button onClick={() => navigateTo('consultation')} className="btn btn-primary" style={{ marginTop: '1.25rem', fontSize: '0.82rem' }}>
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
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          animation: 'fadeInOverlay 0.2s ease'
        }}>
          <div style={{
            width: '100%', maxWidth: '680px', margin: '1rem',
            borderRadius: '20px', backgroundColor: 'var(--surface)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
            maxHeight: '90vh', overflowY: 'auto',
            animation: 'slideUpModal 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Modal header */}
            <div style={{
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
                  {/* Result banner */}
                  {detail.account_code ? (
                    <div style={{
                      borderRadius: '14px', padding: '1.25rem 1.5rem',
                      background: `linear-gradient(135deg, ${getCatStyle(detail.account_category).dot}18, ${getCatStyle(detail.account_category).dot}08)`,
                      border: `1px solid ${getCatStyle(detail.account_category).dot}33`,
                      marginBottom: '1.5rem', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Hasil Klasifikasi Akun</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: getCatStyle(detail.account_category).dot }}>
                        {detail.account_code} — {detail.account_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                        {detail.account_category} {detail.account_subcategory ? `· ${detail.account_subcategory}` : ''}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'Pengguna',     value: detail.user_name },
                      { label: 'Nama Usaha',   value: detail.business_name || '—' },
                      { label: 'Tanggal',      value: new Date(detail.date).toLocaleString('id-ID') },
                      { label: 'ID Konsultasi', value: `#CON-${String(detail.id).padStart(4,'0')}` },
                    ].map((item, i) => (
                      <div key={i} style={{ backgroundColor: 'var(--background)', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{item.label}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Answers */}
                  {detailAnswers.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Jawaban Kuesioner ({detailAnswers.length} fakta)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {detailAnswers.map((ans, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.7rem 1rem',
                            backgroundColor: ans.answer === 'yes' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${ans.answer === 'yes' ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '10px'
                          }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ans.answer === 'yes' ? '✅' : '❌'}</span>
                            <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.35rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>{ans.question_code}</span>
                              {ans.question_text}
                            </div>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
                              color: ans.answer === 'yes' ? '#16a34a' : '#ef4444',
                              backgroundColor: ans.answer === 'yes' ? '#dcfce7' : '#fee2e2',
                              padding: '0.15rem 0.6rem', borderRadius: '999px'
                            }}>
                              {ans.answer === 'yes' ? 'YA' : 'TIDAK'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  {detail.reasoning_text && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Penjelasan Logika Sistem
                      </h4>
                      <div style={{ backgroundColor: 'var(--background)', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {detail.reasoning_text}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ fontWeight: 600 }}>Tutup</button>
                    <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      <PrintIcon className="w-4 h-4" /> Cetak Lembar Audit
                    </button>
                  </div>
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
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};
