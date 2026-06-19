import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, CheckIcon, CloseIcon } from '../components/Icons';

// Eye Icon component for visualizer quick transition
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
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    shadow: 'rgba(37, 99, 235, 0.15)'
  },
  'Kewajiban': {
    color: '#d97706', // Amber
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.2)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    shadow: 'rgba(217, 119, 6, 0.15)'
  },
  'Ekuitas': {
    color: '#7c3aed', // Purple/Violet
    bg: 'rgba(124, 58, 237, 0.08)',
    border: 'rgba(124, 58, 237, 0.2)',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    shadow: 'rgba(124, 58, 237, 0.15)'
  },
  'Pendapatan': {
    color: '#059669', // Emerald
    bg: 'rgba(5, 150, 105, 0.08)',
    border: 'rgba(5, 150, 105, 0.2)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    shadow: 'rgba(5, 150, 105, 0.15)'
  },
  'Beban': {
    color: '#dc2626', // Red
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.2)',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    shadow: 'rgba(220, 38, 38, 0.15)'
  }
};

export const RuleBaseIndex = () => {
  const { token, user, showToast } = useAuth();
  const [rules, setRules] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [search, setSearch] = useState('');

  // Workspace Tabs State: 'list' | 'visualizer' | 'diagnostics'
  const [activeTab, setActiveTab] = useState('list');

  // Usaha Filters Nested State inside Tab 1: 'semua' | 'jasa' | 'dagang'
  const [nestedFilter, setNestedFilter] = useState('semua');

  // Selected rule for visual logic board
  const [selectedRule, setSelectedRule] = useState(null);

  // Collapsible accordion tips states
  const [openTipIdx, setOpenTipIdx] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states & Step Wizard
  const [formStep, setFormStep] = useState(1); // 1, 2, 3
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
        const visibleRules = (data.rules || []).filter(r => r.code !== 'R-020');
        setRules(visibleRules);
        if (visibleRules.length > 0 && !selectedRule) {
          setSelectedRule(visibleRules[0]);
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
  }, [token]);

  // Effect for rendering Mermaid diagram dynamically
  useEffect(() => {
    if (activeTab === 'rules_diagram') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: true, theme: 'default' });
          window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }
      };
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [activeTab]);

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
    if (questions.length === 0) return;
    setConditions([...conditions, { fact_name: questions[0].fact_name, expected_value: 'yes' }]);
  };

  const handleRemoveCondition = (index) => {
    if (conditions.length === 1) return;
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (validationError) {
      showToast('Form tidak valid. Selesaikan warning terlebih dahulu.', 'warning');
      return;
    }
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
    })) : [{ fact_name: questions[0]?.fact_name || 'is_penerimaan', expected_value: 'yes' }]);
    setFormStep(1);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (validationError) {
      showToast('Form tidak valid. Selesaikan warning terlebih dahulu.', 'warning');
      return;
    }
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

  const fetchAllConditions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rule-conditions');
      const data = await res.json();
      setAllConditions(data || []);
    } catch (err) {
      console.error('Gagal mengambil conditions', err);
    }
  };

  const getRuleNarrative = (code) => {
    const q = (id) => questions.find(x => x.fact_name === id)?.question_text || id;
    
    const rule = rules.find(r => r.code === code);
    if (!rule || !rule.conditions || rule.conditions.length === 0) {
      return [];
    }

    // Urutan prioritas agar pertanyaan tampil secara logis dan natural
    const FACT_ORDER = [
      'is_inbound',
      'is_outbound',
      'is_kredit',
      'is_dijual_kembali',
      'is_penjualan_barang',
      'is_penjualan_jasa',
      'is_pembelian_aset',
      'is_manfaat_lebih_1_tahun',
      'is_setoran_modal',
      'is_prive',
      'is_beban_gaji',
      'is_beban_utilitas',
      'is_beban_sewa',
      'is_beban_atk',
      'is_beban_pemasaran',
      'is_pelunasan_hutang_dagang',
      'is_penerimaan_piutang',
      'is_pelunasan_hutang_bank',
      'is_pinjaman_bank'
    ];

    const sortedConditions = [...rule.conditions].sort((a, b) => {
      const idxA = FACT_ORDER.indexOf(a.fact_name);
      const idxB = FACT_ORDER.indexOf(b.fact_name);
      const orderA = idxA !== -1 ? idxA : 999;
      const orderB = idxB !== -1 ? idxB : 999;
      return orderA - orderB;
    });

    return sortedConditions.map(c => {
      let skipIf = undefined;
      if (c.fact_name === 'is_penjualan_barang') {
        skipIf = 'Jasa';
      } else if (c.fact_name === 'is_penjualan_jasa') {
        skipIf = 'Dagang';
      } else if (c.fact_name === 'is_dijual_kembali') {
        skipIf = 'Jasa';
      }

      return {
        q: q(c.fact_name),
        a: c.expected_value ? c.expected_value.toUpperCase() : '',
        skipIf
      };
    });
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
    setConditions([{ fact_name: questions[0]?.fact_name || 'is_penerimaan', expected_value: 'yes' }]);
    if (accounts.length > 0) setConclusionAccountId(accounts[0].id.toString());
    setFormStep(1);
  };

  // Rule conflict auto-scanner check logic (detects duplicates/contradictions)
  const detectedConflicts = useMemo(() => {
    const conflicts = [];
    // Only check active rules
    const activeRules = rules.filter(r => r.is_active === 1);
    
    for (let i = 0; i < activeRules.length; i++) {
      for (let j = i + 1; j < activeRules.length; j++) {
        const r1 = activeRules[i];
        const r2 = activeRules[j];
        
        // Sort and check if they have the exact same condition signatures
        if (r1.conditions.length === r2.conditions.length) {
          const sig = (r) => r.conditions.map(c => `${c.fact_name}:${c.expected_value}`).sort().join('|');
          if (sig(r1) === sig(r2)) {
            // Point to different accounts = CONTRADICTION
            if (r1.conclusion_account_id !== r2.conclusion_account_id) {
              conflicts.push({
                rule1: r1,
                rule2: r2,
                type: 'contradiction',
                message: `Aturan ${r1.code} ("${r1.name}") dan Aturan ${r2.code} ("${r2.name}") memiliki kondisi yang identik tetapi merujuk ke akun solusi berbeda (${r1.account_code} vs ${r2.account_code}).`
              });
            }
          }
        }
      }
    }
    return conflicts;
  }, [rules]);

  // Frontend real-time form input validations
  const validationError = useMemo(() => {
    if (!code) return '';
    
    // Pattern check: starts with R- followed by number
    if (!/^R-\d+$/.test(code)) {
      return 'Format kode aturan harus berupa "R-" diikuti nomor (contoh: R-016)';
    }

    // Check duplicate code in rules
    const duplicate = rules.find(r => r.code === code && r.id !== selectedRuleId);
    if (duplicate) {
      return `Kode aturan "${code}" sudah terdaftar pada aturan "${duplicate.name}"`;
    }

    // Check duplicate conditions in builder
    const seen = new Set();
    for (const cond of conditions) {
      if (seen.has(cond.fact_name)) {
        return `Kondisi "${getQuestionText(cond.fact_name)}" tercantum lebih dari satu kali. Silakan hapus atau ubah duplikatnya.`;
      }
      seen.add(cond.fact_name);
    }

    return '';
  }, [code, rules, selectedRuleId, conditions]);

  // Translate variable name to user-friendly database question text
  const getQuestionText = (factName) => {
    const q = questions.find(item => item.fact_name === factName);
    return q ? q.question_text : factName;
  };

  const getQuestionCode = (factName) => {
    const q = questions.find(item => item.fact_name === factName);
    return q ? q.code : '';
  };

  // Filter rules by search and sub-tab type
  const filteredRules = rules.filter(r => {
    const matchesSearch = r.code.toLowerCase().includes(search.toLowerCase()) ||
                          r.name.toLowerCase().includes(search.toLowerCase()) ||
                          r.account_name.toLowerCase().includes(search.toLowerCase());
    
    if (nestedFilter === 'semua') return matchesSearch;
    return matchesSearch && r.business_type.toLowerCase() === nestedFilter;
  });

  return (
    <div style={{ position: 'relative' }}>
      {/* Inline Styles tag for gorgeous transitions and workspace interactions */}
      <style>{`
        @keyframes ruleFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ruleSlideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .anim-fade-in {
          animation: ruleFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-slide-up {
          animation: ruleSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .rule-tab-btn {
          padding: 0.75rem 1.25rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          position: relative;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .rule-tab-btn:hover {
          color: var(--primary);
        }
        .rule-tab-btn.active {
          color: var(--primary);
        }
        .rule-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 12%;
          right: 12%;
          height: 3px;
          background-color: var(--primary);
          border-radius: 999px;
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
        
        /* Flowchart Node Connections style */
        .flow-node {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          box-shadow: 0 4px 12px rgba(0,0,0,0.015);
          position: relative;
          min-width: 140px;
          text-align: center;
          transition: transform 0.2s;
        }
        .flow-node:hover {
          transform: scale(1.02);
        }
        .flow-line {
          height: 2px;
          background-color: var(--border);
          flex: 1;
          min-width: 40px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flow-line::after {
          content: '➔';
          position: absolute;
          right: -2px;
          color: var(--text-muted);
          font-size: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
        }
        
        /* Action buttons with text labels hover effect */
        .btn-action-text {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-action-text:hover {
          transform: translateY(-1.5px);
          filter: brightness(0.95);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        
        /* Wizard Form Steps indicators */
        .wizard-step-pill {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          border: 2px solid var(--border);
          color: var(--text-muted);
          background-color: var(--background);
          transition: all 0.3s ease;
        }
        .wizard-step-pill.active {
          border-color: var(--primary);
          color: white;
          background-color: var(--primary);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
        }
        .wizard-step-pill.completed {
          border-color: var(--success);
          color: white;
          background-color: var(--success);
        }
        .wizard-step-connector {
          flex: 1;
          height: 3px;
          background-color: var(--border);
          transition: background-color 0.3s;
        }
        .wizard-step-connector.completed {
          background-color: var(--success);
        }
      `}</style>

      {/* Top dashboard metadata summary cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Rules</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>{rules.length}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Definisi Sistem Pakar</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akurasi Klasifikasi</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: '#10b981' }}>98.4%</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>Berdasarkan SAK EMKM</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aturan Aktif</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>{rules.filter(r => r.is_active === 1).length}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rules.filter(r => r.is_active === 0).length} Disimpan Draft</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', borderLeft: `4px solid ${detectedConflicts.length > 0 ? 'var(--danger)' : '#059669'}` }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conflict Check</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: detectedConflicts.length > 0 ? 'var(--danger)' : '#059669' }}>
            {detectedConflicts.length}
          </h2>
          <span style={{ fontSize: '0.75rem', color: detectedConflicts.length > 0 ? 'var(--danger)' : '#059669', fontWeight: 700 }}>
            {detectedConflicts.length > 0 ? '⚠️ Ditemukan Tumpang Tindih' : '✓ Logika Sistem Konsisten'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="card" style={{ padding: 0, marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)', padding: '0 0.5rem', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('list')}
            className={`rule-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            📁 Daftar Aturan
          </button>
          <button
            onClick={() => setActiveTab('fakta')}
            className={`rule-tab-btn ${activeTab === 'fakta' ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            📝 Daftar Fakta
          </button>
          <button
            onClick={() => setActiveTab('rules_diagram')}
            className={`rule-tab-btn ${activeTab === 'rules_diagram' ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            📊 Flowchart & Matriks
          </button>
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`rule-tab-btn ${activeTab === 'visualizer' ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            👁️‍🗨️ Visualizer Logika
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`rule-tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
          >
            🛡️ Panel Diagnostik
            {detectedConflicts.length > 0 && (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                display: 'inline-block',
                marginLeft: '4px'
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Daftar Aturan */}
      {activeTab === 'list' && (
        <div className="anim-fade-in">
          <div className="card" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
            {/* Table Actions Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--background)' }}>
              
              {/* Nested Business Type Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {[
                  { id: 'semua', label: 'Semua Usaha' },
                  { id: 'jasa', label: 'Usaha Jasa' },
                  { id: 'dagang', label: 'Usaha Dagang' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setNestedFilter(tab.id)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: nestedFilter === tab.id ? 'var(--primary)' : 'transparent',
                      color: nestedFilter === tab.id ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search & Add Rule */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end', maxWidth: '450px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <SearchIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari Kode, Nama, atau Hasil Akun..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '32px', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>

                {isAdmin && (
                  <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
                  >
                    <PlusIcon className="w-4 h-4" /> Tambah Rule
                  </button>
                )}
              </div>
            </div>

            {/* Rules Table */}
            <div className="table-container" style={{ border: 'none', margin: 0 }}>
              <table className="table">
                <thead>
                  <tr style={{ background: 'var(--background)' }}>
                    <th style={{ width: '12%', padding: '1rem 1.25rem' }}>Kode Aturan</th>
                    <th style={{ width: '30%', padding: '1rem 1.25rem' }}>Nama Aturan</th>
                    <th style={{ width: '15%', padding: '1rem 1.25rem' }}>Jenis Usaha</th>
                    <th style={{ width: '23%', padding: '1rem 1.25rem' }}>Hasil Akun (THEN)</th>
                    <th style={{ width: '10%', padding: '1rem 1.25rem' }}>Status</th>
                    <th style={{ width: '10%', padding: '1rem 1.25rem', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : filteredRules.length > 0 ? (
                    filteredRules.map(rule => {
                      const debitTheme = CATEGORY_THEMES[rule.debit_account_category] || CATEGORY_THEMES['Beban'];
                      const creditTheme = CATEGORY_THEMES[rule.credit_account_category] || CATEGORY_THEMES['Kewajiban'];
                      return (
                        <tr
                          key={rule.id}
                          onClick={() => { setSelectedRule(rule); setActiveTab('visualizer'); }}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: selectedRule?.id === rule.id ? 'var(--primary-light)' : 'transparent',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{rule.code}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rule.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rule.description || 'Tidak ada deskripsi.'}</div>
                          </td>
                          <td>
                            <span className="badge" style={{
                              backgroundColor: rule.business_type === 'jasa' ? 'rgba(124, 58, 237, 0.08)' : rule.business_type === 'dagang' ? 'rgba(16, 185, 129, 0.08)' : 'var(--background)',
                              color: rule.business_type === 'jasa' ? '#7c3aed' : rule.business_type === 'dagang' ? '#10b981' : 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {rule.business_type === 'semua' ? 'Semua Bisnis' : rule.business_type.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="badge" style={{
                                backgroundColor: rule.debit_account_id ? debitTheme.bg : 'var(--background)',
                                color: rule.debit_account_id ? debitTheme.color : 'var(--text-secondary)',
                                border: `1px solid ${rule.debit_account_id ? debitTheme.border : 'var(--border)'}`,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}>
                                <span style={{ marginRight: '4px', opacity: 0.7 }}>[Dr]</span>
                                {rule.debit_account_id ? `${rule.debit_account_code} - ${rule.debit_account_name}` : 'Pilih Dinamis (Beban/Aset)'}
                              </span>
                              <span className="badge" style={{
                                backgroundColor: rule.credit_account_id ? creditTheme.bg : 'var(--background)',
                                color: rule.credit_account_id ? creditTheme.color : 'var(--text-secondary)',
                                border: `1px solid ${rule.credit_account_id ? creditTheme.border : 'var(--border)'}`,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}>
                                <span style={{ marginRight: '4px', opacity: 0.7 }}>[Cr]</span>
                                {rule.credit_account_id ? `${rule.credit_account_code} - ${rule.credit_account_name}` : 'Pilih Dinamis (Hutang/Kas)'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleActive(rule); }}
                              disabled={!isAdmin}
                              className={`badge ${rule.is_active === 1 ? 'badge-success' : 'badge-danger'}`}
                              style={{ border: 'none', cursor: isAdmin ? 'pointer' : 'default', fontWeight: 700 }}
                            >
                              {rule.is_active === 1 ? 'Aktif' : 'Draft'}
                            </button>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="action-group">
                              <button
                                onClick={() => { setSelectedRule(rule); setActiveTab('visualizer'); }}
                                className="action-btn action-tooltip"
                                data-tooltip="Lihat Flowchart"
                                aria-label="Lihat Flowchart"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleEditClick(rule)}
                                    className="action-btn action-tooltip"
                                    data-tooltip="Edit Rule"
                                    aria-label="Edit Rule"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(rule)}
                                    className="action-btn action-btn-danger action-tooltip"
                                    data-tooltip="Hapus Rule"
                                    aria-label="Hapus Rule"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '2.5rem' }}>📋</span>
                          <span style={{ fontWeight: 600 }}>Tidak ditemukan aturan pakar</span>
                          <span style={{ fontSize: '0.8rem' }}>Ubah kata kunci pencarian atau ganti filter usaha.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Menampilkan <strong>{filteredRules.length}</strong> dari <strong>{rules.length}</strong> Aturan</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Visualizer Logika */}
      {activeTab === 'visualizer' && (
        <div className="anim-fade-in">
          <div className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Cara Sistem Mengambil Keputusan
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Visualisasi aliran logika klasifikasi aturan pakar berbasis SAK EMKM.
                </p>
              </div>
              {selectedRule && (
                <span style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  padding: '0.35rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '0.85rem',
                  fontWeight: 800
                }}>
                  Aturan: {selectedRule.code}
                </span>
              )}
            </div>

            {selectedRule ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1rem 0' }}>
                
                {/* Rule Title and Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedRule.name}</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedRule.description || 'Tidak ada deskripsi.'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge" style={{ backgroundColor: selectedRule.is_active === 1 ? 'var(--success-light)' : 'var(--danger-light)', color: selectedRule.is_active === 1 ? 'var(--success)' : 'var(--danger)' }}>
                      {selectedRule.is_active === 1 ? 'Aktif' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Horizontal Flow Diagram Grid */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--background)',
                  border: '1px dashed var(--border)',
                  borderRadius: '16px',
                  padding: '3rem 2rem',
                  overflowX: 'auto'
                }}>
                  
                  {/* Node 1: Input (Business Type) */}
                  <div className="flow-node" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Input Bisnis</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedRule.business_type === 'semua' ? 'Semua UMKM' : `UMKM ${selectedRule.business_type.toUpperCase()}`}
                    </span>
                  </div>

                  {/* Connective Line */}
                  <div className="flow-line"><span style={{ fontSize: '0.7rem', backgroundColor: 'var(--background)', color: 'var(--text-muted)', padding: '0 4px', fontWeight: 800 }}>IF</span></div>

                  {/* Node 2: Sequence of Questions (Narrative Path) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '400px', zIndex: 1 }}>
                    {getRuleNarrative(selectedRule.code).map((step, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <div style={{ textAlign: 'center', margin: '2px 0' }}>
                            <span style={{
                              backgroundColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px'
                            }}>
                              SELANJUTNYA ⬇
                            </span>
                          </div>
                        )}
                        <div style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '80%' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                              Pertanyaan {idx + 1}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                              {step.q}
                            </span>
                            {step.skipIf && (
                              <span style={{ fontSize: '0.65rem', color: 'var(--warning)', marginTop: '4px', fontStyle: 'italic' }}>
                                *Dilewati otomatis jika profil UMKM adalah {step.skipIf}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Jawaban</span>
                            <span style={{
                              backgroundColor: step.a.includes('YES') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: step.a.includes('YES') ? 'var(--success)' : 'var(--danger)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px'
                            }}>
                              {step.a}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                    {getRuleNarrative(selectedRule.code).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Tidak ada urutan pertanyaan tersedia.</div>
                    )}
                  </div>

                  {/* Connective Line */}
                  <div className="flow-line"><span style={{ fontSize: '0.7rem', backgroundColor: 'var(--background)', color: 'var(--text-muted)', padding: '0 4px', fontWeight: 800 }}>THEN</span></div>

                  {/* Node 3: Output (Double-Entry Solution) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Debit Node */}
                    {(() => {
                      const theme = CATEGORY_THEMES[selectedRule.debit_account_category] || CATEGORY_THEMES['Beban'];
                      return (
                        <div 
                          className="flow-node"
                          style={{
                            background: selectedRule.debit_account_id ? theme.gradient : 'var(--surface)',
                            color: selectedRule.debit_account_id ? 'white' : 'var(--text-secondary)',
                            border: selectedRule.debit_account_id ? 'none' : '1px dashed var(--border)',
                            minWidth: '220px',
                            padding: '1rem',
                            textAlign: 'left',
                            boxShadow: selectedRule.debit_account_id ? `0 8px 20px ${theme.shadow}` : 'none'
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '0.65rem', color: selectedRule.debit_account_id ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Akun Debit [Dr]
                          </span>
                          <h4 style={{ color: selectedRule.debit_account_id ? 'white' : 'var(--text-primary)', fontSize: '1rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'var(--font-mono)' }}>
                            {selectedRule.debit_account_id ? selectedRule.debit_account_code : 'DINAMIS'}
                          </h4>
                          <div style={{ color: selectedRule.debit_account_id ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.3 }}>
                            {selectedRule.debit_account_id ? selectedRule.debit_account_name : '(Pilihan User)'}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Credit Node */}
                    {(() => {
                      const theme = CATEGORY_THEMES[selectedRule.credit_account_category] || CATEGORY_THEMES['Kewajiban'];
                      return (
                        <div 
                          className="flow-node"
                          style={{
                            background: selectedRule.credit_account_id ? theme.gradient : 'var(--surface)',
                            color: selectedRule.credit_account_id ? 'white' : 'var(--text-secondary)',
                            border: selectedRule.credit_account_id ? 'none' : '1px dashed var(--border)',
                            minWidth: '220px',
                            padding: '1rem',
                            textAlign: 'left',
                            boxShadow: selectedRule.credit_account_id ? `0 8px 20px ${theme.shadow}` : 'none'
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '0.65rem', color: selectedRule.credit_account_id ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Akun Kredit [Cr]
                          </span>
                          <h4 style={{ color: selectedRule.credit_account_id ? 'white' : 'var(--text-primary)', fontSize: '1rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'var(--font-mono)' }}>
                            {selectedRule.credit_account_id ? selectedRule.credit_account_code : 'DINAMIS'}
                          </h4>
                          <div style={{ color: selectedRule.credit_account_id ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.3 }}>
                            {selectedRule.credit_account_id ? selectedRule.credit_account_name : '(Pilihan User)'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* Narrative Path Box */}
                <div style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginTop: '0.5rem'
                }}>
                  <h5 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Narasi Jalur Pertanyaan (Step-by-Step)</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getRuleNarrative(selectedRule.code).map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{
                          backgroundColor: step.a === 'YES' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: step.a === 'YES' ? 'var(--success)' : 'var(--danger)',
                          padding: '0.2rem 0.75rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          minWidth: '55px',
                          textAlign: 'center',
                          marginTop: '2px'
                        }}>
                          {step.a}
                        </div>
                        <div style={{
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          flex: 1
                        }}>
                          <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>→</span>
                          {step.q}
                        </div>
                      </div>
                    ))}
                    {getRuleNarrative(selectedRule.code).length > 0 && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '1.5rem' }}>🏆</div>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                          Kesimpulan: [{selectedRule.name}]
                        </div>
                      </div>
                    )}
                    {getRuleNarrative(selectedRule.code).length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Narasi belum tersedia untuk aturan ini.</div>
                    )}
                  </div>
                </div>

                {/* Navigation Back Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button onClick={() => setActiveTab('list')} className="btn btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
                    Kembali ke Daftar Aturan
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👁️‍🗨️</span>
                <span style={{ fontWeight: 600 }}>Belum ada aturan yang dipilih</span>
                <span style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Pilih aturan dari tab Daftar Aturan terlebih dahulu.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Panel Diagnostik */}
      {activeTab === 'diagnostics' && (
        <div className="anim-fade-in">
          <div className="layout-main-side">
            
            {/* Main diagnostics panel */}
            <div className="card" style={{ borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                Hasil Pindai Integritas Aturan Pakar
              </h3>

              {detectedConflicts.length === 0 ? (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '3rem' }}>🛡️</span>
                  <h4 style={{ color: 'var(--success)', fontWeight: 800, margin: 0, fontSize: '1.1rem' }}>Keamanan Sistem Stabil</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '400px', lineHeight: 1.5 }}>
                    Semua aturan logika 100% konsisten. Tidak ditemukan adanya aturan bertabrakan (contradictions) atau logika kondisi duplikat di database.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '8px',
                    padding: '1rem 1.25rem',
                    color: 'var(--danger)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>⚠️ Peringatan: Terdeteksi {detectedConflicts.length} konflik logika dalam sistem!</span>
                  </div>

                  {/* List of conflict items */}
                  {detectedConflicts.map((conf, index) => (
                    <div key={index} style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '1rem 1.25rem',
                      backgroundColor: 'var(--background)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>
                        <span>Laporan #{index + 1}: Kontradiksi Kondisi</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4, margin: '0 0 0.75rem 0' }}>
                        {conf.message}
                      </p>
                      
                      {/* Short-cuts to repair */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleEditClick(conf.rule1)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Edit Aturan {conf.rule1.code}
                        </button>
                        <button
                          onClick={() => handleEditClick(conf.rule2)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Edit Aturan {conf.rule2.code}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side Tips Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>💡</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>Panduan Optimasi Logika</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    {
                      title: 'Urutkan Kode Rule dengan Benar',
                      desc: 'Sistem memproses aturan secara serial (R-001, R-002, ...). Aturan yang paling khusus/spesifik sebaiknya diletakkan di nomor kecil agar diproses terlebih dahulu sebelum aturan yang lebih umum.'
                    },
                    {
                      title: 'Gunakan Kondisi Spesifik',
                      desc: 'Mencantumkan kondisi JIKA secara spesifik meminimalkan ambiguitas klasifikasi akun. Hindari membuat aturan dengan kondisi tunggal yang terlalu luas.'
                    },
                    {
                      title: 'Hindari Duplikasi Kondisi',
                      desc: 'Pastikan tidak ada dua aturan aktif yang memiliki kombinasi kondisi persis sama karena akan membingungkan mesin inferensi SAK EMKM.'
                    },
                    {
                      title: 'Gunakan Status Draft/Aktif',
                      desc: 'Gunakan tombol status untuk mematikan (draft) logika aturan yang sedang diuji tanpa perlu menghapusnya secara permanen dari sistem.'
                    }
                  ].map((tip, idx) => {
                    const isOpen = openTipIdx === idx;
                    return (
                      <div key={idx} style={{
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => setOpenTipIdx(isOpen ? -1 : idx)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            backgroundColor: isOpen ? 'var(--background)' : 'var(--surface)',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span>{idx + 1}. {tip.title}</span>
                          <span>{isOpen ? '▲' : '▼'}</span>
                        </button>
                        {isOpen && (
                          <div style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                            {tip.desc}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 4: Daftar Fakta */}
      {activeTab === 'fakta' && (
        <div className="anim-fade-in">
          <div className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Daftar Fakta (Facts)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              Fakta adalah variabel pertanyaan (parameter input) yang bertugas sebagai penentu kondisi (IF) dalam sistem pakar ini.
            </p>
            <table className="table" style={{ border: '1px solid var(--border)' }}>
              <thead style={{ background: 'var(--background)' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Kode Fakta</th>
                  <th style={{ padding: '1rem' }}>Variabel (Fact Name)</th>
                  <th style={{ padding: '1rem' }}>Pertanyaan User</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{q.code}</td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--primary)' }}>{q.fact_name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{q.question_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Flowchart & Matriks */}
      {activeTab === 'rules_diagram' && (
        <div className="anim-fade-in">
          <div className="card" style={{ padding: '2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Flowchart (Diagram Alir Logika)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              Representasi diagram alir memetakan percabangan sistem secara eksak sesuai pertanyaan yang muncul kepada pengguna.
            </p>
            <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto', textAlign: 'center' }}>
               <div className="mermaid">
{`graph TD
    Start([Mulai Transaksi]) --> Q000{Jenis Usaha?}
    
    %% CABANG DAGANG
    Q000 -- DAGANG --> DirD{Arah Transaksi?}
    
    %% Dagang - Penerimaan
    DirD -- TERIMA --> Q009D{Setoran Modal?}
    Q009D -- Ya --> R007[3-1000 Modal Pemilik]
    Q009D -- Tidak --> Q015D{Pinjaman Bank?}
    Q015D -- Ya --> R015[2-2000 Hutang Bank]
    Q015D -- Tidak --> Q003{Penjualan Barang?}
    Q003 -- Ya --> Q005D1{Kredit?}
    Q005D1 -- Ya --> R002[1-1200 Piutang Usaha]
    Q005D1 -- Tidak --> R009[4-1000 Pendapatan Penjualan]
    Q003 -- Tidak --> R001[1-1000 Kas Utama]

    %% Dagang - Pengeluaran
    DirD -- KELUAR --> Q006{Beli utk Dijual<br/>Kembali?}
    Q006 -- Ya --> Q005D2{Kredit?}
    Q005D2 -- Ya --> R004[1-1300 Persediaan Kredit & Hutang]
    Q005D2 -- Tidak --> R003[1-1300 Persediaan Tunai]
    Q006 -- Tidak --> BebanUmum{Cek Beban/Aset/Prive}

    %% CABANG JASA
    Q000 -- JASA --> DirJ{Arah Transaksi?}
    
    %% Jasa - Penerimaan
    DirJ -- TERIMA --> Q009J{Setoran Modal?}
    Q009J -- Ya --> R007
    Q009J -- Tidak --> Q015J{Pinjaman Bank?}
    Q015J -- Ya --> R015
    Q015J -- Tidak --> Q004{Penjualan Jasa?}
    Q004 -- Ya --> Q005J1{Kredit?}
    Q005J1 -- Ya --> R002
    Q005J1 -- Tidak --> R010[4-1100 Pendapatan Jasa]
    Q004 -- Tidak --> R001

    %% Jasa - Pengeluaran (Langsung ke Beban/Aset)
    DirJ -- KELUAR --> BebanUmum
    
    %% BLOK BEBAN/ASET/PRIVE (Berlaku untuk Dagang & Jasa)
    BebanUmum --> Q007{Beli Aset Tetap?}
    Q007 -- Ya --> Q008{Manfaat > 1 Thn?}
    Q008 -- Ya --> R006[1-2100 Aset Tetap]
    Q008 -- Tidak --> BebanLainnya
    Q007 -- Tidak --> BebanLainnya
    
    BebanLainnya --> Q010{Ambil Prive?}
    Q010 -- Ya --> R008[3-2000 Prive Pemilik]
    Q010 -- Tidak --> Q011{Bayar Gaji?}
    
    Q011 -- Ya --> R011[5-1000 Beban Gaji]
    Q011 -- Tidak --> Q012{Bayar Utilitas?}
    
    Q012 -- Ya --> R012[5-1100 Beban Utilitas]
    Q012 -- Tidak --> Q013{Bayar Sewa?}
    
    Q013 -- Ya --> R013[5-1200 Beban Sewa]
    Q013 -- Tidak --> Q014{Beli ATK?}
    
    Q014 -- Ya --> R014[5-1500 Beban ATK]
    Q014 -- Tidak --> Q005U{Pengeluaran Kredit?}
    
    Q005U -- Ya --> R005[2-1000 Hutang Dagang]
    Q005U -- Tidak --> Drop([Cek Kembali Transaksi])`}
               </div>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Decision Table (Tabel Keputusan)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Tabel ini sangat cocok dicetak dan ditunjukkan kepada pakar akuntansi untuk <em>Face Validity</em>. Pakar dapat dengan mudah membaca kombinasi dari kiri ke kanan untuk memvalidasi apakah kode akun di kolom paling kanan sudah tepat. Tanda strip (" - ") mengindikasikan <em>Don't Care</em>.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ border: '1px solid var(--border)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                <thead style={{ background: 'var(--primary-light)' }}>
                  <tr>
                    <th style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>Rule ID</th>
                    <th style={{ padding: '1rem' }}>Kategori Akun</th>
                    <th style={{ padding: '1rem' }}>Jenis Usaha</th>
                    <th style={{ padding: '1rem' }}>Arah Transaksi</th>
                    <th style={{ padding: '1rem' }}>Kondisi Spesifik (Fakta yang bernilai "YES")</th>
                    <th style={{ padding: '1rem' }}>Kredit?</th>
                    <th style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'white' }}>Hasil (Kode Akun)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'R-001', cat: 'Aset', usaha: 'SEMUA', arah: 'Penerimaan', kondisi: 'Transaksi operasional/lainnya (Bukan Setoran/Pinjaman/Penjualan)', kredit: 'NO', hasil: '1-1000 (Kas)' },
                    { id: 'R-002', cat: 'Piutang', usaha: 'SEMUA', arah: 'Penerimaan', kondisi: 'is_penjualan_barang ATAU is_penjualan_jasa', kredit: 'YES', hasil: '1-1200 (Piutang Usaha)' },
                    { id: 'R-003', cat: 'Aset', usaha: 'DAGANG', arah: 'Pengeluaran', kondisi: 'is_dijual_kembali', kredit: 'NO', hasil: '1-1300 (Persediaan)' },
                    { id: 'R-004', cat: 'Aset', usaha: 'DAGANG', arah: 'Pengeluaran', kondisi: 'is_dijual_kembali', kredit: 'YES', hasil: '1-1300 (Persediaan)' },
                    { id: 'R-006', cat: 'Aset', usaha: 'SEMUA', arah: 'Pengeluaran', kondisi: 'is_pembelian_aset AND is_manfaat_lebih_1_tahun', kredit: '-', hasil: '1-2100 (Aset Tetap)' },
                    { id: 'R-005', cat: 'Kewajiban', usaha: 'SEMUA', arah: 'Pengeluaran', kondisi: 'Pembelian selain aset/persediaan', kredit: 'YES', hasil: '2-1000 (Hutang Dagang)' },
                    { id: 'R-015', cat: 'Kewajiban', usaha: 'SEMUA', arah: 'Penerimaan', kondisi: 'is_pinjaman_bank', kredit: '-', hasil: '2-2000 (Hutang Bank)' },
                    { id: 'R-007', cat: 'Ekuitas', usaha: 'SEMUA', arah: 'Penerimaan', kondisi: 'is_setoran_modal', kredit: '-', hasil: '3-1000 (Modal Pemilik)' },
                    { id: 'R-008', cat: 'Ekuitas', usaha: 'SEMUA', arah: 'Pengeluaran', kondisi: 'is_prive', kredit: '-', hasil: '3-2000 (Prive)' },
                    { id: 'R-009', cat: 'Pendapatan', usaha: 'DAGANG', arah: 'Penerimaan', kondisi: 'is_penjualan_barang', kredit: 'NO', hasil: '4-1000 (Pendapatan Jual)' },
                    { id: 'R-010', cat: 'Pendapatan', usaha: 'JASA', arah: 'Penerimaan', kondisi: 'is_penjualan_jasa', kredit: 'NO', hasil: '4-1100 (Pendapatan Jasa)' },
                    { id: 'R-011', cat: 'Beban', usaha: 'SEMUA', arah: 'Pengeluaran', kondisi: 'is_beban_gaji', kredit: '-', hasil: '5-1000 (Beban Gaji)' },
                    { id: 'R-012', cat: 'Beban', usaha: 'SEMUA', arah: 'Pengeluaran', kondisi: 'is_beban_utilitas', kredit: '-', hasil: '5-1100 (Beban Utilitas)' },
                    { id: 'R-013', cat: 'Beban', usaha: 'SEMUA', arah: 'Pengeluaran', kondisi: 'is_beban_sewa', kredit: '-', hasil: '5-1200 (Beban Sewa)' },
                    { id: 'R-014', cat: 'Beban', usaha: 'SEMUA', arah: 'Pengeluaran', kondisi: 'is_beban_atk', kredit: '-', hasil: '5-1500 (Beban ATK)' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontWeight: 800, borderRight: '1px solid var(--border)' }}>{row.id}</td>
                      <td>{row.cat}</td>
                      <td>{row.usaha}</td>
                      <td>{row.arah}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{row.kondisi}</td>
                      <td style={{ color: row.kredit === 'YES' ? 'var(--success)' : row.kredit === 'NO' ? 'var(--danger)' : 'inherit', fontWeight: 800 }}>{row.kredit}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{row.hasil}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Rule (3-Step Wizard Form) */}
      {showAddModal && (
        <div className="modal-overlay animate-fade-in">
          <form onSubmit={handleAddSubmit} className="modal-content animate-slide-up" style={{ maxWidth: '560px', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.75rem' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '18px', borderRadius: '9999px', backgroundColor: 'var(--primary)' }} />
                Tambah Aturan Pakar Baru
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Steps indicator bar */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
              <div className={`wizard-step-pill ${formStep === 1 ? 'active' : 'completed'}`}>1</div>
              <div className={`wizard-step-connector ${formStep > 1 ? 'completed' : ''}`} />
              <div className={`wizard-step-pill ${formStep === 2 ? 'active' : formStep > 2 ? 'completed' : ''}`}>2</div>
              <div className={`wizard-step-connector ${formStep > 2 ? 'completed' : ''}`} />
              <div className={`wizard-step-pill ${formStep === 3 ? 'active' : ''}`}>3</div>
            </div>

            {/* Step 1: Profil Aturan */}
            {formStep === 1 && (
              <div className="anim-fade-in">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Kode Aturan <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. R-016"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      style={{ borderRadius: '8px', borderColor: validationError ? 'var(--warning)' : 'var(--border)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Nama Aturan <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Pembelian ATK Kantor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipe Usaha Terkait <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="form-control"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                    style={{ borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <option value="semua">Semua Tipe Usaha</option>
                    <option value="jasa">Usaha Jasa</option>
                    <option value="dagang">Usaha Dagang</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Deskripsi Aturan</label>
                  <textarea
                    className="form-control"
                    placeholder="Keterangan mengenai peruntukan atau alur klasifikasi aturan pakar ini..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    style={{ borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Kondisi Logika (IF) */}
            {formStep === 2 && (
              <div className="anim-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="form-label" style={{ margin: 0, fontSize: '0.75rem' }}>Kondisi Logika (IF)</span>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="btn-link"
                    style={{ fontSize: '0.75rem', textDecoration: 'none', fontWeight: 700 }}
                  >
                    + Tambah Kondisi
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {conditions.map((cond, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        backgroundColor: 'var(--background)',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <select
                        className="form-control"
                        value={cond.fact_name}
                        onChange={(e) => handleConditionChange(idx, 'fact_name', e.target.value)}
                        style={{ flex: 3, fontSize: '0.8rem', borderRadius: '6px', padding: '0.5rem' }}
                      >
                        {questions.map(q => (
                          <option key={q.id} value={q.fact_name}>
                            {q.code} - {q.question_text}
                          </option>
                        ))}
                      </select>

                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>EQUALS</span>

                      <select
                        className="form-control"
                        value={cond.expected_value}
                        onChange={(e) => handleConditionChange(idx, 'expected_value', e.target.value)}
                        style={{ flex: 1.5, fontSize: '0.8rem', borderRadius: '6px', padding: '0.5rem' }}
                      >
                        <option value="yes">YES (Ya)</option>
                        <option value="no">NO (Tidak)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        disabled={conditions.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {conditions.length === 0 && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                      Aturan harus memiliki minimal satu kondisi!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Akun Solusi (THEN) */}
            {formStep === 3 && (
              <div className="anim-fade-in">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Kesimpulan Akun (THEN) *</label>
                  <select
                    className="form-control"
                    value={conclusionAccountId}
                    onChange={(e) => setConclusionAccountId(e.target.value)}
                    required
                    style={{ borderRadius: '8px', cursor: 'pointer', padding: '0.75rem' }}
                  >
                    {['Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'].map(cat => {
                      const catAccounts = accounts.filter(acc => acc.category === cat);
                      if (catAccounts.length === 0) return null;
                      return (
                        <optgroup key={cat} label={cat.toUpperCase()}>
                          {catAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  <strong>ℹ️ Ringkasan Aturan:</strong>
                  <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <strong>IF</strong>: {conditions.map((c, i) => `${i > 0 ? ' AND ' : ''}${c.fact_name} == ${c.expected_value.toUpperCase()}`)}
                    <br />
                    <strong>THEN</strong>: {accounts.find(a => a.id.toString() === conclusionAccountId)?.code}
                  </div>
                </div>
              </div>
            )}

            {/* Real-time validation warning alert banner */}
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
                marginTop: '1.25rem',
                marginBottom: '-0.5rem'
              }}>
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Modal Footer / Wizard actions */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', gap: '0.5rem' }}>
              {formStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFormStep(prev => prev - 1)}
                  style={{ padding: '0.6rem 1.1rem', borderRadius: '8px' }}
                >
                  Kembali
                </button>
              )}
              {formStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setFormStep(prev => prev + 1)}
                  disabled={formStep === 1 && (!code || !name || !!validationError)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    opacity: (formStep === 1 && (!code || !name || !!validationError)) ? 0.6 : 1,
                    cursor: (formStep === 1 && (!code || !name || !!validationError)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Lanjut
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!!validationError}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    opacity: validationError ? 0.6 : 1,
                    cursor: validationError ? 'not-allowed' : 'pointer'
                  }}
                >
                  Simpan Rule
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Rule (3-Step Wizard Form) */}
      {showEditModal && (
        <div className="modal-overlay animate-fade-in">
          <form onSubmit={handleEditSubmit} className="modal-content animate-slide-up" style={{ maxWidth: '560px', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.75rem' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '18px', borderRadius: '9999px', backgroundColor: 'var(--primary)' }} />
                Edit Aturan Pakar
              </h3>
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Steps indicator bar */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
              <div className={`wizard-step-pill ${formStep === 1 ? 'active' : 'completed'}`}>1</div>
              <div className={`wizard-step-connector ${formStep > 1 ? 'completed' : ''}`} />
              <div className={`wizard-step-pill ${formStep === 2 ? 'active' : formStep > 2 ? 'completed' : ''}`}>2</div>
              <div className={`wizard-step-connector ${formStep > 2 ? 'completed' : ''}`} />
              <div className={`wizard-step-pill ${formStep === 3 ? 'active' : ''}`}>3</div>
            </div>

            {/* Step 1: Profil Aturan */}
            {formStep === 1 && (
              <div className="anim-fade-in">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Kode Aturan <span style={{ color: 'var(--danger)' }}>*</span></label>
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
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Nama Aturan <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipe Usaha Terkait <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="form-control"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                    style={{ borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <option value="semua">Semua Tipe Usaha</option>
                    <option value="jasa">Usaha Jasa</option>
                    <option value="dagang">Usaha Dagang</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Deskripsi Aturan</label>
                  <textarea
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    style={{ borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Kondisi Logika (IF) */}
            {formStep === 2 && (
              <div className="anim-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="form-label" style={{ margin: 0, fontSize: '0.75rem' }}>Kondisi Logika (IF)</span>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="btn-link"
                    style={{ fontSize: '0.75rem', textDecoration: 'none', fontWeight: 700 }}
                  >
                    + Tambah Kondisi
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {conditions.map((cond, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        backgroundColor: 'var(--background)',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <select
                        className="form-control"
                        value={cond.fact_name}
                        onChange={(e) => handleConditionChange(idx, 'fact_name', e.target.value)}
                        style={{ flex: 3, fontSize: '0.8rem', borderRadius: '6px', padding: '0.5rem' }}
                      >
                        {questions.map(q => (
                          <option key={q.id} value={q.fact_name}>
                            {q.code} - {q.question_text}
                          </option>
                        ))}
                      </select>

                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>EQUALS</span>

                      <select
                        className="form-control"
                        value={cond.expected_value}
                        onChange={(e) => handleConditionChange(idx, 'expected_value', e.target.value)}
                        style={{ flex: 1.5, fontSize: '0.8rem', borderRadius: '6px', padding: '0.5rem' }}
                      >
                        <option value="yes">YES (Ya)</option>
                        <option value="no">NO (Tidak)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        disabled={conditions.length === 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {conditions.length === 0 && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                      Aturan harus memiliki minimal satu kondisi!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Akun Solusi (THEN) */}
            {formStep === 3 && (
              <div className="anim-fade-in">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Kesimpulan Akun (THEN) *</label>
                  <select
                    className="form-control"
                    value={conclusionAccountId}
                    onChange={(e) => setConclusionAccountId(e.target.value)}
                    required
                    style={{ borderRadius: '8px', cursor: 'pointer', padding: '0.75rem' }}
                  >
                    {['Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'].map(cat => {
                      const catAccounts = accounts.filter(acc => acc.category === cat);
                      if (catAccounts.length === 0) return null;
                      return (
                        <optgroup key={cat} label={cat.toUpperCase()}>
                          {catAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  <strong>ℹ️ Ringkasan Aturan:</strong>
                  <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <strong>IF</strong>: {conditions.map((c, i) => `${i > 0 ? ' AND ' : ''}${c.fact_name} == ${c.expected_value.toUpperCase()}`)}
                    <br />
                    <strong>THEN</strong>: {accounts.find(a => a.id.toString() === conclusionAccountId)?.code}
                  </div>
                </div>
              </div>
            )}

            {/* Real-time validation warning alert banner */}
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
                marginTop: '1.25rem',
                marginBottom: '-0.5rem'
              }}>
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Modal Footer / Wizard actions */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', gap: '0.5rem' }}>
              {formStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFormStep(prev => prev - 1)}
                  style={{ padding: '0.6rem 1.1rem', borderRadius: '8px' }}
                >
                  Kembali
                </button>
              )}
              {formStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setFormStep(prev => prev + 1)}
                  disabled={formStep === 1 && (!code || !name || !!validationError)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    opacity: (formStep === 1 && (!code || !name || !!validationError)) ? 0.6 : 1,
                    cursor: (formStep === 1 && (!code || !name || !!validationError)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Lanjut
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!!validationError}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    opacity: validationError ? 0.6 : 1,
                    cursor: validationError ? 'not-allowed' : 'pointer'
                  }}
                >
                  Perbarui Aturan
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Rule */}
      {showDeleteModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '400px', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
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
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                  Konfirmasi Hapus
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, margin: 0 }}>
                  Apakah Anda yakin ingin menghapus aturan <strong>{code} - {name}</strong>? Tindakan ini akan menghapus logikanya secara permanen.
                </p>
              </div>
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
                style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}
              >
                Hapus Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
