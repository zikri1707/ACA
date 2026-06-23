import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrintIcon } from '../components/Icons';

// Stat card icon components
const IconConsultation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconAccuracy = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconConfidence = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconRules = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="13" y2="15"/>
  </svg>
);

const StatCard = ({ label, value, sub, subColor, borderColor, valueColor }) => (
  <div className="card" style={{
    padding: '1.75rem 2rem',
    borderRadius: '16px',
    borderLeft: `6px solid ${borderColor}`,
    boxShadow: `0 10px 25px -5px ${borderColor}22`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  }}>
    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.25rem 0', color: valueColor || 'var(--text-primary)', lineHeight: 1.1 }}>{value}</h2>
    <span style={{ fontSize: '0.9rem', color: subColor || 'var(--text-secondary)', fontWeight: subColor ? 700 : 500 }}>{sub}</span>
  </div>
);


export const DashboardPage = () => {
  const { token, navigateTo, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Detail Modal States
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailAnswers, setDetailAnswers] = useState([]);
  const [detailJournals, setDetailJournals] = useState([]);

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

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/reports/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (response.ok) setData(res);
      else showToast(res.message, 'danger');
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Memuat data dashboard...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalConsultations: 0, totalRules: 0, totalAccounts: 0,
    classifiedCount: 0, accuracyRate: 0, avgConfidence: 0,
    thisMonth: 0, growthPct: 0
  };
  const recentConsultations = data?.recentConsultations || [];
  const monthlyData = data?.charts?.monthly || [];

  const growthPositive = stats.growthPct >= 0;
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── Stats Row ─── */}
      <div className="grid-cols-2 no-print">
        <StatCard
          label="Total Konsultasi"
          value={stats.totalConsultations.toLocaleString('id-ID')}
          sub={`${stats.thisMonth} konsultasi bulan ini`}
          borderColor="#2563eb"
        />
        <StatCard
          label="Rule Pakar Aktif"
          value={stats.totalRules}
          sub="Siap untuk klasifikasi"
          borderColor="#ea580c"
        />
      </div>

      {/* ─── Main Layout ─── */}
      <div className="layout-main-side no-print">

        {/* LEFT: Chart + Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Bar Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.15rem' }}>Aktivitas Konsultasi</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {monthlyData.length > 0 ? 'Data konsultasi per bulan dari database' : 'Mulai konsultasi untuk melihat grafik aktivitas'}
                </p>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>6 Bulan Terakhir</span>
            </div>

            {(() => {
              // Get last 6 months labels
              const bulanIndo = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
              const now = new Date();
              const last6 = Array.from({ length: 6 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                return {
                  key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                  label: bulanIndo[d.getMonth()]
                };
              });

              // Map DB data to the 6 slots
              const chartData = last6.map(slot => {
                const found = monthlyData.find(m => m.month === slot.key);
                return { label: slot.label, count: found ? found.count : 0 };
              });

              const maxVal = Math.max(...chartData.map(d => d.count), 1);
              const hasData = chartData.some(d => d.count > 0);

              return (
                <div>
                  {/* Y-axis guides + bars */}
                  <div style={{ position: 'relative', height: '200px', marginBottom: '0.75rem' }}>
                    {/* Horizontal guide lines */}
                    {[100, 75, 50, 25].map(pct => (
                      <div key={pct} style={{
                        position: 'absolute', left: 0, right: 0,
                        bottom: `${pct}%`,
                        borderTop: '1px dashed var(--border)',
                        zIndex: 0
                      }} />
                    ))}

                    {/* Bars */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'flex-end',
                      gap: '0.6rem', paddingBottom: '1px'
                    }}>
                      {chartData.map((d, idx) => {
                        const pct = hasData ? Math.round((d.count / maxVal) * 100) : 0;
                        const isMax = d.count === maxVal && hasData;
                        return (
                          <div key={idx} style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                            gap: '4px', position: 'relative', zIndex: 1
                          }}>
                            {/* Value label */}
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 700,
                              color: isMax ? '#2563eb' : (d.count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)'),
                              opacity: d.count > 0 ? 1 : 0.4
                            }}>
                              {d.count}
                            </span>
                            {/* Bar */}
                            <div style={{
                              width: '100%',
                              height: `${Math.max(hasData ? pct : 8, 4)}%`,
                              background: isMax
                                ? 'linear-gradient(to top, #1d4ed8, #60a5fa)'
                                : (d.count > 0
                                  ? 'linear-gradient(to top, #3b82f6, #93c5fd)'
                                  : 'var(--border)'),
                              borderRadius: '6px 6px 0 0',
                              transition: 'height 0.5s ease',
                              opacity: d.count === 0 ? 0.4 : 1
                            }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-axis labels */}
                  <div style={{ display: 'flex', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    {chartData.map((d, idx) => (
                      <div key={idx} style={{
                        flex: 1, textAlign: 'center',
                        fontSize: '0.7rem', fontWeight: 600,
                        color: 'var(--text-muted)'
                      }}>
                        {d.label}
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(to top, #3b82f6, #93c5fd)' }} />
                    <span>Jumlah Konsultasi</span>
                    {!hasData && (
                      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        — Belum ada konsultasi yang tercatat
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Recent Consultations Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.1rem' }}>Konsultasi Terbaru</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>5 riwayat klasifikasi akun terakhir</p>
              </div>
              <button className="btn btn-secondary" onClick={() => navigateTo('history')} style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}>
                Lihat Semua →
              </button>
            </div>

            {recentConsultations.length > 0 ? (
              <div>
                {recentConsultations.map((con, idx) => (
                  <div key={con.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem',
                    borderBottom: idx < recentConsultations.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--background)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleViewDetail(con)}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 800, fontSize: '0.85rem'
                    }}>
                      {con.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {con.user_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        UMKM {con.business_type} · {new Date(con.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Result Account */}
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '150px' }}>
                      {(con.journals && con.journals.length > 0) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Terposting
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <span className="badge" style={{ fontSize: '0.62rem', backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              {con.journals[0].debit_category || 'Debit'}
                            </span>
                            <span className="badge" style={{ fontSize: '0.62rem', backgroundColor: '#fce7f3', color: '#db2777', border: '1px solid #fbcfe8', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              {con.journals[0].credit_category || 'Kredit'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>Tidak Terklasifikasi</span>
                      )}
                    </div>

                    {/* Status dot */}
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: (con.journals && con.journals.length > 0) ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                <p style={{ fontSize: '0.85rem' }}>Belum ada riwayat konsultasi.</p>
                <button onClick={() => navigateTo('consultation')} className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                  Mulai Konsultasi Pertama →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Quick Actions + Banner + System */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Quick Access */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Akses Cepat</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Konsultasi Baru', icon: '➕', page: 'consultation', primary: true },
                { label: 'Riwayat Konsultasi', icon: '🕐', page: 'history' },
                { label: 'Basis Pengetahuan', icon: '⚙️', page: 'rules' },
              ].map(item => (
                <button key={item.page} onClick={() => navigateTo(item.page)} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem', borderRadius: '12px',
                  border: item.primary ? 'none' : '1.5px solid var(--border)',
                  background: item.primary ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'var(--surface)',
                  color: item.primary ? 'white' : 'var(--text-primary)',
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.18s',
                  boxShadow: item.primary ? '0 4px 14px rgba(37,99,235,0.3)' : '0 1px 4px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => { if (!item.primary) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; } }}
                onMouseLeave={e => { if (!item.primary) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SAK EMKM Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #7c3aed 100%)',
            borderRadius: '16px', padding: '2rem',
            boxShadow: '0 6px 24px rgba(37,99,235,0.3)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* decorative circles */}
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />

            <div style={{ position: 'relative' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#bfdbfe', display: 'block', marginBottom: '0.65rem' }}>
                ✦ Update Terbaru
              </span>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', lineHeight: 1.3, marginBottom: '0.75rem' }}>
                Standar SAK EMKM 2024 Aktif
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#93c5fd', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Sistem telah mendukung regulasi terbaru untuk pencatatan akuntansi UMKM.
              </p>
              <button onClick={() => navigateTo('rules')} style={{
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                border: 'none', backgroundColor: 'white', color: '#1d4ed8',
                fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                Pelajari Basis Pengetahuan →
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Status Sistem</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', boxShadow: '0 0 0 3px #dcfce7' }} />
                Semua Sistem Normal
              </div>
            </div>
            {[
              { label: 'Basis Pengetahuan', value: `${stats.totalRules} rule`, ok: stats.totalRules > 0 }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: 'none' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: item.ok ? '#16a34a' : 'var(--danger)' }}>
                  {item.ok ? '✓ ' : '✕ '}{item.value}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

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
                            <div className="no-print" style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
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
