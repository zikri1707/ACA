import React, { useState, useEffect, useMemo, useRef } from 'react';
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

  // Fact (Question) form states
  const [showFactModal, setShowFactModal] = useState(false);
  const [factFormMode, setFactFormMode] = useState('add'); // 'add' | 'edit'
  const [selectedFactId, setSelectedFactId] = useState(null);
  const [factCode, setFactCode] = useState('');
  const [factName, setFactName] = useState('');
  const [factQuestionText, setFactQuestionText] = useState('');

  // Zoom & Pan state for interactive flowchart
  const [scale, setScale] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 0.90 : 1.70;
    }
    return 1.70;
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const flowchartContainerRef = useRef(null);
  const flowchartRef = useRef(null);


  useEffect(() => {
    const container = flowchartContainerRef.current;
    if (!container) return;

    const preventDefaultWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 0.05;
      setScale(prev => {
        let newScale = prev + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
        return Math.max(0.15, Math.min(newScale, 6));
      });
    };

    container.addEventListener('wheel', preventDefaultWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', preventDefaultWheel);
    };
  }, [activeTab]);

  const isAdmin = user?.role === 'Admin';

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const visibleRules = data.rules || [];
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
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@9/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        if (window.mermaid && flowchartRef.current) {
          try {
            // Set raw definition
            flowchartRef.current.innerHTML = `<div class="mermaid">graph TD
    Start([Mulai]) --> C1{"Q-001 — is_inbound?<br/>Apakah transaksi merupakan<br/>penerimaan uang?"}
    Start --> C2{"Q-002 — is_outbound?<br/>Apakah transaksi merupakan<br/>pengeluaran uang?"}
    %% ==========================================
    %% BLOK 1: INBOUND
    %% ==========================================
    C1 -- TRUE --> IB1{"Q-009 — is_setoran_modal?<br/>Apakah penerimaan berasal<br/>dari setoran modal pemilik?"}

    IB1 -- TRUE --> A1["G-01: Modal Pemilik<br/>Db: Kas Utama<br/>Cr: Modal Pemilik"]
    IB1 -- FALSE --> IB2{"Q-015 — is_pinjaman_bank?<br/>Apakah penerimaan berasal<br/>dari pinjaman bank?"}

    IB2 -- TRUE --> A2["G-02: Hutang Bank (Pinjaman)<br/>Db: Kas Utama<br/>Cr: Hutang Bank"]
    IB2 -- FALSE --> IB3{"Q-112 — is_penerimaan_piutang?<br/>Apakah transaksi merupakan penerimaan<br/>pembayaran piutang dari pelanggan?"}

    IB3 -- TRUE --> A3["G-03: Penerimaan Piutang<br/>Db: Kas Utama<br/>Cr: Piutang Usaha"]
    IB3 -- FALSE --> IB4{"Q-003 — is_penjualan_barang?<br/>Apakah transaksi berasal<br/>dari penjualan barang?"}

    IB4 -- TRUE --> IB4_K{"Q-005 — is_kredit?<br/>Apakah transaksi dilakukan<br/>secara kredit?"}
    IB4_K -- TRUE --> A4["G-04: Penjualan Barang Kredit<br/>Db: Piutang Usaha<br/>Cr: Pendapatan Penjualan<br/><i>Trigger(Hitung HPP)</i>"]
    IB4_K -- FALSE --> A5["G-05: Penjualan Barang Tunai<br/>Db: Kas Utama<br/>Cr: Pendapatan Penjualan<br/><i>Trigger(Hitung HPP)</i>"]

    IB4 -- FALSE --> IB5{"Q-004 — is_penjualan_jasa?<br/>Apakah transaksi berasal<br/>dari penjualan jasa?"}
    IB5 -- TRUE --> IB5_K{"Q-005 — is_kredit?<br/>Apakah transaksi dilakukan<br/>secara kredit?"}
    IB5_K -- TRUE --> A6["G-06: Penjualan Jasa Kredit<br/>Db: Piutang Usaha<br/>Cr: Pendapatan Jasa"]
    IB5_K -- FALSE --> A7["G-07: Penjualan Jasa Tunai<br/>Db: Kas Utama<br/>Cr: Pendapatan Jasa"]
    IB5 -- FALSE --> A8["G-08: Penerimaan Tunai Lainnya<br/>Db: Kas Utama<br/>Cr: Pendapatan Lain-lain<br/><i>Default/Fallback</i>"]
    %% ==========================================
    %% BLOK 2: OUTBOUND
    %% ==========================================
    C2 -- TRUE --> OB1{"Q-006 — is_dijual_kembali?<br/>Apakah barang yang dibeli<br/>akan dijual kembali?"}
    OB1 -- TRUE --> OB1_K{"Q-005 — is_kredit?<br/>Apakah transaksi dilakukan<br/>secara kredit?"}
    OB1_K -- TRUE --> B1["G-09: Pembelian Persediaan Kredit<br/>Db: Persediaan<br/>Cr: Hutang Dagang<br/><i>Trigger(Hitung Harga Pokok<br/>Moving Average)</i>"]
    OB1_K -- FALSE --> B2["G-10: Pembelian Persediaan Tunai<br/>Db: Persediaan<br/>Cr: Kas Utama<br/><i>Trigger(Hitung Harga Pokok<br/>Moving Average)</i>"]
    OB1 -- FALSE --> OB2{"Q-007 — is_pembelian_aset?<br/>Apakah transaksi merupakan<br/>pembelian aset?"}

    %% --- SUB-BLOK ASET (jalur mandiri, tidak lagi bertemu jalur beban) ---
    OB2 -- TRUE --> OB2_M{"Q-008 — is_manfaat_lebih_1_tahun?<br/>Apakah aset memiliki masa manfaat<br/>lebih dari satu tahun?"}
    OB2_M -- TRUE --> B3["G-11: Pembelian Aset Tetap<br/>Db: Peralatan<br/>Cr: Kas Utama"]
    OB2_M -- FALSE --> OB2_AL{"Q-016 — is_pembelian_perlengkapan?<br/>Apakah pembelian ini termasuk<br/>perlengkapan (seperti ATK kantor)?"}
    OB2_AL -- TRUE --> B12["G-21: Pembelian Aset Lancar<br/>Db: Perlengkapan<br/>Cr: Kas Utama"]
    OB2_AL -- FALSE --> B15["G-23: Pembelian Aset Lain-lain<br/>Db: Perlengkapan<br/>Cr: Kas Utama<br/><i>Default/Fallback (Aset)</i>"]

    OB2 -- FALSE --> OB3{"Q-010 — is_prive?<br/>Apakah pengeluaran digunakan untuk<br/>kepentingan pribadi pemilik (prive)?"}
    OB3 -- TRUE --> B4["G-12: Prive<br/>Db: Prive<br/>Cr: Kas Utama"]
    %% SUB-BLOK: PELUNASAN HUTANG
    OB3 -- FALSE --> OB4{"Q-017 — is_pelunasan_hutang?<br/>Apakah pengeluaran ditujukan untuk<br/>pelunasan kewajiban/hutang?"}
    OB4 -- TRUE --> OB4_D{"Q-111 — is_pelunasan_hutang_dagang?<br/>Apakah transaksi merupakan<br/>pelunasan hutang dagang?"}
    OB4_D -- TRUE --> B5["G-13: Pelunasan Hutang Dagang<br/>Db: Hutang Dagang<br/>Cr: Kas Utama"]

    OB4_D -- FALSE --> OB4_B{"Q-113 — is_pelunasan_hutang_bank?<br/>Apakah transaksi merupakan<br/>pelunasan hutang bank?"}
    OB4_B -- TRUE --> B6["G-14: Pelunasan Hutang Bank<br/>Db: Hutang Bank<br/>Cr: Kas Utama"]
    OB4_B -- FALSE --> B6X["G-15: Pelunasan Hutang Lainnya<br/>Db: Hutang Lain-lain<br/>Cr: Kas Utama"]
    %% SUB-BLOK: PEMBAYARAN BEBAN (jalur mandiri, tidak lagi bertemu jalur aset)
    OB4 -- FALSE --> OB5{"Q-018 — is_beban?<br/>Apakah pengeluaran ditujukan untuk<br/>pembayaran beban?"}
    OB5 -- FALSE --> B13["Tidak Terklasifikasi"]
    OB5 -- TRUE --> OB5_G{"Q-011 — is_beban_gaji?<br/>Apakah pengeluaran merupakan<br/>pembayaran gaji?"}

    OB5_G -- TRUE --> B7["G-16: Beban Gaji<br/>Db: Beban Gaji<br/>Cr: Kas Utama"]
    OB5_G -- FALSE --> OB5_U{"Q-012 — is_beban_utilitas?<br/>Apakah pengeluaran merupakan<br/>pembayaran utilitas (listrik, air, internet)?"}

    OB5_U -- TRUE --> B8["G-17: Beban Utilitas<br/>Db: Beban Utilitas<br/>Cr: Kas Utama"]
    OB5_U -- FALSE --> OB5_S{"Q-013 — is_beban_sewa?<br/>Apakah pengeluaran merupakan<br/>pembayaran sewa?"}

    OB5_S -- TRUE --> B9["G-18: Beban Sewa<br/>Db: Beban Sewa<br/>Cr: Kas Utama"]
    OB5_S -- FALSE --> OB5_P{"Q-110 — is_beban_pemasaran?<br/>Apakah pengeluaran merupakan<br/>biaya pemasaran atau promosi?"}

    OB5_P -- TRUE --> B10["G-19: Beban Pemasaran<br/>Db: Beban Pemasaran<br/>Cr: Kas Utama"]
    OB5_P -- FALSE --> OB5_ATK{"Q-014 — is_beban_atk?<br/>Apakah pengeluaran ini termasuk<br/>biaya ATK (alat tulis kantor)?"}
    OB5_ATK -- TRUE --> B11["G-20: Beban ATK<br/>Db: Beban ATK<br/>Cr: Kas Utama"]
    OB5_ATK -- FALSE --> B14["G-24: Beban Lain-lain<br/>Db: Beban Lain-lain<br/>Cr: Kas Utama<br/><i>Default/Fallback (Beban)</i>"]
</div>`;
            window.mermaid.initialize({
              startOnLoad: false,
              theme: 'neutral',
              themeVariables: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '15px'
              },
              flowchart: {
                useMaxWidth: false,
                htmlLabels: true,
                padding: 24
              }
            });
            window.mermaid.init(undefined, flowchartRef.current.querySelectorAll('.mermaid'));
          } catch (err) {
            console.error("Gagal render diagram:", err);
          }
        }
      };
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) document.body.removeChild(script);
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

  // Fact (Question) CRUD actions
  const handleFactAddClick = () => {
    if (!isAdmin) return;
    setFactFormMode('add');
    setSelectedFactId(null);
    setFactCode('');
    setFactName('');
    setFactQuestionText('');
    setShowFactModal(true);
  };

  const handleFactEditClick = (fact) => {
    if (!isAdmin) return;
    setFactFormMode('edit');
    setSelectedFactId(fact.id);
    setFactCode(fact.code);
    setFactName(fact.fact_name);
    setFactQuestionText(fact.question_text);
    setShowFactModal(true);
  };

  const handleFactSubmit = async (e) => {
    e.preventDefault();
    if (!factCode || !factName || !factQuestionText) {
      showToast('Semua field wajib diisi!', 'warning');
      return;
    }
    
    if (!factName.startsWith('is_')) {
      showToast('Nama variabel fakta harus diawali dengan "is_" (contoh: is_pembelian)', 'warning');
      return;
    }

    try {
      const url = factFormMode === 'add' ? '/api/questions' : `/api/questions/${selectedFactId}`;
      const method = factFormMode === 'add' ? 'POST' : 'PUT';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: factCode,
          fact_name: factName,
          question_text: factQuestionText
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        setShowFactModal(false);
        fetchDependencies(); // refresh questions
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses data fakta.', 'danger');
    }
  };

  const handleFactDeleteClick = async (fact) => {
    if (!isAdmin) return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus fakta ${fact.code} (${fact.fact_name})?`)) return;
    try {
      const response = await fetch(`/api/questions/${fact.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message, 'success');
        fetchDependencies(); // refresh questions
      } else {
        showToast(data.message, 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus fakta.', 'danger');
    }
  };

  const fetchAllConditions = async () => {
    try {
      const res = await fetch('/api/rule-conditions');
      const data = await res.json();
      setAllConditions(data || []);
    } catch (err) {
      console.error('Gagal mengambil conditions', err);
    }
  };

  const getRuleNarrative = (code) => {
    const q = (id) => questions.find(x => x.fact_name === id)?.question_text || id;
    
    let rule = rules.find(r => r.code === code);
    if (!rule || !rule.conditions || rule.conditions.length === 0) {
      return [];
    }

    // Inject gateway conditions dynamically for visualizer (sync with backend)
    const injectedConds = [...rule.conditions];
    if (['G-13', 'G-14', 'G-15'].includes(rule.code)) {
      if (!injectedConds.find(c => c.fact_name === 'is_pelunasan_hutang')) {
        injectedConds.push({ fact_name: 'is_pelunasan_hutang', expected_value: 'yes' });
      }
    } else if (['G-16', 'G-17', 'G-18', 'G-19', 'G-20', 'G-24'].includes(rule.code)) {
      if (!injectedConds.find(c => c.fact_name === 'is_beban')) {
        injectedConds.push({ fact_name: 'is_beban', expected_value: 'yes' });
      }
    }
    rule = { ...rule, conditions: injectedConds };

    const generateQuestionSequence = (targetRule) => {
      if (!targetRule || !targetRule.conditions) return [];
      
      const activeRules = [...rules]
        .filter(r => r.is_active === 1)
        .map(r => {
          const newConds = [...(r.conditions || [])];
          if (['G-13', 'G-14', 'G-15'].includes(r.code)) {
            if (!newConds.find(c => c.fact_name === 'is_pelunasan_hutang')) newConds.push({ fact_name: 'is_pelunasan_hutang', expected_value: 'yes' });
          } else if (['G-16', 'G-17', 'G-18', 'G-19', 'G-20', 'G-24'].includes(r.code)) {
            if (!newConds.find(c => c.fact_name === 'is_beban')) newConds.push({ fact_name: 'is_beban', expected_value: 'yes' });
          }
          return { ...r, conditions: newConds };
        })
        .sort((a, b) => b.priority - a.priority);
      
      const targetAnswers = {};
      targetRule.conditions.forEach(c => {
        targetAnswers[c.fact_name] = c.expected_value;
      });

      const FACT_ORDER = [
        'is_inbound',
        'is_outbound',
        'is_setoran_modal',
        'is_pinjaman_bank',
        'is_penerimaan_piutang',
        'is_penjualan_barang',
        'is_penjualan_jasa',
        'is_dijual_kembali',
        'is_pembelian_aset',
        'is_manfaat_lebih_1_tahun',
        'is_pembelian_perlengkapan',
        'is_pembelian_aset_lainnya',
        'is_kredit',
        'is_prive',
        'is_pelunasan_hutang',
        'is_pelunasan_hutang_dagang',
        'is_pelunasan_hutang_bank',
        'is_beban',
        'is_beban_gaji',
        'is_beban_utilitas',
        'is_beban_sewa',
        'is_beban_pemasaran',
        'is_beban_atk',
        'is_beban_lainnya'
      ];

      const businessType = targetRule.business_type === 'jasa' ? 'jasa' : 'dagang';
      let facts = {};
      if (businessType === 'jasa') {
        facts['is_penjualan_barang'] = 'no';
        facts['is_dijual_kembali'] = 'no';
      } else if (businessType === 'dagang') {
        facts['is_penjualan_jasa'] = 'no';
      }

      const sequence = [];
      let status = 'processing';
      let safetyCounter = 0;

      while (status === 'processing' && safetyCounter < 50) {
        safetyCounter++;
        let nextQuestion = null;
        let provenRule = null;

        if (facts['is_inbound'] === 'yes') facts['is_outbound'] = 'no';
        else if (facts['is_outbound'] === 'yes') facts['is_inbound'] = 'no';

        const penerimaanTypes = ['is_penjualan_barang', 'is_penjualan_jasa', 'is_pinjaman_bank', 'is_setoran_modal', 'is_penerimaan_piutang'];
        for (const type of penerimaanTypes) {
          if (facts[type] === 'yes') {
            for (const other of penerimaanTypes) {
              if (other !== type && facts[other] === undefined) facts[other] = 'no';
            }
          }
        }

        const pengeluaranTypes = ['is_pembelian_aset', 'is_prive', 'is_beban_gaji', 'is_beban_utilitas', 'is_beban_sewa', 'is_beban_atk', 'is_beban_pemasaran', 'is_pelunasan_hutang_dagang', 'is_pelunasan_hutang_bank'];
        for (const type of pengeluaranTypes) {
          if (facts[type] === 'yes') {
            for (const other of pengeluaranTypes) {
              if (other !== type && facts[other] === undefined) facts[other] = 'no';
            }
          }
        }

        for (const rule of activeRules) {
          let ruleStatus = 'passed';
          
          const sortedConds = [...rule.conditions].sort((a, b) => {
            const idxA = FACT_ORDER.indexOf(a.fact_name);
            const idxB = FACT_ORDER.indexOf(b.fact_name);
            return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
          });

          for (const cond of sortedConds) {
            const factValue = facts[cond.fact_name];
            if (factValue !== undefined) {
              if (factValue !== cond.expected_value) {
                ruleStatus = 'failed';
                break;
              }
            } else {
              ruleStatus = 'blocked';
              if (!nextQuestion) {
                 nextQuestion = cond.fact_name;
              }
              break; 
            }
          }

          if (ruleStatus === 'passed') {
            provenRule = rule;
            break;
          } else if (ruleStatus === 'blocked') {
            break; 
          }
        }

        if (provenRule) {
          status = 'proven';
          break;
        }

        if (nextQuestion) {
          let ans = targetAnswers[nextQuestion];
          if (ans === undefined) ans = 'no'; 
          
          const qObj = questions.find(x => x.fact_name === nextQuestion);
          sequence.push({
            q: qObj?.question_text || nextQuestion,
            a: ans.toUpperCase(),
            fact_name: nextQuestion,
            code: qObj?.code || ''
          });
          facts[nextQuestion] = ans;
        } else {
          break;
        }
      }

      return sequence;
    };

    return generateQuestionSequence(rule);
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

  const getTransactionCategory = (rule) => {
    if (rule.debit_account_code !== '1-1000' && rule.debit_account_category) {
      return rule.debit_account_category;
    }
    return rule.credit_account_category || 'Aset';
  };

  const getArah = (conditions) => {
    if (!conditions) return '-';
    if (conditions.some(c => c.fact_name === 'is_inbound' && c.expected_value === 'yes')) return 'Penerimaan';
    if (conditions.some(c => c.fact_name === 'is_outbound' && c.expected_value === 'yes')) return 'Pengeluaran';
    if (conditions.some(c => c.fact_name === 'is_inbound' && c.expected_value === 'no')) return 'Pengeluaran';
    if (conditions.some(c => c.fact_name === 'is_outbound' && c.expected_value === 'no')) return 'Penerimaan';
    return '-';
  };

  const getKondisiSpesifik = (conditions) => {
    if (!conditions || conditions.length === 0) return 'Umum';
    const specific = conditions.filter(c => c.fact_name !== 'is_inbound' && c.fact_name !== 'is_outbound' && c.fact_name !== 'is_kredit');
    if (specific.length === 0) return 'Umum';
    return specific.map(c => `${c.fact_name} == ${c.expected_value.toUpperCase()}`).join(' AND ');
  };

  const getKredit = (conditions) => {
    if (!conditions) return '-';
    const cond = conditions.find(c => c.fact_name === 'is_kredit');
    if (!cond) return '-';
    return cond.expected_value ? cond.expected_value.toUpperCase() : '-';
  };

  // Filter rules by search and sub-tab type
  const filteredRules = rules.filter(r => {
    const matchesSearch = r.code.toLowerCase().includes(search.toLowerCase()) ||
                          r.name.toLowerCase().includes(search.toLowerCase()) ||
                          (r.debit_account_name && r.debit_account_name.toLowerCase().includes(search.toLowerCase())) ||
                          (r.credit_account_name && r.credit_account_name.toLowerCase().includes(search.toLowerCase()));
    
    if (nestedFilter === 'semua') return matchesSearch;
    return matchesSearch && r.business_type.toLowerCase() === nestedFilter;
  }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        /* Reset Mermaid SVG default sizing constraints for sharp zoom and pan */
        .mermaid svg,
        svg.mermaid,
        .flowchart-render-container svg {
          max-width: none !important;
          width: auto !important;
          height: auto !important;
          display: block;
          margin: 0 auto;
          overflow: visible !important;
          padding: 30px !important;
        }

        /* Force standard system font on flowchart elements to prevent text truncation inside foreignObject nodes */
        .flowchart-render-container svg *,
        .flowchart-render-container svg text,
        .flowchart-render-container svg foreignObject,
        .flowchart-render-container svg div,
        .flowchart-render-container svg span,
        svg.mermaid *,
        svg.mermaid text,
        svg.mermaid foreignObject,
        svg.mermaid div,
        svg.mermaid span,
        .flowchart-render-container * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          font-size: 15px !important;
          line-height: 1.25 !important;
        }

        /* Mermaid flowchart node interactive hover styling */
        .mermaid svg g.node:hover rect,
        .mermaid svg g.node:hover polygon,
        .mermaid svg g.node:hover circle,
        .mermaid svg g.node:hover ellipse,
        .mermaid svg g.node:hover path,
        svg.mermaid g.node:hover rect,
        svg.mermaid g.node:hover polygon,
        svg.mermaid g.node:hover circle,
        svg.mermaid g.node:hover ellipse,
        svg.mermaid g.node:hover path,
        .flowchart-render-container svg g.node:hover rect,
        .flowchart-render-container svg g.node:hover polygon,
        .flowchart-render-container svg g.node:hover circle,
        .flowchart-render-container svg g.node:hover ellipse,
        .flowchart-render-container svg g.node:hover path {
          fill: #eff6ff !important;
          stroke: #2563eb !important;
          stroke-width: 2px !important;
          cursor: pointer;
          filter: drop-shadow(0 4px 8px rgba(37, 99, 235, 0.15));
        }

        .mermaid svg g.node rect,
        .mermaid svg g.node polygon,
        .mermaid svg g.node circle,
        .mermaid svg g.node ellipse,
        .mermaid svg g.node path,
        svg.mermaid g.node rect,
        svg.mermaid g.node polygon,
        svg.mermaid g.node circle,
        svg.mermaid g.node ellipse,
        svg.mermaid g.node path,
        .flowchart-render-container svg g.node rect,
        .flowchart-render-container svg g.node polygon,
        .flowchart-render-container svg g.node circle,
        .flowchart-render-container svg g.node ellipse,
        .flowchart-render-container svg g.node path {
          transition: fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease;
        }

        .mermaid svg g.edgePath:hover path.path,
        svg.mermaid g.edgePath:hover path.path,
        .flowchart-render-container svg g.edgePath:hover path.path {
          stroke: #2563eb !important;
          stroke-width: 2.5px !important;
        }

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
        @keyframes pulseGlow {
          0% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes pulseGlowRed {
          0% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.9); opacity: 0.6; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .glowing-dot-active {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          display: inline-block;
          animation: pulseGlow 1.8s infinite ease-in-out;
        }
        .glowing-dot-draft {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          display: inline-block;
          animation: pulseGlowRed 1.8s infinite ease-in-out;
        }
        .rule-tab-btn {
          padding: 1.1rem 1.75rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 1.05rem;
          cursor: pointer;
          position: relative;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 0.75rem;
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
          height: 4px;
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
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
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
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.75rem 2rem', borderRadius: '16px', borderLeft: '6px solid var(--primary)', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Rules</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)', lineHeight: 1.1 }}>{rules.length}</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Definisi Sistem Pakar</span>
        </div>
        <div className="card" style={{ padding: '1.75rem 2rem', borderRadius: '16px', borderLeft: '6px solid #10b981', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Akurasi Klasifikasi</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.25rem 0', color: '#10b981', lineHeight: 1.1 }}>98.4%</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 700 }}>Berdasarkan SAK EMKM</span>
        </div>
        <div className="card" style={{ padding: '1.75rem 2rem', borderRadius: '16px', borderLeft: '6px solid #3b82f6', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aturan Aktif</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)', lineHeight: 1.1 }}>{rules.filter(r => r.is_active === 1).length}</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{rules.filter(r => r.is_active === 0).length} Disimpan Draft</span>
        </div>
        <div className="card" style={{ padding: '1.75rem 2rem', borderRadius: '16px', borderLeft: '6px solid #7c3aed', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Fakta</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0.25rem 0', color: '#7c3aed', lineHeight: 1.1 }}>{questions.length}</h2>
          <span style={{ fontSize: '0.9rem', color: '#7c3aed', fontWeight: 700 }}>Parameter Pertanyaan</span>
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
        </div>
      </div>

      {/* Tab 1: Daftar Aturan */}
      {activeTab === 'list' && (
        <div className="anim-fade-in">
          <div className="card" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
            {/* Table Actions Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', backgroundColor: 'var(--background)' }}>
              
              {/* Nested Business Type Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--surface)', padding: '6px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                {[
                  { id: 'semua', label: 'Semua Usaha' },
                  { id: 'jasa', label: 'Usaha Jasa' },
                  { id: 'dagang', label: 'Usaha Dagang' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setNestedFilter(tab.id)}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: nestedFilter === tab.id ? 'var(--primary)' : 'transparent',
                      color: nestedFilter === tab.id ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search & Add Rule */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end', maxWidth: '550px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <SearchIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari Kode, Nama, atau Hasil Akun..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '40px', paddingRight: '12px', paddingTop: '0.65rem', paddingBottom: '0.65rem', borderRadius: '10px', fontSize: '1rem' }}
                  />
                </div>

                {isAdmin && (
                  <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="btn btn-primary"
                    style={{ padding: '0.65rem 1.3rem', fontSize: '0.95rem', borderRadius: '10px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <PlusIcon className="w-5 h-5" /> Tambah Rule
                  </button>
                )}
              </div>
            </div>

            {/* Rules Table */}
            <div className="table-container" style={{ border: 'none', margin: 0, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: 'var(--background)' }}>
                    <th style={{ width: '12%', padding: '1.25rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Kode Aturan</th>
                    <th style={{ width: '30%', padding: '1.25rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Nama Aturan</th>
                    <th style={{ width: '15%', padding: '1.25rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Jenis Usaha</th>
                    <th style={{ width: '23%', padding: '1.25rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Hasil Akun (THEN)</th>
                    <th style={{ width: '10%', padding: '1.25rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ width: '10%', padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Aksi</th>
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
                          <td style={{ padding: '1.25rem 1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-primary)' }}>{rule.code}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{rule.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rule.description || 'Tidak ada deskripsi.'}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span className="badge" style={{
                              backgroundColor: rule.business_type === 'jasa' ? 'rgba(124, 58, 237, 0.08)' : rule.business_type === 'dagang' ? 'rgba(16, 185, 129, 0.08)' : 'var(--background)',
                              color: rule.business_type === 'jasa' ? '#7c3aed' : rule.business_type === 'dagang' ? '#10b981' : 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px'
                            }}>
                              {rule.business_type === 'semua' ? 'Semua Bisnis' : rule.business_type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className="badge" style={{
                                backgroundColor: rule.debit_account_id ? debitTheme.bg : 'var(--background)',
                                color: rule.debit_account_id ? debitTheme.color : 'var(--text-secondary)',
                                border: `1px solid ${rule.debit_account_id ? debitTheme.border : 'var(--border)'}`,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px'
                              }}>
                                <span style={{ marginRight: '4px', opacity: 0.7 }}>[Dr]</span>
                                {rule.debit_account_id ? `${rule.debit_account_code} - ${rule.debit_account_name}` : 'Pilih Dinamis (Beban/Aset)'}
                              </span>
                              <span className="badge" style={{
                                backgroundColor: rule.credit_account_id ? creditTheme.bg : 'var(--background)',
                                color: rule.credit_account_id ? creditTheme.color : 'var(--text-secondary)',
                                border: `1px solid ${rule.credit_account_id ? creditTheme.border : 'var(--border)'}`,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px'
                              }}>
                                <span style={{ marginRight: '4px', opacity: 0.7 }}>[Cr]</span>
                                {rule.credit_account_id ? `${rule.credit_account_code} - ${rule.credit_account_name}` : 'Pilih Dinamis (Hutang/Kas)'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleActive(rule); }}
                              disabled={!isAdmin}
                              className={`badge ${rule.is_active === 1 ? 'badge-success' : 'badge-danger'}`}
                              style={{ border: 'none', cursor: isAdmin ? 'pointer' : 'default', fontWeight: 700, fontSize: '0.825rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}
                            >
                              {rule.is_active === 1 ? 'Aktif' : 'Draft'}
                            </button>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => { setSelectedRule(rule); setActiveTab('visualizer'); }}
                                className="action-btn action-tooltip"
                                data-tooltip="Lihat Flowchart"
                                aria-label="Lihat Flowchart"
                              >
                                <EyeIcon style={{ width: '22px', height: '22px' }} />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleEditClick(rule)}
                                    className="action-btn action-tooltip"
                                    data-tooltip="Edit Rule"
                                    aria-label="Edit Rule"
                                  >
                                    <EditIcon style={{ width: '20px', height: '20px' }} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(rule)}
                                    className="action-btn action-btn-danger action-tooltip"
                                    data-tooltip="Hapus Rule"
                                    aria-label="Hapus Rule"
                                  >
                                    <TrashIcon style={{ width: '20px', height: '20px' }} />
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
                {(() => {
                  const mainCategory = selectedRule.debit_account_category || selectedRule.credit_account_category || 'Aset';
                  const theme = CATEGORY_THEMES[mainCategory] || CATEGORY_THEMES['Aset'];
                  
                  const getSoftGradient = (category) => {
                    switch (category) {
                      case 'Aset': return 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.01) 100%)';
                      case 'Kewajiban': return 'linear-gradient(135deg, rgba(217, 119, 6, 0.04) 0%, rgba(217, 119, 6, 0.01) 100%)';
                      case 'Ekuitas': return 'linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(124, 58, 237, 0.01) 100%)';
                      case 'Pendapatan': return 'linear-gradient(135deg, rgba(5, 150, 105, 0.04) 0%, rgba(5, 150, 105, 0.01) 100%)';
                      case 'Beban': return 'linear-gradient(135deg, rgba(220, 38, 38, 0.04) 0%, rgba(220, 38, 38, 0.01) 100%)';
                      default: return 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.01) 100%)';
                    }
                  };

                  const getSoftShadow = (category) => {
                    switch (category) {
                      case 'Aset': return 'rgba(37, 99, 235, 0.08)';
                      case 'Kewajiban': return 'rgba(217, 119, 6, 0.08)';
                      case 'Ekuitas': return 'rgba(124, 58, 237, 0.08)';
                      case 'Pendapatan': return 'rgba(5, 150, 105, 0.08)';
                      case 'Beban': return 'rgba(220, 38, 38, 0.08)';
                      default: return 'rgba(37, 99, 235, 0.08)';
                    }
                  };

                  return (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: getSoftGradient(mainCategory),
                      padding: '1.25rem 1.75rem',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      borderLeft: `5px solid ${theme.color}`,
                      boxShadow: `0 8px 30px -4px ${getSoftShadow(mainCategory)}`,
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
                        {/* Capsule Code + Category Tag */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            backgroundColor: theme.bg,
                            color: theme.color,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            border: `1px solid ${theme.border}`
                          }}>
                            {selectedRule.code}
                          </span>
                          <span style={{
                            backgroundColor: 'rgba(243, 244, 246, 0.9)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            border: '1px solid var(--border)'
                          }}>
                            {mainCategory}
                          </span>
                        </div>
                        
                        {/* Rule Name */}
                        <h4 style={{
                          margin: 0,
                          fontSize: '1.35rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.2
                        }}>
                          {selectedRule.name}
                        </h4>
                        
                        {/* Rule Description */}
                        <p style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          maxWidth: '800px'
                        }}>
                          {selectedRule.description || 'Tidak ada deskripsi.'}
                        </p>
                      </div>

                      {/* Right Panel: Status with glowing dot */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: selectedRule.is_active === 1 ? 'var(--success-light)' : 'var(--danger-light)',
                          color: selectedRule.is_active === 1 ? 'var(--success)' : 'var(--danger)',
                          padding: '0.45rem 1rem',
                          borderRadius: '2rem',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          boxShadow: selectedRule.is_active === 1 
                            ? '0 2px 10px rgba(16, 185, 129, 0.1)' 
                            : '0 2px 10px rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${selectedRule.is_active === 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                          <span className={selectedRule.is_active === 1 ? 'glowing-dot-active' : 'glowing-dot-draft'} />
                          <span>
                            {selectedRule.is_active === 1 ? 'Aktif' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                  <div className="flow-node" style={{ borderLeft: '4px solid var(--primary)', padding: '1.25rem 1.5rem', borderRadius: '14px', minWidth: '180px' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Input Bisnis</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedRule.business_type === 'semua' ? 'Semua UMKM' : `UMKM ${selectedRule.business_type.toUpperCase()}`}
                    </span>
                  </div>

                  {/* Connective Line */}
                  <div className="flow-line"><span style={{ fontSize: '0.95rem', backgroundColor: 'var(--background)', color: 'var(--text-muted)', padding: '0 8px', fontWeight: 800 }}>IF</span></div>

                  {/* Node 2: Sequence of Questions (Narrative Path) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '480px', zIndex: 1 }}>
                    {getRuleNarrative(selectedRule.code).map((step, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <div style={{ textAlign: 'center', margin: '4px 0' }}>
                            <span style={{
                              backgroundColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.75rem',
                              borderRadius: '6px'
                            }}>
                              SELANJUTNYA ⬇
                            </span>
                          </div>
                        )}
                        <div style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.015)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '80%' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                              Pertanyaan {idx + 1} {step.code && `(${step.code})`} &middot; Fakta: <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{step.fact_name}</code>
                            </span>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                              {step.q}
                            </span>
                            {step.skipIf && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px', fontStyle: 'italic' }}>
                                *Dilewati otomatis jika profil UMKM adalah {step.skipIf}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Jawaban</span>
                            <span style={{
                              backgroundColor: step.a.includes('YES') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: step.a.includes('YES') ? 'var(--success)' : 'var(--danger)',
                              fontSize: '0.95rem',
                              fontWeight: 800,
                              padding: '0.35rem 0.85rem',
                              borderRadius: '6px'
                            }}>
                              {step.a}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                    {getRuleNarrative(selectedRule.code).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1.5rem', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Tidak ada urutan pertanyaan tersedia.</div>
                    )}
                  </div>

                  {/* Connective Line */}
                  <div className="flow-line"><span style={{ fontSize: '0.95rem', backgroundColor: 'var(--background)', color: 'var(--text-muted)', padding: '0 8px', fontWeight: 800 }}>THEN</span></div>

                  {/* Node 3: Output (Double-Entry Solution) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                            minWidth: '260px',
                            padding: '1.25rem 1.5rem',
                            borderRadius: '14px',
                            textAlign: 'left',
                            boxShadow: selectedRule.debit_account_id ? `0 8px 20px ${theme.shadow}` : 'none'
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '0.85rem', color: selectedRule.debit_account_id ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Akun Debit [Dr]
                          </span>
                          <h4 style={{ color: selectedRule.debit_account_id ? 'white' : 'var(--text-primary)', fontSize: '1.35rem', fontWeight: 800, margin: '0.35rem 0', fontFamily: 'var(--font-mono)' }}>
                            {selectedRule.debit_account_id ? selectedRule.debit_account_code : 'DINAMIS'}
                          </h4>
                          <div style={{ color: selectedRule.debit_account_id ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>
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
                            minWidth: '260px',
                            padding: '1.25rem 1.5rem',
                            borderRadius: '14px',
                            textAlign: 'left',
                            boxShadow: selectedRule.credit_account_id ? `0 8px 20px ${theme.shadow}` : 'none'
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '0.85rem', color: selectedRule.credit_account_id ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Akun Kredit [Cr]
                          </span>
                          <h4 style={{ color: selectedRule.credit_account_id ? 'white' : 'var(--text-primary)', fontSize: '1.35rem', fontWeight: 800, margin: '0.35rem 0', fontFamily: 'var(--font-mono)' }}>
                            {selectedRule.credit_account_id ? selectedRule.credit_account_code : 'DINAMIS'}
                          </h4>
                          <div style={{ color: selectedRule.credit_account_id ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>
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
                  borderRadius: '16px',
                  padding: '1.75rem',
                  marginTop: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  width: '100%'
                }}>
                  <h5 style={{ 
                    margin: '0 0 1.5rem 0', 
                    fontSize: '1.3rem', 
                    fontWeight: 800, 
                    color: 'var(--primary)', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    backgroundColor: 'var(--primary-light)',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(37, 99, 235, 0.12)'
                  }}>
                    Narasi Logika Pengambilan Keputusan
                  </h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {getRuleNarrative(selectedRule.code).map((step, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        gap: '1.25rem', 
                        alignItems: 'flex-start',
                        padding: '1rem 0',
                        borderBottom: idx < getRuleNarrative(selectedRule.code).length - 1 ? '1px dashed var(--border)' : 'none'
                      }}>
                        {/* Step index label */}
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          textTransform: 'uppercase',
                          minWidth: '95px',
                          paddingTop: '2px',
                          letterSpacing: '0.05em'
                        }}>
                          Langkah {idx + 1}
                        </span>
                        
                        {/* Question text & fact name */}
                        <div style={{
                          color: 'var(--text-primary)',
                          fontSize: '1.05rem',
                          lineHeight: 1.5,
                          flex: 1
                        }}>
                          {step.code && <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: '8px', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>[{step.code}]</span>}
                          {step.q}
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>({step.fact_name})</span>
                        </div>

                        {/* Answer Badge */}
                        <span style={{
                          backgroundColor: step.a.includes('YES') ? 'var(--success-light)' : 'var(--danger-light)',
                          color: step.a.includes('YES') ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${step.a.includes('YES') ? 'var(--success-border)' : 'rgba(239, 68, 68, 0.2)'}`,
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          padding: '0.4rem 1.1rem',
                          borderRadius: '6px',
                          minWidth: '70px',
                          textAlign: 'center',
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          {step.a.includes('YES') ? 'YES' : 'NO'}
                        </span>
                      </div>
                    ))}

                    {/* Final Conclusion Banner Card */}
                    {getRuleNarrative(selectedRule.code).length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '1.5rem', 
                        alignItems: 'center', 
                        marginTop: '1.75rem', 
                        padding: '1.5rem 1.75rem', 
                        borderRadius: '12px',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderLeft: '5px solid var(--primary)',
                        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.05), 0 8px 10px -6px rgba(37, 99, 235, 0.05)'
                      }}>
                        {/* SVG Shield-Check Icon */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(37, 99, 235, 0.08)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '28px', height: '28px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Hasil Akhir Klasifikasi
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.45rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <span>{selectedRule.name}</span>
                            <span style={{ 
                              backgroundColor: 'var(--primary-light)', 
                              color: 'var(--primary)', 
                              fontWeight: 850, 
                              fontSize: '0.9rem', 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '6px',
                              fontFamily: 'var(--font-mono)' 
                            }}>{selectedRule.code}</span>
                          </div>
                          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
                            Sistem pakar menyimpulkan transaksi ini diklasifikasikan sebagai <strong>{selectedRule.name}</strong> berdasarkan alur logika yang terpenuhi di atas.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {getRuleNarrative(selectedRule.code).length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                        Narasi belum tersedia untuk aturan ini.
                      </div>
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

      {/* Tab 4: Daftar Fakta */}
      {activeTab === 'fakta' && (
        <div className="anim-fade-in">
          <div className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Daftar Fakta (Facts)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  Fakta adalah variabel pertanyaan (parameter input) yang bertugas sebagai penentu kondisi (IF) dalam sistem pakar ini.
                </p>
              </div>
              {isAdmin && (
                <button className="btn btn-primary" onClick={handleFactAddClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '10px' }}>
                  ➕ Tambah Fakta Baru
                </button>
              )}
            </div>

            <div className="table-container" style={{ border: 'none', margin: 0 }}>
              <table className="table">
                <thead style={{ background: 'var(--background)' }}>
                  <tr>
                    <th style={{ padding: '1rem', width: '15%' }}>Kode Fakta</th>
                    <th style={{ padding: '1rem', width: '25%' }}>Variabel (Fact Name)</th>
                    <th style={{ padding: '1rem', width: '45%' }}>Pertanyaan User</th>
                    {isAdmin && <th style={{ padding: '1rem', width: '15%', textAlign: 'center' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{q.code}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--primary)' }}>{q.fact_name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{q.question_text}</td>
                      {isAdmin && (
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleFactEditClick(q)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                            title="Edit Fakta"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleFactDeleteClick(q)}
                            className="btn btn-danger"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--danger)', color: 'white', border: 'none' }}
                            title="Hapus Fakta"
                          >
                            🗑️ Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div 
              ref={flowchartContainerRef}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                setIsDragging(true);
                setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                height: 'calc(100vh - 280px)',
                minHeight: '600px',
                overflow: 'hidden',
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
            >
              {/* Floating Zoom Controls */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(4px)',
                padding: '0.35rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(prev + 0.2, 6)); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    color: 'var(--text-primary)'
                  }}
                  title="Zoom In"
                >
                  ＋
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(prev - 0.2, 0.3)); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    color: 'var(--text-primary)'
                  }}
                  title="Zoom Out"
                >
                  －
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); const defaultScale = window.innerWidth < 768 ? 0.90 : 1.70; setScale(defaultScale); setPan({ x: 0, y: 0 }); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'white',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)'
                  }}
                  title="Reset Zoom & Position"
                >
                  ⟲
                </button>
              </div>

              {/* Zoom & Pan Wrapper */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '2rem',
                transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${scale})`,
                transformOrigin: 'top center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                display: 'inline-block'
              }}>
                <div ref={flowchartRef} className="flowchart-render-container" style={{ display: 'inline-block' }} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Decision Table (Tabel Keputusan)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Tabel ini sangat cocok dicetak dan ditunjukkan kepada pakar akuntansi untuk <em>Face Validity</em>. Pakar dapat dengan mudah membaca kombinasi dari kiri ke kanan untuk memvalidasi apakah kode akun di kolom paling kanan sudah tepat. Tanda strip (" - ") mengindikasikan <em>Don't Care</em>.
            </p>
            <div style={{ 
              overflowX: 'auto', 
              border: '1px solid var(--border)', 
              borderRadius: '12px',
              boxShadow: 'var(--shadow-sm)',
              backgroundColor: 'var(--surface)'
            }}>
              <table className="table" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', width: '100%', margin: 0 }}>
                <thead style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
                  <tr>
                    <th style={{ padding: '1rem', borderRight: '1px solid var(--border)', fontWeight: 800, color: 'var(--text-primary)' }}>Rule ID</th>
                    <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Kategori Akun</th>
                    <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Jenis Usaha</th>
                    <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Arah Transaksi</th>
                    <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Kondisi Spesifik</th>
                    <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Kredit?</th>
                    <th style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 800 }}>Hasil Jurnal (Debit / Kredit)</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    const kreditVal = getKredit(rule.conditions);
                    return (
                      <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ 
                          fontWeight: 800, 
                          fontFamily: 'var(--font-mono)', 
                          color: 'var(--primary)', 
                          borderRight: '1px solid var(--border)',
                          backgroundColor: 'rgba(37, 99, 235, 0.02)',
                          padding: '1rem'
                        }}>{rule.code}</td>
                        <td style={{ padding: '1rem' }}>{getTransactionCategory(rule)}</td>
                        <td style={{ padding: '1rem' }}>{rule.business_type === 'semua' ? 'SEMUA' : rule.business_type.toUpperCase()}</td>
                        <td style={{ padding: '1rem' }}>{getArah(rule.conditions)}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, padding: '1rem' }}>{getKondisiSpesifik(rule.conditions)}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            backgroundColor: kreditVal === 'YES' ? 'var(--success-light)' : kreditVal === 'NO' ? 'var(--danger-light)' : 'var(--background)',
                            color: kreditVal === 'YES' ? 'var(--success)' : kreditVal === 'NO' ? 'var(--danger)' : 'var(--text-secondary)',
                            border: `1px solid ${kreditVal === 'YES' ? 'var(--success-border)' : kreditVal === 'NO' ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)'}`,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}>
                            {kreditVal}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{
                              backgroundColor: rule.debit_account_id ? 'rgba(37, 99, 235, 0.05)' : 'var(--background)',
                              color: rule.debit_account_id ? 'var(--primary)' : 'var(--text-secondary)',
                              border: `1px solid ${rule.debit_account_id ? 'rgba(37, 99, 235, 0.15)' : 'var(--border)'}`,
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              width: 'fit-content'
                            }}>
                              <span style={{ marginRight: '6px', fontWeight: 800, opacity: 0.8 }}>[Dr]</span>
                              {rule.debit_account_id ? `${rule.debit_account_code} - ${rule.debit_account_name}` : 'Dinamis (Pilihan User)'}
                            </span>
                            
                            <span style={{
                              backgroundColor: rule.credit_account_id ? 'rgba(124, 58, 237, 0.05)' : 'var(--background)',
                              color: rule.credit_account_id ? '#7c3aed' : 'var(--text-secondary)',
                              border: `1px solid ${rule.credit_account_id ? 'rgba(124, 58, 237, 0.15)' : 'var(--border)'}`,
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              width: 'fit-content'
                            }}>
                              <span style={{ marginRight: '6px', fontWeight: 800, opacity: 0.8 }}>[Cr]</span>
                              {rule.credit_account_id ? `${rule.credit_account_code} - ${rule.credit_account_name}` : 'Dinamis (Kas/Hutang)'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal: Add/Edit Fact */}
      {showFactModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '500px', borderRadius: '16px', border: '1px solid var(--border)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {factFormMode === 'add' ? 'Tambah Fakta Baru' : 'Edit Fakta'}
              </h3>
              <button 
                onClick={() => setShowFactModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >✕</button>
            </div>

            <form onSubmit={handleFactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Kode Fakta <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={factCode}
                  onChange={(e) => setFactCode(e.target.value)}
                  placeholder="Contoh: Q-010"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Nama Variabel (Fact Name) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={factName}
                  onChange={(e) => setFactName(e.target.value)}
                  placeholder="Contoh: is_beban_akrual (Harus diawali 'is_')"
                  required
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Wajib menggunakan snake_case dan diawali dengan <code>is_</code> (contoh: <code>is_tunai</code>, <code>is_jasa</code>).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Teks Pertanyaan User <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea 
                  className="form-control" 
                  value={factQuestionText}
                  onChange={(e) => setFactQuestionText(e.target.value)}
                  placeholder="Contoh: Apakah transaksi ini merupakan beban yang ditangguhkan?"
                  rows="3"
                  required
                />
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem', margin: 0, gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowFactModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 700 }}
                >
                  {factFormMode === 'add' ? 'Simpan Fakta' : 'Perbarui Fakta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
