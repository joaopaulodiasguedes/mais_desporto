import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Athlete, UserProfile } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Contact,
  Users,
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  CreditCard,
  Search,
  Filter,
  ShieldCheck,
  Activity,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
  Camera,
  Upload
} from 'lucide-react';

interface GuardiansTabProps {
  onOpenPdf?: (title: string, url: string) => void;
}

export interface GuardianRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  nif?: string;
  address?: string;
  relation: string;
  profession?: string;
  notes?: string;
  avatarUrl?: string;
  athletes: Athlete[];
}

export const GuardiansTab: React.FC<GuardiansTabProps> = ({ onOpenPdf }) => {
  const {
    athletes,
    availableUsers,
    currentUser,
    rolePermissions,
    setActiveTab,
    showToast,
    ageCategories,
    addGuardian,
    updateGuardian,
    deleteGuardian
  } = useApp();

  const canManage =
    currentUser.role === 'treinador' ||
    Boolean(currentUser.isAdmin) ||
    rolePermissions[currentUser.role]?.canManageAthletes ||
    rolePermissions[currentUser.role]?.canManageCoaches;

  const isCurrentUserThisGuardian = (g: GuardianRecord | null) => {
    if (!g || currentUser.role !== 'encarregado') return false;
    return (
      g.id === currentUser.id ||
      (currentUser.email && g.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.name && g.name?.toLowerCase() === currentUser.name.toLowerCase())
    );
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'ficha' | 'grelha'>('ficha');

  // Modal and CRUD state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<GuardianRecord | null>(null);
  const [guardianToDelete, setGuardianToDelete] = useState<GuardianRecord | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    relation: 'Pai / Mãe',
    email: '',
    phone: '',
    altPhone: '',
    nif: '',
    address: '',
    profession: '',
    notes: '',
    athleteIds: [] as string[],
    avatarUrl: ''
  });

  const handleOpenAdd = () => {
    setEditingGuardian(null);
    setFormData({
      name: '',
      relation: 'Pai / Mãe',
      email: '',
      phone: '',
      altPhone: '',
      nif: '',
      address: '',
      profession: '',
      notes: '',
      athleteIds: [],
      avatarUrl: ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (guardian: GuardianRecord) => {
    setEditingGuardian(guardian);
    setFormData({
      name: guardian.name || '',
      relation: guardian.relation || 'Pai / Mãe',
      email: guardian.email || '',
      phone: guardian.phone || '',
      altPhone: guardian.altPhone || '',
      nif: guardian.nif || '',
      address: guardian.address || '',
      profession: guardian.profession || '',
      notes: guardian.notes || '',
      athleteIds: guardian.athletes.map(a => a.id),
      avatarUrl: guardian.avatarUrl || ''
    });
    setIsFormModalOpen(true);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, avatarUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showToast('Por favor preencha o Nome, Email e Telemóvel.', 'info');
      return;
    }

    if (editingGuardian) {
      updateGuardian(
        editingGuardian.id,
        formData,
        { email: editingGuardian.email, name: editingGuardian.name }
      );
      setSelectedGuardianId(editingGuardian.id);
    } else {
      const newId = addGuardian(formData);
      if (newId) {
        setSelectedGuardianId(newId);
        setViewMode('ficha');
      }
    }
    setIsFormModalOpen(false);
  };

  // Build unified and deduplicated list of guardians from users and athletes
  const allGuardians = useMemo<GuardianRecord[]>(() => {
    const list: GuardianRecord[] = [];
    const processedEmails = new Set<string>();
    const processedNames = new Set<string>();

    // 1. Process explicit user accounts with role === 'encarregado'
    const parentUsers = availableUsers.filter((u) => u.role === 'encarregado');
    parentUsers.forEach((u) => {
      // Find associated athletes with flexible matching
      const cleanUName = (u.name || '').replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const relatedAthletes = athletes.filter((a) => {
        if (u.relatedAthleteIds && u.relatedAthleteIds.map(String).includes(String(a.id))) return true;
        if (a.guardianId && String(a.guardianId) === String(u.id)) return true;
        if (uEmail && a.guardianEmail && a.guardianEmail.trim().toLowerCase() === uEmail) return true;
        if (a.guardianName) {
          const cleanAName = a.guardianName.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
          if (cleanAName && cleanUName && (cleanAName.includes(cleanUName) || cleanUName.includes(cleanAName))) {
            return true;
          }
        }
        return false;
      });

      // Determine relation from name or default
      let relation = u.relation || 'Pai / Mãe';
      if (!u.relation) {
        if (u.name.toLowerCase().includes('(mãe)') || u.name.toLowerCase().includes('mãe')) {
          relation = 'Mãe';
        } else if (u.name.toLowerCase().includes('(pai)') || u.name.toLowerCase().includes('pai')) {
          relation = 'Pai';
        }
      }

      list.push({
        id: u.id,
        name: u.name.replace(/\s*\((Pai|Mãe|Tutor|Avô|Avó|Outro|Encarregado)\)\s*/gi, '').trim(),
        email: u.email || '',
        phone: u.phone || '',
        altPhone: u.altPhone || '',
        nif: u.nif || '',
        address: u.address || '',
        relation,
        profession: u.profession || '',
        notes: u.notes || '',
        avatarUrl: u.avatarUrl,
        athletes: relatedAthletes
      });

      if (u.email) processedEmails.add(u.email.toLowerCase());
      processedNames.add(u.name.toLowerCase());
    });

    // 2. Process any other guardians present in athletes list not yet processed
    athletes.forEach((ath) => {
      const gName = ath.guardianName?.trim();
      const gEmail = ath.guardianEmail?.trim()?.toLowerCase();
      const isSelf = gName?.toLowerCase().includes('próprio') || gName?.toLowerCase().includes('auto-responsável');

      if (gName && !isSelf) {
        const alreadyExists =
          (gEmail && processedEmails.has(gEmail)) ||
          processedNames.has(gName.toLowerCase()) ||
          list.some(
            (g) =>
              g.name.toLowerCase() === gName.toLowerCase() ||
              (gEmail && g.email.toLowerCase() === gEmail)
          );

        if (!alreadyExists) {
          // Gather all athletes for this guardian
          const aths = athletes.filter(
            (a) =>
              (gEmail && a.guardianEmail && a.guardianEmail.toLowerCase() === gEmail) ||
              (a.guardianName && a.guardianName.toLowerCase() === gName.toLowerCase())
          );

          let relation = 'Pai / Mãe';
          if (ath.emergencyContact?.toLowerCase().includes('mãe')) relation = 'Mãe';
          if (ath.emergencyContact?.toLowerCase().includes('pai')) relation = 'Pai';

          const stableId = ath.guardianId || `guard-${gName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unlinked'}`;

          list.push({
            id: stableId,
            name: gName,
            email: ath.guardianEmail || '',
            phone: ath.guardianPhone || ath.emergencyContact || '',
            altPhone: ath.emergencyContact,
            nif: (ath as any).guardianNif || '',
            address: ath.address || '',
            relation,
            profession: '',
            notes: ath.notes || '',
            athletes: aths
          });

          if (gEmail) processedEmails.add(gEmail);
          processedNames.add(gName.toLowerCase());
        }
      }
    });

    return list;
  }, [availableUsers, athletes]);

  // Selected guardian in detailed view
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>(() => {
    if (currentUser.role === 'encarregado' && allGuardians.length > 0) {
      const match = allGuardians.find(
        g => g.id === currentUser.id ||
             (currentUser.email && g.email.toLowerCase() === currentUser.email.toLowerCase()) ||
             (currentUser.name && g.name.toLowerCase() === currentUser.name.toLowerCase())
      );
      if (match) return match.id;
    }
    return allGuardians[0]?.id || '';
  });

  useEffect(() => {
    if (currentUser.role === 'encarregado' && allGuardians.length > 0) {
      const match = allGuardians.find(
        g => g.id === currentUser.id ||
             (currentUser.email && g.email.toLowerCase() === currentUser.email.toLowerCase()) ||
             (currentUser.name && g.name.toLowerCase() === currentUser.name.toLowerCase())
      );
      if (match && selectedGuardianId !== match.id) {
        setSelectedGuardianId(match.id);
      }
    }
  }, [currentUser, allGuardians]);

  // Filtered guardians based on search & category
  const filteredGuardians = useMemo(() => {
    return allGuardians.filter((g) => {
      const matchesSearch =
        searchTerm === '' ||
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.athletes.some((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'todos' ||
        g.athletes.some((a) => a.category.toLowerCase().includes(categoryFilter.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  }, [allGuardians, searchTerm, categoryFilter]);

  // Active guardian for detailed view
  const activeGuardian = useMemo(() => {
    const found = filteredGuardians.find((g) => g.id === selectedGuardianId);
    if (found) return found;
    return filteredGuardians[0] || allGuardians[0] || null;
  }, [filteredGuardians, selectedGuardianId, allGuardians]);

  // Selected athlete under active guardian
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');

  const activeAthlete = useMemo(() => {
    if (!activeGuardian || activeGuardian.athletes.length === 0) return null;
    const found = activeGuardian.athletes.find((a) => a.id === selectedAthleteId);
    return found || activeGuardian.athletes[0];
  }, [activeGuardian, selectedAthleteId]);

  // Helper age calculation
  const calculateAge = (birthDateStr?: string): number | null => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado para a área de transferência!`, 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Contact className="w-5 h-5 text-purple-600" />
            Encarregados de Educação
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {filteredGuardians.length} encarregados registados no clube
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar encarregado ou atleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="todos">Todos os Escalões</option>
            {ageCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('ficha')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'ficha'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ficha
            </button>
            <button
              onClick={() => setViewMode('grelha')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grelha'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lista ({filteredGuardians.length})
            </button>
          </div>

          {/* Novo Encarregado Button (Treinador) */}
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Encarregado</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: FICHA COMPLETA (ESTILO ÁREA DOS PAIS - MODO LEITURA) */}
      {/* ========================================================================= */}
      {viewMode === 'ficha' && (
        <div className="space-y-6">
          {/* Encarregado Selector & Atleta a Cargo Selector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Contact className="w-4 h-4 text-purple-600" />
                  Selecionar Encarregado de Educação para Consulta:
                </label>
                <select
                  value={activeGuardian?.id || ''}
                  onChange={(e) => {
                    setSelectedGuardianId(e.target.value);
                    const selG = allGuardians.find((g) => g.id === e.target.value);
                    if (selG && selG.athletes.length > 0) {
                      setSelectedAthleteId(selG.athletes[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-purple-200 bg-purple-50/40 text-slate-800 font-bold text-sm focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
                >
                  {filteredGuardians.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.relation}) — {g.athletes.length} atleta(s) a cargo: {g.athletes.map((a) => a.name).join(', ') || 'Nenhum'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Athletes tabs for active guardian if multiple */}
              {activeGuardian && activeGuardian.athletes.length > 0 && (
                <div className="sm:self-end">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    Atleta a Cargo Selecionado:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeGuardian.athletes.map((ath) => {
                      const isSelected = activeAthlete?.id === ath.id;
                      return (
                        <button
                          key={ath.id}
                          type="button"
                          onClick={() => setSelectedAthleteId(ath.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{ath.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {ath.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeGuardian ? (
            <div className="space-y-6">
              {/* =================================================================== */}
              {/* SEÇÃO 1: DADOS DO ENCARREGADO DE EDUCAÇÃO */}
              {/* =================================================================== */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeGuardian.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'}
                      alt={activeGuardian.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-200 shadow-xs shrink-0 bg-purple-50"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {activeGuardian.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {activeGuardian.relation} • Ficha Oficial de Identificação
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                      {activeGuardian.relation}
                    </span>
                    {(canManage || isCurrentUserThisGuardian(activeGuardian)) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(activeGuardian)}
                          className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-purple-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar Ficha</span>
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setGuardianToDelete(activeGuardian)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-red-200"
                            title="Eliminar Encarregado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {/* Nome Completo */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Nome Completo do Encarregado
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800">
                      <User className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">{activeGuardian.name}</span>
                    </div>
                  </div>

                  {/* Parentesco e NIF */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        Grau de Parentesco
                      </label>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 truncate">
                        {activeGuardian.relation}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        NIF (Fiscal)
                      </label>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800">
                        <span>{activeGuardian.nif || '—'}</span>
                        {activeGuardian.nif && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeGuardian.nif || '', 'NIF')}
                            className="text-slate-400 hover:text-purple-600 p-0.5 cursor-pointer"
                            title="Copiar NIF"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contacto Telefónico Principal */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Telemóvel Principal
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <a
                          href={`tel:${activeGuardian.phone}`}
                          className="truncate hover:text-emerald-700 hover:underline"
                        >
                          {activeGuardian.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`tel:${activeGuardian.phone}`}
                          className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                        >
                          Ligar
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeGuardian.phone, 'Telemóvel')}
                          className="text-slate-400 hover:text-purple-600 p-1"
                          title="Copiar Telemóvel"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Oficial */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Email Oficial
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                        <a
                          href={`mailto:${activeGuardian.email}`}
                          className="truncate hover:text-blue-700 hover:underline"
                        >
                          {activeGuardian.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`mailto:${activeGuardian.email}`}
                          className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                        >
                          Email
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeGuardian.email, 'Email')}
                          className="text-slate-400 hover:text-purple-600 p-1"
                          title="Copiar Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contacto Alternativo e Profissão */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        Contacto Alternativo de Urgência
                      </label>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{activeGuardian.altPhone || 'Não indicado'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">
                        Profissão / Ocupação
                      </label>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{activeGuardian.profession || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Morada de Residência */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Morada de Residência
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{activeGuardian.address || '—'}</span>
                    </div>
                  </div>

                  {/* Observações / Notas */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Observações do Encarregado de Educação
                    </label>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 text-xs leading-relaxed">
                      {activeGuardian.notes || 'Sem observações adicionais registadas.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* SEÇÃO 2: DADOS DO(A) ATLETA A CARGO */}
              {/* =================================================================== */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Dados do Atleta a Cargo
                      </h3>
                      <p className="text-xs text-slate-500">
                        Educando:{' '}
                        <strong className="text-slate-800">
                          {activeAthlete ? activeAthlete.name : 'Nenhum atleta associado'}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100">
                    {activeAthlete?.category || 'Atleta'}
                  </span>
                </div>

                {activeAthlete ? (
                  <div className="space-y-4 text-xs sm:text-sm">
                    {/* Atleta Card Resumo */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/80 via-slate-50 to-purple-50/40 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeAthlete.photoUrl}
                          alt={activeAthlete.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-300 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-black text-slate-900 text-base">{activeAthlete.name}</h4>
                          <p className="text-xs font-bold text-teal-800">{activeAthlete.category}</p>
                          <p className="text-[11px] font-mono text-slate-500">
                            Licença: {activeAthlete.federationNumber || 'FPN pendente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Assiduidade</span>
                          <span className="text-sm font-black text-emerald-600">{activeAthlete.attendanceRate}%</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Exame Médico</span>
                          <span className={`text-xs font-black ${
                            activeAthlete.medicalStatus === 'valido'
                              ? 'text-emerald-600'
                              : activeAthlete.medicalStatus === 'a_expirar'
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}>
                            {activeAthlete.medicalStatus === 'valido'
                              ? '✓ Válido'
                              : activeAthlete.medicalStatus === 'a_expirar'
                              ? '⚠ A Expirar'
                              : '✕ Expirado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nome Completo */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          Nome Completo do Atleta
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800">
                          {activeAthlete.name}
                        </div>
                      </div>

                      {/* Data de Nascimento & Idade */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block mb-1">
                            Data de Nascimento
                          </label>
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{activeAthlete.birthDate || 'Não registada'}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 block mb-1">
                            Idade & Escalão
                          </label>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-teal-800">
                            {calculateAge(activeAthlete.birthDate) !== null
                              ? `${calculateAge(activeAthlete.birthDate)} anos • ${activeAthlete.category}`
                              : activeAthlete.category}
                          </div>
                        </div>
                      </div>

                      {/* Nº Licença Federativa */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          Nº Licença Federativa / Bilhete
                        </label>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800">
                          <span>{activeAthlete.federationNumber || 'Pendente de emissão'}</span>
                          {activeAthlete.federationNumber && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(activeAthlete.federationNumber, 'Nº Licença')}
                              className="text-slate-400 hover:text-purple-600 p-0.5"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Contacto de Emergência Imediato */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          Contacto de Emergência Imediato
                        </label>
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 font-bold text-purple-900">
                          <Phone className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="truncate">{activeAthlete.emergencyContact || activeGuardian.phone}</span>
                        </div>
                      </div>

                      {/* Validade do Exame Médico Desportivo */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          Validade do Exame Médico Desportivo
                        </label>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <HeartPulse className="w-4 h-4 text-slate-400" />
                            <span>{activeAthlete.medicalExamExpiry || 'Sem registo'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            activeAthlete.medicalStatus === 'valido'
                              ? 'bg-emerald-100 text-emerald-800'
                              : activeAthlete.medicalStatus === 'a_expirar'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {activeAthlete.medicalStatus === 'valido' ? 'Aprovado' : activeAthlete.medicalStatus === 'a_expirar' ? 'Aviso Prévio' : 'Suspenso'}
                          </span>
                        </div>
                      </div>

                      {/* Alergias ou Cuidados Especiais */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          Alergias, Patologias ou Cuidados
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 truncate">
                          {activeAthlete.allergiesOrConditions || 'Nenhuma condição ou alergia registada'}
                        </div>
                      </div>

                      {/* Telefone e Email do Atleta */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          Contacto Telefónico do Atleta
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                          {activeAthlete.phone || 'Sem telemóvel individual (contactar encarregado)'}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">
                          Email do Atleta
                        </label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 truncate">
                          {activeAthlete.email || 'Sem email individual'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    Este encarregado de educação não tem atletas associados atualmente.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              Nenhum encarregado de educação encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: GRELHA / LISTA DE ENCARREGADOS DE EDUCAÇÃO */}
      {/* ========================================================================= */}
      {viewMode === 'grelha' && (
        filteredGuardians.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Contact className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                Nenhum encarregado de educação encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || categoryFilter !== 'todos'
                  ? 'Nenhum resultado corresponde à sua pesquisa ou filtro de escalão.'
                  : 'Ainda não existem encarregados de educação registados no clube.'}
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Encarregado</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuardians.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {g.avatarUrl ? (
                        <img
                          src={g.avatarUrl}
                          alt={g.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-200 shadow-2xs shrink-0 bg-purple-50"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-base shadow-2xs shrink-0">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                          {g.name}
                        </h4>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {g.relation}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contactos */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        Telemóvel:
                      </span>
                      <a
                        href={`tel:${g.phone}`}
                        className="font-bold text-slate-800 hover:text-emerald-600 truncate ml-2"
                      >
                        {g.phone}
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        Email:
                      </span>
                      <a
                        href={`mailto:${g.email}`}
                        className="font-bold text-slate-800 hover:text-blue-600 truncate max-w-[170px] text-right"
                      >
                        {g.email}
                      </a>
                    </div>
                  </div>

                  {/* Atletas a Cargo */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Atleta(s) a Cargo ({g.athletes.length}):
                    </span>
                    {g.athletes.length > 0 ? (
                      <div className="space-y-1">
                        {g.athletes.map((ath) => (
                          <div
                            key={ath.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={ath.photoUrl}
                                alt={ath.name}
                                className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <span className="font-bold text-slate-800 truncate">{ath.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded shrink-0">
                              {ath.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhum atleta associado</p>
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGuardianId(g.id);
                      setViewMode('ficha');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Ficha</span>
                  </button>
                  {(canManage || isCurrentUserThisGuardian(g)) && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(g)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                      title="Editar Encarregado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setGuardianToDelete(g)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-600 transition-colors cursor-pointer"
                      title="Eliminar Encarregado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: Adicionar / Editar Encarregado de Educação */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Contact className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {editingGuardian ? 'Editar Encarregado de Educação' : 'Novo Encarregado de Educação'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingGuardian
                      ? 'Atualize os dados de contacto e atletas associados'
                      : 'Preencha os dados oficiais do encarregado de educação'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Foto de Perfil */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-purple-600" />
                    Foto de Perfil do Encarregado
                  </label>
                  {formData.avatarUrl && (
                    <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Foto configurada
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={formData.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'}
                    alt="Pré-visualização"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-400/40 shadow-xs shrink-0 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Carregar Foto do Computador / Telemóvel</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      placeholder="Ou cole aqui o link / URL da foto..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Maria Santos"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Grau de Parentesco *
                  </label>
                  <select
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="Pai">Pai</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Pai / Mãe">Pai / Mãe</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Avô / Avó">Avô / Avó</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email de Contacto *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="exemplo@email.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Telemóvel Principal *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+351 912 345 678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Contacto Alternativo / Urgência
                  </label>
                  <input
                    type="tel"
                    value={formData.altPhone}
                    onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                    placeholder="+351 923 456 789"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    NIF (Número Fiscal)
                  </label>
                  <input
                    type="text"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    placeholder="9 dígitos fiscais"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Profissão / Ocupação
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Ex: Engenharia / Saúde"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Morada / Residência
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número e localidade"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* Atletas a Cargo (Vincular) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Atleta(s) a Cargo / Educandos ({formData.athleteIds.length} selecionado{formData.athleteIds.length === 1 ? '' : 's'})
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Selecione os atletas do clube sob tutela deste encarregado de educação:
                </p>
                <div className="max-h-44 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  {athletes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      Sem atletas registados no clube
                    </p>
                  ) : (
                    athletes.map((ath) => {
                      const isChecked = formData.athleteIds.includes(ath.id);
                      return (
                        <label
                          key={ath.id}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all text-xs ${
                            isChecked
                              ? 'bg-purple-100/80 border border-purple-300 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  athleteIds: isChecked
                                    ? prev.athleteIds.filter((id) => id !== ath.id)
                                    : [...prev.athleteIds, ath.id]
                                }));
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                            />
                            <img
                              src={ath.photoUrl}
                              alt={ath.name}
                              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{ath.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Licença: {ath.federationNumber || 'Pendente'}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                            {ath.category}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Observações / Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais relevantes para o clube..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {editingGuardian ? 'Salvar Alterações' : 'Criar Encarregado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Eliminação */}
      <ConfirmDeleteModal
        isOpen={!!guardianToDelete}
        onClose={() => setGuardianToDelete(null)}
        onConfirm={() => {
          if (guardianToDelete) {
            deleteGuardian(guardianToDelete.id, guardianToDelete.email, guardianToDelete.name);
            const remaining = allGuardians.filter(g => g.id !== guardianToDelete.id);
            setSelectedGuardianId(remaining[0]?.id || '');
            setGuardianToDelete(null);
          }
        }}
        title="Eliminar Encarregado de Educação"
        itemTitle={guardianToDelete ? `${guardianToDelete.name} (${guardianToDelete.relation})` : ''}
        description="Tem a certeza que pretende remover este encarregado de educação do sistema? Os atletas a cargo deixarão de ter este encarregado associado nas suas fichas federativas."
      />
    </div>
  );
};
