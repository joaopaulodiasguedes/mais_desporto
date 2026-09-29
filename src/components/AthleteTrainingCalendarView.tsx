import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Dumbbell,
  Clock,
  Flame,
  User,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  CalendarCheck,
  Check,
  RotateCcw,
  Tag,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Activity
} from 'lucide-react';
import { TrainingPlan, TrainingPlanCompletion, Athlete } from '../types';

interface AthleteTrainingCalendarViewProps {
  athlete: Athlete;
  plans: TrainingPlan[];
  onOpenAddPlan?: (defaultDate?: string) => void;
  onEditPlan?: (plan: TrainingPlan) => void;
  canManagePlans?: boolean;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const AthleteTrainingCalendarView: React.FC<AthleteTrainingCalendarViewProps> = ({
  athlete,
  plans,
  onOpenAddPlan,
  onEditPlan,
  canManagePlans = false
}) => {
  const {
    currentUser,
    completeTrainingPlan,
    removeTrainingPlanCompletion
  } = useApp();

  // Selected date defaults to TODAY (YYYY-MM-DD) as requested by user
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Current calendar viewing month and year (defaults to month of today)
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth()); // 0-indexed

  // Completion logger state
  const [completionStatus, setCompletionStatus] = useState<'cumpriu' | 'nao_cumpriu' | 'parcial'>('cumpriu');
  const [selectedRpe, setSelectedRpe] = useState<number>(7);
  const [athleteFeedback, setAthleteFeedback] = useState<string>('');
  const [isEditingExistingLog, setIsEditingExistingLog] = useState<boolean>(false);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Helper to check if a plan is assigned to this athlete
  const isPlanAssignedToThisAthlete = (plan: TrainingPlan): boolean => {
    if (!plan.assignedAthleteIds || plan.assignedAthleteIds.length === 0) return true;
    return plan.assignedAthleteIds.includes(athlete.id);
  };

  // Athlete specific plans
  const athletePlans = useMemo(() => {
    return plans.filter(isPlanAssignedToThisAthlete);
  }, [plans, athlete.id]);

  // Check which plans are scheduled for a specific date
  const getPlansForDate = (dateStr: string): TrainingPlan[] => {
    return athletePlans.filter((plan) => {
      if (plan.scheduledDate === dateStr) return true;
      if (plan.scheduledDates && plan.scheduledDates.includes(dateStr)) return true;
      return false;
    });
  };

  // Check completion record for an athlete on a specific date and plan
  const getCompletionRecord = (plan: TrainingPlan, dateStr: string): TrainingPlanCompletion | undefined => {
    if (!plan.completedByAthleteIds) return undefined;
    return plan.completedByAthleteIds.find(
      (c) => c.athleteId === athlete.id && (c.date === dateStr || (!c.date && plan.scheduledDate === dateStr))
    );
  };

