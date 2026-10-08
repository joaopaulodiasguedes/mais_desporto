import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  CheckCircle2,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export const PendingApprovalScreen: React.FC = () => {
  const {
    currentUser,
    logout,
    approveUser,
    switchRole,
    clubInfo,
    showToast
  } = useApp();

  const handleSimulateCoachApproval = () => {
    approveUser(currentUser.id);
    showToast('Conta aprovada com sucesso no modo de demonstração!', 'success');
  };

  const handleSwitchToCoach = () => {
    switchRole('treinador');
    showToast('Sessão alterada para o Treinador Carlos Silva.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 mb-1">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {clubInfo.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Registo Efetuado &bull; Aguardar Validação
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Status Badge */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-amber-300">
                Perfil Pendente de Aprovação
              </h2>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                Olá, <strong>{currentUser.name}</strong>! O teu registo foi recebido pelo clube e encontra-se na fila de espera para validação e autorização por um dos nossos treinadores oficiais.
              </p>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 space-y-3">
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Progresso da Candidatura
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">1. Registo de Perfil Submetido</p>
                  <p className="text-[11px] text-slate-400">
                    Dados registados com sucesso em {currentUser.registeredAt || 'hoje'}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 animate-pulse">
                  2
                </div>
                <div className="text-xs">
                  <p className="font-bold text-amber-400">2. Revisão pela Equipa Técnica (Atual)</p>
                  <p className="text-[11px] text-slate-400">
                    O treinador está a verificar a categoria, escalão e contactos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-50">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-300">3. Acesso Completo à Aplicação</p>
                  <p className="text-[11px] text-slate-500">
                    Planos de treino, convocatórias e resultados libertados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Applicant Details Summary */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Resumo dos Teus Dados Registados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-400">Nome:</span>
                <span className="font-semibold text-white">{currentUser.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-white truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-400">Perfil:</span>
                <span className="font-semibold text-amber-400 capitalize">{currentUser.role}</span>
              </div>
              {currentUser.requestedCategory && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Award className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-400">Escalão:</span>
                  <span className="font-semibold text-white">{currentUser.requestedCategory}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-400">Telefone:</span>
                <span className="font-semibold text-white">{currentUser.phone}</span>
              </div>
              {currentUser.notes && (
                <div className="sm:col-span-2 flex items-start gap-2 text-slate-300 pt-1">
                  <span className="text-slate-400 shrink-0">Notas:</span>
                  <span className="text-slate-300 italic">{currentUser.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Demo Testing Shortcuts
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Painel de Testes & Demonstração</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Como avaliador, pode testar o fluxo de aprovação de duas formas:
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSwitchToCoach}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar como Treinador (Aprovar no Painel)</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateCoachApproval}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprovar Imediatamente</span>
              </button>
            </div>
          </div>
 */}
          {/* Logout / Switch Account */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Estado</span>
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminar Sessão / Mudar Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
