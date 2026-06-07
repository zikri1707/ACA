import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PrintIcon } from '../components/Icons';

export const ReportsIndex = () => {
  const { token, showToast } = useAuth();
  const [periode, setPeriode] = useState('Januari 2024 - Desember 2024');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (response.ok) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div>
      {/* Filters and Export Button */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            className="form-control" 
            value={periode} 
            onChange={(e) => setPeriode(e.target.value)}
            style={{ width: '260px', fontWeight: 600 }}
          >
            <option value="Januari 2024 - Desember 2024">Januari 2024 - Desember 2024</option>
            <option value="Kuartal I 2024">Kuartal I 2024</option>
            <option value="Kuartal II 2024">Kuartal II 2024</option>
            <option value="Kuartal III 2024">Kuartal III 2024</option>
            <option value="Kuartal IV 2024">Kuartal IV 2024</option>
          </select>
        </div>

        <button onClick={handleExportPDF} className="btn btn-primary no-print">
          <PrintIcon className="w-4 h-4" /> Ekspor PDF
        </button>
      </div>

      {/* KPI Value Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Card 1: Total Assets */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TOTAL ASSETS</div>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: 'var(--primary)' }}>Rp428M</h2>
          <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700 }}>▲ +12.4% vs LY</span>
        </div>

        {/* Card 2: Liabilities */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>LIABILITIES</div>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: 'var(--warning)' }}>Rp152M</h2>
          <span style={{ fontSize: '0.65rem', color: 'var(--warning)', fontWeight: 700 }}>▲ +4.1% vs LY</span>
        </div>

        {/* Card 3: Equity */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>EQUITY</div>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#7c3aed' }}>Rp276M</h2>
          <span style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 700 }}>Stable Growth</span>
        </div>

        {/* Card 4: Revenue */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>REVENUE</div>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: 'var(--success)' }}>Rp84M</h2>
          <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700 }}>▲ +8.2% MoM</span>
        </div>

        {/* Card 5: Expenses */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>EXPENSES</div>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: 'var(--danger)' }}>Rp32M</h2>
          <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700 }}>Within Budget</span>
        </div>
      </div>

      {/* Main Analysis grid split */}
      <div className="layout-main-side">
        {/* Left Column: Trend / Distributions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Trend chart card */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">Trend Konsultasi Sistem</div>
            <div style={{ height: '200px', display: 'flex', alignItems: 'end', justifyContent: 'space-between', padding: '1rem 0' }}>
              {[35, 52, 45, 68, 80, 75, 92, 85].map((val, idx) => (
                <div key={idx} style={{ width: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: `${val * 1.5}px`, backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Frequent Accounts list */}
          <div className="card">
            <div className="card-title">Akun Paling Sering Digunakan</div>
            <div className="table-container" style={{ border: 'none', margin: 0 }}>
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Tipe</th>
                    <th>Frekuensi Penggunaan</th>
                    <th style={{ textAlign: 'right' }}>Saldo Saat Ini (Demo)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: '1-101', name: 'Kas dan Setara Kas', type: 'ASET', freq: '1,248x', balance: 'Rp128.500.000' },
                    { code: '2-101', name: 'Utang Usaha', type: 'LIABILITY', freq: '856x', balance: 'Rp45.000.000' },
                    { code: '4-101', name: 'Pendapatan Penjualan', type: 'REVENUE', freq: '612x', balance: 'Rp240.200.000' },
                    { code: '5-101', name: 'Beban Gaji Karyawan', type: 'EXPENSE', freq: '420x', balance: 'Rp12.000.000' }
                  ].map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{row.code}</td>
                      <td style={{ fontWeight: 600 }}>{row.name}</td>
                      <td>
                        <span className={`badge ${row.type === 'ASET' ? 'badge-info' : row.type === 'LIABILITY' ? 'badge-warning' : row.type === 'REVENUE' ? 'badge-success' : 'badge-danger'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.freq}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Donut Dist & SAK EMKM insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Donut chart card */}
          <div className="card">
            <div className="card-title">Distribusi Kategori</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
              {/* Custom SVG Donut Chart */}
              <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border)" strokeWidth="4" />
                  
                  {/* Arc Aset: 40% (stroke-dasharray="40 60") */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--primary)" strokeWidth="4" 
                          strokeDasharray="40 60" strokeDashoffset="0" />
                  
                  {/* Arc Liability: 30% (stroke-dasharray="30 70", offset=40) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning)" strokeWidth="4" 
                          strokeDasharray="30 70" strokeDashoffset="-40" />

                  {/* Arc Equity: 15% (stroke-dasharray="15 85", offset=70) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#7c3aed" strokeWidth="4" 
                          strokeDasharray="15 85" strokeDashoffset="-70" />

                  {/* Arc Others: 15% (stroke-dasharray="15 85", offset=85) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--danger)" strokeWidth="4" 
                          strokeDasharray="15 85" strokeDashoffset="-85" />
                </svg>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center', fontSize: '1rem', fontWeight: 800
                }}>
                  86%
                </div>
              </div>

              {/* Legend details */}
              <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div className="flex-between">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                    Aset
                  </span>
                  <strong>40%</strong>
                </div>
                <div className="flex-between">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                    Liability
                  </span>
                  <strong>30%</strong>
                </div>
                <div className="flex-between">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
                    Equity
                  </span>
                  <strong>15%</strong>
                </div>
                <div className="flex-between">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                    Others
                  </span>
                  <strong>15%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SAK EMKM compliance recommendation banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: 800 }}>Expert Insights: Kepatuhan SAK EMKM</h4>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: '#bfdbfe', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Sistem mendeteksi <strong>98.4%</strong> transaksi telah sesuai dengan parameter entitas mikro, kecil, dan menengah. Disarankan melakukan review pada akun 'Biaya Lain-lain' untuk reklasifikasi lebih spesifik guna meningkatkan akurasi laporan laba rugi.
            </p>

            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem', border: 'none', color: '#2563eb', fontWeight: 700, backgroundColor: 'white' }}>
              Pelajari Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
