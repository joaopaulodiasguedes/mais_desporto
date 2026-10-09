import React, { useState, useMemo } from 'react';
import { useApp, isCalendarEventVisibleForUser } from '../context/AppContext';
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Trophy,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Edit,
  CheckCircle2,
  X,
  Check,
  UserCheck,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Compass,
  Briefcase,
  Users,
  Settings,
  CheckSquare,
  Lock,
  Globe2,
  ExternalLink
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { DayManagerModal } from './DayManagerModal';
import { EventModal } from './EventModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { openOriginalDocument } from '../utils/documentUtils';

interface CalendarTabProps {
  onOpenPdf: (title: string, url: string) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const CalendarTab: React.FC<CalendarTabProps> = ({ onOpenPdf }) => {
  const {
    calendarEvents,
    deleteCalendarEvent,
    setEventRsvp,
    currentUser,
    hasPermission,
    athletes,
    toggleEventCompletion
  } = useApp();

  // Current view: Month and Year — defaults to today
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // Pre-select today's day number
  const [selectedDay, setSelectedDay] = useState<number | null>(() => today.getDate());
  const [filterType, setFilterType] = useState<'todos' | 'treino' | 'competicao' | 'tarefas'>('todos');

  // Day Manager Modal (Full Day CRUD)
  const [isDayManagerOpen, setIsDayManagerOpen] = useState(false);
  const [dayManagerDayNumber, setDayManagerDayNumber] = useState<number | null>(null);

  // Generic Event Modal (Create or Edit)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [defaultEventType, setDefaultEventType] = useState<'treino_oficial' | 'prova' | 'estagio' | 'reuniao' | 'treino_individual' | 'tarefa'>('treino_oficial');
  const [defaultEventDate, setDefaultEventDate] = useState<string>('');

  // RSVP Form Modal
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [rsvpSelectedEvent, setRsvpSelectedEvent] = useState<CalendarEvent | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'confirmado' | 'ausente' | 'justificado'>('confirmado');
  const [rsvpNote, setRsvpNote] = useState('');

  const isCoach = currentUser.role === 'treinador';
  const canManage = isCoach || hasPermission('canAddCompetitions');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  // Helper to check if an event is a "Competição" or "Treino"
  const isCompetition = (evt: CalendarEvent) => evt.type === 'prova';
  const isTraining = (evt: CalendarEvent) => evt.type === 'treino_oficial' || evt.type === 'treino_individual';

  // Events of this month, filtered by user visibility (athletes see only their tasks & public coach events)
  const monthEvents = useMemo(() => {
    return calendarEvents.filter((evt) => {
      const parts = evt.date.split('-');
      if (parts.length < 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === currentYear && m === currentMonth;
    }).filter((evt) => isCalendarEventVisibleForUser(evt, currentUser, athletes));
  }, [calendarEvents, currentYear, currentMonth, currentUser, athletes]);

  // Filtered month events
  const filteredMonthEvents = useMemo(() => {
    return monthEvents.filter((evt) => {
      if (filterType === 'competicao') return isCompetition(evt);
      if (filterType === 'treino') return isTraining(evt);
      if (filterType === 'tarefas') return evt.type === 'tarefa';
      return true;
    }).filter((evt) => {
      if (selectedDay === null) return true;
      const d = parseInt(evt.date.split('-')[2], 10);
      return d === selectedDay;
    }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [monthEvents, filterType, selectedDay]);

  // Days in month calculation for the grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  // Map of events by day number
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      map[d] = [];
    }
    monthEvents.forEach((evt) => {
      const d = parseInt(evt.date.split('-')[2], 10);
      if (map[d]) {
        map[d].push(evt);
      }
    });
    return map;
  }, [monthEvents, daysInMonth]);

  // Counts for the month
  const totalCompetitions = monthEvents.filter(isCompetition).length;
  const totalTrainings = monthEvents.filter(isTraining).length;
  const totalTasks = monthEvents.filter((e) => e.type === 'tarefa').length;

  // Day Click Handler: Selects day for side-by-side view (or opens day manager if already selected)
  const handleDayClick = (dayNum: number) => {
    if (selectedDay === dayNum) {
      setDayManagerDayNumber(dayNum);
      setIsDayManagerOpen(true);
    } else {
      setSelectedDay(dayNum);
    }
  };

  const handleOpenCreateEvent = (
    type: 'treino_oficial' | 'prova' | 'estagio' | 'reuniao' | 'treino_individual' | 'tarefa',
    targetDay?: number
  ) => {
    const day = targetDay || selectedDay || 15;
    const dateFormatted = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEventToEdit(null);
    setDefaultEventType(type);
    setDefaultEventDate(dateFormatted);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: CalendarEvent) => {
    setEventToEdit(evt);
    setIsEventModalOpen(true);
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpSelectedEvent) return;
    setEventRsvp(rsvpSelectedEvent.id, rsvpStatus, rsvpNote);
    setIsRsvpModalOpen(false);
    setRsvpNote('');
  };

