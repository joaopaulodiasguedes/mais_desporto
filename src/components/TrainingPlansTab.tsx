import React, { useState, useMemo, useEffect } from 'react';
import { useApp, isTrainingPlanVisibleForUser, getLinkedAthletesForGuardian } from '../context/AppContext';
import {
  Dumbbell,
  Plus,
  Clock,
  CheckCircle2,
  Layers,
  Trash2,
  Edit2,
  X,
  Check,
  User,
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  Filter,
  Calendar as CalendarIcon,
  CalendarCheck,
  HeartHandshake,
  Info
} from 'lucide-react';
import { TrainingPlan, ExerciseBlock, Athlete } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { AthleteTrainingCalendarView } from './AthleteTrainingCalendarView';

export const TrainingPlansTab: React.FC = () => {
  const {
    trainingPlans,
    addTrainingPlan,
    updateTrainingPlan,
    deleteTrainingPlan,
    completeTrainingPlan,
    hasPermission,
    currentUser,
    athletes
  } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);

  // Athletes under guardian's responsibility
  const guardianAthletes = useMemo(() => {
    if (currentUser.role !== 'encarregado') return [];
    return getLinkedAthletesForGuardian(currentUser, athletes);
  }, [currentUser, athletes]);

  // Separation by Athlete
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('plus_selected_athlete_plan_id');
      if (saved && saved !== 'todos') {
        sessionStorage.removeItem('plus_selected_athlete_plan_id');
        return saved;
      }
    } catch {}
    if (currentUser.role === 'atleta' && currentUser.athleteProfileId) {
      return currentUser.athleteProfileId;
    }
    if (currentUser.role === 'encarregado') {
      const linked = getLinkedAthletesForGuardian(currentUser, athletes);
      return linked[0]?.id || '';
    }
    return athletes[0]?.id || '';
  });
  const [athleteSearch, setAthleteSearch] = useState<string>('');

  useEffect(() => {
    if (currentUser.role === 'atleta') {
      if (currentUser.athleteProfileId) {
        setSelectedAthleteId(currentUser.athleteProfileId);
      }
    } else if (currentUser.role === 'encarregado') {
      if (guardianAthletes.length > 0) {
        if (!guardianAthletes.some((a) => a.id === selectedAthleteId)) {
          setSelectedAthleteId(guardianAthletes[0].id);
        }
      } else {
        setSelectedAthleteId('');
      }
    } else {
      if ((selectedAthleteId === 'todos' || !selectedAthleteId) && athletes.length > 0) {
        setSelectedAthleteId(athletes[0].id);
      }
    }
  }, [athletes, currentUser.role, currentUser.athleteProfileId, guardianAthletes, selectedAthleteId]);

  // View Mode: 'calendario' (split-screen: calendar on one half, discriminated workout of the day on the other) or 'lista'
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario');

  // Interactive Workout Logger Modal for Athletes
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [rpeRating, setRpeRating] = useState<number>(7);
  const [feedbackNote, setFeedbackNote] = useState<string>('');

  const canCreate = hasPermission('canCreateTrainingPlans') || currentUser.role === 'treinador';

  // Form State for creating a new workout plan
  const [newTitle, setNewTitle] = useState('');
  const [newModality, setNewModality] = useState('Natação Pura');
  const [newCategory, setNewCategory] = useState('Juvenis (Sub-16)');
  const [newAssignedAthleteIds, setNewAssignedAthleteIds] = useState<string[]>([]);
  const [newDuration, setNewDuration] = useState(75);
  const [newIntensity, setNewIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [newObjective, setNewObjective] = useState('');
  const [newTags, setNewTags] = useState('Técnica, Resistência');
  const [newScheduledDate, setNewScheduledDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newScheduledTime, setNewScheduledTime] = useState<string>('18:00');

  // Exercise blocks for new plan builder
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([
    {
      id: 'b-init-1',
      title: 'Aquecimento Geral & Ativação',
      type: 'aquecimento',
      exercises: [
        {
          id: 'ex-1',
          name: '400m Nado suave variado + 4x50m progressivo',
          sets: '1',
          repsOrDuration: '600m',
          rest: '30s',
          intensity: 'Leve (R1)',
          notes: 'Foco na sensibilidade e alinhamento hidrodinâmico.'
        }
      ]
    },
    {
      id: 'b-init-2',
      title: 'Série Principal de Rendimento',
      type: 'principal',
      exercises: [
        {
          id: 'ex-2',
          name: '6 x 150m Ritmo de Prova (50m Forte + 50m Suave + 50m Forte)',
          sets: '6',
          repsOrDuration: '150m',
          rest: '45s',
          intensity: 'R4 (Limiar)',
          notes: 'Controlo rigoroso do número de braçadas.'
        }
      ]
    },
    {
      id: 'b-init-3',
      title: 'Retorno à Calma',
      type: 'retorno_calma',
      exercises: [
        {
          id: 'ex-3',
          name: '200m Costas / Bruços descompressão',
          sets: '1',
          repsOrDuration: '200m',
          rest: '0s',
          intensity: 'R1',
          notes: 'Respiração profunda e soltura.'
        }
      ]
    }
  ]);

  // Current Athlete logged in (if role === 'atleta')
  const currentAthleteProfile = useMemo(() => {
    if (currentUser.role !== 'atleta') return null;
    return athletes.find(
      (a) => a.id === currentUser.athleteProfileId || a.email?.toLowerCase() === currentUser.email?.toLowerCase()
    ) || null;
  }, [currentUser, athletes]);

  // Filter plans visible for the logged user
  const visiblePlans = useMemo(() => {
    return trainingPlans.filter((p) => isTrainingPlanVisibleForUser(p, currentUser, athletes));
  }, [trainingPlans, currentUser, athletes]);

  // Athletes list accessible for this user role
  const availableAthletesForRoster = useMemo(() => {
    if (currentUser.role === 'encarregado') {
      return guardianAthletes;
    }
    return athletes;
  }, [currentUser.role, guardianAthletes, athletes]);

  // Count plans per athlete
  const plansCountByAthlete = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ath of availableAthletesForRoster) {
      counts[ath.id] = 0;
    }
    let generalCount = 0;

    for (const plan of visiblePlans) {
      if (plan.assignedAthleteIds && plan.assignedAthleteIds.length > 0) {
        for (const athId of plan.assignedAthleteIds) {
          if (counts[athId] !== undefined) {
            counts[athId] = (counts[athId] || 0) + 1;
          }
        }
      } else {
        generalCount++;
      }
    }
    return { counts, generalCount };
  }, [visiblePlans, availableAthletesForRoster]);

  // Filtered athletes based on search input
  const filteredAthletesList = useMemo(() => {
    if (!athleteSearch.trim()) return availableAthletesForRoster;
    const term = athleteSearch.toLowerCase();
    return availableAthletesForRoster.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term) ||
        a.federationNumber.toLowerCase().includes(term)
    );
  }, [availableAthletesForRoster, athleteSearch]);

  // Selected single athlete object if one is selected
  const activeSelectedAthlete = useMemo(() => {
    if (currentUser.role === 'encarregado') {
      return guardianAthletes.find((a) => a.id === selectedAthleteId) || guardianAthletes[0] || null;
    }
    if (selectedAthleteId === 'todos') return null;
    return athletes.find((a) => a.id === selectedAthleteId) || null;
  }, [athletes, selectedAthleteId, currentUser.role, guardianAthletes]);

  // Plans for the currently selected athlete filter
  const plansForCurrentFilter = useMemo(() => {
    if (currentUser.role === 'atleta') {
      const myId = currentAthleteProfile?.id || currentUser.athleteProfileId;
      return visiblePlans.filter(
        (p) => !p.assignedAthleteIds || p.assignedAthleteIds.length === 0 || (myId && p.assignedAthleteIds.includes(myId))
      );
    }

    if (currentUser.role === 'encarregado') {
      const target = guardianAthletes.find((a) => a.id === selectedAthleteId) || guardianAthletes[0];
      if (!target) return [];

      return visiblePlans.filter((p) => {
        if (p.assignedAthleteIds && p.assignedAthleteIds.length > 0) {
          return p.assignedAthleteIds.includes(target.id);
        }
        const athleteCat = (target.category || '').toLowerCase();
        const planCat = (p.targetCategory || '').toLowerCase();
        if (planCat.includes('geral') || planCat === 'todos' || planCat === 'todas') return true;
        return athleteCat.includes(planCat) || planCat.includes(athleteCat);
      });
    }

    if (selectedAthleteId === 'todos') {
      return visiblePlans;
    }

    if (selectedAthleteId === 'geral') {
      return visiblePlans.filter((p) => !p.assignedAthleteIds || p.assignedAthleteIds.length === 0);
    }

    return visiblePlans.filter((p) => p.assignedAthleteIds && p.assignedAthleteIds.includes(selectedAthleteId));
  }, [visiblePlans, selectedAthleteId, currentUser, currentAthleteProfile, guardianAthletes]);

  // Grouped plans by athlete when "todos" is selected (only for coaches/staff)
  const groupedPlansByAthlete = useMemo(() => {
    if (currentUser.role === 'atleta' || currentUser.role === 'encarregado' || selectedAthleteId !== 'todos') {
      return [];
    }

    const groups: { athlete: Athlete; plans: TrainingPlan[] }[] = [];

    // Order athletes: those with plans first, then alphabetical
    const athletesWithPlans = athletes.filter((ath) => (plansCountByAthlete.counts[ath.id] || 0) > 0);
    for (const ath of athletesWithPlans) {
      const athletePlans = visiblePlans.filter(
        (p) => p.assignedAthleteIds && p.assignedAthleteIds.includes(ath.id)
      );
      if (athletePlans.length > 0) {
        groups.push({ athlete: ath, plans: athletePlans });
      }
    }

    return groups;
  }, [athletes, visiblePlans, plansCountByAthlete, currentUser, selectedAthleteId]);

  // General plans (not assigned to a specific athlete)
  const generalPlans = useMemo(() => {
    return visiblePlans.filter((p) => !p.assignedAthleteIds || p.assignedAthleteIds.length === 0);
  }, [visiblePlans]);

  // Athletes without any assigned plans yet (for quick coach assignment)
  const athletesWithoutPlans = useMemo(() => {
    if (currentUser.role === 'atleta' || currentUser.role === 'encarregado') return [];
    return athletes.filter((ath) => (plansCountByAthlete.counts[ath.id] || 0) === 0);
  }, [athletes, plansCountByAthlete, currentUser.role]);

  const getIntensityBadge = (level: number) => {
    switch (level) {
      case 1:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">1 - Regenerativo</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">2 - Aeróbio Leve</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">3 - Moderado</span>;
      case 4:
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-bold">4 - Limiar Anaeróbio</span>;
      case 5:
        return <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-bold animate-pulse">5 - Esforço Máximo / VAM</span>;
      default:
        return null;
    }
  };

  const formatDatePretty = (dateStr?: string) => {
    if (!dateStr) return 'Data a definir';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${weekdays[dateObj.getDay()]}, ${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  };

  const formatDatePrettyShort = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${weekdays[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
  };

  const getRelativeDayLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const afterTomorrow = new Date(now);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    const afterTomorrowStr = `${afterTomorrow.getFullYear()}-${String(afterTomorrow.getMonth() + 1).padStart(2, '0')}-${String(afterTomorrow.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === tomorrowStr) return 'Amanhã';
    if (dateStr === afterTomorrowStr) return 'Depois de amanhã';
    return '';
  };

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setNewScheduledDate(`${y}-${m}-${day}`);
  };

  const handleAddBlock = () => {
    const newB: ExerciseBlock = {
      id: `b-${Date.now()}`,
      title: 'Novo Bloco de Trabalho',
      type: 'principal',
      exercises: [
        {
          id: `ex-${Date.now()}`,
          name: 'Exercício',
          sets: '3',
          repsOrDuration: '100m',
          rest: '30s',
          intensity: 'Moderado'
        }
      ]
    };
    setBlocks([...blocks, newB]);
  };

  const handleAddExerciseToBlock = (blockId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            exercises: [
              ...b.exercises,
              {
                id: `ex-${Date.now()}`,
                name: 'Novo Exercício / Tarefa',
                sets: '4',
                repsOrDuration: '50m',
                rest: '20s',
                intensity: 'R3'
              }
            ]
          };
        }
        return b;
      })
    );
  };

  const handleRemoveExercise = (blockId: string, exId: string) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            exercises: b.exercises.filter((ex) => ex.id !== exId)
          };
        }
        return b;
      })
    );
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleOpenAddPlan = (targetAthleteId?: string, defaultDate?: string) => {
    setEditingPlan(null);
    setNewTitle('');
    setNewModality('Natação Pura');

    // If specific athlete was provided or active in filter
    const initialAthId = targetAthleteId || (selectedAthleteId !== 'todos' && selectedAthleteId !== 'geral' ? selectedAthleteId : '');
    const foundAth = athletes.find((a) => a.id === initialAthId);

    setNewAssignedAthleteIds(initialAthId ? [initialAthId] : []);
    setNewCategory(foundAth?.category || 'Geral');
    setNewDuration(75);
    setNewIntensity(3);
    setNewObjective('');
    setNewTags('Técnica, Resistência');
    setNewScheduledDate(defaultDate || new Date().toISOString().split('T')[0]);
    setNewScheduledTime('18:00');
    setBlocks([
      {
        id: `b-${Date.now()}-1`,
        title: 'Aquecimento Geral & Ativação',
        type: 'aquecimento',
        exercises: [
          {
            id: `ex-${Date.now()}-1`,
            name: '400m Nado variado + 4x50m progressivo',
            sets: '1',
            repsOrDuration: '600m',
            rest: '30s',
            intensity: 'Leve (R1)'
          }
        ]
      },
      {
        id: `b-${Date.now()}-2`,
        title: 'Série Principal',
        type: 'principal',
        exercises: [
          {
            id: `ex-${Date.now()}-2`,
            name: '6 x 150m Ritmo de Prova',
            sets: '6',
            repsOrDuration: '150m',
            rest: '45s',
            intensity: 'R4'
          }
        ]
      }
    ]);
    setIsAddModalOpen(true);
  };

  const handleOpenEditPlan = (plan: TrainingPlan) => {
    setEditingPlan(plan);
    setNewTitle(plan.title);
    setNewModality(plan.modality);
    setNewCategory(plan.targetCategory);
    setNewAssignedAthleteIds(plan.assignedAthleteIds || []);
    setNewDuration(plan.durationMinutes);
    setNewIntensity(plan.intensityLevel);
    setNewObjective(plan.objective || '');
    setNewTags(plan.tags?.join(', ') || '');
    setNewScheduledDate(plan.scheduledDate || new Date().toISOString().split('T')[0]);
    setNewScheduledTime(plan.scheduledTime || '18:00');
    setBlocks(plan.blocks || []);
    setIsAddModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Determine category based on assigned athletes if possible
    let catToSave = newCategory;
    if (newAssignedAthleteIds.length > 0) {
      const primaryAth = athletes.find((a) => a.id === newAssignedAthleteIds[0]);
      if (primaryAth) {
        catToSave = primaryAth.category;
      }
    }

    if (editingPlan) {
      updateTrainingPlan(editingPlan.id, {
        title: newTitle.trim(),
        modality: newModality,
        targetCategory: catToSave,
        assignedAthleteIds: newAssignedAthleteIds.length > 0 ? newAssignedAthleteIds : undefined,
        durationMinutes: newDuration,
        intensityLevel: newIntensity,
        objective: newObjective.trim(),
        scheduledDate: newScheduledDate || undefined,
        scheduledTime: newScheduledTime || undefined,
        blocks,
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean)
      });
      if (selectedPlan?.id === editingPlan.id) {
        setSelectedPlan({
          ...selectedPlan,
          title: newTitle.trim(),
          modality: newModality,
          targetCategory: catToSave,
          assignedAthleteIds: newAssignedAthleteIds.length > 0 ? newAssignedAthleteIds : undefined,
          durationMinutes: newDuration,
          intensityLevel: newIntensity,
          objective: newObjective.trim(),
          scheduledDate: newScheduledDate || undefined,
          scheduledTime: newScheduledTime || undefined,
          blocks,
          tags: newTags.split(',').map((t) => t.trim()).filter(Boolean)
        });
      }
    } else {
      addTrainingPlan({
        title: newTitle.trim(),
        modality: newModality,
        targetCategory: catToSave,
        assignedAthleteIds: newAssignedAthleteIds.length > 0 ? newAssignedAthleteIds : undefined,
        durationMinutes: newDuration,
        intensityLevel: newIntensity,
        objective: newObjective.trim(),
        scheduledDate: newScheduledDate || undefined,
        scheduledTime: newScheduledTime || undefined,
        blocks,
        createdByCoachName: currentUser.name || 'Treinador Principal',
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean)
      });
    }

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewObjective('');
    setNewAssignedAthleteIds([]);
  };

  const handleLogWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const athleteId = currentUser.athleteProfileId || currentUser.id;
    completeTrainingPlan(selectedPlan.id, athleteId, rpeRating, feedbackNote);
    setIsLoggingWorkout(false);
    setFeedbackNote('');
  };

  const isCurrentAthleteCompleted = (plan: TrainingPlan) => {
    const athleteId = currentUser.athleteProfileId || currentUser.id;
    return plan.completedByAthleteIds?.some((c) => c.athleteId === athleteId);
  };

  // Helper to render a Training Plan card
  const renderPlanCard = (plan: TrainingPlan, highlightAthlete?: Athlete) => {
    const completed = isCurrentAthleteCompleted(plan);
    const assignedAthletes = athletes.filter((a) => plan.assignedAthleteIds?.includes(a.id));

    return (
      <div
        key={plan.id}
        onClick={() => setSelectedPlan(plan)}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
      >
        <div className="space-y-3">
          {/* Header: Athlete & Modality */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {assignedAthletes.length > 0 ? (
                  assignedAthletes.map((ath) => (
                    <span
                      key={ath.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        highlightAthlete?.id === ath.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-indigo-50 border border-indigo-100 text-indigo-800'
                      }`}
                    >
                      {ath.photoUrl ? (
                        <img
                          src={ath.photoUrl}
                          alt={ath.name}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      <span>{ath.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    Plano Coletivo Geral
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-400">• {plan.modality}</span>

                {plan.scheduledDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold">
                    <CalendarIcon className="w-3 h-3 text-blue-600" />
                    <span>{formatDatePrettyShort(plan.scheduledDate)}</span>
                    {plan.scheduledTime && (
                      <span className="text-blue-500 font-normal">às {plan.scheduledTime}</span>
                    )}
                    {getRelativeDayLabel(plan.scheduledDate) && (
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded-full bg-blue-200/80 text-blue-900">
                        {getRelativeDayLabel(plan.scheduledDate)}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                {plan.title}
              </h3>
            </div>
            <div className="shrink-0">{getIntensityBadge(plan.intensityLevel)}</div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {plan.objective}
          </p>

          {/* Meta Information */}
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{plan.durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>{plan.blocks.length} blocos de treino</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Por {plan.createdByCoachName}</span>
            </div>
          </div>

          {/* Tags */}
          {plan.tags && plan.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plan.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
          {completed ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Treino Concluído
            </span>
          ) : (
            <span className="text-xs text-indigo-600 font-bold group-hover:underline flex items-center gap-1">
              Ver ficha do treino &rarr;
            </span>
          )}

          {canCreate && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditPlan(plan);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                title="Editar Plano de Treino"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPlanToDelete(plan);
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Eliminar Plano de Treino"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-indigo-600" />
            Planos de Treino por Atleta
          </h2>
          <p className="text-xs text-slate-500">
            Prescrição individualizada, séries fracionadas, intensidades e registo de esforço por atleta
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => handleOpenAddPlan()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Plano de Treino</span>
          </button>
        )}
      </div>

      {/* Athlete Role Banner */}
      {currentUser.role === 'atleta' && (
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 flex items-center gap-3">
          {currentAthleteProfile?.photoUrl ? (
            <img
              src={currentAthleteProfile.photoUrl}
              alt={currentAthleteProfile.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold shrink-0">
              <User className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                Os Teus Treinos Individuais
              </span>
              <span className="text-xs font-bold text-slate-700">
                {currentAthleteProfile?.name || currentUser.name}
              </span>
            </div>
            <p className="text-xs text-indigo-950 mt-1">
              A consultar os planos de treino prescritos exclusivamente para ti pelo teu treinador.
            </p>
          </div>
        </div>
      )}

      {/* Encarregado de Educação Role Banner & Athlete Selector */}
      {currentUser.role === 'encarregado' && (
        <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold shrink-0 border border-purple-200">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-white px-2.5 py-0.5 rounded-md border border-purple-200">
                    Encarregado de Educação
                  </span>
                  {activeSelectedAthlete && (
                    <span className="text-xs font-bold text-slate-800">
                      Plano de Treino: {activeSelectedAthlete.name} ({activeSelectedAthlete.category})
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-950 mt-1">
                  A consultar os treinos prescritos pelo treinador exclusivamente para o(s) atleta(s) a seu cargo.
                </p>
              </div>
            </div>

            {/* Quick switcher if guardian has multiple athletes */}
            {guardianAthletes.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto bg-white/80 p-1.5 rounded-xl border border-purple-200">
                <span className="text-[11px] font-bold text-slate-600 pl-1">Atleta:</span>
                {guardianAthletes.map((ath) => {
                  const isSelected = selectedAthleteId === ath.id || (!selectedAthleteId && ath.id === guardianAthletes[0].id);
                  return (
                    <button
                      key={ath.id}
                      type="button"
                      onClick={() => setSelectedAthleteId(ath.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-purple-100/70 border border-purple-100'
                      }`}
                    >
                      {ath.photoUrl ? (
                        <img
                          src={ath.photoUrl}
                          alt={ath.name}
                          className="w-4 h-4 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      <span>{ath.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {guardianAthletes.length === 0 && (
            <div className="p-3 bg-white rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Ainda não tens nenhum atleta associado ao teu perfil de encarregado. Podes associar ou registar a ficha do teu educando na <strong>Área dos Pais</strong>.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Athlete Selector & Filter Bar (Treinadores / Gestores) */}
      {currentUser.role !== 'atleta' && currentUser.role !== 'encarregado' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Separação por Atleta
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                ({athletes.length} atletas registados)
              </span>
            </div>

            {/* Quick search input for athletes */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                placeholder="Filtrar por nome do atleta..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
              {athleteSearch && (
                <button
                  onClick={() => setAthleteSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Athlete Pills Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Individual Athlete Pills */}
            {filteredAthletesList.map((ath) => {
              const count = plansCountByAthlete.counts[ath.id] || 0;
              const isSelected = selectedAthleteId === ath.id;

              return (
                <button
                  key={ath.id}
                  onClick={() => setSelectedAthleteId(ath.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {ath.photoUrl ? (
                    <img
                      src={ath.photoUrl}
                      alt={ath.name}
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                        isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {ath.name.charAt(0)}
                    </div>
                  )}
                  <span>{ath.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? 'bg-indigo-700 text-white'
                        : count > 0
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* General Plans Pill (if any general plan exists) */}
            {plansCountByAthlete.generalCount > 0 && (
              <button
                onClick={() => setSelectedAthleteId('geral')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  selectedAthleteId === 'geral'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Gerais / Coletivos</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedAthleteId === 'geral' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {plansCountByAthlete.generalCount}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* View 1: When a specific athlete is selected (or when logged-in as athlete or encarregado) */}
      {(selectedAthleteId !== 'todos' || currentUser.role === 'atleta' || currentUser.role === 'encarregado') && (
        <div className="space-y-4">
          {(() => {
            const targetAthlete =
              activeSelectedAthlete ||
              currentAthleteProfile ||
              (currentUser.role === 'atleta'
                ? athletes.find((a) => a.id === currentUser.athleteProfileId) || athletes[0]
                : currentUser.role === 'encarregado'
                ? guardianAthletes.find((a) => a.id === selectedAthleteId) || guardianAthletes[0] || null
                : null);

            return (
              <>
                {/* View switcher when viewing as athlete or encarregado */}
                {targetAthlete && (currentUser.role === 'atleta' || currentUser.role === 'encarregado') && (
                  <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode('calendario')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                          viewMode === 'calendario'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        <CalendarIcon className="w-4 h-4" />
                        <span>Calendário & Treino do Dia</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('lista')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                          viewMode === 'lista'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>Lista Completa ({plansForCurrentFilter.length})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Content: Either Athlete Training Calendar View or Plans List */}
                {targetAthlete && viewMode === 'calendario' ? (
                  <AthleteTrainingCalendarView
                    athlete={targetAthlete}
                    plans={plansForCurrentFilter}
                    onOpenAddPlan={(defaultDate) => handleOpenAddPlan(targetAthlete.id, defaultDate)}
                    onEditPlan={handleOpenEditPlan}
                    canManagePlans={canCreate}
                  />
                ) : plansForCurrentFilter.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {plansForCurrentFilter.map((plan) =>
                      renderPlanCard(plan, targetAthlete || undefined)
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Nenhum plano de treino individual atribuído a este atleta
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {currentUser.role === 'encarregado'
                        ? `O treinador ainda não prescreveu planos de treino para ${targetAthlete?.name || 'o seu educando'}.`
                        : targetAthlete
                        ? `Prescreva um plano de treino personalizado com séries, descansos e intensidades para ${targetAthlete.name}.`
                        : 'Ainda não tens planos de treino atribuídos.'}
                    </p>
                    {canCreate && targetAthlete && (
                      <button
                        onClick={() => handleOpenAddPlan(targetAthlete.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Prescrever 1º Treino para {targetAthlete.name}</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* View 2: When "Todos os Atletas" is selected (Separated by Athlete Groups, Coaches only) */}
      {selectedAthleteId === 'todos' && currentUser.role !== 'atleta' && currentUser.role !== 'encarregado' && (
        <div className="space-y-6">
          {/* Group for Each Athlete who has plans */}
          {groupedPlansByAthlete.map(({ athlete, plans }) => (
            <div key={athlete.id} className="space-y-3">
              {/* Athlete Group Header */}
              <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-3">
                  {athlete.photoUrl ? (
                    <img
                      src={athlete.photoUrl}
                      alt={athlete.name}
                      className="w-9 h-9 rounded-full object-cover border border-indigo-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                      {athlete.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{athlete.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                        {athlete.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {plans.length} {plans.length === 1 ? 'plano de treino' : 'planos de treino'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAthleteId(athlete.id);
                      setViewMode('calendario');
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Abrir calendário e diário de treino de ${athlete.name}`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Calendário & Diário</span>
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => handleOpenAddPlan(athlete.id)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title={`Prescrever novo plano para ${athlete.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Treino</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of plans for this athlete */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {plans.map((plan) => renderPlanCard(plan, athlete))}
              </div>
            </div>
          ))}

          {/* General / Group Plans Section (if any) */}
          {generalPlans.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-slate-600" />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Planos Coletivos & Gerais
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Planos aplicáveis a todos os atletas ou sem atleta individual designado ({generalPlans.length})
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {generalPlans.map((plan) => renderPlanCard(plan))}
              </div>
            </div>
          )}

          {/* Athletes without any plans yet */}
          {athletesWithoutPlans.length > 0 && canCreate && (
            <div className="bg-white rounded-2xl p-4 border border-dashed border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Atletas ainda sem plano prescrito ({athletesWithoutPlans.length}):
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {athletesWithoutPlans.map((ath) => (
                  <button
                    key={ath.id}
                    onClick={() => handleOpenAddPlan(ath.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Prescrever primeiro treino para ${ath.name}`}
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{ath.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({ath.category})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Deleting Training Plan */}
      <ConfirmDeleteModal
        isOpen={planToDelete !== null}
        onClose={() => setPlanToDelete(null)}
        onConfirm={() => {
          if (planToDelete) {
            deleteTrainingPlan(planToDelete.id);
            setPlanToDelete(null);
          }
        }}
        title="Eliminar Plano de Treino"
        itemTitle={planToDelete?.title}
        description="Tem a certeza de que deseja eliminar este plano de treino? Todos os blocos e exercícios deste plano serão removidos."
        confirmText="Sim, Eliminar"
      />

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                {/* Athletes Badges in modal */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {selectedPlan.assignedAthleteIds && selectedPlan.assignedAthleteIds.length > 0 ? (
                    athletes
                      .filter((a) => selectedPlan.assignedAthleteIds?.includes(a.id))
                      .map((ath) => (
                        <span
                          key={ath.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold"
                        >
                          {ath.photoUrl ? (
                            <img
                              src={ath.photoUrl}
                              alt={ath.name}
                              className="w-4 h-4 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>Atleta: {ath.name}</span>
                          <span className="text-[10px] text-indigo-500 font-normal">({ath.category})</span>
                        </span>
                      ))
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Plano Coletivo Geral
                    </span>
                  )}
                  {getIntensityBadge(selectedPlan.intensityLevel)}

                  {selectedPlan.scheduledDate && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Agendado para: {formatDatePretty(selectedPlan.scheduledDate)}</span>
                      {selectedPlan.scheduledTime && (
                        <span className="text-blue-600">às {selectedPlan.scheduledTime}</span>
                      )}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-xl text-slate-900 mt-1">
                  {selectedPlan.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Duração: {selectedPlan.durationMinutes} minutos • Modalidade: {selectedPlan.modality} • Criado por {selectedPlan.createdByCoachName} ({selectedPlan.createdAt})
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Objective Box */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                Objetivo do Treino:
              </span>
              <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                {selectedPlan.objective}
              </p>
            </div>

            {/* Structured Exercise Blocks */}
            <div className="space-y-4 mb-6">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Estrutura do Treino ({selectedPlan.blocks.length} Blocos)
              </h4>

              {selectedPlan.blocks.map((block, bIdx) => (
                <div
                  key={block.id || bIdx}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                >
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      {bIdx + 1}. {block.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                      {block.type}
                    </span>
                  </div>

                  <div className="p-3 space-y-2">
                    {block.exercises.map((ex, exIdx) => (
                      <div
                        key={ex.id || exIdx}
                        className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 text-xs space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {ex.name}
                          </span>
                          <span className="font-mono font-bold text-indigo-600 text-[11px] shrink-0">
                            {ex.sets ? `${ex.sets}x ` : ''}{ex.repsOrDuration}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span>Descanso: {ex.rest || '15s'}</span>
                          {ex.intensity && <span>• Intensidade: {ex.intensity}</span>}
                        </div>
                        {ex.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-1.5 rounded-lg border border-slate-100">
                            💡 {ex.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
                {canCreate && (
                  <button
                    onClick={() => {
                      const p = selectedPlan;
                      setSelectedPlan(null);
                      handleOpenEditPlan(p);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Plano</span>
                  </button>
                )}
              </div>

              {/* Athlete Workout Completion Logger Button */}
              {currentUser.role === 'atleta' && (
                <button
                  onClick={() => setIsLoggingWorkout(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Marcar como Concluído</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Workout Completion Modal for Athletes */}
      {isLoggingWorkout && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Registar Conclusão do Treino
              </h3>
              <button
                onClick={() => setIsLoggingWorkout(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogWorkoutSubmit} className="space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-slate-600 font-medium">
                Regista como te sentiste no treino <strong>"{selectedPlan.title}"</strong>. Os teus treinadores poderão acompanhar o teu desgaste e evolução.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Escala de Esforço Percebido (RPE: 1 a 10): <span className="text-indigo-600 font-extrabold">{rpeRating}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rpeRating}
                  onChange={(e) => setRpeRating(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>1 (Muito Fácil)</span>
                  <span>5 (Moderado)</span>
                  <span>10 (Exaustão Total)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sensações / Notas do Atleta</label>
                <textarea
                  rows={3}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="Ex: Treino correu muito bem, senti os ombros ligeiramente cansados na última série..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoggingWorkout(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar Registo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Training Plan Modal (Coach) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-indigo-600" />
                  {editingPlan ? 'Editar Plano de Treino' : 'Prescrever Plano de Treino'}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    <UserCheck className="w-3.5 h-3.5" />
                    {newAssignedAthleteIds.length === 1
                      ? `Atleta: ${athletes.find((a) => a.id === newAssignedAthleteIds[0])?.name}`
                      : newAssignedAthleteIds.length > 1
                      ? `${newAssignedAthleteIds.length} Atletas selecionados`
                      : 'Plano coletivo / geral'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    Para o dia: {formatDatePrettyShort(newScheduledDate)}
                    {newScheduledTime && ` às ${newScheduledTime}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs sm:text-sm">
              {/* SECTION: Assigned Athlete(s) Selection - PRIMARY FOCUS */}
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Atleta(s) Destinatário(s) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewAssignedAthleteIds(athletes.map((a) => a.id))}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setNewAssignedAthleteIds([])}
                      className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Clique no atleta para prescrever este plano individualmente.
                </p>

                {/* Athlete Grid Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                  {athletes.map((ath) => {
                    const isSelected = newAssignedAthleteIds.includes(ath.id);
                    return (
                      <button
                        key={ath.id}
                        type="button"
                        onClick={() => {
                          setNewAssignedAthleteIds((prev) => {
                            if (isSelected) {
                              return prev.filter((id) => id !== ath.id);
                            } else {
                              // If setting an athlete, auto-update category too
                              setNewCategory(ath.category);
                              return [...prev, ath.id];
                            }
                          });
                        }}
                        className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-300'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        {ath.photoUrl ? (
                          <img
                            src={ath.photoUrl}
                            alt={ath.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {ath.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold leading-tight">{ath.name}</p>
                          <p
                            className={`text-[10px] truncate leading-tight ${
                              isSelected ? 'text-indigo-100' : 'text-slate-400'
                            }`}
                          >
                            {ath.category}
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: Para que dia é este treino? (Agendamento no Calendário) */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-blue-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    Para que dia é este treino? (Data e Horário) *
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Atalhos:</span>
                    <button
                      type="button"
                      onClick={() => setQuickDate(0)}
                      className="px-2 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100/50 cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      className="px-2 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100/50 cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      Amanhã
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(2)}
                      className="px-2 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100/50 cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      +2 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(7)}
                      className="px-2 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100/50 cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      +1 Semana
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Data Agendada *
                    </label>
                    <input
                      type="date"
                      required
                      value={newScheduledDate}
                      onChange={(e) => setNewScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Hora Prevista de Início
                    </label>
                    <input
                      type="time"
                      value={newScheduledTime}
                      onChange={(e) => setNewScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Real-time date confirmation banner */}
                <div className="p-2.5 rounded-xl bg-white/90 border border-blue-200/70 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold min-w-0">
                    <CalendarCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate sm:whitespace-normal">
                      Treino agendado para: <strong className="text-indigo-900 underline decoration-indigo-300">{formatDatePretty(newScheduledDate)}</strong>
                      {newScheduledTime && <span> às {newScheduledTime}</span>}
                    </span>
                  </div>
                  {getRelativeDayLabel(newScheduledDate) && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                      {getRelativeDayLabel(newScheduledDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Título do Plano *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Ex: Velocidade Crítica & Saídas Rápidas"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Modalidade</label>
                  <input
                    type="text"
                    value={newModality}
                    onChange={(e) => setNewModality(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Natação Pura, Atletismo..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duração Estimada (minutos)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nível de Intensidade (1 a 5)</label>
                  <select
                    value={newIntensity}
                    onChange={(e) => setNewIntensity(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value={1}>1 - Regenerativo / Muito Leve</option>
                    <option value={2}>2 - Aeróbio Base (R1)</option>
                    <option value={3}>3 - Moderado / Ritmo Confortável (R2)</option>
                    <option value={4}>4 - Limiar Anaeróbio (R3/R4)</option>
                    <option value={5}>5 - Esforço Máximo / VAM / Sprint (R5)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Objetivos Específicos para o Atleta</label>
                  <textarea
                    rows={2}
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Ex: Foco no controlo da frequência de braçada e viragens rápidas."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Etiquetas / Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Ex: Velocidade, Técnica, Partidas"
                  />
                </div>
              </div>

              {/* Interactive Workout Builder Blocks */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Blocos de Exercícios ({blocks.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Bloco
                  </button>
                </div>

                {blocks.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Nenhum bloco de exercício adicionado a este plano.</p>
                    <button
                      type="button"
                      onClick={handleAddBlock}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Bloco
                    </button>
                  </div>
                ) : (
                  blocks.map((block, bIdx) => (
                    <div key={block.id || bIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            {bIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={block.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBlocks(blocks.map((b) => (b.id === block.id ? { ...b, title: val } : b)));
                            }}
                            className="font-bold text-xs text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-300 w-full focus:ring-1 focus:ring-indigo-500"
                            placeholder="Título do Bloco (Ex: Aquecimento, Série Principal)"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddExerciseToBlock(block.id)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" /> Exercício
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(block.id)}
                            title="Eliminar este bloco de exercício"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span className="hidden sm:inline text-red-600">Eliminar Bloco</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {block.exercises.map((ex) => (
                          <div key={ex.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBlocks(
                                  blocks.map((b) =>
                                    b.id === block.id
                                      ? {
                                          ...b,
                                          exercises: b.exercises.map((x) => (x.id === ex.id ? { ...x, name: val } : x))
                                        }
                                      : b
                                  )
                                );
                              }}
                              className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              placeholder="Exercício"
                            />
                            <input
                              type="text"
                              value={ex.repsOrDuration}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBlocks(
                                  blocks.map((b) =>
                                    b.id === block.id
                                      ? {
                                          ...b,
                                          exercises: b.exercises.map((x) => (x.id === ex.id ? { ...x, repsOrDuration: val } : x))
                                        }
                                      : b
                                  )
                                );
                              }}
                              className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              placeholder="Distância/Reps"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(block.id, ex.id)}
                              title="Eliminar exercício"
                              className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingPlan ? 'Guardar Alterações do Plano' : 'Prescrever Plano de Treino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
