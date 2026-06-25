import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, CloseIcon, CheckIcon } from '../components/Icons';

// Eye Icon for View Details action
const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CATEGORY_THEMES = {
  'Aset': {
    color: '#2563eb', // Blue
    bg: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.2)',
    badgeClass: 'badge-info',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    shadow: 'rgba(37, 99, 235, 0.15)'
  },
  'Kewajiban': {
    color: '#d97706', // Amber
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.2)',
    badgeClass: 'badge-warning',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    shadow: 'rgba(217, 119, 6, 0.15)'
  },
  'Ekuitas': {
    color: '#7c3aed', // Purple/Violet
    bg: 'rgba(124, 58, 237, 0.08)',
    border: 'rgba(124, 58, 237, 0.2)',
    badgeClass: 'badge-success',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    shadow: 'rgba(124, 58, 237, 0.15)'
  },
  'Pendapatan': {
    color: '#059669', // Emerald
    bg: 'rgba(5, 150, 105, 0.08)',
    border: 'rgba(5, 150, 105, 0.2)',
    badgeClass: 'badge-success',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    shadow: 'rgba(5, 150, 105, 0.15)'
  },
  'Beban': {
    color: '#dc2626', // Red
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.2)',
    badgeClass: 'badge-danger',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    shadow: 'rgba(220, 38, 38, 0.15)'
  }
};

