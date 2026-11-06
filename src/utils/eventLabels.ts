/**
 * Etiquetas de eventos (usadas na Gestão do Dia): nome, ícone, cor e sequência editáveis pelo administrador.
 * Os ids são fixos (ligados aos tipos de evento e aos níveis de prova); só a apresentação é configurável.
 */
import React from 'react';
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
  Award,
  type LucideIcon
} from 'lucide-react';
import { CalendarEvent, EventLabel, EventLabelId } from '../types';

export type LabelIcon = React.ComponentType<{ className?: string }>;

/** Bandeira de Portugal (o lucide não a inclui). */
export const PortugalFlagIcon: LabelIcon = ({ className }) =>
  React.createElement(
    'svg',
    { viewBox: '0 0 30 20', className, role: 'img', 'aria-label': 'Bandeira de Portugal' },
    React.createElement('rect', { width: 30, height: 20, rx: 2, fill: '#FF0000' }),
    React.createElement('path', { d: 'M2 0h10v20H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z', fill: '#006600' }),
    React.createElement('circle', { cx: 12, cy: 10, r: 4.2, fill: '#FFCC00' }),
    React.createElement('circle', { cx: 12, cy: 10, r: 2.4, fill: '#FF0000' }),
    React.createElement('circle', { cx: 12, cy: 10, r: 1.2, fill: '#FFFFFF' })
  );

/** Ícones de atletismo desenhados em traço (o lucide não os inclui). */
const strokeIcon = (label: string, ...children: React.ReactNode[]): LabelIcon => ({ className }) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      className,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      role: 'img',
      'aria-label': label
    },
    ...children
  );

const runner = (transform: string) =>
  React.createElement(
    'g',
    { transform },
    React.createElement('circle', { cx: 14, cy: 4.5, r: 1.8 }),
    React.createElement('path', { d: 'M12.5 8.5L10 12l3 2.5.5 4.5M10 12l-3 1M12.5 8.5l3 1.5 2.5-1M13 14.5l3.5 1.5.5 3.5' })
  );

export const TrackRunnerIcon = strokeIcon(
  'Corrida em pista',
  runner('translate(0 -1.5) scale(0.92)'),
  React.createElement('rect', { x: 2, y: 18.5, width: 20, height: 3.5, rx: 1.75 }),
  React.createElement('path', { d: 'M2 6h4M3 9h3M2 12h3' })
);

export const MountainIcon = strokeIcon(
  'Montanha / Trail',
  React.createElement('path', { d: 'M2.5 20L10 5l4.5 8 2-3L21.5 20z' }),
  React.createElement('path', { d: 'M7 12.5l2 1.5 2-2.5' })
);

export const StadiumTrackIcon = strokeIcon(
  'Pista de atletismo',
  React.createElement('rect', { x: 2, y: 5, width: 20, height: 14, rx: 7 }),
  React.createElement('rect', { x: 6, y: 9, width: 12, height: 6, rx: 3 }),
  React.createElement('path', { d: 'M10.5 12h3' })
);

export const ParkRunIcon = strokeIcon(
  'Corrida ao ar livre',
  runner('translate(-3 0) scale(0.95)'),
  React.createElement('circle', { cx: 19, cy: 8, r: 3 }),
  React.createElement('path', { d: 'M19 11v6M2 20h20' })
);

