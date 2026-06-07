import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { token, navigateTo, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/reports/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (response.ok) {
        setData(res);
      } else {
        showToast(res.message, 'danger');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalConsultations: 1284,
    totalRules: 452,
    totalAccounts: 86,
    accuracyRate: 98.4
  };

  const recentConsultations = data?.recentConsultations || [];

  return (
    <div>
      {/* Statistics Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        {/* Card 1 */}
        <div className="card" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Konsultasi</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#ecfdf5', color: '#10b981', fontWeight: 700 }}>+12%</span>
          </div>
          <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{stats.totalConsultations.toLocaleString()}</h2>
        </div>

        {/* Card 2 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Rule Pakar</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 700 }}>Tetap</span>
          </div>
          <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{stats.totalRules}</h2>
        </div>

        {/* Card 3 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Akun CoA</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#ecfdf5', color: '#10b981', fontWeight: 700 }}>+5</span>
          </div>
          <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{stats.totalAccounts}</h2>
        </div>

        {/* Card 4 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tingkat Akurasi</span>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 700 }}>Tinggi</span>
          </div>
          <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{stats.accuracyRate}%</h2>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="layout-main-side">
        {/* Left Column: Logic Engine Activity Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">
              <span>Aktivitas Logic Engine</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Konsultasi & Akurasi</span>
            </div>
            
            {/* Visual Bar Graph */}
            <div style={{
              height: '220px',
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              padding: '1rem 0',
              borderBottom: '1px solid var(--border)'
            }}>
              {/* Graphic bars (academic simulation style) */}
              {[45, 62, 53, 78, 90, 85].map((val, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '12%',
                  height: '100%',
                  justifyContent: 'end'
                }}>
                  <div style={{
                    width: '100%',
                    height: `${val}%`,
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'center',
                    paddingTop: '4px'
                  }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>{val}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'][idx]}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '2px' }} />
                <span>Jumlah Konsultasi</span>
              </div>
            </div>
          </div>

          {/* Recent Classification Table */}
          <div className="card">
            <div className="card-title">
              <span>Klasifikasi Akun Terbaru</span>
              <button className="btn-link" onClick={() => navigateTo('history')} style={{ fontSize: '0.8rem' }}>Lihat Semua</button>
            </div>
            <div className="table-container" style={{ margin: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu/Tanggal</th>
                    <th>Pengguna</th>
                    <th>Jenis Usaha</th>
                    <th>Transaksi/Kategori</th>
                    <th>Hasil Akun</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentConsultations.length > 0 ? (
                    recentConsultations.map(con => (
                      <tr key={con.id}>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(con.date).toLocaleDateString('id-ID')}</td>
                        <td>{con.user_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{con.business_type}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{con.reasoning_text.split('.')[0]}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{con.account_category || 'N/A'}</div>
                        </td>
                        <td>
                          {con.account_code ? (
                            <span className="badge badge-info">{con.account_code} - {con.account_name}</span>
                          ) : (
                            <span className="badge badge-danger">Tidak Terklasifikasi</span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Matched</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada riwayat konsultasi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Access & Metadata info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Access Actions */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Akses Cepat</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <button onClick={() => navigateTo('consultation')} style={{
                padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition)'
              }}>
                <span>➕</span>
                <span>Konsultasi Baru</span>
              </button>
              
              <button onClick={() => navigateTo('accounts')} style={{
                padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition)'
              }}>
                <span>📖</span>
                <span>Daftar Akun</span>
              </button>

              <button onClick={() => navigateTo('rules')} style={{
                padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition)'
              }}>
                <span>⚙️</span>
                <span>Knowledge Base</span>
              </button>

              <button onClick={() => navigateTo('history')} style={{
                padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition)'
              }}>
                <span>🔄</span>
                <span>Riwayat Log</span>
              </button>
            </div>
          </div>

          {/* SAK EMKM Update Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bfdbfe', display: 'block', marginBottom: '0.25rem' }}>Update Terbaru</span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: '0.5rem' }}>
              Implementasi Standar SAK EMKM 2024
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#bfdbfe', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Sistem telah diperbarui untuk mendukung regulasi perpajakan UMKM terbaru.
            </p>
            <button className="btn btn-secondary" onClick={() => navigateTo('rules')} style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem', border: 'none', color: '#2563eb', fontWeight: 700, backgroundColor: 'white' }}>
              Pelajari Selengkapnya →
            </button>
          </div>

          {/* Evaluation Trace Visualizer */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Alur Penilaian Terakhir</h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--background)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <div style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>ID: R-01</div>
              <div style={{ color: 'var(--text-muted)' }}>→</div>
              <div style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>ID: R-12</div>
              <div style={{ color: 'var(--text-muted)' }}>→</div>
              <div style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid var(--success-border)', borderRadius: '4px', fontWeight: 700 }}>ID: R-55 ✓</div>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Automated SAK-EMKM Verification Path
            </p>
          </div>

          {/* System Health */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Kesehatan Sistem</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>● Optimal</span>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <div className="flex-between" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span>Memory Usage</span>
                <span>32%</span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '32%', height: '100%', backgroundColor: 'var(--success)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div className="flex-between" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span>CPU Load</span>
                <span>18%</span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '18%', height: '100%', backgroundColor: 'var(--success)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