export const CoAIndex = () => {
  const { token, user, showToast } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real database stats
  const [stats, setStats] = useState({
    Aset: 0,
    Kewajiban: 0,
    Ekuitas: 0,
    Pendapatan: 0,
    Beban: 0
  });

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  
  // CRUD Modals state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form fields / Selected item
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Aset');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');

  // Info details & usage checks
  const [detailAccount, setDetailAccount] = useState(null);
  const [detailUsage, setDetailUsage] = useState(null);
  const [loadingDetailUsage, setLoadingDetailUsage] = useState(false);

  const [deleteUsage, setDeleteUsage] = useState(null);
  const [checkingDeleteUsage, setCheckingDeleteUsage] = useState(false);

  const isAdmin = user?.role === 'Admin';

  // Fetch real database counts per category (unfiltered baseline)
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        const counts = { Aset: 0, Kewajiban: 0, Ekuitas: 0, Pendapatan: 0, Beban: 0 };
        (data.accounts || []).forEach(acc => {
          if (counts[acc.category] !== undefined) {
            counts[acc.category]++;
          }
        });
        setStats(counts);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

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

  // Run on mount
  useEffect(() => {
    fetchStats();
  }, [token]);

  // Run when category filter changes
  useEffect(() => {
    fetchAccounts();
  }, [categoryFilter, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAccounts();
  };

  const handleClearSearch = () => {
    setSearch('');
    setLoading(true);
    fetch(`/api/accounts?search=&category=${encodeURIComponent(categoryFilter)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAccounts(data.accounts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleDetailClick = async (acc) => {
    setDetailAccount(acc);
    setShowDetailModal(true);
    setLoadingDetailUsage(true);
    setDetailUsage(null);
    try {
      const response = await fetch(`/api/accounts/${acc.id}/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDetailUsage(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetailUsage(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (validationError) {
      showToast('Form tidak valid. Selesaikan warning terlebih dahulu.', 'warning');
      return;
    }
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
        fetchStats();
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
    if (validationError) {
      showToast('Form tidak valid. Selesaikan warning terlebih dahulu.', 'warning');
      return;
    }
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
        fetchStats();
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui akun.', 'danger');
    }
  };

  const handleDeleteClick = async (acc) => {
    if (!isAdmin) return;
    setSelectedAccountId(acc.id);
    setName(acc.name);
    setCode(acc.code);
    setShowDeleteModal(true);
    setCheckingDeleteUsage(true);
    setDeleteUsage(null);
    try {
      const response = await fetch(`/api/accounts/${acc.id}/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDeleteUsage(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingDeleteUsage(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteUsage?.inUse) {
      showToast('Akun ini sedang aktif digunakan dan tidak dapat dihapus.', 'warning');
      return;
    }
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
        fetchStats();
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

  // Group accounts by category dynamically
  const groupedAccounts = useMemo(() => {
    const groups = {
      'Aset': [],
      'Kewajiban': [],
      'Ekuitas': [],
      'Pendapatan': [],
      'Beban': []
    };
    accounts.forEach(acc => {
      if (groups[acc.category]) {
        groups[acc.category].push(acc);
      }
    });
    return groups;
  }, [accounts]);

  // Compute total active accounts from DB stats
  const totalDbAccounts = useMemo(() => {
    return Object.values(stats).reduce((a, b) => a + b, 0);
  }, [stats]);

  // Real-time frontend validation rules for inputs
  const getCategoryPrefix = (cat) => {
    switch (cat) {
      case 'Aset': return '1';
      case 'Kewajiban': return '2';
      case 'Ekuitas': return '3';
      case 'Pendapatan': return '4';
      case 'Beban': return '5';
      default: return '';
    }
  };

  const validationError = useMemo(() => {
    if (!code) return '';
    
    // Check pattern: must match number-number (e.g. 1-1000)
    if (!/^\d+-\d+$/.test(code)) {
      return 'Format kode harus berupa angka dipisah strip (contoh: 1-1000)';
    }
    
    // Check starting category prefix logic
    const prefix = getCategoryPrefix(category);
    if (prefix && !code.startsWith(`${prefix}-`)) {
      return `Kode untuk kategori "${category}" harus diawali dengan "${prefix}-" (contoh: ${prefix}-XXXX)`;
    }
    
    // Check duplication in state (excluding current edited account)
    const duplicate = accounts.find(acc => acc.code === code && acc.id !== selectedAccountId);
    if (duplicate) {
      return `Kode akun "${code}" sudah terdaftar pada akun "${duplicate.name}"`;
    }
    
    return '';
  }, [code, category, accounts, selectedAccountId]);

  // Subcategory suggestions autocomplete based on category
  const subcategorySuggestions = useMemo(() => {
    switch (category) {
      case 'Aset':
        return ['Kas & Setara Kas', 'Bank', 'Piutang Usaha', 'Persediaan', 'Peralatan Kantor', 'Kendaraan', 'Aset Lancar Lainnya', 'Aset Tetap'];
      case 'Kewajiban':
        return ['Hutang Usaha', 'Hutang Pajak', 'Hutang Bank', 'Hutang Lancar Lainnya', 'Kewajiban Jangka Panjang'];
      case 'Ekuitas':
        return ['Modal Pemilik', 'Prive Pemilik', 'Laba Ditahan', 'Modal Disetor'];
      case 'Pendapatan':
        return ['Pendapatan Penjualan', 'Pendapatan Jasa', 'Pendapatan Bunga', 'Pendapatan Lain-lain'];
      case 'Beban':
        return ['Beban Gaji', 'Beban Listrik & Air', 'Beban Sewa Kantor', 'Beban Internet', 'Beban Transportasi', 'Beban ATK', 'Beban Promosi', 'Beban Penyusutan', 'Beban Administrasi'];
      default:
        return [];
    }
  }, [category]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Inline styles for gorgeous animations & hover details */}
      <style>{`
        @keyframes coaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes coaSlideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: coaFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: coaSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .coa-stat-card {
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .coa-stat-card:hover {
          transform: translateY(-3px);
        }
        .clear-search-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        .clear-search-btn:hover {
          background-color: var(--border);
          color: var(--text-primary);
        }
        
        /* Interactive Action Buttons Styling */
        .action-group {
          display: flex;
          gap: 0.375rem;
          justify-content: flex-end;
          align-items: center;
        }
        .action-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border);
          background-color: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .action-btn:hover {
          transform: translateY(-1.5px);
          background-color: var(--background);
          color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
        }
        .action-btn-danger:hover {
          color: var(--danger);
          border-color: var(--danger);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.12);
        }
        
        /* CSS-only Premium Tooltips */
        .action-tooltip {
          position: relative;
        }
        .action-tooltip::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background-color: #0f172a;
          color: #ffffff;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          z-index: 99;
          letter-spacing: 0.02em;
        }
        .action-tooltip:hover::after {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      {/* Top action header */}
      <div className="page-header">
        <div className="page-title">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.50rem' }}>
            <span>Struktur Akun (CoA)</span>
          </h1>
          <p>Kelola dan klasifikasikan struktur akun akuntansi standar SAK EMKM untuk memetakan hasil konsultasi AI.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }} 
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.25rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)',
              borderRadius: '8px'
            }}
          >
            <PlusIcon className="w-4 h-4" /> Tambah Akun Baru
          </button>
        )}
      </div>

      {/* Real database KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {Object.entries(CATEGORY_THEMES).map(([catName, theme]) => {
          const count = stats[catName] || 0;
          const percent = totalDbAccounts > 0 ? Math.round((count / totalDbAccounts) * 100) : 0;
          return (
            <div 
              key={catName} 
              className="card coa-stat-card"
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${theme.color}`,
                boxShadow: `0 4px 20px rgba(0, 0, 0, 0.02)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {catName}
                </span>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: theme.bg,
                  color: theme.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  {percent}%
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: 1 }}>
                  {count}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Akun Terdaftar
                </span>
              </div>

              {/* Progress Line */}
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--border)',
                borderRadius: '2px',
                marginTop: '1rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: theme.gradient,
                  borderRadius: '2px',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Cari Kode, Nama, atau Deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: search ? '36px' : '12px', borderRadius: '8px', fontSize: '0.875rem' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="clear-search-btn"
                  title="Reset Pencarian"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}
            >
              Cari
            </button>
          </form>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {['Semua', 'Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'].map(cat => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '0.45rem 1.1rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: active ? 'var(--primary)' : 'var(--surface)',
                    color: active ? 'white' : 'var(--text-secondary)',
                    boxShadow: active ? '0 4px 10px rgba(37, 99, 235, 0.15)' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'var(--transition)'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grouped Accounts List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
        <div className="table-container" style={{ border: 'none', margin: 0, borderRadius: 0 }}>
          <table className="table" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--background)' }}>
                <th style={{ width: '15%', padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700 }}>Kode Akun</th>
                <th style={{ width: '28%', padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700 }}>Nama Akun</th>
                <th style={{ width: '20%', padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700 }}>Sub-Kategori</th>
                <th style={{ width: '25%', padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700 }}>Deskripsi</th>
                <th style={{ width: '12%', padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : accounts.length > 0 ? (
                Object.entries(groupedAccounts).map(([category, items]) => {
                  if (items.length === 0) return null;
                  const theme = CATEGORY_THEMES[category] || CATEGORY_THEMES['Aset'];
                  
                  return (
                    <React.Fragment key={category}>
                      {/* Category Separator Header */}
                      <tr>
                        <td 
                          colSpan={5} 
                          style={{
                            backgroundColor: theme.bg,
                            borderLeft: `4px solid ${theme.color}`,
                            padding: '0.75rem 1.25rem',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            color: theme.color,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{category}</span>
                            <span className="badge" style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.5)',
                              color: theme.color,
                              border: `1px solid ${theme.border}`,
                              padding: '0.15rem 0.5rem',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '4px'
                            }}>
                              {items.length} Akun
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Items under this category */}
                      {items.map(acc => (
                        <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {acc.code}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {acc.name}
                          </td>
                          <td>
                            <span className="badge" style={{
                              backgroundColor: 'var(--background)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'none'
                            }}>
                              {acc.subcategory || '-'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {acc.description || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Tidak ada deskripsi</span>}
                          </td>
                          <td>
                            <div className="action-group">
                              {/* View Details button (Visible to all users) */}
                              <button
                                onClick={() => handleDetailClick(acc)}
                                className="action-btn action-tooltip"
                                data-tooltip="Detail Akun"
                                aria-label="Detail Akun"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>

                              {/* Admin specific action buttons */}
                              {isAdmin && (
                                <>
                                  <button 
                                    onClick={() => handleEditClick(acc)} 
                                    className="action-btn action-tooltip" 
                                    data-tooltip="Edit Akun"
                                    aria-label="Edit Akun"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClick(acc)} 
                                    className="action-btn action-btn-danger action-tooltip" 
                                    data-tooltip="Hapus Akun"
                                    aria-label="Hapus Akun"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2.5rem' }}>🗂️</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tidak ditemukan akun akuntansi</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Coba sesuaikan kata kunci pencarian atau ganti filter kategori.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info stats */}
        <div style={{ 
          padding: '1rem 1.25rem', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'var(--background)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Menampilkan <strong>{accounts.length}</strong> akun hasil filter
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--primary)', 
            fontWeight: 700, 
            backgroundColor: 'rgba(37, 99, 235, 0.08)', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '9999px',
            border: '1px solid rgba(37, 99, 235, 0.15)'
          }}>
            Total Database: {totalDbAccounts} Akun Standar SAK EMKM
          </span>
        </div>
      </div>

      {/* Modal: View Details (Available to both Admin and User) */}
      {showDetailModal && detailAccount && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowDetailModal(false)} style={{ overflowY: 'auto', padding: '2rem 1rem' }}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.75rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '8px',
                  height: '18px',
                  borderRadius: '9999px',
                  backgroundColor: CATEGORY_THEMES[detailAccount.category]?.color || 'var(--primary)'
                }} />
                Detail Akun Akuntansi
              </h3>
              <button 
                type="button" 
                onClick={() => setShowDetailModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {/* Gradient Banner representing Category */}
            <div style={{
              background: CATEGORY_THEMES[detailAccount.category]?.gradient || 'var(--primary)',
              borderRadius: '8px',
              padding: '1.25rem',
              color: 'white',
              marginBottom: '1.25rem',
              boxShadow: `0 4px 14px ${CATEGORY_THEMES[detailAccount.category]?.shadow || 'rgba(0,0,0,0.15)'}`
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.05em' }}>
                {detailAccount.category} &bull; {detailAccount.subcategory || 'Umum'}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0 0 0', color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {detailAccount.name}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Kode Akun</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{detailAccount.code}</span>
              </div>
              <div style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Kategori</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: CATEGORY_THEMES[detailAccount.category]?.color }}>{detailAccount.category}</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Deskripsi</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                {detailAccount.description || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Tidak ada deskripsi.</span>}
              </p>
            </div>

            {/* Database Reference Links */}
            <div style={{
              backgroundColor: 'var(--background)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              border: '1px solid var(--border)'
            }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Penggunaan Database Real
              </span>
              {loadingDetailUsage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                  <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Memeriksa relasi database...</span>
                </div>
              ) : detailUsage ? (
                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ flex: 1, backgroundColor: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>Aturan Sistem Pakar</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>{detailUsage.ruleCount} Rules</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>Transaksi Terklasifikasi</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>{detailUsage.consultationCount} Kali</div>
                    </div>
                  </div>
                  {detailUsage.relatedRules && detailUsage.relatedRules.length > 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.25rem' }}>Digunakan oleh Aturan:</div>
                      {detailUsage.relatedRules.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-primary)', padding: '0.15rem 0' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.code}</span> — {r.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Gagal memuat info relasi database.</span>
              )}
            </div>
            </div>{/* end scrollable body */}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
              {isAdmin && (
                <button
                  onClick={() => { setShowDetailModal(false); handleEditClick(detailAccount); }}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <EditIcon className="w-3.5 h-3.5" /> Edit Akun
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setShowDetailModal(false)}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Account */}
      {showAddModal && (
        <div className="modal-overlay animate-fade-in">
          <form onSubmit={handleAddSubmit} className="modal-content animate-slide-up" style={{ maxWidth: '520px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '8px',
                  height: '18px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--primary)'
                }} />
                Tambah Akun Baru
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Kode Akun <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 1-1000 (Aset), 2-1000 (Kewajiban), 5-1100 (Beban)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ borderRadius: '8px', borderColor: validationError ? 'var(--warning)' : 'var(--border)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Nama Akun <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: Kas Utama, Pendapatan Jasa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="form-row" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Kategori <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  style={{ borderRadius: '8px', cursor: 'pointer' }}
                >
                  <option value="Aset">Aset</option>
                  <option value="Kewajiban">Kewajiban</option>
                  <option value="Ekuitas">Ekuitas</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Beban">Beban</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Sub-Kategori</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ketik / pilih saran..."
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  list="subcategories-add"
                  style={{ borderRadius: '8px' }}
                />
                <datalist id="subcategories-add">
                  {subcategorySuggestions.map(sub => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Deskripsi</label>
              <textarea
                className="form-control"
                placeholder="Keterangan mengenai fungsi atau peruntukan akun keuangan ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            {/* Real-time alert messages for validation */}
            {validationError && (
              <div style={{
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                color: 'var(--warning)',
                border: '1px solid rgba(217, 119, 6, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4,
                marginBottom: '1rem'
              }}>
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddModal(false)}
                style={{ padding: '0.6rem 1.1rem', borderRadius: '8px' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!!validationError}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', opacity: validationError ? 0.6 : 1, cursor: validationError ? 'not-allowed' : 'pointer' }}
              >
                Simpan Akun
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Account */}
      {showEditModal && (
        <div className="modal-overlay animate-fade-in">
          <form onSubmit={handleEditSubmit} className="modal-content animate-slide-up" style={{ maxWidth: '520px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '8px',
                  height: '18px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--primary)'
                }} />
                Edit Akun Akuntansi
              </h3>
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Kode Akun <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ borderRadius: '8px', borderColor: validationError ? 'var(--warning)' : 'var(--border)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Nama Akun <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="form-row" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Kategori <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  style={{ borderRadius: '8px', cursor: 'pointer' }}
                >
                  <option value="Aset">Aset</option>
                  <option value="Kewajiban">Kewajiban</option>
                  <option value="Ekuitas">Ekuitas</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Beban">Beban</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Sub-Kategori</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ketik / pilih saran..."
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  list="subcategories-edit"
                  style={{ borderRadius: '8px' }}
                />
                <datalist id="subcategories-edit">
                  {subcategorySuggestions.map(sub => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Deskripsi</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            {/* Real-time alert messages for validation */}
            {validationError && (
              <div style={{
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                color: 'var(--warning)',
                border: '1px solid rgba(217, 119, 6, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4,
                marginBottom: '1rem'
              }}>
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowEditModal(false)}
                style={{ padding: '0.6rem 1.1rem', borderRadius: '8px' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!!validationError}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', opacity: validationError ? 0.6 : 1, cursor: validationError ? 'not-allowed' : 'pointer' }}
              >
                Perbarui Akun
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Account (with usage integrity checks) */}
      {showDeleteModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '440px', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.75rem' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <TrashIcon className="w-5 h-5" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                  Hapus Akun Akuntansi?
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, margin: 0 }}>
                  Apakah Anda yakin ingin menghapus akun <strong>{code} - {name}</strong> secara permanen?
                </p>
              </div>
            </div>

            {/* DB Usage Check Alert */}
            <div style={{ marginBottom: '1.5rem' }}>
              {checkingDeleteUsage ? (
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2.5px' }} />
                  <span>Memeriksa keterkaitan data di database...</span>
                </div>
              ) : deleteUsage ? (
                deleteUsage.inUse ? (
                  // Account is active in system - BLOCK DELETE
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      <span>⚠️ Hapus Dicegah (Integritas Data)</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                      Akun ini sedang digunakan secara aktif dalam database:
                    </p>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 1.25rem', padding: 0, lineHeight: 1.5 }}>
                      <li>Digunakan oleh: <strong>{deleteUsage.ruleCount} aturan</strong> sistem pakar</li>
                      <li>Digunakan oleh: <strong>{deleteUsage.consultationCount} riwayat</strong> klasifikasi</li>
                    </ul>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      * Untuk menghapus akun ini, silakan hapus atau ubah aturan/riwayat konsultasi yang bersangkutan terlebih dahulu.
                    </span>
                  </div>
                ) : (
                  // Account is safe to delete
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    color: 'var(--success)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>✅</span>
                    <span>Akun ini aman untuk dihapus. Tidak ada keterkaitan data aktif.</span>
                  </div>
                )
              ) : (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  Gagal mendeteksi keterkaitan data database.
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', margin: 0, gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                Batal
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={checkingDeleteUsage || !deleteUsage || deleteUsage.inUse}
                style={{ 
                  padding: '0.55rem 1.1rem', 
                  borderRadius: '8px', 
                  fontSize: '0.85rem', 
                  boxShadow: deleteUsage?.inUse ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.2)',
                  opacity: (checkingDeleteUsage || !deleteUsage || deleteUsage.inUse) ? 0.5 : 1,
                  cursor: (checkingDeleteUsage || !deleteUsage || deleteUsage.inUse) ? 'not-allowed' : 'pointer'
                }}
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
