import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarRange,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  RefreshCw,
  Layers,
  AlertCircle,
  X,
  User,
  ShieldCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AgeCategory, Athlete } from '../types';

interface CategoriesManagementProps {
  onSelectAthlete?: (athleteId: string) => void;
}

export const CategoriesManagement: React.FC<CategoriesManagementProps> = ({ onSelectAthlete }) => {
  const {
    currentUser,
    athletes,
    ageCategories,
    addAgeCategory,
    updateAgeCategory,
    deleteAgeCategory,
    applyAgeCategoriesToAthletes
  } = useApp();

  // Se não for treinador, esta vista nunca deve ser mostrada
  if (currentUser.role !== 'treinador') {
    return null;
  }

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeasonStatus, setFilterSeasonStatus] = useState<'todos' | 'em_vigor' | 'outros'>('todos');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AgeCategory | null>(null);
  const [selectedCategoryForAthletes, setSelectedCategoryForAthletes] = useState<AgeCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AgeCategory | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<AgeCategory, 'id'>>({
    name: '',
    code: '',
    birthDateStart: '',
    birthDateEnd: '',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: '',
    color: 'blue'
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Helper para formatar data portuguesa (DD/MM/AAAA)
  const formatDatePt = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Helper para calcular idade a partir da data de nascimento
  const calculateAge = (birthDateStr: string, referenceDateStr?: string): number => {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  // Calcula se o período de gestão está atualmente em vigor
  const isSeasonActive = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return false;
    const now = new Date().toISOString().split('T')[0];
    return now >= startDate && now <= endDate;
  };

  // Mapeia cor para classes CSS elegantes
  const getColorClasses = (colorName?: string) => {
    switch (colorName) {
      case 'emerald':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          accent: 'border-l-emerald-500'
        };
      case 'teal':
        return {
          badge: 'bg-teal-50 text-teal-700 border-teal-200',
          dot: 'bg-teal-500',
          accent: 'border-l-teal-500'
        };
      case 'indigo':
        return {
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          accent: 'border-l-indigo-500'
        };
      case 'purple':
        return {
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          accent: 'border-l-purple-500'
        };
      case 'amber':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          accent: 'border-l-amber-500'
        };
      case 'rose':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          accent: 'border-l-rose-500'
        };
      case 'slate':
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          accent: 'border-l-slate-500'
        };
      case 'blue':
      default:
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          accent: 'border-l-blue-500'
        };
    }
  };

  // Retorna os atletas que se enquadram num escalão por data de nascimento
  const getAthletesForCategory = (cat: AgeCategory): Athlete[] => {
    if (!cat.birthDateStart || !cat.birthDateEnd) return [];
    return athletes.filter(a => {
      if (!a.birthDate) return false;
      return a.birthDate >= cat.birthDateStart && a.birthDate <= cat.birthDateEnd;
    });
  };

  // Filtragem dos escalões
  const filteredCategories = useMemo(() => {
    return ageCategories.filter(cat => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.code && cat.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cat.notes && cat.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterSeasonStatus === 'em_vigor') {
        return isSeasonActive(cat.seasonStartDate, cat.seasonEndDate);
      } else if (filterSeasonStatus === 'outros') {
        return !isSeasonActive(cat.seasonStartDate, cat.seasonEndDate);
      }

      return true;
    });
  }, [ageCategories, searchTerm, filterSeasonStatus]);

  // Abertura do modal para criar
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      birthDateStart: '',
      birthDateEnd: '',
      seasonStartDate: '2025-09-01',
      seasonEndDate: '2026-08-31',
      gender: 'todos',
      notes: '',
      color: 'blue'
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Abertura do modal para editar
  const handleOpenEditModal = (category: AgeCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code || '',
      birthDateStart: category.birthDateStart,
      birthDateEnd: category.birthDateEnd,
      seasonStartDate: category.seasonStartDate,
      seasonEndDate: category.seasonEndDate,
      gender: category.gender || 'todos',
      notes: category.notes || '',
      color: category.color || 'blue'
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Gravar formulário
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações
    if (!formData.name.trim()) {
      setFormError('Indique a designação do escalão (ex: Sub-14, Juvenis, etc.).');
      return;
    }
    if (!formData.birthDateStart || !formData.birthDateEnd) {
      setFormError('Indique a data de nascimento inicial e final para este escalão.');
      return;
    }
    if (formData.birthDateStart > formData.birthDateEnd) {
      setFormError('A data de nascimento inicial deve ser anterior ou igual à data de nascimento final.');
      return;
    }
    if (!formData.seasonStartDate || !formData.seasonEndDate) {
      setFormError('Indique a data de início e de fim para a gestão desportiva deste escalão.');
      return;
    }
    if (formData.seasonStartDate > formData.seasonEndDate) {
      setFormError('A data de início da gestão deve ser anterior à data de fim da gestão.');
      return;
    }

    if (editingCategory) {
      updateAgeCategory(editingCategory.id, formData);
    } else {
      addAgeCategory(formData);
    }

    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteAgeCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner / Explanatory Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Módulo Exclusivo para Treinadores
              </span>

            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Tabela de Gestão de Escalões
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-1">
              Configure os escalões competitivos do clube com base no intervalo de datas de nascimento dos atletas e defina as datas de início e fim da vigência desportiva da época.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => applyAgeCategoriesToAthletes()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
              title="Atribuir automaticamente aos atletas o escalão correspondente à sua data de nascimento"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Sincronizar com Atletas</span>
            </button>

            <button
              id="btn-new-age-category"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Escalão</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Escalões</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{ageCategories.length}</p>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/70">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Em Vigor</p>
            <p className="text-xl font-black text-emerald-800 mt-0.5">
              {ageCategories.filter(c => isSeasonActive(c.seasonStartDate, c.seasonEndDate)).length}
            </p>
          </div>
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/70">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Atletas no Clube</p>
            <p className="text-xl font-black text-blue-800 mt-0.5">{athletes.length}</p>
          </div>
          <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200/70">
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Enquadrados</p>
            <p className="text-xl font-black text-purple-800 mt-0.5">
              {athletes.filter(a => {
                if (!a.birthDate) return false;
                return ageCategories.some(c => a.birthDate >= c.birthDateStart && a.birthDate <= c.birthDateEnd);
              }).length}
            </p>
          </div>
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Em Análise</p>
            <p className="text-xl font-black text-amber-800 mt-0.5">
              {athletes.filter(a => a.category === 'Em Análise' || !a.birthDate || !ageCategories.some(c => a.birthDate >= c.birthDateStart && a.birthDate <= c.birthDateEnd)).length}
            </p>
          </div>
        </div>

        {/* Em Análise Banner if any athletes unassigned */}
        {athletes.some(a => a.category === 'Em Análise' || !a.birthDate || !ageCategories.some(c => a.birthDate >= c.birthDateStart && a.birthDate <= c.birthDateEnd)) && (
          <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Atletas em Análise:</strong> Existem atletas cuja data de nascimento não se enquadra nos escalões em vigor definidos para a época.
              </span>
            </div>
            <button
              onClick={() => applyAgeCategoriesToAthletes()}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              Reenquadrar Atletas
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar escalão (ex: Sub-14, Juvenis, Benjamins...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition-all text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 mr-1">Vigência:</span>
          <button
            onClick={() => setFilterSeasonStatus('todos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSeasonStatus === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({ageCategories.length})
          </button>
          <button
            onClick={() => setFilterSeasonStatus('em_vigor')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSeasonStatus === 'em_vigor'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Em Vigor
          </button>
          <button
            onClick={() => setFilterSeasonStatus('outros')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSeasonStatus === 'outros'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Outros Períodos
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Escalão & Código</th>
                <th className="py-3 px-4">Intervalo Nascimento dos Atletas</th>
                <th className="py-3 px-4">Idades Referência</th>
                <th className="py-3 px-4">Período de Gestão (Início / Fim)</th>
                <th className="py-3 px-4 text-center">Atletas Elegíveis</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-700">Nenhum escalão encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm ? 'Tente ajustar os termos da sua pesquisa.' : 'Clique em "Novo Escalão" para criar o primeiro escalão do clube.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const colorTheme = getColorClasses(cat.color);
                  const matchingAthletes = getAthletesForCategory(cat);
                  const active = isSeasonActive(cat.seasonStartDate, cat.seasonEndDate);

                  // Cálculos das idades mínima e máxima abrangidas
                  const minAge = calculateAge(cat.birthDateEnd);
                  const maxAge = calculateAge(cat.birthDateStart);

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Escalão & Código */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${colorTheme.dot}`} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                              {cat.code && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase border ${colorTheme.badge}`}>
                                  {cat.code}
                                </span>
                              )}
                            </div>
                            {cat.notes && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {cat.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Intervalo de Nascimento */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold">{formatDatePt(cat.birthDateStart)}</span>
                          <span className="text-slate-400 font-medium">a</span>
                          <span className="font-semibold">{formatDatePt(cat.birthDateEnd)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Nascidos entre estas datas
                        </p>
                      </td>

                      {/* Idades de Referência */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                          {minAge === maxAge ? `${minAge} anos` : `${minAge} a ${maxAge} anos`}
                        </span>
                      </td>

                      {/* Período de Gestão (Início e Fim) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-slate-700">
                            <div className="font-semibold flex items-center gap-1">
                              <CalendarRange className="w-3.5 h-3.5 text-slate-500" />
                              <span>{formatDatePt(cat.seasonStartDate)}</span>
                              <span className="text-slate-400">até</span>
                              <span>{formatDatePt(cat.seasonEndDate)}</span>
                            </div>
                          </div>
                          {active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Em Vigor
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Fora de Época
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Atletas Elegíveis */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCategoryForAthletes(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all cursor-pointer group-hover:shadow-xs active:scale-95"
                          title="Ver lista de atletas correspondentes a este escalão"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>{matchingAthletes.length} {matchingAthletes.length === 1 ? 'atleta' : 'atletas'}</span>
                          <ChevronRight className="w-3 h-3 text-blue-400" />
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar escalão e datas"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar escalão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR / EDITAR ESCALÃO */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingCategory ? 'Editar Escalão Desportivo' : 'Criar Novo Escalão'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina o intervalo de nascimento dos atletas e o período de vigência.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 mt-4 text-xs">
              {/* Nome e Código */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">
                    Designação do Escalão <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sub-14 (Infantis)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-hidden font-medium text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Código</label>
                  <input
                    type="text"
                    placeholder="Ex: SUB-14"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-hidden font-mono uppercase text-slate-800"
                  />
                </div>
              </div>

              {/* BLOCO: INTERVALO DE NASCIMENTO DOS ATLETAS */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Intervalo de Nascimento dos Atletas (Início e Fim)</span>
                </div>
                <p className="text-[11px] text-blue-800/80">
                  Os atletas com data de nascimento entre estas datas serão enquadrados neste escalão.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">
                      Nascimento Início (Mais Antigo) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.birthDateStart}
                      onChange={(e) => setFormData({ ...formData, birthDateStart: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl focus:border-blue-600 outline-hidden font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">
                      Nascimento Fim (Mais Recente) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.birthDateEnd}
                      onChange={(e) => setFormData({ ...formData, birthDateEnd: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl focus:border-blue-600 outline-hidden font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO: DATAS DE INÍCIO E FIM PARA A GESTÃO / ÉPOCA */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                  <CalendarRange className="w-4 h-4 text-emerald-600" />
                  <span>Período de Gestão / Época Desportiva (Início e Fim)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Define o período temporal em que esta gestão do escalão está ativa (ex: Época 2025/2026).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">
                      Data Início da Gestão <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.seasonStartDate}
                      onChange={(e) => setFormData({ ...formData, seasonStartDate: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 outline-hidden font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">
                      Data Fim da Gestão <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.seasonEndDate}
                      onChange={(e) => setFormData({ ...formData, seasonEndDate: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 outline-hidden font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Cor e Género */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cor Identificadora</label>
                  <select
                    value={formData.color || 'blue'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-hidden font-medium text-slate-800"
                  >
                    <option value="blue">Azul (Padrão)</option>
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="teal">Verde Petróleo</option>
                    <option value="indigo">Índigo</option>
                    <option value="purple">Roxo</option>
                    <option value="amber">Âmbar / Amarelo</option>
                    <option value="rose">Rosa / Coral</option>
                    <option value="slate">Cinza Neutro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Aplicação de Género</label>
                  <select
                    value={formData.gender || 'todos'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-hidden font-medium text-slate-800"
                  >
                    <option value="todos">Misto / Ambos os Géneros</option>
                    <option value="masculino">Apenas Masculino</option>
                    <option value="feminino">Apenas Feminino</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Notas / Regulamentação Técnica</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Normas da Federação Portuguesa de Natação / Atletismo, provas específicas..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-hidden font-medium text-slate-800"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCategory ? 'Guardar Alterações' : 'Criar Escalão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LISTA DE ATLETAS DO ESCALÃO */}
      {selectedCategoryForAthletes && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {selectedCategoryForAthletes.name}
                    </h3>
                    {selectedCategoryForAthletes.code && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedCategoryForAthletes.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Nascidos entre {formatDatePt(selectedCategoryForAthletes.birthDateStart)} e {formatDatePt(selectedCategoryForAthletes.birthDateEnd)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategoryForAthletes(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4">
              {getAthletesForCategory(selectedCategoryForAthletes).length === 0 ? (
                <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-700">Nenhum atleta enquadrado</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Não existem atletas registados no clube com data de nascimento entre {formatDatePt(selectedCategoryForAthletes.birthDateStart)} e {formatDatePt(selectedCategoryForAthletes.birthDateEnd)}.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                  {getAthletesForCategory(selectedCategoryForAthletes).map((ath) => {
                    const age = calculateAge(ath.birthDate);
                    return (
                      <div
                        key={ath.id}
                        className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {ath.photoUrl ? (
                            <img
                              src={ath.photoUrl}
                              alt={ath.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                          )}

                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{ath.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap mt-0.5">
                              <span>Nascimento: <strong className="text-slate-700">{formatDatePt(ath.birthDate)}</strong></span>
                              <span>•</span>
                              <span>Idade: <strong className="text-blue-700">{age} anos</strong></span>
                              {ath.federationNumber && (
                                <>
                                  <span>•</span>
                                  <span>FPN: <span className="font-mono text-slate-700">{ath.federationNumber}</span></span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                            Ficha: {ath.category || 'Não definido'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Total de {getAthletesForCategory(selectedCategoryForAthletes).length} atletas abrangidos
              </span>
              <button
                onClick={() => setSelectedCategoryForAthletes(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE ELIMINAÇÃO */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Eliminar Escalão?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tem a certeza de que pretende eliminar o escalão <strong>"{categoryToDelete.name}"</strong>? Os atletas continuarão no sistema, mas as regras deste escalão deixarão de estar ativas.
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
