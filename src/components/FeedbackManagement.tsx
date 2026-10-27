import React, { useState } from 'react';
import { Eye, CheckCircle2, RotateCcw, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FeedbackStatus, FeedbackType } from '../types';
import { FeedbackStatusBadge, FeedbackTypeBadge, formatFeedbackDate } from './FeedbackBadges';

type StatusFilter = 'todos' | FeedbackStatus;
type TypeFilter = 'todos' | FeedbackType;

export const FeedbackManagement: React.FC = () => {
  const { feedbacks, updateFeedbackStatus } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');

  const filtered = feedbacks.filter(
    (f) => (statusFilter === 'todos' || f.status === statusFilter) && (typeFilter === 'todos' || f.type === typeFilter)
  );

  const count = (s: FeedbackStatus) => feedbacks.filter((f) => f.status === s).length;

  const statusTabs: { value: StatusFilter; label: string; total: number }[] = [
    { value: 'todos', label: 'Todos', total: feedbacks.length },
    { value: 'novo', label: 'Novos', total: count('novo') },
    { value: 'visto', label: 'Vistos', total: count('visto') },
    { value: 'resolvido', label: 'Resolvidos', total: count('resolvido') }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {statusTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                statusFilter === t.value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label} <span className="text-slate-400">({t.total})</span>
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
        >
          <option value="todos">Todos os tipos</option>
          <option value="nova_funcionalidade">Novas funcionalidades</option>
          <option value="erro">Erros / Bugs</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Sem feedback para mostrar.</p>
        </div>
      ) : (
        filtered.map((fb) => (
          <div key={fb.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <FeedbackTypeBadge type={fb.type} />
              <FeedbackStatusBadge status={fb.status} />
              <span className="text-[11px] text-slate-400 ml-auto">{formatFeedbackDate(fb.createdAt)}</span>
            </div>

            <div>
              <p className="font-extrabold text-sm text-slate-900">{fb.title}</p>
              <p className="text-[11px] text-slate-500 font-semibold">
                {fb.authorName} · {fb.authorRole}
              </p>
            </div>

            <p className="text-xs text-slate-700 whitespace-pre-wrap">{fb.description}</p>

            {(fb.seenAt || fb.resolvedAt) && (
              <p className="text-[11px] text-slate-400">
                {fb.seenAt && <>Visto em {formatFeedbackDate(fb.seenAt)}</>}
                {fb.seenAt && fb.resolvedAt && ' · '}
                {fb.resolvedAt && <>Resolvido em {formatFeedbackDate(fb.resolvedAt)}</>}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {fb.status === 'novo' && (
                <button
                  onClick={() => updateFeedbackStatus(fb.id, 'visto')}
                  className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Marcar como visto
                </button>
              )}
              {fb.status !== 'resolvido' && (
                <button
                  onClick={() => updateFeedbackStatus(fb.id, 'resolvido')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como resolvido
                </button>
              )}
              {fb.status === 'resolvido' && (
                <button
                  onClick={() => updateFeedbackStatus(fb.id, 'visto')}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FeedbackManagement;
