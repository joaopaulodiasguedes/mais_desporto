import React, { useState } from 'react';
import { useApp, isCalendarEventVisibleForUser } from '../context/AppContext';
import { CalendarEvent } from '../types';
import {
  X,
  Plus,
  Trophy,
  Dumbbell,
  Clock,
  MapPin,
  FileText,
  Trash2,
  Edit,
  UserCheck,
  Calendar,
  Compass,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckSquare,
  Lock,
  Globe2,
  Check,
  ExternalLink
} from 'lucide-react';
import { EventModal } from './EventModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { openOriginalDocument } from '../utils/documentUtils';

interface DayManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayNumber: number | null;
  currentYear: number;
  currentMonth: number;
  onOpenPdf: (title: string, url: string) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DayManagerModal: React.FC<DayManagerModalProps> = ({
  isOpen,
  onClose,
  dayNumber,
  currentYear,
  currentMonth,
  onOpenPdf
}) => {
  const {
    calendarEvents,
    deleteCalendarEvent,
    currentUser,
    hasPermission,
    showToast,
    athletes,
    toggleEventCompletion,
    setEventRsvp
  } = useApp();

  // Child event modal state (for Create & Edit)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [defaultEventType, setDefaultEventType] = useState<'treino_oficial' | 'prova' | 'estagio' | 'reuniao' | 'treino_individual' | 'tarefa'>('treino_oficial');
  const [expandedRsvpEventId, setExpandedRsvpEventId] = useState<string | null>(null);

  if (!isOpen || dayNumber === null) return null;

  // Format date string YYYY-MM-DD
  const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  
  // Format readable title
  const dateObj = new Date(currentYear, currentMonth, dayNumber);
  const weekdayName = dateObj.toLocaleDateString('pt-PT', { weekday: 'long' });
  const formattedDayTitle = `${weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1)}, ${dayNumber} de ${MONTH_NAMES[currentMonth]} de ${currentYear}`;

  // Filter events for this specific day with RBAC
  const dayEvents = calendarEvents
    .filter((evt) => evt.date === dateString)
    .filter((evt) => isCalendarEventVisibleForUser(evt, currentUser, athletes))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const isCoach = currentUser.role === 'treinador';
  const canManage = isCoach || hasPermission('canAddCompetitions');

  const handleOpenAddEvent = (type: 'treino_oficial' | 'prova' | 'estagio' | 'reuniao' | 'treino_individual' | 'tarefa') => {
    setEventToEdit(null);
    setDefaultEventType(type);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: CalendarEvent) => {
    setEventToEdit(evt);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = (evt: CalendarEvent) => {
    setEventToDelete(evt);
  };

  const toggleRsvpExpand = (id: string) => {
    setExpandedRsvpEventId(prev => prev === id ? null : id);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl p-5 sm:p-6 animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-black flex flex-col items-center justify-center shadow-md shrink-0">
                <span className="text-[10px] font-extrabold uppercase opacity-80 leading-none">
                  {weekdayName.slice(0, 3)}
                </span>
                <span className="text-xl font-black leading-none mt-0.5">
                  {dayNumber}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">
                    Gestão do Dia
                  </h3>
                  {isCoach && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-700" />
                      Modo Treinador (CRUD)
                    </span>
                  )}
                  {currentUser.role === 'atleta' && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 font-extrabold text-[10px] flex items-center gap-1">
                      <CheckSquare className="w-3 h-3 text-teal-700" />
                      Área do Atleta
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formattedDayTitle}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-700">{dayEvents.length} {dayEvents.length === 1 ? 'atividade' : 'atividades'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Coach Quick Actions Toolbar */}
          {canManage && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-4 mb-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-orange-600" />
                  Adicionar atividade neste dia:
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => handleOpenAddEvent('treino_oficial')}
                  className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Treino</span>
                </button>

                <button
                  onClick={() => handleOpenAddEvent('prova')}
                  className="px-2.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Prova</span>
                </button>

                <button
                  onClick={() => handleOpenAddEvent('tarefa')}
                  className="px-2.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tarefa</span>
                </button>

                <button
                  onClick={() => handleOpenAddEvent('estagio')}
                  className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Estágio</span>
                </button>

                <button
                  onClick={() => handleOpenAddEvent('reuniao')}
                  className="px-2.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Reunião</span>
                </button>
              </div>
            </div>
          )}

          {/* Athlete Quick Actions Toolbar */}
          {currentUser.role === 'atleta' && (
            <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-200 mt-4 mb-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  
                  As minhas ações para este dia:
                </span>
                <span className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> As tuas tarefas são privadas
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenAddEvent('tarefa')}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Adicionar uma tarefa pessoal</span>
                </button>

                <button
                  onClick={() => handleOpenAddEvent('treino_individual')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Treino individual</span>
                </button>
              </div>
            </div>
          )}

          {/* Events List for this Day */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 mt-1">
            {dayEvents.map((evt) => {
              const comp = evt.type === 'prova';
              const train = evt.type === 'treino_oficial' || evt.type === 'treino_individual';
              const isTask = evt.type === 'tarefa';
              const isOwnerOrCoach = isCoach || evt.creatorId === currentUser.id || canManage;

              // Calculate RSVPs stats
              const rsvpsList = Object.values(evt.rsvps || {}) as Array<{
                status: 'confirmado' | 'ausente' | 'justificado';
                responderName: string;
                role: string;
                note?: string;
                updatedAt: string;
              }>;
              const confirmedCount = rsvpsList.filter(r => r.status === 'confirmado').length;
              const justifiedCount = rsvpsList.filter(r => r.status === 'justificado').length;
              const absentCount = rsvpsList.filter(r => r.status === 'ausente').length;
              const isRsvpExpanded = expandedRsvpEventId === evt.id;

              const athleteRsvpKey = currentUser.athleteProfileId || currentUser.id;
              const userRsvp = evt.rsvps?.[athleteRsvpKey];

              return (
                <div
                  key={evt.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    comp
                      ? 'border-amber-200 bg-amber-50/20 hover:border-amber-400'
                      : isTask
                      ? 'border-teal-200 bg-teal-50/25 hover:border-teal-400'
                      : train
                      ? 'border-blue-200 bg-blue-50/20 hover:border-blue-400'
                      : evt.type === 'estagio'
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400'
                      : 'border-purple-200 bg-purple-50/20 hover:border-purple-400'
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {comp && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> COMPETIÇÃO
                          </span>
                        )}
                        {train && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" /> {evt.type === 'treino_individual' ? 'TREINO INDIVIDUAL' : 'TREINO OFICIAL'}
                          </span>
                        )}
                        {isTask && (
                          evt.createdByRole === 'treinador' ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                              <Globe2 className="w-3 h-3 text-blue-600" /> TAREFA EQUIPA (PÚBLICA)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 text-[10px] font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-teal-600" /> MINHA TAREFA (PRIVADA)
                            </span>
                          )
                        )}
                        {isTask && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                            evt.isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {evt.isCompleted ? '✓ Concluída' : '○ Pendente'}
                          </span>
                        )}
                        {evt.type === 'estagio' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center gap-1">
                            <Compass className="w-3 h-3" /> ESTÁGIO
                          </span>
                        )}
                        {evt.type === 'reuniao' && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-[10px] flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> REUNIÃO
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          <Clock className="w-3 h-3 text-slate-500" />
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
                        <h4 className={`text-base font-black ${isTask && evt.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
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
                    </div>

                    {/* Action Buttons: Edit and Delete */}
                    {isOwnerOrCoach && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditEvent(evt)}
                          className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-slate-200 hover:border-orange-300 shadow-2xs cursor-pointer"
                          title="Editar atividade"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-300 shadow-2xs cursor-pointer"
                          title="Eliminar atividade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Location & Details */}
                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    {evt.location && (
                      <p className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{evt.location}</span>
                      </p>
                    )}

                    {evt.targetCategories && evt.targetCategories.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-500">Escalões:</span>
                        {evt.targetCategories.map((c) => (
                          <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {evt.description && (
                      <p className="pt-1.5 text-xs text-slate-700 bg-white/70 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  {/* PDF Document and Attendance Summary Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Athlete Quick RSVP for Tasks */}
                      {isTask && currentUser.role === 'atleta' && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {userRsvp?.status === 'confirmado' ? (
                            <div className="flex items-center gap-1">
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs">
                                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                <span>Presente (✓)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setEventRsvp(evt.id, 'ausente')}
                                className="px-2.5 py-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                                title="Alterar para Ausente"
                              >
                                <span className="flex items-center gap-1 text-red-600"><X className="w-3 h-3 stroke-[3]" /> Mudar p/ Ausente</span>
                              </button>
                            </div>
                          ) : userRsvp?.status === 'ausente' ? (
                            <div className="flex items-center gap-1">
                              <span className="px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs">
                                <X className="w-3.5 h-3.5 text-red-700 stroke-[3]" />
                                <span>Ausente (✕)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setEventRsvp(evt.id, 'confirmado')}
                                className="px-2.5 py-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                                title="Alterar para Presente"
                              >
                                <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3 h-3 stroke-[3]" /> Mudar p/ Presente</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEventRsvp(evt.id, 'confirmado')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                title="Confirmar Presença (Visto Verde)"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Confirmar Presença</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEventRsvp(evt.id, 'ausente')}
                                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-300 hover:border-red-400 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                title="Responder Ausente (Cruz Vermelha)"
                              >
                                <X className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Ausente</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Regulamento PDF - Abre diretamente noutro separador */}
                      {evt.officialPdfUrl && (
                        <button
                          type="button"
                          onClick={() => openOriginalDocument(evt.officialPdfUrl!, `${evt.title || 'Regulamento'}.pdf`)}
                          className="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title="Abrir Regulamento PDF num novo separador"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-500" />
                          <span>Regulamento PDF</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* RSVPs Convocatórias Accordion Button */}
                    {rsvpsList.length > 0 ? (
                      <button
                        onClick={() => toggleRsvpExpand(evt.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Presenças: {confirmedCount} Conf. / {justifiedCount} Just. / {absentCount} Aus.
                        </span>
                        {isRsvpExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Sem respostas de presença registadas
                      </span>
                    )}
                  </div>

                  {/* Expanded RSVPs list */}
                  {isRsvpExpanded && rsvpsList.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 animate-in fade-in">
                      <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Lista de Respostas dos Atletas:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                        {rsvpsList.map((resp, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl border flex items-start justify-between gap-2 text-xs ${
                              resp.status === 'confirmado'
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                : resp.status === 'justificado'
                                ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                                : 'bg-red-50/50 border-red-200 text-red-950'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold block">{resp.responderName}</span>
                              {resp.note && (
                                <p className="text-[11px] text-slate-600 italic">"{resp.note}"</p>
                              )}
                            </div>
                            <span className="shrink-0 flex items-center gap-1 font-extrabold text-[10px]">
                              {resp.status === 'confirmado' && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                              {resp.status === 'justificado' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                              {resp.status === 'ausente' && <X className="w-3.5 h-3.5 text-red-600 stroke-[3]" />}
                              <span className={resp.status === 'confirmado' ? 'text-emerald-800' : resp.status === 'ausente' ? 'text-red-800' : ''}>
                                {resp.status === 'confirmado' ? 'Presente (✓)' : resp.status === 'ausente' ? 'Ausente (✕)' : resp.status}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {dayEvents.length === 0 && (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">
                  Nenhuma atividade agendada para este dia
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {canManage
                    ? 'Como treinador, utilize os botões acima para criar uma sessão de treino, convocatória para competição ou estágio para esta data.'
                    : 'Não existem treinos ou competições agendados pelo clube para este dia.'}
                </p>

                {canManage && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenAddEvent('treino_oficial')}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Dumbbell className="w-4 h-4" />
                      <span>Criar Treino</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddEvent('prova')}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Criar Competição</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              {dateString}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Nested Event Create / Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        defaultDate={dateString}
        defaultType={defaultEventType}
      />

      {/* Confirmation Modal for Deleting Event in Day Manager */}
      <ConfirmDeleteModal
        isOpen={eventToDelete !== null}
        onClose={() => setEventToDelete(null)}
        onConfirm={() => {
          if (eventToDelete) {
            deleteCalendarEvent(eventToDelete.id);
            setEventToDelete(null);
          }
        }}
        title="Eliminar Atividade"
        itemTitle={eventToDelete ? `${eventToDelete.title} (${eventToDelete.time})` : ''}
        description={`Tem a certeza de que deseja eliminar esta atividade do dia ${dayNumber}?`}
        confirmText="Sim, Eliminar"
      />
    </>
  );
};