  const getUserRsvp = (event: CalendarEvent) => {
    const key = currentUser.athleteProfileId || currentUser.id;
    return event.rsvps?.[key];
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Coach Info Banner */}
      {isCoach && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
                Modo de Gestão do Treinador Ativo
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800 font-medium">
                Clique em qualquer dia do calendário para <strong className="font-bold">adicionar treinos, provas, tarefas para a equipa (visíveis a todos)</strong> e gerir presenças.
              </p>
            </div>
          </div>
          {selectedDay && (
            <button
              onClick={() => {
                setDayManagerDayNumber(selectedDay);
                setIsDayManagerOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gerir Dia {selectedDay}</span>
            </button>
          )}
        </div>
      )}

      {/* Athlete Info Banner */}
      {currentUser.role === 'atleta' && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-teal-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-extrabold text-teal-950 flex items-center gap-2">
                  <span>Calendário Pessoal do Atleta</span>
                </h4>
             
              </div>
              <p className="text-[11px] sm:text-xs text-teal-800 font-medium">
                Podes adicionar as tuas tarefas e treinos pessoais (visíveis apenas para ti).
              </p>
              <p className="text-[11px] sm:text-xs text-teal-800 font-medium">
                As tarefas e treinos adicionados pelo treinador são visualizados por toda a equipa.
              </p>
            </div>
          </div>
         
        </div>
      )}

