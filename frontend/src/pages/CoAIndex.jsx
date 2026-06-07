import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../components/Icons';

export const CoAIndex = () => {
  const { token, user, showToast } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  
  // CRUD Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form fields
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Aset');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = user?.role === 'Admin';

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const url = `/api/accounts?search=${encodeURIComponent(search)}&category=${encodeURIComponent(categoryFilter)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.accounts || []);
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat Chart of Accounts.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAccounts();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, name, category, subcategory, description })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setShowAddModal(false);
        resetForm();
        fetchAccounts();
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan akun.', 'danger');
    }
  };

  const handleEditClick = (acc) => {
    if (!isAdmin) return;
    setSelectedAccountId(acc.id);
    setCode(acc.code);
    setName(acc.name);
    setCategory(acc.category);
    setSubcategory(acc.subcategory || '');
    setDescription(acc.description || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/accounts/${selectedAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, name, category, subcategory, description })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setShowEditModal(false);
        resetForm();
        fetchAccounts();
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui akun.', 'danger');
    }
  };

  const handleDeleteClick = (acc) => {
    if (!isAdmin) return;
    setSelectedAccountId(acc.id);
    setName(acc.name);
    setCode(acc.code);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/accounts/${selectedAccountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setShowDeleteModal(false);
        setSelectedAccountId(null);
        fetchAccounts();
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus akun.', 'danger');
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setCategory('Aset');
    setSubcategory('');
    setDescription('');
    setSelectedAccountId(null);
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Aset':
        return 'badge-info';
      case 'Kewajiban':
        return 'badge-warning';
      case 'Ekuitas':
        return 'badge-success'; // Violet class simulated as success/green for visual variance
      case 'Pendapatan':
        return 'badge-success';
      case 'Beban':
      default:
        return 'badge-danger';
    }
  };

  return (
    <div>
      {/* Top action header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Chart of Accounts</h1>
          <p>Kelola dan klasifikasikan struktur keuangan bisnis Anda berdasarkan standar SAK EMKM.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn btn-primary">
            <PlusIcon className="w-4 h-4" /> Tambah Akun Baru
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Cari Kode atau Nama Akun..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Cari</button>
          </form>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {['Semua', 'Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  backgroundColor: categoryFilter === cat ? 'var(--primary)' : 'var(--surface)',
                  color: categoryFilter === cat ? 'white' : 'var(--text-secondary)',
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
      </div>

      {/* Main accounts table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none', margin: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Kode Akun</th>
                <th style={{ width: '25%' }}>Nama Akun</th>
                <th style={{ width: '15%' }}>Kategori</th>
                <th style={{ width: '35%' }}>Deskripsi</th>
                {isAdmin && <th style={{ width: '10%', textAlignment: 'right' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : accounts.length > 0 ? (
                accounts.map(acc => (
                  <tr key={acc.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{acc.code}</td>
                    <td style={{ fontWeight: 600 }}>{acc.name}</td>
                    <td>
                      <span className={`badge ${getCategoryBadgeClass(acc.category)}`}>
                        {acc.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{acc.description || '-'}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditClick(acc)} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '4px' }} title="Edit Akun">
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteClick(acc)} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '4px', color: 'var(--danger)' }} title="Hapus Akun">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ditemukan akun akuntansi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info stats */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Menampilkan {accounts.length} dari {accounts.length} Akun Standar
          </span>
        </div>
      </div>

      {/* Mock Footer Cards matching mockups */}
      <div className="grid-cols-2" style={{ marginTop: '2rem' }}>
        {/* Left footer card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Nilai Aset UMKM (Demo)</span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', color: 'var(--primary)' }}>Rp 450.2M</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.25rem' }}>
            ▲ +2.4% dari bulan lalu
          </span>
        </div>

        {/* Right footer callout card */}
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Validasi Rule Base</h4>
            <p style={{ fontSize: '0.75rem', color: '#bfdbfe', lineHeight: 1.4 }}>
              Struktur akun Anda saat ini 100% kompatibel dengan SAK EMKM. Sistem pakar tidak menemukan adanya anomali klasifikasi.
            </p>
          </div>
          <div style={{ fontSize: '2.5rem', marginLeft: '1rem' }}>🛡️</div>
        </div>
      </div>

      {/* Modal: Add Account */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleAddSubmit} className="modal-content">
            <h3 className="modal-header">Tambah Akun Baru</h3>
            <div className="form-group">
              <label className="form-label">Kode Akun *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 1-1000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Akun *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Kas Utama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kategori *</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Aset">Aset</option>
                  <option value="Kewajiban">Kewajiban</option>
                  <option value="Ekuitas">Ekuitas</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Beban">Beban</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-Kategori</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Kas & Setara Kas"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea
                className="form-control"
                placeholder="Keterangan mengenai peruntukan akun..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan Akun</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Account */}
      {showEditModal && (
        <div className="modal-overlay">
          <form onSubmit={handleEditSubmit} className="modal-content">
            <h3 className="modal-header">Edit Akun Akuntansi</h3>
            <div className="form-group">
              <label className="form-label">Kode Akun *</label>
              <input
                type="text"
                className="form-control"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Akun *</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kategori *</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Aset">Aset</option>
                  <option value="Kewajiban">Kewajiban</option>
                  <option value="Ekuitas">Ekuitas</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Beban">Beban</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-Kategori</label>
                <input
                  type="text"
                  className="form-control"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Perbarui Akun</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Account */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 className="modal-header">Konfirmasi Hapus</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
              Apakah Anda yakin ingin menghapus akun <strong>{code} - {name}</strong>? Tindakan ini akan menghapus akun secara permanen dari sistem.
            </p>
            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Hapus Akun</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
