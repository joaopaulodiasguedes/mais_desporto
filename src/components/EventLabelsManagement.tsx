import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, RotateCcw, Check, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { EventLabel } from '../types';
import {
  COLOR_OPTIONS,
  ICON_OPTIONS,
  EVENT_LABEL_HINTS,
  getColorOption,
  getIconComponent,
  isBuiltInLabel,
  LABEL_CATEGORIES,
  getLabelCategory
} from '../utils/eventLabels';

const LabelPreview: React.FC<{ label: EventLabel }> = ({ label }) => {
  const Icon = getIconComponent(label.icon);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[11px] uppercase shadow-2xs ${getColorOption(label.color).badge}`}
    >
      <Icon className="w-3 h-3" /> {label.name || '—'}
    </span>
  );
};

const LabelRow: React.FC<{
  label: EventLabel;
  index: number;
  total: number;
  onDelete?: (label: EventLabel) => void;
}> = ({ label, index, total, onDelete }) => {
  const { updateEventLabel, moveEventLabel } = useApp();
  const [name, setName] = useState(label.name);

  useEffect(() => {
    setName(label.name);
  }, [label.name]);

  const commitName = () => {
    const clean = name.trim();
    if (!clean) {
      setName(label.name);
      return;
    }
    if (clean !== label.name) updateEventLabel(label.id, { name: clean });
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col shrink-0">
          <button
            type="button"
            onClick={() => moveEventLabel(label.id, -1)}
            disabled={index === 0}
            title="Mover para cima"
            className="p-0.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => moveEventLabel(label.id, 1)}
            disabled={index === total - 1}
            title="Mover para baixo"
            className="p-0.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0 space-y-0.5">
          <input
            type="text"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
            placeholder="Nome da etiqueta"
          />
          <p className="text-[11px] text-slate-400 font-medium">{EVENT_LABEL_HINTS[label.id] || 'Etiqueta personalizada (aplica-se aos eventos)'}</p>
        </div>

        <div className="hidden sm:block shrink-0">
          <LabelPreview label={label} />
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(label)}
            title="Eliminar etiqueta"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="sm:hidden">
        <LabelPreview label={label} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Ícone</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(ICON_OPTIONS).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateEventLabel(label.id, { icon: key })}
                title={key}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                  label.icon === key
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Cor</span>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => updateEventLabel(label.id, { color: c.key })}
                title={c.label}
                className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${c.swatch} ${
                  label.color === c.key ? 'ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-110'
                }`}
              >
                {label.color === c.key && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventLabelsManagement: React.FC = () => {
  const { eventLabels, resetEventLabels, addEventLabel, deleteEventLabel } = useApp();
  const [labelToDelete, setLabelToDelete] = useState<EventLabel | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">Etiquetas da Gestão do Dia</h3>
          <p className="text-xs text-slate-500 font-medium">
            Define o nome, o ícone e a cor de cada etiqueta e a sequência pela qual aparecem (de cima para baixo).
            As predefinidas estão ligadas aos tipos de evento e não se eliminam; as que criares podem ser aplicadas aos eventos.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetEventLabels}
            title="Repõe as predefinidas e elimina as etiquetas criadas"
            className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Repor predefinições
          </button>
        </div>
      </div>

      {LABEL_CATEGORIES.map((cat) => {
        const group = eventLabels.filter((l) => getLabelCategory(l.id) === cat.key);
        return (
          <section key={cat.key} className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{cat.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{cat.hint}</p>
              </div>
              <button
                type="button"
                onClick={() => addEventLabel({ name: 'Nova etiqueta', icon: 'Flag', color: 'blue', category: cat.key })}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Nova etiqueta
              </button>
            </div>
            {group.map((label, idx) => (
              <LabelRow
                key={label.id}
                label={label}
                index={idx}
                total={group.length}
                onDelete={isBuiltInLabel(label.id) ? undefined : setLabelToDelete}
              />
            ))}
          </section>
        );
      })}

      <ConfirmDeleteModal
        isOpen={!!labelToDelete}
        onClose={() => setLabelToDelete(null)}
        onConfirm={() => {
          if (labelToDelete) deleteEventLabel(labelToDelete.id);
          setLabelToDelete(null);
        }}
        title="Eliminar etiqueta"
        description="A etiqueta deixa de aparecer nos eventos onde estava aplicada. Esta ação não pode ser revertida."
        itemTitle={labelToDelete?.name}
      />
    </div>
  );
};

export default EventLabelsManagement;
