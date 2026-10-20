import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Athlete, UserProfile } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { formatBirthDate, formatShortName } from '../utils/athleteRules';
import { generateInitialsAvatar, isInitialsAvatar } from '../utils/avatarUtils';
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
  Upload,
  RotateCcw,
  Check
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
  address?: string;
  relation: string;
  profession?: string;
  notes?: string;
  avatarUrl?: string;
  isAlsoAthlete?: boolean;
  isCoach?: boolean;
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

  // Modal and CRUD state
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<GuardianRecord | null>(null);
  const [guardianToDelete, setGuardianToDelete] = useState<GuardianRecord | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    relation: 'Pai / Mãe',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    profession: '',
    notes: '',
    athleteIds: [] as string[],
    avatarUrl: '',
    isAlsoAthlete: false
  });

  const handleOpenAdd = () => {
    setEditingGuardian(null);
    setFormData({
      name: '',
      relation: 'Pai / Mãe',
      email: '',
      phone: '',
      altPhone: '',
      address: '',
      profession: '',
      notes: '',
      athleteIds: [],
      avatarUrl: '',
      isAlsoAthlete: false
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
      address: guardian.address || '',
      profession: guardian.profession || '',
      notes: guardian.notes || '',
      athleteIds: guardian.athletes.map(a => a.id),
      avatarUrl: guardian.avatarUrl || '',
      isAlsoAthlete: !!guardian.isAlsoAthlete
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
    const parentUsers = availableUsers.filter((u) => u.role === 'encarregado' || (u.isAlsoGuardian && u.status !== 'rejeitado'));
    parentUsers.forEach((u) => {
      // Find associated athletes with flexible matching
      const cleanUName = (u.name || '').replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const relatedAthletes = athletes.filter((a) => {
        if (u.relatedAthleteIds && u.relatedAthleteIds.map(String).includes(String(a.id))) return true;
        if (a.guardianId && String(a.guardianId) === String(u.id)) return true;
        if (uEmail && a.guardianEmail && a.guardianEmail.trim().toLowerCase() === uEmail) return true;
        // Sem id/email, só associa por nome exato (sem parentesco) e se o atleta não tiver outro encarregado definido
        if (a.guardianName && !a.guardianId && !a.guardianEmail) {
          const cleanAName = a.guardianName.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
          if (cleanAName && cleanUName && cleanAName === cleanUName) {
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
        address: u.address || '',
        relation,
        profession: u.profession || '',
        notes: u.notes || '',
        avatarUrl: u.avatarUrl,
        isAlsoAthlete: !!u.isAlsoAthlete,
        isCoach: u.role === 'treinador',
        athletes: relatedAthletes
      });

      if (u.email) processedEmails.add(u.email.toLowerCase());
      processedNames.add(u.name.toLowerCase());
    });

    // Apenas encarregados registados (tabela profiles). Nomes escritos nas fichas dos atletas
    // sem conta associada não geram encarregados "virtuais".
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

  // Filtered guardians based on search
  const filteredGuardians = useMemo(() => {
    return allGuardians.filter((g) => {
      return (
        searchTerm === '' ||
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.athletes.some((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [allGuardians, searchTerm]);

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
              placeholder="Pesquisar por encarregado / atleta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Novo Encarregado Button (Treinador) */}
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTA DE ENCARREGADOS */}
      {/* ========================================================================= */}

      {filteredGuardians.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Contact className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800">
              Nenhum encarregado de educação encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Nenhum resultado corresponde à sua pesquisa.'
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
              onClick={() => setSelectedGuardian(g)}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
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
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight group-hover:text-purple-700 transition-colors">
                        {formatShortName(g.name)}
                      </h4>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {g.relation}
                      </span>
                      {g.isCoach && (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md inline-block mt-0.5 ml-1">
                          Treinador
                        </span>
                      )}
                      {g.isAlsoAthlete && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md inline-block mt-0.5 ml-1">
                          Atleta
                        </span>
                      )}
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
                      onClick={(e) => e.stopPropagation()}
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
                      onClick={(e) => e.stopPropagation()}
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
                            <span className="font-bold text-slate-800 truncate">{formatShortName(ath.name)}</span>
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Ver Ficha &rarr;</span>

                <div className="flex items-center gap-1.5">
                  {(canManage || isCurrentUserThisGuardian(g)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(g);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                      title="Editar Encarregado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGuardianToDelete(g);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-600 transition-colors cursor-pointer"
                      title="Eliminar Encarregado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {!isInitialsAvatar(formData.avatarUrl) && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: generateInitialsAvatar(formData.name) })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          title="Remover a foto e voltar ao avatar com as iniciais do nome"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Usar Iniciais</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={isInitialsAvatar(formData.avatarUrl) ? '' : formData.avatarUrl}
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

              {/* Encarregado que também é atleta */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAlsoAthlete: !formData.isAlsoAthlete })}
                  className="w-full text-left flex items-start gap-2.5 cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${formData.isAlsoAthlete ? 'border-purple-600 bg-purple-600' : 'border-slate-400 bg-white'}`}>
                    {formData.isAlsoAthlete && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">Também é Atleta</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      Se assinalar, é criada uma ficha deste encarregado em Atletas.
                    </span>
                  </div>
                </button>
                {editingGuardian?.isAlsoAthlete && !formData.isAlsoAthlete && (
                  <p className="text-[11px] font-semibold text-red-600">
                    ⚠️ Ao guardar, a ficha de atleta deste encarregado será removida de Atletas.
                  </p>
                )}
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
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all text-xs ${isChecked
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

      {/* Modal: Ficha Detalhada do Encarregado de Educação */}
      {selectedGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                {selectedGuardian.avatarUrl ? (
                  <img
                    src={selectedGuardian.avatarUrl}
                    alt={selectedGuardian.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/30 shadow-md bg-purple-50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xl shadow-md">
                    {selectedGuardian.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-slate-900">
                      {formatShortName(selectedGuardian.name)}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                      {selectedGuardian.relation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedGuardian.profession ? `Profissão: ${selectedGuardian.profession}` : 'Encarregado de Educação Registado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuardian(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Contact Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Contact className="w-3.5 h-3.5 text-purple-600" />
                  Dados de Contacto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Telemóvel Principal:</span>
                    <a
                      href={`tel:${selectedGuardian.phone}`}
                      className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedGuardian.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Telemóvel Alternativo:</span>
                    <span className="font-medium text-slate-900">
                      {selectedGuardian.altPhone ? (
                        <a href={`tel:${selectedGuardian.altPhone}`} className="hover:underline text-emerald-600 font-bold">
                          {selectedGuardian.altPhone}
                        </a>
                      ) : (
                        'Não indicado'
                      )}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold">E-mail:</span>
                    <a
                      href={`mailto:${selectedGuardian.email}`}
                      className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {selectedGuardian.email}
                    </a>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold">Morada:</span>
                    <span className="font-medium text-slate-900">{selectedGuardian.address || 'Não indicada'}</span>
                  </div>
                </div>
              </div>

              {/* Atletas a Cargo */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2.5">
                <h4 className="font-bold text-purple-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  Atletas a Cargo ({selectedGuardian.athletes.length})
                </h4>
                {selectedGuardian.athletes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedGuardian.athletes.map((ath) => (
                      <div
                        key={ath.id}
                        className="p-3 rounded-xl bg-white border border-purple-200/60 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={ath.photoUrl}
                            alt={ath.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-100 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                              {formatShortName(ath.name)}
                            </h5>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Nasc: {formatBirthDate(ath.birthDate)} {ath.federationNumber ? `• Nº Fed: ${ath.federationNumber}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200 shrink-0">
                          {ath.category}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Sem atletas registados a cargo deste encarregado.</p>
                )}
              </div>

              {/* Observações / Notas */}
              {selectedGuardian.notes && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                    Observações / Notas:
                  </span>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    {selectedGuardian.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedGuardian(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                {(canManage || isCurrentUserThisGuardian(selectedGuardian)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const g = selectedGuardian;
                      setSelectedGuardian(null);
                      handleOpenEdit(g);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Ficha</span>
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      const g = selectedGuardian;
                      setSelectedGuardian(null);
                      setGuardianToDelete(g);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
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