export const ICON_OPTIONS: Record<string, LabelIcon> = {
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
  PortugalFlag: PortugalFlagIcon,
  TrackRunner: TrackRunnerIcon,
  Mountain: MountainIcon,
  StadiumTrack: StadiumTrackIcon,
  ParkRun: ParkRunIcon
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

export const getIconComponent = (key: string): LabelIcon => ICON_OPTIONS[key] || Flag;

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

export const EVENT_LABEL_HINTS: Record<string, string> = {
  treino_oficial: 'Treinos da equipa',
  treino_individual: 'Treinos individuais do atleta',
  prova: 'Provas e competições',
  tarefa: 'Tarefas',
  estagio: 'Estágios',
  reuniao: 'Reuniões',
  nivel_regional: 'Nível da prova: regional',
  nivel_nacional: 'Nível da prova: nacional'
};

export type LabelCategory = 'acao' | 'nivel' | 'tipo';

export const LABEL_CATEGORIES: { key: LabelCategory; title: string; hint: string }[] = [
  { key: 'acao', title: 'Ações', hint: 'Botões para criar atividades no calendário e na Gestão do Dia (os primeiros aparecem em destaque).' },
  { key: 'nivel', title: 'Nível da Prova', hint: 'Distinguem o nível das provas (cor e ícone nas células do calendário).' },
  { key: 'tipo', title: 'Tipo', hint: 'Etiquetas adicionais que se aplicam aos eventos.' }
];

const ACTION_LABEL_IDS = ['treino_oficial', 'prova', 'tarefa', 'estagio', 'reuniao'];

/** Grupo da etiqueta. As personalizadas guardam o grupo no próprio id (custom-<grupo>-...). */
export function getLabelCategory(id: string): LabelCategory {
  if (id.startsWith('nivel_') || id.startsWith('custom-nivel-')) return 'nivel';
  if (ACTION_LABEL_IDS.includes(id) || id.startsWith('custom-acao-')) return 'acao';
  return 'tipo';
}

export const BUILT_IN_LABEL_IDS = DEFAULT_EVENT_LABELS.map((l) => l.id);
export const isBuiltInLabel = (id: string): boolean => BUILT_IN_LABEL_IDS.includes(id);

/** Junta as etiquetas guardadas com as predefinidas (ids em falta usam o valor por omissão), mantém as personalizadas e ordena. */
export function mergeEventLabels(saved: EventLabel[] | undefined | null): EventLabel[] {
  const savedList = saved || [];
  const byId = new Map(savedList.map((l) => [l.id, l]));
  const builtIn = DEFAULT_EVENT_LABELS.map((def) => ({ ...def, ...(byId.get(def.id) || {}) }));
  const custom = savedList.filter((l) => !isBuiltInLabel(l.id));
  return [...builtIn, ...custom].sort((a, b) => a.order - b.order);
}

const CATEGORY_RANK: Record<LabelCategory, number> = { acao: 0, tipo: 1, nivel: 2 };

/** Sequência fixa de apresentação: Ação (ex.: Prova), depois Tipo (ex.: Pista) e por fim Nível (ex.: Distrital). Dentro do grupo, a ordem do administrador. */
export const compareLabelsForDisplay = (a: EventLabel, b: EventLabel): number =>
  CATEGORY_RANK[getLabelCategory(a.id)] - CATEGORY_RANK[getLabelCategory(b.id)] || a.order - b.order;

/** Etiquetas de um evento (tipo + nível da prova + personalizadas), pela ordem definida pelo administrador. */
export function getLabelIdsForEvent(evt: CalendarEvent): EventLabelId[] {
  const ids: EventLabelId[] = [evt.type];
  if (evt.type === 'prova' && evt.competitionLevel) {
    ids.push(evt.competitionLevel === 'nacional' ? 'nivel_nacional' : 'nivel_regional');
  }
  if (evt.labelIds) ids.push(...evt.labelIds);
  return ids;
}

export interface ColorTone {
  card: string;
  date: string;
  pill: string;
  pillIcon: string;
  chipHover: string;
}

// Tons claros por cor (cartões, datas e pílulas do calendário); classes por extenso para o Tailwind as detetar
export const COLOR_TONES: Record<string, ColorTone> = {
  blue: {
    card: 'border-blue-200 hover:border-blue-400 bg-gradient-to-r from-blue-50/20 to-white',
    date: 'bg-blue-100/90 text-blue-950 border-blue-300',
    pill: 'bg-blue-100 border-blue-300 text-blue-800',
    pillIcon: 'text-blue-700',
    chipHover: 'hover:text-blue-700'
  },
  indigo: {
    card: 'border-indigo-200 hover:border-indigo-400 bg-gradient-to-r from-indigo-50/20 to-white',
    date: 'bg-indigo-100/90 text-indigo-950 border-indigo-300',
    pill: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    pillIcon: 'text-indigo-700',
    chipHover: 'hover:text-indigo-700'
  },
  purple: {
    card: 'border-purple-200 hover:border-purple-400 bg-gradient-to-r from-purple-50/20 to-white',
    date: 'bg-purple-100/90 text-purple-950 border-purple-300',
    pill: 'bg-purple-100 border-purple-300 text-purple-800',
    pillIcon: 'text-purple-700',
    chipHover: 'hover:text-purple-700'
  },
  pink: {
    card: 'border-pink-200 hover:border-pink-400 bg-gradient-to-r from-pink-50/20 to-white',
    date: 'bg-pink-100/90 text-pink-950 border-pink-300',
    pill: 'bg-pink-100 border-pink-300 text-pink-800',
    pillIcon: 'text-pink-700',
    chipHover: 'hover:text-pink-700'
  },
  red: {
    card: 'border-red-200 hover:border-red-400 bg-gradient-to-r from-red-50/20 to-white',
    date: 'bg-red-100/90 text-red-950 border-red-300',
    pill: 'bg-red-100 border-red-300 text-red-800',
    pillIcon: 'text-red-700',
    chipHover: 'hover:text-red-700'
  },
  orange: {
    card: 'border-orange-200 hover:border-orange-400 bg-gradient-to-r from-orange-50/20 to-white',
    date: 'bg-orange-100/90 text-orange-950 border-orange-300',
    pill: 'bg-orange-100 border-orange-300 text-orange-800',
    pillIcon: 'text-orange-700',
    chipHover: 'hover:text-orange-700'
  },
  amber: {
    card: 'border-amber-200 hover:border-amber-400 bg-gradient-to-r from-amber-50/20 to-white',
    date: 'bg-amber-100/90 text-amber-950 border-amber-300',
    pill: 'bg-amber-100 border-amber-300 text-amber-800',
    pillIcon: 'text-amber-700',
    chipHover: 'hover:text-amber-700'
  },
  green: {
    card: 'border-green-200 hover:border-green-400 bg-gradient-to-r from-green-50/20 to-white',
    date: 'bg-green-100/90 text-green-950 border-green-300',
    pill: 'bg-green-100 border-green-300 text-green-800',
    pillIcon: 'text-green-700',
    chipHover: 'hover:text-green-700'
  },
  emerald: {
    card: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-r from-emerald-50/20 to-white',
    date: 'bg-emerald-100/90 text-emerald-950 border-emerald-300',
    pill: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    pillIcon: 'text-emerald-700',
    chipHover: 'hover:text-emerald-700'
  },
  teal: {
    card: 'border-teal-200 hover:border-teal-400 bg-gradient-to-r from-teal-50/20 to-white',
    date: 'bg-teal-100/90 text-teal-950 border-teal-300',
    pill: 'bg-teal-100 border-teal-300 text-teal-800',
    pillIcon: 'text-teal-700',
    chipHover: 'hover:text-teal-700'
  },
  cyan: {
    card: 'border-cyan-200 hover:border-cyan-400 bg-gradient-to-r from-cyan-50/20 to-white',
    date: 'bg-cyan-100/90 text-cyan-950 border-cyan-300',
    pill: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    pillIcon: 'text-cyan-700',
    chipHover: 'hover:text-cyan-700'
  },
  slate: {
    card: 'border-slate-200 hover:border-slate-400 bg-gradient-to-r from-slate-50/20 to-white',
    date: 'bg-slate-100/90 text-slate-950 border-slate-300',
    pill: 'bg-slate-100 border-slate-300 text-slate-800',
    pillIcon: 'text-slate-700',
    chipHover: 'hover:text-slate-700'
  }
};

export const getColorTone = (key: string): ColorTone => COLOR_TONES[key] || COLOR_TONES.blue;

/** Etiqueta pelo id, com a predefinição como alternativa. */
export const findLabel = (labels: EventLabel[], id: string): EventLabel =>
  labels.find((l) => l.id === id) || DEFAULT_EVENT_LABELS.find((l) => l.id === id) || DEFAULT_EVENT_LABELS[0];

/** Etiqueta que dá a cor/ícone de destaque ao evento: o nível da prova (se existir) ou o tipo. */
export const getAccentLabel = (labels: EventLabel[], evt: CalendarEvent): EventLabel => {
  if (evt.type === 'prova' && evt.competitionLevel) {
    return findLabel(labels, evt.competitionLevel === 'nacional' ? 'nivel_nacional' : 'nivel_regional');
  }
  return findLabel(labels, evt.type);
};
