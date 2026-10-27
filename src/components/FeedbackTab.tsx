import React, { useState } from 'react';
import { MessageSquarePlus, Lightbulb, Bug, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FeedbackType } from '../types';
import { FeedbackStatusBadge, FeedbackTypeBadge, formatFeedbackDate } from './FeedbackBadges';

export const FeedbackTab: React.FC = () => {
  const { currentUser, feedbacks, addFeedback } = useApp();
  const [type, setType] = useState<FeedbackType>('nova_funcionalidade');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const myFeedbacks = feedbacks.filter((f) => f.authorId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    addFeedback({ type, title, description });
    setTitle('');
    setDescription('');
  };

  const typeOptions: { value: FeedbackType; label: string; hint: string; Icon: typeof Lightbulb }[] = [
    { value: 'nova_funcionalidade', label: 'Nova funcionalidade', hint: 'Uma ideia ou melhoria', Icon: Lightbulb },
    { value: 'erro', label: 'Erro / Bug', hint: 'Algo não funciona como devia', Icon: Bug }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-indigo-600" />
          Feedback
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Sugere uma nova funcionalidade ou reporta um erro. A administração recebe o teu pedido.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-1.5">Tipo de feedback *</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {typeOptions.map(({ value, label, hint, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  type === value
                    ? value === 'erro'
                      ? 'border-red-400 bg-red-50 ring-2 ring-red-200'
                      : 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${value === 'erro' ? 'text-red-600' : 'text-indigo-600'}`} />
                <span>
                  <span className="block text-xs font-extrabold text-slate-900">{label}</span>
                  <span className="block text-[11px] text-slate-500">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Título *</label>
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            placeholder={type === 'erro' ? 'Ex: O calendário não abre no telemóvel' : 'Ex: Exportar planos de treino em PDF'}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Detalhes *</label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            placeholder={
              type === 'erro'
                ? 'O que aconteceu? Em que página? Que passos levam ao erro?'
                : 'Descreve a ideia e como te ajudaria no dia a dia.'
            }
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Enviar feedback
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900">Os meus pedidos ({myFeedbacks.length})</h3>
        {myFeedbacks.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 font-medium">
            Ainda não enviaste nenhum feedback.
          </div>
        ) : (
          myFeedbacks.map((fb) => (
            <div key={fb.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <FeedbackTypeBadge type={fb.type} />
                <FeedbackStatusBadge status={fb.status} />
                <span className="text-[11px] text-slate-400 ml-auto">{formatFeedbackDate(fb.createdAt)}</span>
              </div>
              <p className="font-extrabold text-sm text-slate-900">{fb.title}</p>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{fb.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackTab;