  // Calendar matrix calculation for current month
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Monday is index 0 in Portuguese UI
    let firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun, 1 is Mon...
    const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      plans: TrainingPlan[];
    }[] = [];

    // Previous month padding
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: prevDay,
        isCurrentMonth: false,
        plans: getPlansForDate(dateStr)
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        plans: getPlansForDate(dateStr)
      });
    }

    // Next month padding to fill a complete 7-column grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        plans: getPlansForDate(dateStr)
      });
    }

    return days;
  }, [currentYear, currentMonth, athletePlans]);

  // Plans scheduled for the selected day
  const plansForSelectedDate = useMemo(() => {
    return getPlansForDate(selectedDate);
  }, [selectedDate, athletePlans]);

  // Selected workout plan to focus on for this day (defaults to first plan if multiple)
  const activePlan = plansForSelectedDate[0] || null;

  // Completion for the active plan on selected day
  const activeCompletion = useMemo(() => {
    if (!activePlan) return undefined;
    return getCompletionRecord(activePlan, selectedDate);
  }, [activePlan, selectedDate, athlete.id]);

  // Sync logger form when active plan or selected date changes
  React.useEffect(() => {
    if (activeCompletion) {
      setCompletionStatus(activeCompletion.status || 'cumpriu');
      setSelectedRpe(activeCompletion.rpeRating || 7);
      setAthleteFeedback(activeCompletion.feedback || '');
      setIsEditingExistingLog(false);
    } else {
      setCompletionStatus('cumpriu');
      setSelectedRpe(7);
      setAthleteFeedback('');
      setIsEditingExistingLog(false);
    }
  }, [activePlan?.id, selectedDate, activeCompletion]);

  // Formatted date string in Portuguese
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const weekday = dateObj.toLocaleDateString('pt-PT', { weekday: 'long' });
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const day = dateObj.getDate();
      const month = MONTH_NAMES_PT[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      return `${capitalizedWeekday}, ${day} de ${month} de ${year}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Monthly summary metrics for the athlete
  const monthlyMetrics = useMemo(() => {
    let totalScheduledInMonth = 0;
    let completedCount = 0;
    let missedCount = 0;
    let partialCount = 0;
    let rpeSum = 0;
    let rpeCount = 0;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPlans = getPlansForDate(dateStr);
      for (const p of dayPlans) {
        totalScheduledInMonth++;
        const comp = getCompletionRecord(p, dateStr);
        if (comp) {
          if (comp.status === 'cumpriu') completedCount++;
          else if (comp.status === 'nao_cumpriu') missedCount++;
          else if (comp.status === 'parcial') partialCount++;
          if (comp.rpeRating) {
            rpeSum += comp.rpeRating;
            rpeCount++;
          }
        }
      }
    }

    const completionRate = totalScheduledInMonth > 0 ? Math.round((completedCount / totalScheduledInMonth) * 100) : 0;
    const avgRpe = rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : '-';

    return {
      totalScheduledInMonth,
      completedCount,
      missedCount,
      partialCount,
      completionRate,
      avgRpe
    };
  }, [currentYear, currentMonth, athletePlans]);

  // Find nearest upcoming plan day if selected date has no plans
  const nearestPlanDate = useMemo(() => {
    const allDates: string[] = [];
    athletePlans.forEach((p) => {
      if (p.scheduledDate) allDates.push(p.scheduledDate);
      if (p.scheduledDates) allDates.push(...p.scheduledDates);
    });
    const sorted = Array.from(new Set(allDates)).sort();
    const upcoming = sorted.find((d) => d >= selectedDate);
    return upcoming || sorted[0] || null;
  }, [athletePlans, selectedDate]);

  // Handler for saving athlete completion
  const handleSaveCompletion = () => {
    if (!activePlan) return;
    completeTrainingPlan(
      activePlan.id,
      athlete.id,
      {
        rpeRating: selectedRpe,
        feedback: athleteFeedback,
        status: completionStatus,
        date: selectedDate
      }
    );
    setIsEditingExistingLog(false);
  };

  // Handler for deleting completion
  const handleRemoveCompletion = () => {
    if (!activePlan) return;
    if (window.confirm('Deseja remover o registo de realização deste treino?')) {
      removeTrainingPlanCompletion(activePlan.id, athlete.id, selectedDate);
      setIsEditingExistingLog(false);
    }
  };

  // RPE labels and color helpers
  const getRpeDescription = (val: number) => {
    if (val <= 2) return { text: 'Muito Leve (Regenerativo)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (val <= 4) return { text: 'Leve a Moderado (Ritmo Confortável)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (val <= 6) return { text: 'Moderado a Firme (Exigente)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (val <= 8) return { text: 'Muito Difícil (Perto do Limiar)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { text: 'Esforço Máximo / Exaustão', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  return (
    <div className="space-y-6">
      {/* Athlete Header & Monthly Performance Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {athlete.photoUrl ? (
              <img
                src={athlete.photoUrl}
                alt={athlete.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 shadow-xs shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-lg shadow-xs shrink-0">
                <User className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200/80 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3 text-indigo-600" />
                  Plano de Treinos do Atleta
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {athlete.category}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {athlete.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nº Federado: <span className="font-semibold text-slate-700">{athlete.federationNumber}</span> • Acompanhamento diário e registo de esforço
              </p>
            </div>
          </div>

          {/* Quick Stats of the selected month */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">No Mês</span>
              <span className="text-lg font-black text-slate-800 flex items-center gap-1">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                {monthlyMetrics.totalScheduledInMonth}
              </span>
            </div>

            <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Cumpridos</span>
              <span className="text-lg font-black text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {monthlyMetrics.completedCount}
                <span className="text-[10px] text-slate-400 font-bold ml-0.5">
                  ({monthlyMetrics.completionRate}%)
                </span>
              </span>
            </div>

            <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Não Cumpriu</span>
              <span className="text-lg font-black text-rose-600 flex items-center gap-1">
                <XCircle className="w-4 h-4 text-rose-500" />
                {monthlyMetrics.missedCount}
              </span>
            </div>

            <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Dificuldade Média</span>
              <span className="text-lg font-black text-amber-600 flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-500" />
                {monthlyMetrics.avgRpe}
                <span className="text-[10px] text-slate-400 font-semibold">/10</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Dia focado: <strong className="text-slate-800">{formattedSelectedDate}</strong>
              </span>
            </div>
            {canManagePlans && onOpenAddPlan && (
              <button
                type="button"
                onClick={() => onOpenAddPlan(selectedDate)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto active:scale-95"
                title={`Prescrever novo plano para ${athlete.name} no dia ${selectedDate}`}
              >
                <Dumbbell className="w-4 h-4" />
                <span>Prescrever Treino para este Dia</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 50/50 SPLIT LAYOUT AS REQUESTED:
          "metade da página o treino discriminado a outra metade o calendário e aparece por defeito o do dia" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* =========================================================
            HALF 1: O CALENDÁRIO INTERATIVO
            ========================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          {/* Calendar Header with Month Navigation and "Hoje" button */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {MONTH_NAMES_PT[currentMonth]} {currentYear}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Clica num dia para ver o treino discriminado
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGoToToday}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Ir para o dia de hoje"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Mês seguinte"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 uppercase tracking-wider py-1">
            {WEEKDAYS_PT.map((w, idx) => (
              <div key={w} className={idx >= 5 ? 'text-slate-400' : ''}>
                {w}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const hasPlans = cell.plans.length > 0;

              // Check status of first plan on this day
              let statusBadge: 'cumpriu' | 'nao_cumpriu' | 'parcial' | 'agendado' | null = null;
              let rpeScore: number | null = null;

              if (hasPlans) {
                const comp = getCompletionRecord(cell.plans[0], cell.dateStr);
                if (comp) {
                  statusBadge = comp.status || 'cumpriu';
                  rpeScore = comp.rpeRating;
                } else {
                  statusBadge = 'agendado';
                }
              }

              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[72px] sm:min-h-[82px] p-1.5 rounded-2xl flex flex-col justify-between text-left transition-all relative cursor-pointer border ${
                    isSelected
                      ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/40 shadow-xs'
                      : isToday
                      ? 'border-blue-400 bg-blue-50/20 hover:bg-blue-50/40'
                      : cell.isCurrentMonth
                      ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      : 'border-slate-100 bg-slate-50/40 text-slate-300'
                  }`}
                >
                  {/* Top row: Day number and Today badge */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isToday
                          ? 'bg-blue-100 text-blue-700 font-black'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {hasPlans && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {cell.plans.length > 1 ? `x${cell.plans.length}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Workout Indicator - Apenas a imagem e cor correspondente sem legenda */}
                  {hasPlans ? (
                    <div className="w-full mt-1.5 flex items-center justify-center gap-1 flex-wrap">
                      {cell.plans.map((plan, pIdx) => {
                        const comp = getCompletionRecord(plan, cell.dateStr);
                        const status = comp?.status || 'agendado';

                        if (status === 'cumpriu') {
                          return (
                            <div
                              key={pIdx}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs transition-transform hover:scale-110"
                              title={`Treino Cumpriu: ${plan.title}`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          );
                        }
                        if (status === 'nao_cumpriu') {
                          return (
                            <div
                              key={pIdx}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-2xs transition-transform hover:scale-110"
                              title={`Treino Não Realizado: ${plan.title}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </div>
                          );
                        }
                        if (status === 'parcial') {
                          return (
                            <div
                              key={pIdx}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs transition-transform hover:scale-110"
                              title={`Treino Parcial: ${plan.title}`}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          );
                        }
                        // Agendado
                        return (
                          <div
                            key={pIdx}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs transition-transform hover:scale-110"
                            title={`Treino Agendado: ${plan.title} (${plan.durationMinutes}m)`}
                          >
                            <Dumbbell className="w-3.5 h-3.5" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-7 sm:h-8" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer quick note */}
          <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-semibold text-slate-600">
              {plansForSelectedDate.length} treino(s) em {selectedDate === todayStr ? 'Hoje' : selectedDate}
            </span>
            {canManagePlans && onOpenAddPlan && (
              <button
                type="button"
                onClick={() => onOpenAddPlan(selectedDate)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                title={`Prescrever treino para ${selectedDate}`}
              >
                <span>+ Prescrever para este dia</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================
            HALF 2: O TREINO DISCRIMINADO A REALIZAR NO DIA
            ========================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Day Title Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider border border-blue-200/80 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                  Treino Discriminado do Dia
                </span>
                {selectedDate === todayStr && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase border border-emerald-200">
                    Hoje
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-slate-400 font-mono">
                {selectedDate}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              {formattedSelectedDate}
            </h3>
          </div>

          {/* Case A: A workout plan exists for this day */}
          {activePlan ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Plan Title & Metadata Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                        {activePlan.modality}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {activePlan.targetCategory}
                      </span>
                      {activePlan.scheduledTime && (
                        <span className="text-slate-600 font-semibold flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {activePlan.scheduledTime}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {activePlan.title}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-400">Duração Prevista</div>
                    <div className="text-lg font-black text-slate-800 flex items-center justify-end gap-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      {activePlan.durationMinutes} min
                    </div>
                  </div>
                </div>

                {/* Objective */}
                {activePlan.objective && (
                  <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider">
                      Objetivo da Sessão
                    </span>
                    <p className="leading-relaxed font-medium">
                      {activePlan.objective}
                    </p>
                  </div>
                )}

                {/* Tags & Prescribed by coach */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activePlan.tags?.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-white rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    Prescrito por: <span className="font-bold text-slate-800">{activePlan.createdByCoachName}</span>
                  </span>
                </div>
              </div>

              {/* =========================================================
                  SECÇÃO DE REGISTO: MARCAR SE CUMPRIU OU NÃO E DIFICULDADE
                  ========================================================= */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-indigo-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Registo de Cumprimento & Dificuldade
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Regista o cumprimento da sessão e a intensidade sentida
                      </p>
                    </div>
                  </div>

                  {/* If already recorded and not in edit mode */}
                  {activeCompletion && !isEditingExistingLog && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingExistingLog(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Editar Registo
                      </button>
                    </div>
                  )}
                </div>

                {/* Current status display (if already recorded and not editing) */}
                {activeCompletion && !isEditingExistingLog ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {activeCompletion.status === 'cumpriu' && (
                          <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            Cumpriu o Treino
                          </span>
                        )}
                        {activeCompletion.status === 'nao_cumpriu' && (
                          <span className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                            <XCircle className="w-4 h-4" />
                            Não Realizado
                          </span>
                        )}
                        {activeCompletion.status === 'parcial' && (
                          <span className="px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                            <AlertCircle className="w-4 h-4" />
                            Cumprimento Parcial
                          </span>
                        )}

                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${getRpeDescription(activeCompletion.rpeRating).color}`}>
                          Dificuldade: {activeCompletion.rpeRating}/10 ({getRpeDescription(activeCompletion.rpeRating).text})
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        Registo guardado
                      </span>
                    </div>

                    {activeCompletion.feedback && (
                      <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 mt-2">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase mb-0.5">
                          Sensações / Notas do Atleta:
                        </span>
                        <p className="italic">"{activeCompletion.feedback}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Form to record or edit completion */
                  <div className="space-y-4">
                    {/* 1. SELETOR: CUMPRIU OU NÃO? */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        1. Realizaste o treino de hoje?
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setCompletionStatus('cumpriu')}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            completionStatus === 'cumpriu'
                              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-xs font-extrabold">Sim, Cumpri</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompletionStatus('nao_cumpriu')}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            completionStatus === 'nao_cumpriu'
                              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-600/30 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-rose-300'
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                          <span className="text-xs font-extrabold">Não Realizado</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompletionStatus('parcial')}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            completionStatus === 'parcial'
                              ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-xs font-extrabold">Parcial</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. SELETOR: NÍVEL DE DIFICULDADE (1-10) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          2. Nível de Dificuldade Sentida (Escala 1 a 10)
                        </label>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${getRpeDescription(selectedRpe).color}`}>
                          {selectedRpe}/10: {getRpeDescription(selectedRpe).text}
                        </span>
                      </div>

                      {/* 10-point scale buttons */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const isSelected = selectedRpe === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setSelectedRpe(num)}
                              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs scale-105'
                                  : num <= 2
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : num <= 4
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                  : num <= 6
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  : num <= 8
                                  ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                                  : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1 mt-1">
                        <span>1 - Muito Leve</span>
                        <span>5 - Moderado</span>
                        <span>10 - Máximo</span>
                      </div>
                    </div>

                    {/* 3. SENSAÇÕES / NOTAS DO ATLETA */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        3. Sensações ou Notas para o Treinador (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={athleteFeedback}
                        onChange={(e) => setAthleteFeedback(e.target.value)}
                        placeholder="Ex.: Cumpri todas as séries, senti fadiga apenas nas últimas 2 repetições..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    {/* Botão de Gravação */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      {isEditingExistingLog && (
                        <button
                          type="button"
                          onClick={() => setIsEditingExistingLog(false)}
                          className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveCompletion}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Guardar Registo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================
                  DISCRIMINAÇÃO DO TREINO (BLOCO A BLOCO, EXERCÍCIO A EXERCÍCIO)
                  ========================================================= */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-blue-600" />
                    <span>Exercícios Discriminados da Sessão</span>
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {activePlan.blocks?.length || 0} bloco(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {activePlan.blocks?.map((block, bIdx) => {
                    const getBlockBadge = () => {
                      switch (block.type) {
                        case 'aquecimento':
                          return { text: 'Aquecimento & Ativação', color: 'bg-amber-100 text-amber-800 border-amber-200' };
                        case 'principal':
                          return { text: 'Série Principal de Rendimento', color: 'bg-blue-100 text-blue-800 border-blue-200' };
                        case 'retorno_calma':
                          return { text: 'Retorno à Calma & Soltura', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                        default:
                          return { text: 'Complementar', color: 'bg-slate-100 text-slate-800 border-slate-200' };
                      }
                    };
                    const badge = getBlockBadge();

                    return (
                      <div
                        key={block.id || bIdx}
                        className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                              {bIdx + 1}
                            </span>
                            <h5 className="text-sm font-extrabold text-slate-900">
                              {block.title}
                            </h5>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>

                        {/* List of exercises inside this block */}
                        <div className="space-y-2">
                          {block.exercises?.map((ex, eIdx) => (
                            <div
                              key={ex.id || eIdx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 flex-1">
                                  {ex.name}
                                </span>
                                {ex.intensity && (
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700 shrink-0">
                                    {ex.intensity}
                                  </span>
                                )}
                              </div>

                              {/* Exercise Metrics chips */}
                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 font-semibold">
                                {ex.sets && (
                                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    Séries: <span className="font-bold text-slate-900">{ex.sets}</span>
                                  </span>
                                )}
                                {ex.repsOrDuration && (
                                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    Distância/Reps: <span className="font-bold text-slate-900">{ex.repsOrDuration}</span>
                                  </span>
                                )}
                                {ex.rest && (
                                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    Intervalo: <span className="font-bold text-slate-900">{ex.rest}</span>
                                  </span>
                                )}
                              </div>

                              {/* Technical notes */}
                              {ex.notes && (
                                <p className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded-lg border border-slate-200/60 mt-1">
                                  💡 {ex.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Case B: No plan on the selected date */
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 space-y-4">
              <div className="w-14 h-14 bg-white text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-slate-200">
                <CalendarIcon className="w-7 h-7 text-slate-400" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">
                  Nenhum treino prescrito para este dia
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Este dia está marcado como descanso, recuperação ativa ou sem sessão individual prescrita pelo treinador.
                </p>
              </div>

              {nearestPlanDate && nearestPlanDate !== selectedDate && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(nearestPlanDate)}
                    className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Ver Próximo Treino Agendado</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {canManagePlans && onOpenAddPlan && (
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => onOpenAddPlan(selectedDate)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Dumbbell className="w-4 h-4" />
                    <span>Prescrever Treino para {athlete.name.split(' ')[0]} neste dia</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteTrainingCalendarView;
