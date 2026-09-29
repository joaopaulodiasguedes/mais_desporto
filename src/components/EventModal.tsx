import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent } from '../types';
import {
  X,
  Check,
  Trophy,
  Dumbbell,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Compass,
  Briefcase,
  CheckSquare,
  Lock,
  Globe2
} from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  defaultDate?: string;
  defaultType?: 'treino_oficial' | 'prova' | 'estagio' | 'reuniao' | 'treino_individual' | 'tarefa';
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  defaultDate,
  defaultType
}) => {
  const { addCalendarEvent, updateCalendarEvent, currentUser } = useApp();

  const isEditing = !!eventToEdit;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'prova' | 'treino_oficial' | 'treino_individual' | 'estagio' | 'reuniao' | 'tarefa'>('treino_oficial');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('Complexo Desportivo / Piscinas Municipais');
  const [targetCategories, setTargetCategories] = useState<string[]>(['Todos']);
  const [description, setDescription] = useState('');
  const [officialPdfUrl, setOfficialPdfUrl] = useState('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setType(eventToEdit.type || 'treino_oficial');
      setDate(eventToEdit.date || new Date().toISOString().split('T')[0]);
      setTime(eventToEdit.time || '09:00');
      setEndTime(eventToEdit.endTime || '');
      setLocation(eventToEdit.location || '');
      setTargetCategories(eventToEdit.targetCategories && eventToEdit.targetCategories.length > 0 ? eventToEdit.targetCategories : ['Todos']);
      setDescription(eventToEdit.description || '');
      setOfficialPdfUrl(eventToEdit.officialPdfUrl || '');
      setIsCompleted(eventToEdit.isCompleted || false);
    } else {
      setTitle('');
      setType(defaultType || (currentUser.role === 'treinador' ? 'treino_oficial' : 'tarefa'));
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setEndTime('10:30');
      setLocation(currentUser.role === 'atleta' ? 'Piscina / Ginásio' : 'Complexo Desportivo / Piscinas Municipais');
      setTargetCategories(['Todos']);
      setDescription('');
      setOfficialPdfUrl('');
      setIsCompleted(false);
    }
  }, [eventToEdit, defaultDate, defaultType, currentUser.role, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && eventToEdit) {
      updateCalendarEvent(eventToEdit.id, {
        title: title.trim(),
        type,
        date,
        time,
        endTime: endTime.trim() || undefined,
        location: location.trim(),
        targetCategories,
        description: description.trim() || undefined,
        officialPdfUrl: officialPdfUrl.trim() || undefined,
        isCompleted: type === 'tarefa' ? isCompleted : undefined
      });
    } else {
      addCalendarEvent({
        title: title.trim(),
        type,
        date,
        time,
        endTime: endTime.trim() || undefined,
        location: location.trim(),
        targetCategories,
        description: description.trim() || undefined,
        officialPdfUrl: officialPdfUrl.trim() || undefined,
        createdByRole: currentUser.role,
        creatorName: currentUser.name,
        creatorId: currentUser.id,
        athleteId: currentUser.role === 'atleta' ? (currentUser.athleteProfileId || currentUser.id) : undefined,
        isCompleted: type === 'tarefa' ? isCompleted : undefined
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-5 sm:p-6 animate-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              type === 'prova'
                ? 'bg-amber-100 text-amber-700'
                : type === 'treino_oficial'
                ? 'bg-blue-100 text-blue-700'
                : type === 'tarefa'
                ? 'bg-teal-100 text-teal-700'
                : type === 'estagio'
                ? 'bg-emerald-100 text-emerald-700'
                : type === 'reuniao'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {type === 'prova' && <Trophy className="w-5 h-5" />}
              {type === 'treino_oficial' && <Dumbbell className="w-5 h-5" />}
              {type === 'tarefa' && <CheckSquare className="w-5 h-5" />}
              {type === 'estagio' && <Compass className="w-5 h-5" />}
              {type === 'reuniao' && <Briefcase className="w-5 h-5" />}
              {type === 'treino_individual' && <Dumbbell className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-tight">
                {isEditing ? 'Editar Evento / Tarefa' : type === 'tarefa' ? 'Nova Tarefa' : 'Novo Evento no Calendário'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing ? 'Altere os detalhes da atividade selecionada' : `Agendar para o dia ${date}`}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Event Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Tipo de Atividade *
            </label>
            {currentUser.role === 'atleta' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('tarefa')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    type === 'tarefa'
                      ? 'bg-teal-50 border-teal-500 text-teal-950 ring-2 ring-teal-500/20 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <CheckSquare className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-bold">Tarefa Individual</span>
                  <span className="text-[10px] text-slate-400">Privada (só tu vês)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('treino_individual')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    type === 'treino_individual'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Dumbbell className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold">Treino Individual</span>
                  <span className="text-[10px] text-slate-400">Sessão pessoal</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setType('treino_oficial')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    type === 'treino_oficial'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Dumbbell className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px]">Treino Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('prova')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    type === 'prova'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px]">Competição</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('tarefa')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    type === 'tarefa'
                      ? 'bg-teal-50 border-teal-500 text-teal-950 ring-2 ring-teal-500/20 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px]">Tarefa Equipa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('estagio')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    type === 'estagio'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px]">Estágio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('reuniao')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    type === 'reuniao'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-500/20 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span className="text-[11px]">Reunião</span>
                </button>
              </div>
            )}

            {/* Privacy indicator for tasks */}
            {type === 'tarefa' && (
              <div className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                currentUser.role === 'atleta'
                  ? 'bg-teal-50/80 border-teal-200 text-teal-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}>
                {currentUser.role === 'atleta' ? (
                  <>
                    <Lock className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>Tarefa Privada:</strong> Cada atleta só vê as suas tarefas no calendário.</span>
                  </>
                ) : (
                  <>
                    <Globe2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span><strong>Tarefa de Treinador:</strong> As tarefas adicionadas pelo treinador são visualizadas por todos os utilizadores.</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {type === 'tarefa' ? 'Descrição / Título da Tarefa *' : 'Título da Atividade / Competição *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-bold text-slate-900"
              placeholder={
                type === 'tarefa'
                  ? (currentUser.role === 'atleta' ? 'Ex: Trazer atestado médico / Alongamento em casa' : 'Ex: Entregar termos de responsabilidade assinados')
                  : type === 'prova'
                  ? 'Ex: Torneio Regional de Clubes'
                  : type === 'reuniao'
                  ? 'Ex: Reunião com Encarregados de Educação'
                  : 'Ex: Treino Técnico de Velocidade e Saídas'
              }
            />
          </div>

          {type === 'tarefa' && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="task-complete-cb"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="task-complete-cb" className="text-xs font-bold text-slate-700 cursor-pointer">
                Marcar tarefa como concluída
              </label>
            </div>
          )}

          {/* Date and Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Hora Início *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Hora Fim
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-medium"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Localização *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-medium"
              placeholder="Ex: Piscina Municipal de Guimarães / Complexo Desportivo"
            />
          </div>

          {/* Official PDF URL */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Link do Regulamento / Documento Oficial (PDF)
            </label>
            <input
              type="url"
              value={officialPdfUrl}
              onChange={(e) => setOfficialPdfUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-medium text-xs"
              placeholder="https://exemplo.com/regulamento.pdf"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Instruções Técnicas / Observações / Convocatória
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-medium"
              placeholder="Ex: Aquecimento às 08:30. Trazer equipamento oficial do clube e garrafa de água..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Alterações' : 'Criar Evento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
