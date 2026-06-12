import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrintIcon } from '../components/Icons';

// ─── Color palette for categories ───
const CATEGORY_COLORS = {
  'Aset': '#2563eb',
  'Liabilitas': '#f59e0b',
  'Ekuitas': '#7c3aed',
  'Pendapatan': '#10b981',
  'Beban': '#ef4444',
  'default': '#64748b'
};

const getCategoryColor = (name = '') => {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return CATEGORY_COLORS.default;
};

// ─── Donut chart from real category data ───
const DonutChart = ({ categories, total }) => {
  if (!categories || categories.length === 0 || total === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
        <p style={{ fontSize: '0.8rem' }}>Belum ada data distribusi kategori.</p>
      </div>
    );
  }

  let offset = 0;
  const arcs = categories.slice(0, 5).map(cat => {
    const pct = (cat.value / total) * 100;
    const arc = { ...cat, pct: pct.toFixed(1), offset, color: getCategoryColor(cat.name) };
    offset += pct;
    return arc;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '150px', height: '150px' }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border)" strokeWidth="3.5" />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx="18" cy="18" r="15.915"
              fill="none"
              stroke={arc.color}
              strokeWidth="3.5"
              strokeDasharray={`${arc.pct} ${100 - parseFloat(arc.pct)}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>konsultasi</div>
        </div>
      </div>

      <div style={{ width: '100%', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {arcs.map((arc, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: arc.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arc.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, marginLeft: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: arc.color }}>{arc.pct}%</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({arc.value}x)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Stat KPI Card ───
const KpiCard = ({ label, value, sub, color, icon }) => (
  <div className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{
      position: 'absolute', top: '-12px', right: '-12px',
      width: '70px', height: '70px', borderRadius: '50%',
      backgroundColor: color + '18'
    }} />
    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{sub}</div>}
  </div>
);

export const ReportsIndex = () => {
  const { token, user, showToast } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [businessType, setBusinessType] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (businessType) params.append('business_type', businessType);

      const response = await fetch(`/api/reports/analytics?${params}`, {
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
  }, [token, businessType]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleExportPDF = () => window.print();

  const agg = data?.aggregates || { total: 0, classifiedCount: 0, unclassifiedCount: 0, averageConfidence: 0, categories: [], accounts: [] };
  const consultations = data?.consultations || [];

  const bulanIndo = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: bulanIndo[d.getMonth()]
    };
  });

  // Build monthly data from consultations
  const monthlyCounts = {};
  consultations.forEach(c => {
    const m = c.date ? c.date.substring(0, 7) : null;
    if (m) monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;
  });
  const chartData = last6.map(s => ({ label: s.label, count: monthlyCounts[s.key] || 0 }));
  const maxChart = Math.max(...chartData.map(d => d.count), 1);

  // Top accounts from aggregates
  const topAccounts = agg.accounts
    ? [...agg.accounts].sort((a, b) => b.count - a.count).slice(0, 5)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── Header Bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.2rem' }}>Laporan & Analitik</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Data konsultasi akuntansi berdasarkan database sistem</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="no-print">
          <select
            className="form-control"
            value={businessType}
            onChange={e => setBusinessType(e.target.value)}
            style={{ width: '200px', fontSize: '0.85rem' }}
          >
            <option value="">Semua Jenis Usaha</option>
            <option value="jasa">Usaha Jasa</option>
            <option value="dagang">Usaha Dagang</option>
          </select>
          <button
            onClick={handleExportPDF}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            <PrintIcon className="w-4 h-4" /> Ekspor PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner" />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Memuat data laporan...</p>
        </div>
      ) : (
        <>
          {/* ─── KPI Cards ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <KpiCard
              label="Total Konsultasi"
              value={agg.total.toLocaleString('id-ID')}
              sub={businessType ? `Filter: UMKM ${businessType}` : 'Semua jenis usaha'}
              color="#2563eb" icon="📋"
            />
            <KpiCard
              label="Berhasil Diklasifikasi"
              value={agg.classifiedCount.toLocaleString('id-ID')}
              sub={`${agg.total > 0 ? ((agg.classifiedCount / agg.total) * 100).toFixed(1) : 0}% dari total`}
              color="#10b981" icon="✅"
            />
            <KpiCard
              label="Tidak Terklasifikasi"
              value={agg.unclassifiedCount.toLocaleString('id-ID')}
              sub={`${agg.total > 0 ? ((agg.unclassifiedCount / agg.total) * 100).toFixed(1) : 0}% dari total`}
              color="#ef4444" icon="⚠️"
            />
            <KpiCard
              label="Rata-rata Keyakinan"
              value={`${agg.averageConfidence}%`}
              sub="Confidence score rata-rata"
              color="#7c3aed" icon="🎯"
            />
          </div>

          {/* ─── Main Grid ─── */}
          <div className="layout-main-side">

            {/* LEFT: Chart + Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Trend Chart */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.1rem' }}>Tren Konsultasi Bulanan</h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {businessType ? `UMKM ${businessType.charAt(0).toUpperCase() + businessType.slice(1)}` : 'Semua jenis usaha'} · 6 bulan terakhir
                    </p>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Real-time</span>
                </div>

                <div style={{ position: 'relative', height: '180px', marginBottom: '0.75rem' }}>
                  {[75, 50, 25].map(pct => (
                    <div key={pct} style={{
                      position: 'absolute', left: 0, right: 0, bottom: `${pct}%`,
                      borderTop: '1px dashed var(--border)', zIndex: 0
                    }} />
                  ))}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: '0.6rem', paddingBottom: '1px' }}>
                    {chartData.map((d, i) => {
                      const pct = Math.round((d.count / maxChart) * 100);
                      const isMax = d.count === maxChart && d.count > 0;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px', zIndex: 1 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isMax ? '#2563eb' : (d.count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)'), opacity: d.count > 0 ? 1 : 0.4 }}>
                            {d.count}
                          </span>
                          <div style={{
                            width: '100%',
                            height: `${Math.max(d.count > 0 ? pct : 5, 4)}%`,
                            background: isMax ? 'linear-gradient(to top, #1d4ed8, #60a5fa)' : (d.count > 0 ? 'linear-gradient(to top, #3b82f6, #93c5fd)' : 'var(--border)'),
                            borderRadius: '6px 6px 0 0',
                            opacity: d.count === 0 ? 0.4 : 1
                          }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  {chartData.map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d.label}</div>
                  ))}
                </div>
              </div>

              {/* Top Accounts Table */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.1rem' }}>Akun Paling Sering Diklasifikasi</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Berdasarkan frekuensi hasil konsultasi dari database</p>
                </div>

                {topAccounts.length > 0 ? (
                  <div>
                    {topAccounts.map((acc, i) => {
                      const pct = agg.classifiedCount > 0 ? Math.round((acc.count / agg.classifiedCount) * 100) : 0;
                      return (
                        <div key={i} style={{
                          padding: '0.9rem 1.5rem',
                          borderBottom: i < topAccounts.length - 1 ? '1px solid var(--border)' : 'none',
                          display: 'flex', alignItems: 'center', gap: '1rem'
                        }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            backgroundColor: i === 0 ? '#fef9c3' : 'var(--background)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 800,
                            color: i === 0 ? '#ca8a04' : 'var(--text-muted)',
                            flexShrink: 0
                          }}>
                            {i === 0 ? '🥇' : i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.name}
                            </div>
                            <div style={{ marginTop: '0.3rem', height: '5px', backgroundColor: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(to right, #2563eb, #60a5fa)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{acc.count}x</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pct}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                    <p style={{ fontSize: '0.85rem' }}>Belum ada data klasifikasi akun.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Donut + Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Donut Chart */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.1rem' }}>Distribusi Kategori Akun</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Proporsi dari hasil konsultasi nyata</p>
                </div>
                <DonutChart categories={agg.categories} total={agg.classifiedCount} />
              </div>

              {/* SAK EMKM Insight */}
              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #7c3aed 100%)',
                padding: '1.5rem',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(37,99,235,0.3)'
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />

                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 800 }}>Insight SAK EMKM</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                      { label: 'Tingkat Keberhasilan', val: `${agg.total > 0 ? ((agg.classifiedCount / agg.total) * 100).toFixed(1) : 0}%`, color: '#6ee7b7' },
                      { label: 'Rata-rata Confidence', val: `${agg.averageConfidence}%`, color: '#93c5fd' },
                      { label: 'Total Transaksi Dianalisis', val: agg.total.toLocaleString('id-ID'), color: '#e9d5ff' }
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#93c5fd', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                    {agg.classifiedCount > 0
                      ? `Sistem berhasil mengklasifikasikan ${agg.classifiedCount} dari ${agg.total} transaksi sesuai standar SAK EMKM.`
                      : 'Belum ada data konsultasi. Mulai konsultasi untuk melihat laporan analitik.'}
                  </p>
                </div>
              </div>

              {/* Recent raw list */}
              {consultations.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '1rem' }}>Konsultasi Terakhir</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {consultations.slice(0, 4).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                          backgroundColor: c.account_name ? 'var(--success)' : 'var(--danger)'
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.account_name || 'Tidak Terklasifikasi'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {c.business_type} · {new Date(c.date).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                          {c.confidence_level}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12px; }
        }
      `}</style>
    </div>
  );
};
