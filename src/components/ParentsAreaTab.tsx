import React, { useState, useMemo, useEffect } from 'react';
import { useApp, getLinkedAthletesForGuardian } from '../context/AppContext';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  MessageCircle,
  Plus,
  AlertTriangle,
  FileCheck,
  Calendar,
  User,
  MapPin,
  X,
  Check,
  Trash2,
  FileText,
  Users,
  ShieldAlert,
  ArrowRight,
  Trophy,
  Dumbbell,
  Sparkles,
  Filter,
  ChevronRight,
  Info,
  CalendarDays,
  Award
} from 'lucide-react';
import { Athlete, ParentAuthorization, CarpoolOffer } from '../types';
import { ParentAthleteDataForm } from './ParentAthleteDataForm';

type ParentsSubTab = 'visao_geral' | 'ficha' | 'boleias';

interface ParentsAreaTabProps {
  onOpenPdf?: (title: string, url: string) => void;
}

export const ParentsAreaTab: React.FC<ParentsAreaTabProps> = ({ onOpenPdf }) => {
  const {
    athletes,
    authorizations,
    updateAuthorizationStatus,
    carpools,
    addCarpoolOffer,
    deleteCarpoolOffer,
    claimCarpoolSeat,
    currentUser,
    hasPermission,
    showToast,
    calendarEvents,
    trainingPlans
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<ParentsSubTab>('visao_geral');

  // Deteção se o utilizador com sessão iniciada é um atleta menor de 18 anos
  const currentAthleteProfile = currentUser.role === 'atleta'
    ? athletes.find(a => a.id === currentUser.athleteProfileId || a.name.toLowerCase() === currentUser.name.toLowerCase() || (a.email && a.email.toLowerCase() === currentUser.email.toLowerCase()))
    : null;

  const currentBirthDate = currentUser.birthDate || currentAthleteProfile?.birthDate;

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

  const currentAthleteAge = calculateAge(currentBirthDate);
  // Se for perfil de atleta e tiver menos de 18 anos (ou sem data comprovada), é considerado menor
  const isUnderageAthlete = currentUser.role === 'atleta' && (currentAthleteAge === null || currentAthleteAge < 18);

  // Find athletes related to this parent
  const parentAthletes = useMemo(() => {
    if (currentUser.role === 'encarregado') {
      const linked = getLinkedAthletesForGuardian(currentUser, athletes);
      if (linked.length > 0) return linked;
      // Fallback: se ainda não houver ligação explícita, disponibilizar os atletas do clube para não ficar a vazio
      return athletes;
    }
    return athletes;
  }, [currentUser, athletes]);

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(() => {
    if (currentUser.role === 'encarregado') {
      const linked = getLinkedAthletesForGuardian(currentUser, athletes);
      if (linked.length > 0) {
        return linked[0].id;
      }
    }
    return athletes[0]?.id || '';
  });

  // Garantir que selectedAthleteId é sempre sincronizado quando a lista de atletas é carregada ou atualizada
  useEffect(() => {
    if (parentAthletes.length > 0) {
      if (!selectedAthleteId || selectedAthleteId === 'nao_inserido' || !parentAthletes.some((a) => a.id === selectedAthleteId)) {
        setSelectedAthleteId(parentAthletes[0].id);
      }
    }
  }, [parentAthletes, selectedAthleteId]);

  const activeAthlete = parentAthletes.find((a) => a.id === selectedAthleteId) || parentAthletes[0] || null;

  // Modals
  const [isOfferCarpoolOpen, setIsOfferCarpoolOpen] = useState(false);
  const [isClaimSeatOpen, setIsClaimSeatOpen] = useState<CarpoolOffer | null>(null);
  const [claimSeatsCount, setClaimSeatsCount] = useState(1);
  const [carpoolToDelete, setCarpoolToDelete] = useState<CarpoolOffer | null>(null);

  // New Carpool Form State
  const [carpoolEventTitle, setCarpoolEventTitle] = useState('');
  const [carpoolDate, setCarpoolDate] = useState('');
  const [carpoolSeats, setCarpoolSeats] = useState(3);
  const [carpoolLocation, setCarpoolLocation] = useState('');
  const [carpoolTime, setCarpoolTime] = useState('08:00');
  const [carpoolPhone, setCarpoolPhone] = useState(currentUser.phone || '');
  const [carpoolNotes, setCarpoolNotes] = useState('');

  const [septemberFilterType, setSeptemberFilterType] = useState<'todos' | 'provas' | 'treinos'>('todos');

  // Atividades agendadas no mês de Setembro (2026) para o atleta / clube
  const septemberActivities = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      dayNumber: number;
      weekday: string;
      title: string;
      type: 'prova' | 'treino_oficial' | 'treino_individual' | 'plano_treino' | 'tarefa';
      time: string;
      endTime?: string;
      location?: string;
      description?: string;
      authorization?: ParentAuthorization;
      carpool?: CarpoolOffer;
    }> = [];

    // 1. Eventos do Calendário em Setembro (mês 9)
    calendarEvents.forEach((evt) => {
      const parts = evt.date.split('-');
      if (parts.length < 3) return;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);

      if (m === 9) {
        const isTargeted =
          !activeAthlete ||
          evt.type === 'prova' ||
          !evt.targetCategories ||
          evt.targetCategories.length === 0 ||
          evt.targetCategories.includes('Todos') ||
          evt.targetCategories.includes(activeAthlete.category) ||
          evt.athleteId === activeAthlete.id;

        if (isTargeted) {
          const dt = new Date(y, m - 1, d);
          const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const weekday = weekdayNames[dt.getDay()];

          const auth = authorizations.find(
            (a) =>
              (a.eventId === evt.id || a.eventTitle.toLowerCase().includes(evt.title.toLowerCase().slice(0, 10))) &&
              (!activeAthlete || a.athleteId === activeAthlete.id)
          );

          const carp = carpools.find(
            (c) =>
              c.eventId === evt.id ||
              c.eventTitle.toLowerCase().includes(evt.title.toLowerCase().slice(0, 10)) ||
              c.eventDate === evt.date
          );

          list.push({
            id: `evt-${evt.id}`,
            date: evt.date,
            dayNumber: d,
            weekday,
            title: evt.title,
            type: evt.type as any,
            time: evt.time || '09:00',
            endTime: evt.endTime,
            location: evt.location,
            description: evt.description,
            authorization: auth,
            carpool: carp
          });
        }
      }
    });

    // 2. Planos de Treino com datas em Setembro
    if (activeAthlete) {
      trainingPlans.forEach((plan) => {
        let isAssigned = false;
        if (plan.assignedAthleteIds && plan.assignedAthleteIds.length > 0) {
          isAssigned = plan.assignedAthleteIds.includes(activeAthlete.id);
        } else {
          isAssigned =
            plan.targetCategory === activeAthlete.category ||
            plan.targetCategory === 'Todos' ||
            plan.targetCategory?.toLowerCase().includes('geral');
        }

        if (isAssigned) {
          const datesToCheck: string[] = [];
          if (plan.scheduledDate) datesToCheck.push(plan.scheduledDate);
          if (plan.scheduledDates && plan.scheduledDates.length > 0) {
            datesToCheck.push(...plan.scheduledDates);
          }

          const uniqueDates = Array.from(new Set(datesToCheck));
          uniqueDates.forEach((dateStr) => {
            const parts = dateStr.split('-');
            if (parts.length < 3) return;
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (m === 9) {
              const alreadyExists = list.some(
                (item) => item.date === dateStr && item.title.toLowerCase().includes(plan.title.toLowerCase().slice(0, 10))
              );
              if (!alreadyExists) {
                const dt = new Date(y, m - 1, d);
                const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const weekday = weekdayNames[dt.getDay()];

                list.push({
                  id: `plan-${plan.id}-${dateStr}`,
                  date: dateStr,
                  dayNumber: d,
                  weekday,
                  title: plan.title,
                  type: 'plano_treino',
                  time: plan.scheduledTime || '18:00',
                  endTime: '19:30',
                  location: 'Complexo Municipal do Porto',
                  description: `${plan.modality} • Duração: ${plan.durationMinutes} min • Intensidade ${plan.intensityLevel}/5`
                });
              }
            }
          });
        }
      });
    }

    // Ordenar cronologicamente por data e hora
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    return list;
  }, [calendarEvents, trainingPlans, activeAthlete, authorizations, carpools]);

  const filteredSeptemberActivities = useMemo(() => {
    let result = septemberActivities;
    if (septemberFilterType === 'provas') {
      result = result.filter((a) => a.type === 'prova');
    } else if (septemberFilterType === 'treinos') {
      result = result.filter(
        (a) => a.type === 'treino_oficial' || a.type === 'treino_individual' || a.type === 'plano_treino'
      );
    }
    return result;
  }, [septemberActivities, septemberFilterType]);

  const handleCreateCarpool = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnderageAthlete) {
      showToast('Por motivos legais de segurança rodoviária, atletas menores de 18 anos não podem disponibilizar lugares na bolsa de boleias.', 'error');
      setIsOfferCarpoolOpen(false);
      return;
    }
    addCarpoolOffer({
      parentId: currentUser.id,
      parentName: currentUser.name,
      athleteName: activeAthlete?.name || 'Atleta',
      eventId: 'evt-carpool',
      eventTitle: carpoolEventTitle,
      eventDate: carpoolDate,
      availableSeats: carpoolSeats,
      departureLocation: carpoolLocation,
      departureTime: carpoolTime,
      contactPhone: carpoolPhone,
      notes: carpoolNotes
    });
    setIsOfferCarpoolOpen(false);
  };

  const handleClaimSeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClaimSeatOpen) return;
    claimCarpoolSeat(
      isClaimSeatOpen.id,
      currentUser.name,
      activeAthlete?.name || 'Educando',
      claimSeatsCount
    );
    setIsClaimSeatOpen(null);
  };

  const handleConfirmDeleteCarpool = () => {
    if (!carpoolToDelete) return;
    deleteCarpoolOffer(carpoolToDelete.id);
    setCarpoolToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-purple-600" />
            Portal dos Pais & Encarregados de Educação
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhamento desportivo, autorizações de provas, ficha do educando e bolsa de boleias
          </p>
        </div>

        {/* Child / Educando Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <span className="text-[11px] font-extrabold text-slate-600 pl-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            Atleta a Cargo:
          </span>
          <select
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer max-w-[220px] truncate"
          >
            <option value="nao_inserido">⚠️ Não inserido</option>
            <optgroup label="Atletas do Clube">
              {athletes.map((ath) => (
                <option key={ath.id} value={ath.id}>
                  {ath.name} ({ath.category})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200 w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('ficha')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ficha'
              ? 'bg-white text-purple-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Dados do Encarregado e Atleta</span>
        </button>

        <button
          onClick={() => setActiveSubTab('visao_geral')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'visao_geral'
              ? 'bg-white text-purple-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>Resumo e Provas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('boleias')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'boleias'
              ? 'bg-white text-purple-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="w-4 h-4 text-teal-600" />
          <span>Bolsa de Boleias</span>
          <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold">
            {carpools.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: FICHA DO ENCARREGADO & ATLETA (FORMULÁRIO COMPLETO) */}
      {/* ========================================================================= */}
      {activeSubTab === 'ficha' && (
        <div className="animate-in fade-in duration-200">
          <ParentAthleteDataForm
            activeAthlete={activeAthlete}
            selectedAthleteId={selectedAthleteId}
            onSelectAthleteId={setSelectedAthleteId}
            onSuccess={() => {}}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: VISÃO GERAL & AUTORIZAÇÕES DE PROVAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'visao_geral' && activeAthlete && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Athlete Overview Card */}
          <div className="md:col-span-1 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 h-fit">
            <div className="flex items-center gap-3">
              <img
                src={activeAthlete.photoUrl}
                alt={activeAthlete.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{activeAthlete.name}</h3>
                <p className="text-xs text-purple-700 font-bold">{activeAthlete.category}</p>
                <p className="text-[11px] font-mono text-slate-400">{activeAthlete.federationNumber}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-600">Assiduidade aos Treinos</span>
                <span className="font-extrabold text-emerald-600 text-sm">{activeAthlete.attendanceRate}%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-600">Exame Médico Desportivo</span>
                <span className={`font-bold ${activeAthlete.medicalStatus === 'valido' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {activeAthlete.medicalStatus === 'valido' ? '✓ Válido' : '⚠ A Expirar'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">
                  Contacto de Emergência Registado:
                </span>
                <p className="font-bold text-purple-950 text-xs">{activeAthlete.emergencyContact}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Encarregado de Educação:
                </span>
                <p className="font-bold text-slate-800 text-xs">
                  {activeAthlete.guardianName || 'Não especificado'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeAthlete.guardianPhone || activeAthlete.guardianEmail || activeAthlete.emergencyContact || 'Sem contacto direto'}
                </p>
              </div>
            </div>

            {/* Quick Link to Edit Guardian & Athlete Form */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('ficha')}
                className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Editar Dados do Encarregado & Atleta</span>
              </button>
            </div>
          </div>

          {/* Activities */}
          <div className="md:col-span-2 space-y-6">
            {/* Dias com Atividade em Setembro */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-100/80 text-purple-700">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                        Dias com Atividade em Setembro
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                        Setembro 2026
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeAthlete ? `Calendário de provas e treinos de ${activeAthlete.name.split(' ')[0]}` : 'Calendário de provas e treinos agendados'}
                    </p>
                  </div>
                </div>

                {/* Filter chips: Todos, Provas, Treinos */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSeptemberFilterType('todos')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      septemberFilterType === 'todos'
                        ? 'bg-white text-purple-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({septemberActivities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeptemberFilterType('provas')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      septemberFilterType === 'provas'
                        ? 'bg-white text-amber-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Provas ({septemberActivities.filter(a => a.type === 'prova').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeptemberFilterType('treinos')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      septemberFilterType === 'treinos'
                        ? 'bg-white text-indigo-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Treinos ({septemberActivities.filter(a => a.type !== 'prova' && a.type !== 'tarefa').length})</span>
                  </button>
                </div>
              </div>

              {/* Activities List for September */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Atividades Agendadas em Setembro ({filteredSeptemberActivities.length})
                  </h4>
                </div>

                {filteredSeptemberActivities.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    Nenhuma atividade encontrada com os filtros selecionados.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredSeptemberActivities.map((act) => (
                      <div
                        key={act.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          act.type === 'prova'
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-slate-50/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Date Badge */}
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center shrink-0">
                              <span className="text-base font-black text-slate-900 leading-none">
                                {act.dayNumber < 10 ? `0${act.dayNumber}` : act.dayNumber}
                              </span>
                              <span className="text-[9px] font-bold text-purple-700 uppercase tracking-tighter mt-0.5">
                                {act.weekday}
                              </span>
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {act.type === 'prova' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-amber-600" />
                                    <span>Prova Oficial</span>
                                  </span>
                                )}
                                {act.type === 'treino_oficial' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-flex items-center gap-1">
                                    <Dumbbell className="w-3 h-3 text-purple-600" />
                                    <span>Treino de Equipa</span>
                                  </span>
                                )}
                                {act.type === 'plano_treino' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-indigo-600" />
                                    <span>Plano Prescrito</span>
                                  </span>
                                )}
                                {act.type === 'treino_individual' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200 inline-flex items-center gap-1">
                                    <Users className="w-3 h-3 text-blue-600" />
                                    <span>Treino Individual</span>
                                  </span>
                                )}
                                {act.type === 'tarefa' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200 inline-flex items-center gap-1">
                                    <FileCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Prazo de Clube</span>
                                  </span>
                                )}

                                {act.authorization && (
                                  act.authorization.status === 'autorizado' ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Autorizado</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1 animate-pulse">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Assinatura Pendente</span>
                                    </span>
                                  )
                                )}

                                {act.carpool && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 inline-flex items-center gap-1">
                                    <Car className="w-3 h-3 text-teal-600" />
                                    <span>Boleia Disponível</span>
                                  </span>
                                )}
                              </div>

                              <h4 className="font-extrabold text-slate-900 text-sm">
                                {act.title}
                              </h4>

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{act.time}{act.endTime ? ` às ${act.endTime}` : ''}</span>
                                </span>
                                {act.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{act.location}</span>
                                  </span>
                                )}
                              </div>

                              {act.description && (
                                <p className="text-xs text-slate-600 pt-0.5">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action button if pending authorization */}
                          {act.authorization && act.authorization.status === 'pendente' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateAuthorizationStatus(
                                  act.authorization!.id,
                                  'autorizado',
                                  `Autorizado por ${currentUser.name}`
                                )
                              }
                              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 self-center"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Assinar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visão Geral: Estado quando 'Não inserido' */}
      {activeSubTab === 'visao_geral' && (!activeAthlete || selectedAthleteId === 'nao_inserido') && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center space-y-4 max-w-xl mx-auto my-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-slate-900">
              Atleta a Cargo: Não Inserido
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Neste momento a opção selecionada é <strong>"Não inserido"</strong>. Pode associar um atleta existente no clube através do seletor acima para consultar a visão geral ou abrir a ficha cadastral para atualizar os dados.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('ficha')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Abrir Ficha de Dados do Encarregado & Atleta</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BOLSA DE BOLEIAS & TRANSPORTE SOLIDÁRIO (COMPLETA) */}
      {/* ========================================================================= */}
      {activeSubTab === 'boleias' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Bolsa de Boleias & Transporte Solidário
                </h3>
                <p className="text-xs text-slate-500">
                  Partilha responsável de lugares em viagens para treinos e competições
                </p>
              </div>
            </div>

            {isUnderageAthlete ? (
              <div
                title="Por requisitos legais de segurança rodoviária e habilitação de condução, atletas menores de 18 anos não podem disponibilizar lugares."
                className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2 select-none self-start sm:self-auto"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Disponibilização restrita a maiores de 18 anos</span>
              </div>
            ) : (
              <button
                onClick={() => setIsOfferCarpoolOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Disponibilizar Lugares</span>
              </button>
            )}
          </div>

          {/* Aviso Legal para Atletas Menores de 18 Anos */}
          {isUnderageAthlete && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start sm:items-center gap-3 animate-in fade-in">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-slate-900 mb-0.5">
                  Restrição Legal de Segurança Rodoviária: Condutores
                </p>
                <p className="text-slate-600">
                  Por razões legais de segurança e habilitação de condução, os atletas menores de 18 anos {currentAthleteAge !== null ? `(${currentAthleteAge} anos)` : ''} não podem disponibilizar lugares como condutores na bolsa de boleias. Podes, no entanto, consultar todas as viagens ativas e reservar lugares com os encarregados de educação e treinadores responsáveis.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {carpools.map((carp) => {
              const claimedTotal = carp.claimedSeats.reduce((acc, c) => acc + c.seats, 0);
              const remaining = carp.availableSeats - claimedTotal;
              const isOwner =
                carp.parentId === currentUser.id ||
                carp.parentName === currentUser.name ||
                currentUser.role === 'treinador';

              return (
                <div
                  key={carp.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 hover:border-teal-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                        Organizado por: {carp.parentName} {carp.athleteName ? `(Educando: ${carp.athleteName})` : ''}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5">
                        {carp.eventTitle}
                      </h4>
                      <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span>📅 <strong>Data:</strong> {carp.eventDate} às {carp.departureTime}</span>
                        <span>• 📍 <strong>Partida:</strong> {carp.departureLocation}</span>
                        {carp.contactPhone && (
                          <span>• 📞 <strong>Contacto:</strong> {carp.contactPhone}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                          remaining > 0
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {remaining > 0 ? `${remaining} lugares livres` : 'Esgotado'}
                      </span>

                      {/* Delete button available for offer owner or coach */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setCarpoolToDelete(carp)}
                          title="Eliminar esta oferta de boleia"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {carp.notes && (
                    <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                      "{carp.notes}"
                    </p>
                  )}

                  {/* Claimed list */}
                  {carp.claimedSeats.length > 0 ? (
                    <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-xs">
                      <span className="font-bold text-teal-900 block mb-1">
                        Passageiros Confirmados ({claimedTotal}/{carp.availableSeats} lugares):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {carp.claimedSeats.map((c, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-teal-200 text-[11px] font-semibold text-slate-800"
                          >
                            <User className="w-3 h-3 text-teal-600" />
                            <span>{c.athleteName} ({c.parentName})</span>
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded">
                              {c.seats} lug.
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Ainda não existem reservas nesta boleia.
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setCarpoolToDelete(carp)}
                          className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar Boleia</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {carp.contactPhone && (
                        <a
                          href={`https://wa.me/${carp.contactPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {remaining > 0 && (
                        <button
                          onClick={() => setIsClaimSeatOpen(carp)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Reservar Lugar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {carpools.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Não existem ofertas de boleias ativas.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isUnderageAthlete
                    ? 'Apenas encarregados de educação, treinadores ou atletas maiores de 18 anos podem criar ofertas de boleia.'
                    : 'Seja o primeiro a disponibilizar lugares para a próxima competição!'}
                </p>
                {!isUnderageAthlete && (
                  <button
                    type="button"
                    onClick={() => setIsOfferCarpoolOpen(true)}
                    className="mt-3 px-4 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Disponibilizar Lugares
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR BOLEIA COM NOTIFICAÇÃO AOS PASSAGEIROS QUE RESERVARAM */}
      {/* ========================================================================= */}
      {carpoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Eliminar Oferta de Boleia
              </h3>
              <button
                onClick={() => setCarpoolToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <p className="text-slate-700">
                Tem a certeza de que pretende eliminar a oferta de boleia para{' '}
                <strong>"{carpoolToDelete.eventTitle}"</strong> no dia <strong>{carpoolToDelete.eventDate}</strong>?
              </p>

              {/* Passenger notification warning */}
              {carpoolToDelete.claimedSeats && carpoolToDelete.claimedSeats.length > 0 ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Atenção: Existem {carpoolToDelete.claimedSeats.length} família(s) com lugares confirmados nesta viagem!
                    </span>
                  </div>
                  <div className="pl-6 space-y-1 text-xs text-amber-800">
                    {carpoolToDelete.claimedSeats.map((claim, idx) => (
                      <p key={idx} className="font-medium">
                        • <strong>{claim.athleteName}</strong> (Encarregado: {claim.parentName}) — {claim.seats} lugar(es)
                      </p>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-900/80 font-bold pt-1 border-t border-amber-200/60">
                    Ao confirmar a eliminação, todas estas famílias serão notificadas de imediato através de uma notificação urgente informando que a boleia ficou sem efeito e a reserva foi cancelada.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Esta boleia não tem atualmente passageiros ou reservas registadas.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCarpoolToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCarpool}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {carpoolToDelete.claimedSeats.length > 0
                    ? 'Eliminar & Notificar Famílias'
                    : 'Confirmar Eliminação'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFERECER BOLEIA */}
      {/* ========================================================================= */}
      {isOfferCarpoolOpen && !isUnderageAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-teal-600" />
                Disponibilizar Lugares / Boleia
              </h3>
              <button
                onClick={() => setIsOfferCarpoolOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCarpool} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Evento / Torneio *</label>
                <input
                  type="text"
                  required
                  value={carpoolEventTitle}
                  onChange={(e) => setCarpoolEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Data da Viagem *</label>
                  <input
                    type="date"
                    required
                    value={carpoolDate}
                    onChange={(e) => setCarpoolDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hora de Partida</label>
                  <input
                    type="time"
                    value={carpoolTime}
                    onChange={(e) => setCarpoolTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lugares Disponíveis</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={carpoolSeats}
                    onChange={(e) => setCarpoolSeats(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefone de Contacto</label>
                  <input
                    type="text"
                    value={carpoolPhone}
                    onChange={(e) => setCarpoolPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Local de Encontro / Partida *</label>
                <input
                  type="text"
                  required
                  value={carpoolLocation}
                  onChange={(e) => setCarpoolLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  placeholder="Ex: Rotunda da Boavista / Complexo Municipal"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notas Adicionais</label>
                <textarea
                  rows={2}
                  value={carpoolNotes}
                  onChange={(e) => setCarpoolNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  placeholder="Espaço na bagageira, paragens..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOfferCarpoolOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs active:scale-95 cursor-pointer"
                >
                  Publicar Boleia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESERVAR LUGAR NA BOLEIA */}
      {/* ========================================================================= */}
      {isClaimSeatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Reservar Lugar na Boleia</h3>
              <button
                onClick={() => setIsClaimSeatOpen(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClaimSeatSubmit} className="space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-slate-600 font-medium">
                Está a reservar lugar na viagem de <strong>{isClaimSeatOpen.parentName}</strong> para a prova{' '}
                <strong>"{isClaimSeatOpen.eventTitle}"</strong>.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Atleta / Passageiro:</label>
                <input
                  type="text"
                  disabled
                  value={activeAthlete?.name}
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl border border-slate-300 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Número de Lugares a Reservar:</label>
                <select
                  value={claimSeatsCount}
                  onChange={(e) => setClaimSeatsCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                >
                  <option value={1}>1 Lugar (Apenas Atleta)</option>
                  <option value={2}>2 Lugares (Atleta + Acompanhante)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClaimSeatOpen(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs active:scale-95 cursor-pointer"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
