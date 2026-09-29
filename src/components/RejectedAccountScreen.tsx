import React from 'react';
import { useApp } from '../context/AppContext';
import {
  XCircle,
  LogOut,
  Mail,
  Phone,
  HelpCircle,
  ShieldX
} from 'lucide-react';

export const RejectedAccountScreen: React.FC = () => {
  const { currentUser, logout, clubInfo } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-red-500 selection:text-white">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 mb-1">
            <ShieldX className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Registo Não Aprovado
          </h1>
          <p className="text-xs text-slate-400">
            {clubInfo.name}
          </p>
        </div>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-200 space-y-2">
            <p className="font-bold text-red-300">
              Informação da Equipa Técnica:
            </p>
            <p className="leading-relaxed">
              {currentUser.rejectionReason || 'A sua candidatura de registo não foi validada pelos treinadores do clube.'}
            </p>
          </div>

          <div className="text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">
              Precisa de ajuda ou esclarecimentos?
            </p>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{clubInfo.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{clubInfo.phone}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Voltar ao Início de Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