      {/* 50/50 SPLIT LAYOUT AS REQUESTED:
          "em calendário quero uma visualização igual ao plano de treinos, calendário e eventos lado a lado" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* =========================================================
            COLUNA 1 (ESQUERDA): O CALENDÁRIO INTERATIVO E FILTROS
            ========================================================= */}
        <div className="space-y-5">
          {/* Month Navigation & Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Month & Year Navigator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={handleGoToToday}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-xs cursor-pointer"
                  title="Ir para o dia de hoje"
                >
                  Hoje
                </button>
                <button
                  onClick={prevMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all shadow-xs hover:shadow-2xs cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-all shadow-xs hover:shadow-2xs cursor-pointer"
              title="Mês seguinte"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {totalCompetitions} {totalCompetitions === 1 ? 'Competição' : 'Competições'} • {totalTrainings} {totalTrainings === 1 ? 'Treino' : 'Treinos'} • {totalTasks} {totalTasks === 1 ? 'Tarefa' : 'Tarefas'} neste mês
            </p>
          </div>
        </div>

        {/* Filters and Add Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Quick Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 flex-wrap gap-0.5">
            <button
              onClick={() => { setFilterType('todos'); setSelectedDay(null); }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Todos ({monthEvents.length})
            </button>
            <button
              onClick={() => { setFilterType('treino'); setSelectedDay(null); }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                filterType === 'treino' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-blue-600'
              }`}
            >
              <Dumbbell className="w-3 h-3" />
              <span>Treinos ({totalTrainings})</span>
            </button>
            <button
              onClick={() => { setFilterType('competicao'); setSelectedDay(null); }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                filterType === 'competicao' ? 'bg-amber-500 text-white shadow-xs' : 'hover:text-amber-600'
              }`}
            >
              <Trophy className="w-3 h-3" />
              <span>Competições ({totalCompetitions})</span>
            </button>
            <button
              onClick={() => { setFilterType('tarefas'); setSelectedDay(null); }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                filterType === 'tarefas' ? 'bg-teal-600 text-white shadow-xs' : 'hover:text-teal-600'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>Tarefas ({totalTasks})</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  onClick={() => handleOpenCreateEvent('tarefa')}
                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Criar tarefa pública para a equipa"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tarefa Equipa</span>
                </button>
                <button
                  onClick={() => handleOpenCreateEvent('treino_oficial')}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Treino</span>
                </button>
                <button
                  onClick={() => handleOpenCreateEvent('prova')}
                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Competição</span>
                </button>
              </>
            )}
            {currentUser.role === 'atleta' && (
              <button
                onClick={() => {
                  setEventToEdit(null);
                  setDefaultEventType('tarefa');
                  setDefaultEventDate(new Date().toISOString().split('T')[0]);
                  setIsEventModalOpen(true);
                }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tarefa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Interactive Calendar Grid */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-500">
            {isCoach ? '💡 Clique em qualquer dia para abrir a gestão e CRUD do dia' : 'Selecione um dia para filtrar os eventos'}
          </span>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
            >
              Limpar filtro do dia ({selectedDay})
            </button>
          )}
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[64px] sm:min-h-[90px] bg-slate-50/50 rounded-xl border border-transparent opacity-30" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayEvents = eventsByDay[dayNum] || [];
            const hasComp = dayEvents.some(isCompetition);
            const hasTrain = dayEvents.some(isTraining);
            const taskEvents = dayEvents.filter((e) => e.type === 'tarefa');
            const hasTask = taskEvents.length > 0;
            const isAthlete = currentUser.role === 'atleta';
            const confirmedTasks = taskEvents.filter((t) => getUserRsvp(t)?.status === 'confirmado');
            const absentTasks = taskEvents.filter((t) => getUserRsvp(t)?.status === 'ausente');
            const hasEstagio = dayEvents.some((e) => e.type === 'estagio');
            const hasReuniao = dayEvents.some((e) => e.type === 'reuniao');
            const isSelected = selectedDay === dayNum;
            const isToday = dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => handleDayClick(dayNum)}
                className={`group min-h-[64px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer relative ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-400/40 bg-orange-50/50 shadow-sm'
                    : isToday
                    ? 'border-blue-400 ring-1 ring-blue-300/50 bg-blue-50/30 hover:border-blue-500'
                    : dayEvents.length > 0
                    ? 'border-slate-200 bg-white hover:border-orange-400 hover:shadow-xs'
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                }`}
                title={`Clique para ver as atividades do dia ${dayNum}`}
              >
                {/* Day Number and indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs sm:text-sm font-extrabold ${
                      isSelected
                        ? 'bg-orange-500 text-white font-black shadow-xs'
                        : isToday
                        ? 'bg-blue-600 text-white font-black shadow-xs'
                        : dayEvents.length > 0
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* CRUD quick badge indicator */}
                  {isCoach && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-orange-600 bg-orange-100 px-1 py-0.2 rounded-md hidden sm:inline">
                      Gerir
                    </span>
                  )}
                  {currentUser.role === 'atleta' && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-teal-600 bg-teal-100 px-1 py-0.2 rounded-md hidden sm:inline">
                      Ações
                    </span>
                  )}

                  {!isCoach && currentUser.role !== 'atleta' && dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                      {dayEvents.length} {dayEvents.length === 1 ? 'evt' : 'evts'}
                    </span>
                  )}
                </div>

                {/* Event Pills inside Day Cell */}
                <div className="space-y-1 mt-1">
                  {hasComp && (
                    <div className="px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold flex items-center gap-1 truncate shadow-2xs">
                      <Trophy className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                      <span className="truncate">Competição</span>
                    </div>
                  )}

                  {hasTrain && (
                    <div className="px-1.5 py-0.5 rounded-md bg-blue-100 border border-blue-300 text-blue-900 text-[10px] font-extrabold flex items-center gap-1 truncate shadow-2xs">
                      <Dumbbell className="w-2.5 h-2.5 text-blue-700 shrink-0" />
                      <span className="truncate">Treino</span>
                    </div>
                  )}

                  {hasTask && (
                    isAthlete ? (
                      confirmedTasks.length > 0 && absentTasks.length === 0 ? (
                        <div
                          className="px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-400 text-emerald-950 text-[10px] font-extrabold flex items-center justify-between gap-1 truncate shadow-2xs"
                          title="Tarefa: Presença Confirmada (Visto Verde)"
                        >
                          <div className="flex items-center gap-1 truncate">
                            <CheckSquare className="w-2.5 h-2.5 text-emerald-800 shrink-0" />
                            <span className="truncate">Tarefa</span>
                          </div>
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-600 text-white font-black text-[9px] shrink-0 shadow-2xs">
                            ✓
                          </span>
                        </div>
                      ) : absentTasks.length > 0 && confirmedTasks.length === 0 ? (
                        <div
                          className="px-1.5 py-0.5 rounded-md bg-red-100 border border-red-400 text-red-950 text-[10px] font-extrabold flex items-center justify-between gap-1 truncate shadow-2xs"
                          title="Tarefa: Ausente (Cruz Vermelha)"
                        >
                          <div className="flex items-center gap-1 truncate">
                            <CheckSquare className="w-2.5 h-2.5 text-red-800 shrink-0" />
                            <span className="truncate">Tarefa</span>
                          </div>
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-600 text-white font-black text-[9px] shrink-0 shadow-2xs">
                            ✕
                          </span>
                        </div>
                      ) : confirmedTasks.length > 0 && absentTasks.length > 0 ? (
                        <div
                          className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-900 text-[10px] font-extrabold flex items-center justify-between gap-1 truncate shadow-2xs"
                          title="Tarefas: Confirmadas e Ausentes"
                        >
                          <div className="flex items-center gap-1 truncate">
                            <CheckSquare className="w-2.5 h-2.5 text-slate-700 shrink-0" />
                            <span className="truncate">Tarefa</span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-emerald-600 text-white font-black text-[8px]" title="Confirmado">✓</span>
                            <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-red-600 text-white font-black text-[8px]" title="Ausente">✕</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="px-1.5 py-0.5 rounded-md bg-teal-100 border border-teal-300 text-teal-950 text-[10px] font-extrabold flex items-center justify-between gap-1 truncate shadow-2xs"
                          title="Tarefa (Presença por confirmar)"
                        >
                          <div className="flex items-center gap-1 truncate">
                            <CheckSquare className="w-2.5 h-2.5 text-teal-700 shrink-0" />
                            <span className="truncate">Tarefa</span>
                          </div>
                          <span className="text-[9px] font-bold text-teal-700">Pendente</span>
                        </div>
                      )
                    ) : (
                      <div className="px-1.5 py-0.5 rounded-md bg-teal-100 border border-teal-300 text-teal-950 text-[10px] font-extrabold flex items-center gap-1 truncate shadow-2xs">
                        <CheckSquare className="w-2.5 h-2.5 text-teal-700 shrink-0" />
                        <span className="truncate">Tarefa</span>
                      </div>
                    )
                  )}

                  {hasEstagio && (
                    <div className="px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-extrabold flex items-center gap-1 truncate shadow-2xs">
                      <Compass className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                      <span className="truncate">Estágio</span>
                    </div>
                  )}

                  {hasReuniao && (
                    <div className="px-1.5 py-0.5 rounded-md bg-purple-100 border border-purple-300 text-purple-900 text-[10px] font-extrabold flex items-center gap-1 truncate shadow-2xs">
                      <Briefcase className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                      <span className="truncate">Reunião</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-bold text-slate-700">
              A filtrar pelo dia <span className="text-orange-600 font-extrabold">{selectedDay} de {MONTH_NAMES[currentMonth]}</span> ({eventsByDay[selectedDay]?.length || 0} atividades)
            </span>
            <div className="flex items-center gap-2">
              {(canManage || currentUser.role === 'atleta') && (
                <button
                  onClick={() => {
                    setDayManagerDayNumber(selectedDay);
                    setIsDayManagerOpen(true);
                  }}
                  className={`px-3 py-1 font-extrabold rounded-lg text-xs shadow-2xs flex items-center gap-1 cursor-pointer ${
                    isCoach
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Ver Atividades deste Dia</span>
                </button>
              )}
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
              >
                Ver todos os dias
              </button>
            </div>
          </div>
        )}
      </div>
        </div>

        {/* =========================================================
            COLUNA 2 (DIREITA): ATIVIDADES E EVENTOS DISCRIMINADOS
            ========================================================= */}
        <div className="space-y-5">
          {/* Selected Day Quick Management Bar or Month Overview Header */}
          {selectedDay ? (
            <div className="bg-white rounded-2xl p-4 border border-orange-200 bg-gradient-to-r from-orange-50/40 to-white shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-base shrink-0 shadow-xs">
                  {selectedDay}
                </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Dia {selectedDay} de {MONTH_NAMES[currentMonth]} de {currentYear}
              </h4>
              <p className="text-xs text-slate-500">
                {eventsByDay[selectedDay]?.length || 0} atividades agendadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canManage && (
              <>
                <button
                  onClick={() => handleOpenCreateEvent('treino_oficial', selectedDay)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Treino no Dia {selectedDay}</span>
                </button>

                <button
                  onClick={() => handleOpenCreateEvent('prova', selectedDay)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Competição no Dia {selectedDay}</span>
                </button>

                <button
                  onClick={() => handleOpenCreateEvent('tarefa', selectedDay)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tarefa Equipa</span>
                </button>
              </>
            )}

            {currentUser.role === 'atleta' && (
              <>
                <button
                  onClick={() => handleOpenCreateEvent('tarefa', selectedDay)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Minha Tarefa no Dia {selectedDay}</span>
                </button>

                <button
                  onClick={() => handleOpenCreateEvent('treino_individual', selectedDay)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Treino Individual</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setDayManagerDayNumber(selectedDay);
                setIsDayManagerOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Painel do Dia</span>
            </button>
          </div>
        </div>
      ) : (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-black flex items-center justify-center text-base shrink-0">
                  <CalendarDays className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Todas as Atividades de {MONTH_NAMES[currentMonth]}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {filteredMonthEvents.length} atividades • Clique num dia no calendário para focar
                  </p>
                </div>
              </div>
              {today.getMonth() === currentMonth && today.getFullYear() === currentYear && (
                <button
                  onClick={() => setSelectedDay(today.getDate())}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Focar Hoje ({today.getDate()})</span>
                </button>
              )}
            </div>
          )}

          {/* Days & Events List for the Month */}
          <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            {selectedDay
              ? `Eventos no dia ${selectedDay} de ${MONTH_NAMES[currentMonth]} (${filteredMonthEvents.length})`
              : `Todos os Dias com Atividade em ${MONTH_NAMES[currentMonth]} (${filteredMonthEvents.length})`}
          </h3>
        </div>

        {filteredMonthEvents.map((evt) => {
          const comp = isCompetition(evt);
          const train = isTraining(evt);
          const isTask = evt.type === 'tarefa';
          const userRsvp = getUserRsvp(evt);
          const isOwnerOrCoach = isCoach || evt.creatorId === currentUser.id || canManage;

          const dateObj = new Date(evt.date);
          const dayNumber = parseInt(evt.date.split('-')[2], 10);
          const weekdayName = dateObj.toLocaleDateString('pt-PT', { weekday: 'short' });

          return (
            <div
              key={evt.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:shadow-md ${
                comp
                  ? 'border-amber-200 hover:border-amber-400 bg-gradient-to-r from-amber-50/20 to-white'
                  : isTask
                  ? 'border-teal-200 hover:border-teal-400 bg-gradient-to-r from-teal-50/20 to-white'
                  : train
                  ? 'border-blue-200 hover:border-blue-400 bg-gradient-to-r from-blue-50/20 to-white'
                  : 'border-slate-200 hover:border-slate-400 bg-gradient-to-r from-slate-50/30 to-white'
              }`}
            >
              {/* Date & Core Info */}
              <div className="flex items-start gap-4">
                {/* Day Badge (Clickable to manage that day) */}
                <button
                  onClick={() => handleDayClick(dayNumber)}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 border shadow-xs transition-transform hover:scale-105 cursor-pointer ${
                    comp
                      ? 'bg-amber-100/90 text-amber-950 border-amber-300'
                      : isTask
                      ? 'bg-teal-100/90 text-teal-950 border-teal-300'
                      : train
                      ? 'bg-blue-100/90 text-blue-950 border-blue-300'
                      : 'bg-slate-100 text-slate-900 border-slate-300'
                  }`}
                  title={`Ver dia ${dayNumber}`}
                >
                  <span className="text-[10px] font-extrabold uppercase opacity-80">
                    {weekdayName}
                  </span>
                  <span className="text-xl font-black leading-none">
                    {dayNumber}
                  </span>
                </button>

                {/* Event Details */}
                <div className="space-y-1">
                  {/* Type Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {comp && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[11px] shadow-2xs">
                        <Trophy className="w-3 h-3" /> COMPETIÇÃO
                      </span>
                    )}
                    {train && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[11px] shadow-2xs">
                        <Dumbbell className="w-3 h-3" /> {evt.type === 'treino_individual' ? 'TREINO INDIVIDUAL' : 'TREINO'}
                      </span>
                    )}
                    {isTask && (
                      evt.createdByRole === 'treinador' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 font-extrabold text-[11px] shadow-2xs">
                          <Globe2 className="w-3 h-3 text-blue-600" /> TAREFA EQUIPA (PÚBLICA)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 font-extrabold text-[11px] shadow-2xs">
                          <Lock className="w-3 h-3 text-teal-600" /> MINHA TAREFA (PRIVADA)
                        </span>
                      )
                    )}
                    {isTask && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        evt.isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {evt.isCompleted ? '✓ Concluída' : '○ Pendente'}
                      </span>
                    )}
                    {evt.type === 'estagio' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] shadow-2xs">
                        <Compass className="w-3 h-3" /> ESTÁGIO
                      </span>
                    )}
                    {evt.type === 'reuniao' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-[11px] shadow-2xs">
                        <Briefcase className="w-3 h-3" /> REUNIÃO
                      </span>
                    )}

                    <span className="text-xs text-slate-500 font-medium">
                      {evt.time} {evt.endTime ? `às ${evt.endTime}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    {isTask && (
                      <button
                        type="button"
                        onClick={() => toggleEventCompletion(evt.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer ${
                          evt.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-300 border-slate-300 hover:border-teal-500'
                        }`}
                        title={evt.isCompleted ? "Marcar como pendente" : "Marcar como concluída"}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <h4 className={`text-base font-extrabold ${isTask && evt.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {evt.title}
                    </h4>

                    {/* Visto verde ou Cruz vermelha para Atleta na Tarefa */}
                    {isTask && currentUser.role === 'atleta' && (
                      userRsvp?.status === 'confirmado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black shadow-2xs">
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span>Presença Confirmada (✓)</span>
                        </span>
                      ) : userRsvp?.status === 'ausente' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-900 text-xs font-black shadow-2xs">
                          <X className="w-3.5 h-3.5 text-red-600 stroke-[3]" />
                          <span>Ausente (✕)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold border border-slate-200">
                          Presença por responder
                        </span>
                      )
                    )}
                  </div>

                  {evt.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{evt.location}</span>
                    </p>
                  )}

                  {evt.targetCategories && evt.targetCategories.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-0.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold">{evt.targetCategories.join(', ')}</span>
                    </div>
                  )}

                  {evt.description && (
                    <p className="text-xs text-slate-600 pt-0.5 font-medium leading-relaxed">
                      {evt.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                {/* RSVP for Tasks (Athlete) */}
                {isTask && currentUser.role === 'atleta' && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {userRsvp?.status === 'confirmado' ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRsvpSelectedEvent(evt);
                            setRsvpStatus('confirmado');
                            setRsvpNote(userRsvp.note || '');
                            setIsRsvpModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-all cursor-pointer shadow-2xs"
                          title="Presença confirmada (Visto Verde). Clique para detalhes ou notas."
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                          <span>Presente</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventRsvp(evt.id, 'ausente')}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                          title="Mudar para Ausente (Cruz Vermelha)"
                        >
                          <span className="flex items-center gap-1 text-red-600"><X className="w-3 h-3 stroke-[3]" /> Mudar p/ Ausente</span>
                        </button>
                      </div>
                    ) : userRsvp?.status === 'ausente' ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRsvpSelectedEvent(evt);
                            setRsvpStatus('ausente');
                            setRsvpNote(userRsvp.note || '');
                            setIsRsvpModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border border-red-300 bg-red-100 text-red-900 hover:bg-red-200 transition-all cursor-pointer shadow-2xs"
                          title="Ausente (Cruz Vermelha). Clique para detalhes ou notas."
                        >
                          <X className="w-3.5 h-3.5 text-red-700 stroke-[3]" />
                          <span>Ausente</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventRsvp(evt.id, 'confirmado')}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                          title="Mudar para Presente (Visto Verde)"
                        >
                          <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3 h-3 stroke-[3]" /> Mudar p/ Presente</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEventRsvp(evt.id, 'confirmado')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          title="Confirmar Presença na Tarefa (Visto Verde)"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Confirmar Presença</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventRsvp(evt.id, 'ausente')}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-300 hover:border-red-400 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          title="Responder Ausente na Tarefa (Cruz Vermelha)"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Ausente</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* RSVP for official events */}
                {evt.type !== 'treino_individual' && evt.type !== 'tarefa' && currentUser.role === 'atleta' && (
                  <div>
                    {userRsvp ? (
                      <button
                        onClick={() => {
                          setRsvpSelectedEvent(evt);
                          setRsvpStatus(userRsvp.status);
                          setRsvpNote(userRsvp.note || '');
                          setIsRsvpModalOpen(true);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          userRsvp.status === 'confirmado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : userRsvp.status === 'justificado'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                      >
                        {userRsvp.status === 'confirmado' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {userRsvp.status === 'justificado' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                        {userRsvp.status === 'ausente' && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                        <span className="capitalize">{userRsvp.status}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRsvpSelectedEvent(evt);
                          setRsvpStatus('confirmado');
                          setIsRsvpModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar Presença</span>
                      </button>
                    )}
                  </div>
                )}

                {/* PDF Link - Abre logo noutro separador */}
                {evt.officialPdfUrl && (
                  <button
                    onClick={() => openOriginalDocument(evt.officialPdfUrl!, `${evt.title || 'Regulamento'}.pdf`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Abrir Regulamento Oficial em PDF noutro separador"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                    <span>Regulamento PDF</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                )}

                {/* Coach CRUD: Edit & Delete */}
                {isOwnerOrCoach && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditEvent(evt)}
                      className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                      title="Editar evento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEventToDelete(evt)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredMonthEvents.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">Sem eventos no período selecionado</h4>
            <p className="text-xs text-slate-500 mt-1">
              {selectedDay
                ? `Não existem treinos ou competições no dia ${selectedDay}.`
                : `Não existem ${filterType === 'todos' ? 'eventos' : filterType === 'competicao' ? 'competições' : 'treinos'} em ${MONTH_NAMES[currentMonth]} ${currentYear}.`}
            </p>
            {canManage && selectedDay && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleOpenCreateEvent('treino_oficial', selectedDay)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Treino no dia {selectedDay}</span>
                </button>
                <button
                  onClick={() => handleOpenCreateEvent('prova', selectedDay)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Competição no dia {selectedDay}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
        </div>
      </div>

      {/* Day Manager Modal (Full Day CRUD when clicking on any day) */}
      <DayManagerModal
        isOpen={isDayManagerOpen}
        onClose={() => {
          setIsDayManagerOpen(false);
          setDayManagerDayNumber(null);
        }}
        dayNumber={dayManagerDayNumber}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onOpenPdf={onOpenPdf}
      />

      {/* Direct Event Create / Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        defaultDate={defaultEventDate}
        defaultType={defaultEventType}
      />

      {/* Confirmation Modal for Deleting Calendar Event */}
      <ConfirmDeleteModal
        isOpen={eventToDelete !== null}
        onClose={() => setEventToDelete(null)}
        onConfirm={() => {
          if (eventToDelete) {
            deleteCalendarEvent(eventToDelete.id);
            setEventToDelete(null);
          }
        }}
        title="Eliminar Evento do Calendário"
        itemTitle={eventToDelete ? `${eventToDelete.title} (${eventToDelete.date} às ${eventToDelete.time})` : ''}
        description="Tem a certeza de que deseja eliminar esta atividade do calendário? Esta ação removerá a sessão e todas as respostas de presença associadas."
        confirmText="Sim, Eliminar"
      />

      {/* RSVP Modal */}
      {isRsvpModalOpen && rsvpSelectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Confirmação de Presença
              </h3>
              <button
                onClick={() => setIsRsvpModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500">Evento:</p>
                <h4 className="text-sm font-extrabold text-slate-900">{rsvpSelectedEvent.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  📅 {rsvpSelectedEvent.date} às {rsvpSelectedEvent.time} • {rsvpSelectedEvent.location}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">A tua resposta:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('confirmado')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                      rsvpStatus === 'confirmado'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ Presente
                  </button>

                  <button
                    type="button"
                    onClick={() => setRsvpStatus('justificado')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                      rsvpStatus === 'justificado'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠ Justificado
                  </button>

                  <button
                    type="button"
                    onClick={() => setRsvpStatus('ausente')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                      rsvpStatus === 'ausente'
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✗ Ausente
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nota (opcional)
                </label>
                <textarea
                  rows={2}
                  value={rsvpNote}
                  onChange={(e) => setRsvpNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="Ex: Provas a nadar, horário de chegada..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRsvpModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs text-xs cursor-pointer"
                >
                  Gravar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
