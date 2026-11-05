/**
 * Etiquetas de eventos (usadas na Gestão do Dia): nome, ícone, cor e sequência editáveis pelo administrador.
 * Os ids são fixos (ligados aos tipos de evento e aos níveis de prova); só a apresentação é configurável.
 */
import {
  Trophy,
  Dumbbell,
  CheckSquare,
  Compass,
  Briefcase,
  Flag,
  Star,
  Medal,
  Users,
  Calendar,
  Flame,
  MapPin,
  Heart,
  Target,
  Zap,
  Award,
  Bell,
  Bookmark,
  type LucideIcon
} from 'lucide-react';
import { CalendarEvent, EventLabel, EventLabelId } from '../types';

export const ICON_OPTIONS: Record<string, LucideIcon> = {
  Trophy,
  Dumbbell,
  CheckSquare,
  Compass,
  Briefcase,
  Flag,
  Star,
  Medal,
  Award,
  Users,
  Calendar,
  Flame,
  MapPin,
  Heart,
  Target,
  Zap,
  Bell,
  Bookmark
};

export interface ColorOption {
  key: string;
  label: string;
  /** Etiqueta (pílula) */
  badge: string;
  /** Botão de ação */
  button: string;
  /** Amostra no seletor */
  swatch: string;
}

// Classes escritas por extenso para o Tailwind as detetar
export const COLOR_OPTIONS: ColorOption[] = [
  { key: 'blue', label: 'Azul', badge: 'bg-blue-600 text-white', button: 'bg-blue-600 hover:bg-blue-700 text-white', swatch: 'bg-blue-600' },
  { key: 'indigo', label: 'Índigo', badge: 'bg-indigo-600 text-white', button: 'bg-indigo-600 hover:bg-indigo-700 text-white', swatch: 'bg-indigo-600' },
  { key: 'purple', label: 'Roxo', badge: 'bg-purple-600 text-white', button: 'bg-purple-600 hover:bg-purple-700 text-white', swatch: 'bg-purple-600' },
  { key: 'pink', label: 'Rosa', badge: 'bg-pink-600 text-white', button: 'bg-pink-600 hover:bg-pink-700 text-white', swatch: 'bg-pink-600' },
  { key: 'red', label: 'Vermelho', badge: 'bg-red-600 text-white', button: 'bg-red-600 hover:bg-red-700 text-white', swatch: 'bg-red-600' },
  { key: 'orange', label: 'Laranja', badge: 'bg-orange-500 text-white', button: 'bg-orange-500 hover:bg-orange-600 text-white', swatch: 'bg-orange-500' },
  { key: 'amber', label: 'Âmbar', badge: 'bg-amber-500 text-slate-950', button: 'bg-amber-500 hover:bg-amber-600 text-slate-950', swatch: 'bg-amber-500' },
  { key: 'green', label: 'Verde claro', badge: 'bg-green-500 text-white', button: 'bg-green-500 hover:bg-green-600 text-white', swatch: 'bg-green-500' },
  { key: 'emerald', label: 'Esmeralda', badge: 'bg-emerald-600 text-white', button: 'bg-emerald-600 hover:bg-emerald-700 text-white', swatch: 'bg-emerald-600' },
  { key: 'teal', label: 'Turquesa', badge: 'bg-teal-600 text-white', button: 'bg-teal-600 hover:bg-teal-700 text-white', swatch: 'bg-teal-600' },
  { key: 'cyan', label: 'Ciano', badge: 'bg-cyan-600 text-white', button: 'bg-cyan-600 hover:bg-cyan-700 text-white', swatch: 'bg-cyan-600' },
  { key: 'slate', label: 'Cinza', badge: 'bg-slate-700 text-white', button: 'bg-slate-700 hover:bg-slate-800 text-white', swatch: 'bg-slate-700' }
];

export const getColorOption = (key: string): ColorOption =>
  COLOR_OPTIONS.find((c) => c.key === key) || COLOR_OPTIONS[0];

export const getIconComponent = (key: string): LucideIcon => ICON_OPTIONS[key] || Bookmark;

export const DEFAULT_EVENT_LABELS: EventLabel[] = [
  { id: 'treino_oficial', name: 'Treino', icon: 'Dumbbell', color: 'blue', order: 0 },
  { id: 'treino_individual', name: 'Treino Individual', icon: 'Dumbbell', color: 'blue', order: 1 },
  { id: 'prova', name: 'Competição', icon: 'Trophy', color: 'amber', order: 2 },
  { id: 'tarefa', name: 'Tarefa', icon: 'CheckSquare', color: 'teal', order: 3 },
  { id: 'estagio', name: 'Estágio', icon: 'Compass', color: 'emerald', order: 4 },
  { id: 'reuniao', name: 'Reunião', icon: 'Briefcase', color: 'purple', order: 5 },
  { id: 'nivel_regional', name: 'Regional', icon: 'Flag', color: 'green', order: 6 },
  { id: 'nivel_nacional', name: 'Nacional', icon: 'Flag', color: 'red', order: 7 }
];

export const EVENT_LABEL_HINTS: Record<EventLabelId, string> = {
  treino_oficial: 'Treinos da equipa',
  treino_individual: 'Treinos individuais do atleta',
  prova: 'Provas e competições',
  tarefa: 'Tarefas',
  estagio: 'Estágios',
  reuniao: 'Reuniões',
  nivel_regional: 'Nível da prova: regional',
  nivel_nacional: 'Nível da prova: nacional'
};

/** Junta as etiquetas guardadas com as predefinidas (ids em falta usam o valor por omissão) e ordena-as. */
export function mergeEventLabels(saved: EventLabel[] | undefined | null): EventLabel[] {
  const byId = new Map((saved || []).map((l) => [l.id, l]));
  return DEFAULT_EVENT_LABELS.map((def) => ({ ...def, ...(byId.get(def.id) || {}) })).sort((a, b) => a.order - b.order);
}

/** Etiquetas de um evento (tipo + nível da prova), pela ordem definida pelo administrador. */
export function getLabelIdsForEvent(evt: CalendarEvent): EventLabelId[] {
  const ids: EventLabelId[] = [evt.type];
  if (evt.type === 'prova' && evt.competitionLevel) {
    ids.push(evt.competitionLevel === 'nacional' ? 'nivel_nacional' : 'nivel_regional');
  }
  return ids;
}
