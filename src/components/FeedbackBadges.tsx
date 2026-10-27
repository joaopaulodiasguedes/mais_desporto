import React from 'react';
import { Lightbulb, Bug } from 'lucide-react';
import { FeedbackStatus, FeedbackType } from '../types';

export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = {
  nova_funcionalidade: 'Nova funcionalidade',
  erro: 'Erro / Bug'
};

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  novo: 'Novo',
  visto: 'Visto',
  resolvido: 'Resolvido'
};

export const FeedbackTypeBadge: React.FC<{ type: FeedbackType }> = ({ type }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
      type === 'erro'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }`}
  >
    {type === 'erro' ? <Bug className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
    {FEEDBACK_TYPE_LABEL[type]}
  </span>
);

export const FeedbackStatusBadge: React.FC<{ status: FeedbackStatus }> = ({ status }) => (
  <span
    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
      status === 'resolvido'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : status === 'visto'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200'
    }`}
  >
    {FEEDBACK_STATUS_LABEL[status]}
  </span>
);

export const formatFeedbackDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
};
