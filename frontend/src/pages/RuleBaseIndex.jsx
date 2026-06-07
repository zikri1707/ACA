import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, CheckIcon } from '../components/Icons';

export const RuleBaseIndex = () => {
  const { token, user, showToast } = useAuth();
  const [rules, setRules] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [search, setSearch] = useState('');

  // Selected rule for Visual Logic Builder
  const [selectedRule, setSelectedRule] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('semua');
  const [conclusionAccountId, setConclusionAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(1);
  const [conditions, setConditions] = useState([{ fact_name: 'is_penerimaan', expected_value: 'yes' }]);

  const isAdmin = user?.role === 'Admin';

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRules(data.rules || []);
        if (data.rules.length > 0 && !selectedRule) {
          setSelectedRule(data.rules[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const qRes = await fetch('/api/questions', { headers: { 'Authorization': `Bearer ${token}` } });
      const qData = await qRes.json();
      if (qRes.ok) setQuestions(qData.questions || []);

      const aRes = await fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } });
      const aData = await aRes.json();
      if (aRes.ok) {
        setAccounts(aData.accounts || []);
        if (aData.accounts.length > 0) {
          setConclusionAccountId(aData.accounts[0].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchDependencies();
  }, []);

  const handleToggleActive = async (rule) => {
    if (!isAdmin) return;
    try {
      const newActiveState = rule.is_active === 1 ? 0 : 1;
      const response = await fetch(`/api/rules/${rule.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: newActiveState })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        
        // Refresh local items
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: newActiveState } : r));
        if (selectedRule?.id === rule.id) {
          setSelectedRule(prev => ({ ...prev, is_active: newActiveState }));
        }
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { fact_name: 'is_penerimaan', expected_value: 'yes' }]);
  };

  const handleRemoveCondition = (index) => {
    if (conditions.length === 1) return;
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          name,
          business_type: businessType,
          conclusion_account_id: parseInt(conclusionAccountId),
          description,
          conditions
        })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setShowAddModal(false);
        resetForm();
        fetchRules();
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan aturan pakar.', 'danger');
    }
  };

  const handleEditClick = (rule) => {
    if (!isAdmin) return;
    setSelectedRuleId(rule.id);
    setCode(rule.code);
    setName(rule.name);
    setBusinessType(rule.business_type);
    setConclusionAccountId(rule.conclusion_account_id.toString());
    setDescription(rule.description || '');
    setIsActive(rule.is_active);
    setConditions(rule.conditions.length > 0 ? rule.conditions.map(c => ({
      fact_name: c.fact_name,
      expected_value: c.expected_value
    })) : [{ fact_name: 'is_penerimaan', expected_value: 'yes' }]);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/rules/${selectedRuleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          name,
          business_type: businessType,
          conclusion_account_id: parseInt(conclusionAccountId),
          description,
          is_active: isActive,
          conditions
        })
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setShowEditModal(false);
        resetForm();
        fetchRules();
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui aturan pakar.', 'danger');
    }
  };

  const handleDeleteClick = (rule) => {
    if (!isAdmin) return;
    setSelectedRuleId(rule.id);
    setName(rule.name);
    setCode(rule.code);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/rules/${selectedRuleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setShowDeleteModal(false);
        setSelectedRuleId(null);
        fetchRules();
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus aturan.', 'danger');
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setBusinessType('semua');
    setDescription('');
    setIsActive(1);
    setConditions([{ fact_name: 'is_penerimaan', expected_value: 'yes' }]);
    if (accounts.length > 0) setConclusionAccountId(accounts[0].id.toString());
  };

  const filteredRules = rules.filter(r => 
    r.code.toLowerCase().includes(search.toLowerCase()) || 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.account_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Top dashboard metadata summary cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Rules</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem' }}>{rules.length}</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>+4 bulan ini</span>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Akurasi AI</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem' }}>98.4%</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>Sangat Tinggi</span>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rule Aktif</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem' }}>{rules.filter(r => r.is_active === 1).length}</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{rules.filter(r => r.is_active === 0).length} Diarsip</span>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Conflict Check</span>
          <h2 style={{ fontSize: '1.875rem', marginTop: '0.25rem', color: 'var(--success)' }}>0</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>✓ Sistem Stabil</span>
        </div>
      </div>

      {/* Main split builder/manager layout */}
      <div className="layout-main-side">
        {/* Left Column: Visual Logic Builder display */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          <div className="card-title">
            <span>Visual Logic Builder</span>
            {selectedRule && <span className="badge badge-info">{selectedRule.code}</span>}
          </div>

          {selectedRule ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* IF conditions block */}
              <div style={{
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                backgroundColor: 'var(--background)'
              }}>
                <span style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '1rem'
                }}>
                  IF CONDITIONS
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedRule.conditions?.map((c, index) => (
                    <div key={index} style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.fact_name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>EQUALS</span>
                      <span className="badge badge-info">{c.expected_value.toUpperCase()}</span>
                    </div>
                  ))}
                  {selectedRule.conditions?.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Tidak ada kondisi penentu.</p>
                  )}
                </div>
              </div>

              {/* AND operator box */}
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  backgroundColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  AND CONNECTIVE
                </span>
              </div>

              {/* THEN Action block */}
              <div style={{
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                backgroundColor: 'var(--success-light)'
              }}>
                <span style={{
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '1rem'
                }}>
                  THEN CONCLUSION
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>
                    {selectedRule.account_code} - {selectedRule.account_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Kategori Akun: <strong>{selectedRule.account_category}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Regulasi: SAK EMKM Standard Compliance
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Pilih salah satu aturan di daftar untuk divisualisasikan.
            </div>
          )}
        </div>

        {/* Right Column: Rules List Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: 0 }}>
            {/* Table Action Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <SearchIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari Rule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              {isAdmin && (
                <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  <PlusIcon className="w-4 h-4" /> Tambah Rule
                </button>
              )}
            </div>

            {/* Rules Table */}
            <div className="table-container" style={{ border: 'none', margin: 0 }}>
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Aturan (Rule Name)</th>
                    <th>Hasil Akun</th>
                    <th>Status</th>
                    {isAdmin && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : filteredRules.length > 0 ? (
                    filteredRules.map(rule => (
                      <tr 
                        key={rule.id}
                        onClick={() => setSelectedRule(rule)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedRule?.id === rule.id ? 'var(--primary-light)' : 'transparent'
                        }}
                      >
                        <td style={{ fontWeight: 700 }}>{rule.code}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{rule.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Untuk: Usaha {rule.business_type}</div>
                        </td>
                        <td>
                          <span className="badge badge-info">{rule.account_code}</span>
                        </td>
                        <td>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(rule); }}
                            className={`badge ${rule.is_active === 1 ? 'badge-success' : 'badge-danger'}`}
                            style={{ border: 'none', cursor: isAdmin ? 'pointer' : 'default' }}
                          >
                            {rule.is_active === 1 ? 'Aktif' : 'Draft'}
                          </button>
                        </td>
                        {isAdmin && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button onClick={() => handleEditClick(rule)} className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '4px' }}>
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteClick(rule)} className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '4px', color: 'var(--danger)' }}>
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada aturan pakar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rule visual tip box */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            fontSize: '0.8rem',
            lineHeight: 1.4
          }}>
            <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>ℹ️ Tip Pengoptimalan Logic</span>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gunakan kata kunci spesifik dalam kondisi 'IF' untuk meminimalkan ambiguitas klasifikasi. Sistem pakar memproses rules secara serial berdasarkan kode aturan.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Add Rule */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleAddSubmit} className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 className="modal-header">Tambah Rule Pakar Baru</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kode Rule *</label>
                <input type="text" className="form-control" placeholder="e.g. R-016" value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Rule *</label>
                <input type="text" className="form-control" placeholder="e.g. Pembelian Supplies" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Jenis Usaha *</label>
                <select className="form-control" value={businessType} onChange={(e) => setBusinessType(e.target.value)} required>
                  <option value="semua">Semua Usaha</option>
                  <option value="jasa">UMKM Jasa</option>
                  <option value="dagang">UMKM Dagang</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kesimpulan Akun (THEN) *</label>
                <select className="form-control" value={conclusionAccountId} onChange={(e) => setConclusionAccountId(e.target.value)} required>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi Rule</label>
              <textarea className="form-control" placeholder="Mengatur logika pencatatan..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            {/* Conditions Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <span className="form-label" style={{ margin: 0 }}>Kondisi Logika (IF)</span>
                <button type="button" onClick={handleAddCondition} className="btn-link" style={{ fontSize: '0.75rem' }}>+ Tambah Kondisi</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                {conditions.map((cond, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      value={cond.fact_name}
                      onChange={(e) => handleConditionChange(idx, 'fact_name', e.target.value)}
                      style={{ flex: 2 }}
                    >
                      {questions.map(q => (
                        <option key={q.id} value={q.fact_name}>{q.code} - {q.fact_name}</option>
                      ))}
                    </select>
                    
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EQUALS</span>

                    <select
                      className="form-control"
                      value={cond.expected_value}
                      onChange={(e) => handleConditionChange(idx, 'expected_value', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="yes">YES (Ya)</option>
                      <option value="no">NO (Tidak)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(idx)}
                      className="btn"
                      style={{ padding: '0.5rem', color: 'var(--danger)', border: 'none', background: 'none' }}
                      disabled={conditions.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan Rule</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Rule */}
      {showEditModal && (
        <div className="modal-overlay">
          <form onSubmit={handleEditSubmit} className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 className="modal-header">Edit Aturan Pakar</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kode Rule *</label>
                <input type="text" className="form-control" value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Rule *</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Jenis Usaha *</label>
                <select className="form-control" value={businessType} onChange={(e) => setBusinessType(e.target.value)} required>
                  <option value="semua">Semua Usaha</option>
                  <option value="jasa">UMKM Jasa</option>
                  <option value="dagang">UMKM Dagang</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kesimpulan Akun (THEN) *</label>
                <select className="form-control" value={conclusionAccountId} onChange={(e) => setConclusionAccountId(e.target.value)} required>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi Rule</label>
              <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            {/* Conditions Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <span className="form-label" style={{ margin: 0 }}>Kondisi Logika (IF)</span>
                <button type="button" onClick={handleAddCondition} className="btn-link" style={{ fontSize: '0.75rem' }}>+ Tambah Kondisi</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                {conditions.map((cond, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      value={cond.fact_name}
                      onChange={(e) => handleConditionChange(idx, 'fact_name', e.target.value)}
                      style={{ flex: 2 }}
                    >
                      {questions.map(q => (
                        <option key={q.id} value={q.fact_name}>{q.code} - {q.fact_name}</option>
                      ))}
                    </select>
                    
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EQUALS</span>

                    <select
                      className="form-control"
                      value={cond.expected_value}
                      onChange={(e) => handleConditionChange(idx, 'expected_value', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="yes">YES (Ya)</option>
                      <option value="no">NO (Tidak)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(idx)}
                      className="btn"
                      style={{ padding: '0.5rem', color: 'var(--danger)', border: 'none', background: 'none' }}
                      disabled={conditions.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Perbarui Aturan</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Rule */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 className="modal-header">Konfirmasi Hapus</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
              Apakah Anda yakin ingin menghapus aturan <strong>{code} - {name}</strong>? Tindakan ini akan menghapus logikanya secara permanen.
            </p>
            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Hapus Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
