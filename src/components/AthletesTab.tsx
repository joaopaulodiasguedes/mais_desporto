import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  HeartPulse,
  Award,
  Trash2,
  Edit2,
  X,
  Check,
  User,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Send,
  Lock,
  Sparkles,
  Camera,
  Upload
} from 'lucide-react';
import { Athlete, NotificationItem } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { calculateMedicalStatus, determineAgeCategory } from '../utils/athleteRules';

export const AthletesTab: React.FC = () => {
  const {
    athletes,
    addAthlete,
    updateAthlete,
    deleteAthlete,
    hasPermission,
    currentUser,
    ageCategories,
    addNotification,
    showToast,
    setActiveTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);

  // Direct Athlete Notification Modal state (Treinador)
  const [athleteForDirectNotif, setAthleteForDirectNotif] = useState<Athlete | null>(null);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationItem['type']>('comunicado');
  const [notifActionTab, setNotifActionTab] = useState<string>('');

  const canManage = hasPermission('canManageAthletes') || currentUser.role === 'treinador';

  const handleOpenAthleteNotif = (ath: Athlete) => {
    setAthleteForDirectNotif(ath);
    setNotifTitle('');
    setNotifMessage('');
    setNotifType('comunicado');
    setNotifActionTab('');
  };

  const applyDirectTemplate = (preset: 'convocatoria' | 'feedback' | 'exame' | 'treino') => {
    if (!athleteForDirectNotif) return;
    const name = athleteForDirectNotif.name;
    if (preset === 'convocatoria') {
      setNotifTitle(`Convocatória Oficial: ${name}`);
      setNotifType('convocatoria');
      setNotifMessage(`Foste convocado(a) para a próxima prova oficial. Por favor consulta os detalhes no calendário e confirma a tua presença com a equipa técnica.`);
      setNotifActionTab('calendario');
    } else if (preset === 'feedback') {
      setNotifTitle(`Avaliação & Feedback Técnico: ${name}`);
      setNotifType('comunicado');
      setNotifMessage(`Excelente trabalho e dedicação nos treinos desta semana. Continua com o foco nas correções técnicas indicadas durante as sessões.`);
      setNotifActionTab('');
    } else if (preset === 'exame') {
      setNotifTitle(`Aviso de Exame Médico Desportivo: ${name}`);
      setNotifType('urgente');
      setNotifMessage(`Informamos que o teu exame médico desportivo está pendente ou próximo da data de validade. Por favor entrega a ficha atualizada na secretaria com urgência.`);
      setNotifActionTab('');
    } else if (preset === 'treino') {
      setNotifTitle(`Instruções de Treino / Horário: ${name}`);
      setNotifType('aviso_treino');
      setNotifMessage(`Aviso individual relativo aos teus objetivos de treino específicos e horário de acompanhamento na próxima sessão.`);
      setNotifActionTab('');
    }
  };

  const handleSendDirectNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteForDirectNotif || !notifTitle.trim() || !notifMessage.trim()) return;

    addNotification({
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: notifType,
      targetAudience: 'atletas',
      targetAthleteId: athleteForDirectNotif.id,
      targetAthleteName: athleteForDirectNotif.name,
      authorName: currentUser.name || 'Treinador',
      actionTab: notifActionTab || undefined,
      actionLabel:
        notifActionTab === 'calendario'
          ? 'Ver no Calendário'
          : notifActionTab === 'resultados'
            ? 'Ver Resultados'
            : notifActionTab === 'encarregados'
              ? 'Encarregados de Educação'
              : notifActionTab === 'pais'
                ? 'Área dos Pais'
                : undefined
    });

    setAthleteForDirectNotif(null);
  };

  // Helper to determine if an athlete profile belongs to the logged-in user
  const isMyProfile = (ath?: Athlete | null) => {
    if (!ath || currentUser.role !== 'atleta') return false;
    if (currentUser.athleteProfileId && ath.id === currentUser.athleteProfileId) return true;
    if (currentUser.email && ath.email && ath.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (ath.name && currentUser.name && ath.name.toLowerCase() === currentUser.name.toLowerCase()) return true;
    return false;
  };

  const myAthleteProfile = currentUser.role === 'atleta'
    ? athletes.find((a) => isMyProfile(a))
    : null;

  // Permission checks: Coach can CRUD everything; Athlete can CRUD only their own profile
  const canEditAthlete = (ath?: Athlete | null) => {
    if (!ath) return false;
    if (currentUser.role === 'treinador') return true;
    if (currentUser.role === 'atleta' && isMyProfile(ath)) return true;
    return false;
  };

  const canDeleteAthlete = (ath?: Athlete | null) => {
    if (!ath) return false;
    if (currentUser.role === 'treinador') return true;
    if (currentUser.role === 'atleta' && isMyProfile(ath)) return true;
    return false;
  };

  // Form State for Adding / Editing
  const [formData, setFormData] = useState<Omit<Athlete, 'id'>>({
    name: '',
    birthDate: '2010-01-01',
    address: '',
    phone: '',
    email: '',
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
    federationNumber: 'FPN-',
    category: 'Juvenis (Sub-16)',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    medicalExamExpiry: '2027-01-01',
    medicalStatus: 'valido',
    emergencyContact: '',
    allergiesOrConditions: '',
    attendanceRate: 95,
    notes: ''
  });

  const configuredCategoryNames = ageCategories && ageCategories.length > 0
    ? ageCategories.map(c => c.name)
    : [
      'Benjamins (Sub-12)',
      'Infantis (Sub-14)',
      'Iniciados (Sub-15)',
      'Juvenis (Sub-16)',
      'Juniores (Sub-18)',
      'Seniores',
      'Masters'
    ];

  const categoryNames = Array.from(new Set([...configuredCategoryNames, 'Em Análise']));
  const categories = ['todos', ...categoryNames];

  // Auto-enquadramento de escalão por data de nascimento (ou 'Em Análise' se não houver escalão)
  const handleBirthDateChange = (newBirthDate: string) => {
    const matchedCategory = determineAgeCategory(newBirthDate, ageCategories);
    setFormData(prev => ({
      ...prev,
      birthDate: newBirthDate,
      category: matchedCategory
    }));
  };

  // Cálculo automático do estado clínico e de aptidão do exame médico
  const handleMedicalExpiryChange = (newExpiry: string) => {
    const { status } = calculateMedicalStatus(newExpiry);
    setFormData(prev => ({
      ...prev,
      medicalExamExpiry: newExpiry,
      medicalStatus: status
    }));
  };

  // Helper to calculate age safely
  const getAge = (birthDateStr?: string) => {
    if (!birthDateStr) return '';
    try {
      const birth = new Date(birthDateStr);
      if (isNaN(birth.getTime())) return '';
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : '';
    } catch {
      return '';
    }
  };

  const filteredAthletes = athletes.filter((ath) => {
    const name = ath.name || '';
    const fed = ath.federationNumber || '';
    const guardian = ath.guardianName || '';
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      name.toLowerCase().includes(query) ||
      fed.toLowerCase().includes(query) ||
      guardian.toLowerCase().includes(query);

    const cat = ath.category || '';
    const matchesCat =
      selectedCategory === 'todos' ||
      cat === selectedCategory ||
      cat.includes(selectedCategory);

    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    const defaultBirthDate = '2010-05-15';
    const defaultCategory = determineAgeCategory(defaultBirthDate, ageCategories);
    const defaultExpiry = '2027-01-15';
    const defaultStatus = calculateMedicalStatus(defaultExpiry).status;

    setFormData({
      name: '',
      birthDate: defaultBirthDate,
      address: '',
      phone: '',
      email: '',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      federationNumber: `FPN-${Math.floor(10000 + Math.random() * 90000)}`,
      category: defaultCategory,
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianId: '',
      medicalExamExpiry: defaultExpiry,
      medicalStatus: defaultStatus,
      emergencyContact: '',
      allergiesOrConditions: '',
      attendanceRate: 95,
      notes: ''
    });
    setEditingAthlete(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    const computedStatus = calculateMedicalStatus(athlete.medicalExamExpiry).status;
    const computedCategory = athlete.category || determineAgeCategory(athlete.birthDate, ageCategories);

    setFormData({
      name: athlete.name || '',
      birthDate: athlete.birthDate || '',
      address: athlete.address || '',
      phone: athlete.phone || '',
      email: athlete.email || '',
      photoUrl: athlete.photoUrl || '',
      federationNumber: athlete.federationNumber || '',
      category: computedCategory,
      guardianName: athlete.guardianName || '',
      guardianPhone: athlete.guardianPhone || '',
      guardianEmail: athlete.guardianEmail || '',
      guardianId: athlete.guardianId || '',
      medicalExamExpiry: athlete.medicalExamExpiry || '',
      medicalStatus: computedStatus,
      emergencyContact: athlete.emergencyContact || '',
      allergiesOrConditions: athlete.allergiesOrConditions || '',
      attendanceRate: athlete.attendanceRate ?? 90,
      notes: athlete.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, photoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAthlete) {
      updateAthlete(editingAthlete.id, formData);
      if (selectedAthlete?.id === editingAthlete.id) {
        setSelectedAthlete({ ...editingAthlete, ...formData });
      }
    } else {
      addAthlete(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleDelete = (athlete: Athlete) => {
    setAthleteToDelete(athlete);
  };

  const getMedicalStatusBadge = (_status?: Athlete['medicalStatus'], expiry?: string) => {
    const { status, daysRemaining, label } = calculateMedicalStatus(expiry);
    const expiryFormatted = expiry ? ` (${expiry})` : '';

    if (status === 'valido') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
          title={label}
        >
          <Check className="w-3 h-3 text-emerald-600" /> Válido {daysRemaining !== null ? `(${daysRemaining}d)` : expiryFormatted}
        </span>
      );
    }
    if (status === 'a_expirar') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
          title={`Aviso aos 15 dias: ${label}`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" /> A expirar ({daysRemaining !== null ? `${daysRemaining}d` : expiryFormatted})
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"
        title={label}
      >
        <AlertTriangle className="w-3 h-3 text-red-600" /> Expirado {expiryFormatted}
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar with Search, Filter & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Quadro de Atletas
          </h2>
          <p className="text-xs text-slate-500">
            {filteredAthletes.length} atletas registados no clube
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou nº federado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Add Athlete Button (Treinador) */}
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Atleta</span>
            </button>
          )}
        </div>
      </div>

      {/* Athlete's Own Profile Hero Section (Only for Atleta role) */}
      {currentUser.role === 'atleta' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-blue-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {myAthleteProfile ? (
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={myAthleteProfile.photoUrl}
                    alt={myAthleteProfile.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-white/20 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -right-1 text-[11px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-lg shadow-md">
                    {getAge(myAthleteProfile.birthDate)} anos
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 text-[11px] font-bold rounded-full border border-blue-400/30">
                      O Teu Perfil
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-200 text-[11px] font-bold rounded-full border border-emerald-400/30">
                      {myAthleteProfile.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight text-white">
                    {myAthleteProfile.name}
                  </h3>
                  <p className="text-xs text-blue-200/80 font-mono">
                    Nº Federado: {myAthleteProfile.federationNumber} • Assiduidade: <span className="font-bold text-emerald-300">{myAthleteProfile.attendanceRate}%</span>
                  </p>
                  <p className="text-xs text-blue-100/90 pt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    <span>{myAthleteProfile.address}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0">
                <button
                  onClick={() => handleOpenEdit(myAthleteProfile)}
                  className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-900 rounded-2xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <span>Editar o Meu Perfil</span>
                </button>
                <div className="text-[11px] text-blue-200/80 text-center md:text-right">
                  Exame: {myAthleteProfile.medicalStatus === 'valido' ? '✅ Válido até ' + myAthleteProfile.medicalExamExpiry : '⚠️ ' + myAthleteProfile.medicalExamExpiry}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <div>
                <h3 className="text-base font-extrabold text-white">Ainda não tens a tua ficha de atleta criada</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Cria o teu perfil pessoal para associar a tua modalidade, contactos de emergência e histórico desportivo.
                </p>
              </div>
              <button
                onClick={() => {
                  setFormData({
                    name: currentUser.name,
                    birthDate: '2009-06-18',
                    address: '',
                    phone: currentUser.phone || '',
                    email: currentUser.email,
                    photoUrl: currentUser.avatarUrl,
                    federationNumber: `FPN-${Math.floor(10000 + Math.random() * 90000)}`,
                    category: 'Juvenis (Sub-16)',
                    guardianName: '',
                    guardianPhone: '',
                    guardianEmail: '',
                    medicalExamExpiry: '2027-01-01',
                    medicalStatus: 'valido',
                    emergencyContact: '',
                    allergiesOrConditions: '',
                    attendanceRate: 100,
                    notes: ''
                  });
                  setEditingAthlete(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar o Meu Perfil de Atleta</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Escalão:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
          >
            {cat === 'todos' ? 'Todos os Escalões' : cat}
          </button>
        ))}
      </div>

      {/* Athletes Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAthletes.map((ath) => {
          const age = getAge(ath.birthDate);
          const isMine = isMyProfile(ath);
          const canEditThis = canEditAthlete(ath);
          return (
            <div
              key={ath.id}
              onClick={() => setSelectedAthlete(ath)}
              className={`bg-white rounded-2xl p-4 border shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${isMine
                ? 'border-blue-400/80 ring-2 ring-blue-500/20 bg-gradient-to-b from-blue-50/30 to-white'
                : 'border-slate-200 hover:border-blue-300'
                }`}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={ath.photoUrl}
                      alt={ath.name}
                      className={`w-14 h-14 rounded-2xl object-cover ring-2 transition-all shadow-xs ${isMine
                        ? 'ring-blue-500'
                        : 'ring-slate-100 group-hover:ring-blue-400'
                        }`}
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -right-1 text-[10px] font-extrabold bg-blue-600 text-white px-1.5 py-0.2 rounded-md shadow-2xs">
                      {age}a
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {ath.name}
                      </h3>
                      {isMine && (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold shadow-2xs">
                          O Meu Perfil
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      {ath.category === 'Em Análise' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Em Análise
                        </span>
                      ) : (
                        <p className="text-xs font-medium text-slate-500">
                          {ath.category}
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      {ath.federationNumber}
                    </p>
                  </div>
                </div>

                {/* Quick Details */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Nasc: {ath.birthDate} ({age} anos)</span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ath.address}</span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ath.phone || ath.guardianPhone}</span>
                  </div>
                </div>
              </div>

              {/* Footer status and actions */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <div>{getMedicalStatusBadge(ath.medicalStatus, ath.medicalExamExpiry)}</div>
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-bold text-slate-500">
                    Assiduidade: <span className="text-blue-600 font-extrabold">{ath.attendanceRate}%</span>
                  </div>
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAthleteNotif(ath);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title={`Emitir comunicado individual para ${ath.name}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canEditThis && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(ath);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title={isMine ? "Editar o Meu Perfil" : "Editar Atleta"}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAthletes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum atleta encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tente ajustar os termos da pesquisa ou o escalão selecionado.
          </p>
        </div>
      )}

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedAthlete.photoUrl}
                  alt={selectedAthlete.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-slate-900">
                      {selectedAthlete.name}
                    </h3>
                    {selectedAthlete.category === 'Em Análise' ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Em Análise
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                        {selectedAthlete.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Nº Federado: {selectedAthlete.federationNumber} • {getAge(selectedAthlete.birthDate)} anos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAthlete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Personal & Contact Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Dados Pessoais & Contactos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Data de Nascimento:</span>
                    <span className="font-medium text-slate-900">{selectedAthlete.birthDate}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Contacto do Atleta:</span>
                    <span className="font-medium text-slate-900">{selectedAthlete.phone || 'Sem telemóvel direto'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold">Morada de Residência:</span>
                    <span className="font-medium text-slate-900">{selectedAthlete.address}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold">E-mail:</span>
                    <span className="font-medium text-slate-900">{selectedAthlete.email}</span>
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Encarregado de Educação & Emergência
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Nome do Encarregado:</span>
                    <span className="font-bold text-slate-900">{selectedAthlete.guardianName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Telefone Encarregado:</span>
                    <a
                      href={`tel:${selectedAthlete.guardianPhone}`}
                      className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedAthlete.guardianPhone}
                    </a>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold">Contacto de Emergência / Relação:</span>
                    <span className="font-medium text-slate-900">{selectedAthlete.emergencyContact}</span>
                  </div>
                </div>
              </div>

              {/* Medical & Health status */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                    Exame Médico Desportivo & Saúde
                  </h4>
                  {getMedicalStatusBadge(selectedAthlete.medicalStatus, selectedAthlete.medicalExamExpiry)}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {selectedAthlete.allergiesOrConditions || 'Sem registo de alergias ou condições médicas impeditivas.'}
                </p>
              </div>

              {/* Coach notes & performance */}
              {selectedAthlete.notes && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                    Notas Técnicas do Treinador:
                  </span>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {selectedAthlete.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const ath = selectedAthlete;
                    try {
                      sessionStorage.setItem('plus_selected_athlete_plan_id', ath.id);
                    } catch { }
                    setSelectedAthlete(null);
                    setActiveTab('planos_treino');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Ver calendário discriminado e planos de treino deste atleta"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendário de Treinos</span>
                </button>

                {canManage && (
                  <button
                    onClick={() => {
                      const ath = selectedAthlete;
                      handleOpenAthleteNotif(ath);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Emitir comunicado individual para este atleta"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Novo Comunicado</span>
                  </button>
                )}
              </div>

              {(canEditAthlete(selectedAthlete) || canDeleteAthlete(selectedAthlete)) && (
                <div className="flex items-center gap-2">
                  {canEditAthlete(selectedAthlete) && (
                    <button
                      onClick={() => {
                        const ath = selectedAthlete;
                        setSelectedAthlete(null);
                        handleOpenEdit(ath);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      title={isMyProfile(selectedAthlete) ? 'Editar o Meu Perfil' : 'Editar Ficha do Atleta'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isMyProfile(selectedAthlete) ? 'Editar Meu Perfil' : 'Editar'}</span>
                    </button>
                  )}
                  {canDeleteAthlete(selectedAthlete) && (
                    <button
                      onClick={() => handleDelete(selectedAthlete)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar Atleta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Athlete Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {editingAthlete ? 'Editar Ficha do Atleta' : 'Registar Novo Atleta'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo do Atleta *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Ex: Marta Sofia Santos"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Escalão *</label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${formData.category === 'Em Análise'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                      {formData.category === 'Em Análise' ? '⚠️ Em Análise' : '⚡ Automático por Nascimento'}
                    </span>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border focus:ring-2 font-medium ${formData.category === 'Em Análise'
                      ? 'border-amber-300 bg-amber-50/50 text-amber-900 focus:ring-amber-500'
                      : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                      }`}
                  >
                    {categories.filter(c => c !== 'todos').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Caso não corresponda a nenhum escalão configurado, assume <strong className="text-amber-700 font-bold">Em Análise</strong>.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nº Filiado</label>
                  <input
                    type="text"
                    value={formData.federationNumber}
                    onChange={(e) => setFormData({ ...formData, federationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Ex: FPN-84920"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contacto Telefónico</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="+351 912 345 678"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Morada Completa *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Rua, Número, Andar, Localidade"
                  />
                </div>

                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      Foto de Perfil do Atleta
                    </label>
                    {formData.photoUrl && (
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Foto configurada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={formData.photoUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300'}
                      alt="Pré-visualização"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/40 shadow-xs shrink-0 bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs">
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
                        value={formData.photoUrl}
                        onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                        placeholder="Ou cole aqui o link / URL da foto..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Encarregado</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Pai / Mãe / Tutor"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefone do Encarregado</label>
                  <input
                    type="text"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="+351 963 888 999"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Validade Exame Médico</label>
                    <span className="text-[10px] font-bold text-slate-500">
                      Alerta a 15 dias
                    </span>
                  </div>
                  <input
                    type="date"
                    value={formData.medicalExamExpiry}
                    onChange={(e) => handleMedicalExpiryChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Estado do Exame</label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      ⚡ Automático pela Validade
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      {getMedicalStatusBadge(formData.medicalStatus, formData.medicalExamExpiry)}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {formData.medicalStatus === 'valido'
                        ? 'Apto para competir'
                        : formData.medicalStatus === 'a_expirar'
                          ? 'Notificação ativa (15 dias)'
                          : 'Aptidão suspensa'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    O estado é calculado de modo automático pela validade. O atleta e o encarregado são notificados quando faltar 15 dias para expirar.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alergias / Restrições Médicas</label>
                  <input
                    type="text"
                    value={formData.allergiesOrConditions || ''}
                    onChange={(e) => setFormData({ ...formData, allergiesOrConditions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Ex: Asma induzida por esforço, alergia a penicilina"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notas Técnicas do Treinador</label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Especialidades, provas alvo, notas de evolução..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingAthlete ? 'Atualizar Atleta' : 'Registar Atleta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Athlete */}
      <ConfirmDeleteModal
        isOpen={athleteToDelete !== null}
        onClose={() => setAthleteToDelete(null)}
        onConfirm={() => {
          if (athleteToDelete) {
            deleteAthlete(athleteToDelete.id);
            if (selectedAthlete?.id === athleteToDelete.id) {
              setSelectedAthlete(null);
            }
            setAthleteToDelete(null);
          }
        }}
        title="Eliminar Atleta"
        itemTitle={athleteToDelete?.name}
        description="Tem a certeza de que deseja eliminar a ficha deste atleta? Esta ação não pode ser desfeita."
        confirmText="Sim, Eliminar"
      />

      {/* Direct Athlete Notification Modal (Treinador) */}
      {athleteForDirectNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                    Novo Comunicado para Atleta
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mensagem individual restrita ao atleta e respetivo encarregado
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAthleteForDirectNotif(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Athlete Summary */}
            <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 mb-4 space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={athleteForDirectNotif.photoUrl}
                  alt={athleteForDirectNotif.name}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-blue-500 shadow-2xs shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {athleteForDirectNotif.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                    <span className="font-bold text-blue-700">{athleteForDirectNotif.category}</span>
                    <span>•</span>
                    <span>Federado: {athleteForDirectNotif.federationNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-blue-900 bg-white/80 p-2 rounded-xl border border-blue-200/60">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  <strong>Destinatários:</strong> {athleteForDirectNotif.name} e Encarregado de Educação ({athleteForDirectNotif.guardianName || 'associado'}).
                </span>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="mb-4 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Sugestões Rápidas de Modelo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyDirectTemplate('convocatoria')}
                  className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Convocatória Individual
                </button>
                <button
                  type="button"
                  onClick={() => applyDirectTemplate('feedback')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Feedback Técnico
                </button>
                <button
                  type="button"
                  onClick={() => applyDirectTemplate('exame')}
                  className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Aviso de Exame Médico
                </button>
                <button
                  type="button"
                  onClick={() => applyDirectTemplate('treino')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Aviso de Treino
                </button>
              </div>
            </div>

            <form onSubmit={handleSendDirectNotif} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Notificação</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as NotificationItem['type'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-xs bg-white"
                  >
                    <option value="comunicado">Comunicado Geral</option>
                    <option value="convocatoria">Convocatória de Prova</option>
                    <option value="aviso_treino">Aviso de Treino</option>
                    <option value="urgente">Urgente / Importante</option>
                    <option value="mensalidade">Mensalidades & Quotas</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Atalho de Ação Rápida</label>
                  <select
                    value={notifActionTab}
                    onChange={(e) => setNotifActionTab(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-xs bg-white"
                  >
                    <option value="">Sem atalho</option>
                    <option value="calendario">Ver Calendário</option>
                    <option value="resultados">Ver Resultados</option>
                    <option value="encarregados">Encarregados de Educação</option>
                    <option value="pais">Área dos Pais</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título do Comunicado *</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium text-xs sm:text-sm"
                  placeholder="Ex: Convocatória para o Torneio Regional"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mensagem *</label>
                <textarea
                  rows={4}
                  required
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium text-xs sm:text-sm"
                  placeholder="Escreva a mensagem individual para o atleta..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAthleteForDirectNotif(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer text-xs sm:text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar para {athleteForDirectNotif.name.split(' ')[0]}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
