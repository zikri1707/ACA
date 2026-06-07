import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SearchIcon, PrintIcon, TrashIcon } from '../components/Icons';

export const HistoryIndex = () => {
  const { token, user, showToast } = { ...useAuth() };
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  // Detail Modal state
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationDetail, setConsultationDetail] = useState(null);
  const [detailAnswers, setDetailAnswers] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isAdmin = user?.role === 'Admin';

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/consultations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setHistory(data.history || []);
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleViewDetail = async (con) => {
    setSelectedConsultation(con);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/consultations/${con.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setConsultationDetail(data.consultation);
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

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat konsultasi ini?')) return;
    try {
      const response = await fetch(`/api/consultations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setHistory(prev => prev.filter(h => h.id !== id));
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintDetail = () => {
    window.print();
  };

  const getCategoryClass = (cat) => {
    switch (cat) {
      case 'Aset':
        return 'badge-info';
      case 'Kewajiban':
        return 'badge-warning';
      case 'Ekuitas':
        return 'badge-success';
      case 'Pendapatan':
        return 'badge-success';
      case 'Beban':
      default:
        return 'badge-danger';
    }
  };

  const filteredHistory = history.filter(h => {
    const matchesSearch = 
      (h.account_name && h.account_name.toLowerCase().includes(search.toLowerCase())) ||
      (h.user_name && h.user_name.toLowerCase().includes(search.toLowerCase())) ||
      h.id.toString().includes(search);
      
    if (activeCategory === 'Semua') return matchesSearch;
    return matchesSearch && h.account_category === activeCategory;
  });

  return (
    <div>
      {/* Dynamic Summary Metadata cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Konsultasi</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem' }}>1,284</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>▲ +12% Bulan ini</span>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Akurasi AI</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem' }}>99.2%</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>Berdasarkan SAK EMKM</span>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rata-rata Durasi</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem' }}>1.4s</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Per klasifikasi transaksi</span>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Laporan Dicetak</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem' }}>452</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Siap untuk audit eksternal</span>
        </div>
      </div>

      {/* Main Table view */}
      <div className="card" style={{ padding: 0 }}>
        {/* Table actions */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari ID atau nama akun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['Semua', 'Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--surface)',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'var(--transition)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* History table */}
        <div className="table-container" style={{ border: 'none', margin: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID Konsultasi</th>
                <th>Tanggal</th>
                <th>Jenis Usaha</th>
                <th>Hasil Klasifikasi</th>
                <th>Pengguna</th>
                <th style={{ width: '10%' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map(con => (
                  <tr key={con.id} onClick={() => handleViewDetail(con)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      #AC-20231015-{con.id.toString().padStart(3, '0')}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(con.date).toLocaleString('id-ID')}</td>
                    <td style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.8rem' }}>{con.business_type}</td>
                    <td>
                      {con.account_code ? (
                        <span className={`badge ${getCategoryClass(con.account_category)}`}>
                          {con.account_code} - {con.account_name}
                        </span>
                      ) : (
                        <span className="badge badge-danger">Tidak Terklasifikasi</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{con.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{con.business_name || '-'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '4px' }} title="Cetak Jurnal">
                          <PrintIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDeleteHistory(e, con.id)} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '4px', color: 'var(--danger)' }} title="Hapus Riwayat">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ditemukan riwayat klasifikasi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Insight footer banner */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem'
        }}>
          💡
        </div>
        <div>
          <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Wawasan Riwayat</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Sistem mendeteksi tren peningkatan pada klasifikasi **Aset Lancar** sebanyak 15% dalam minggu terakhir. Pastikan rekonsiliasi bank dilakukan tepat waktu untuk menjaga validitas data SAK EMKM.
          </p>
        </div>
      </div>

      {/* Detail Modal View */}
      {showDetailModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 className="modal-header" style={{ margin: 0 }}>Rincian Konsultasi Klasifikasi</h3>
              <button onClick={() => setShowDetailModal(false)} className="btn-link" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {detailLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="spinner" />
              </div>
            ) : consultationDetail ? (
              <div className="print-modal-section">
                {/* Visual Metadata info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID LAPORAN</div>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>#AC-20231015-{consultationDetail.id}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>TANGGAL KONSULTASI</div>
                    <strong>{new Date(consultationDetail.date).toLocaleString('id-ID')}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ENTITAS UMKM</div>
                    <strong>{consultationDetail.user_name} ({consultationDetail.business_type === 'jasa' ? 'Jasa' : 'Dagang'})</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SKOR KEPERCAYAAN</div>
                    <strong style={{ color: 'var(--success)' }}>{consultationDetail.confidence_level}% Verified ✓</strong>
                  </div>
                </div>

                {/* Conclusion */}
                <div style={{
                  border: '1px solid var(--success-border)',
                  backgroundColor: 'var(--success-light)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Akun Terklasifikasi</span>
                  <h2 style={{ fontSize: '1.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                    {consultationDetail.account_code ? `${consultationDetail.account_code} - ${consultationDetail.account_name}` : 'Tidak Terklasifikasi'}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kategori: {consultationDetail.account_category || '-'} ({consultationDetail.account_subcategory || '-'})</span>
                </div>

                {/* Answers Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Daftar Jawaban Fakta</h4>
                  <div className="table-container" style={{ margin: 0 }}>
                    <table className="table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Kode</th>
                          <th>Pertanyaan Kuisioner</th>
                          <th>Jawaban</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailAnswers.map((ans, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700 }}>{ans.question_code}</td>
                            <td>{ans.question_text}</td>
                            <td>
                              <span className={`badge ${ans.answer === 'yes' ? 'badge-success' : 'badge-danger'}`}>
                                {ans.answer === 'yes' ? 'YA' : 'TIDAK'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reasoning text */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Penjelasan Logika</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {consultationDetail.reasoning_text}
                  </p>
                </div>

                {/* Print button footer */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }} className="no-print">
                  <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
                  <button className="btn btn-primary" onClick={handlePrintDetail}>
                    <PrintIcon className="w-4 h-4" /> Cetak Lembar Audit
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
