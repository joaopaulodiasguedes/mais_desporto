import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  X,
  Search,
  Check,
  AlertCircle,
  Users
} from 'lucide-react';
import { UserProfile } from '../types';

interface PendingApprovalsManagementProps {
  onClose?: () => void;
}

export const PendingApprovalsManagement: React.FC<PendingApprovalsManagementProps> = ({ onClose }) => {
  const {
    availableUsers,
    approveUser,
    rejectUser,
    currentUser,
    pendingApprovalsCount
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'pendentes' | 'aprovados' | 'rejeitados'>('pendentes');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingUser, setRejectingUser] = useState<UserProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingUser) return;
    rejectUser(rejectingUser.id, rejectReason || 'Inscrição recusada pela equipa técnica.');
    setRejectingUser(null);
    setRejectReason('');
  };

  const filteredUsers = availableUsers.filter((u) => {
    if (activeSubTab === 'pendentes' && u.status !== 'pendente_aprovacao') return false;
    if (activeSubTab === 'aprovados' && u.status !== 'aprovado') return false;
    if (activeSubTab === 'rejeitados' && u.status !== 'rejeitado') return false;

    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.requestedCategory && u.requestedCategory.toLowerCase().includes(q))
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'treinador':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atleta':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'encarregado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900">
                Aprovação de Perfis e Novos Registos
              </h3>
              {pendingApprovalsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 animate-pulse">
                  {pendingApprovalsCount} pendente{pendingApprovalsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Área reservada aos Treinadores para validar, filiar e aprovar novos atletas e membros no clube.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Subtabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveSubTab('pendentes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'pendentes'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Aguardar Aprovação</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 font-bold">
                {availableUsers.filter(u => u.status === 'pendente_aprovacao').length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('aprovados')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'aprovados'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprovados</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/10 font-bold">
                {availableUsers.filter(u => u.status === 'aprovado').length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('rejeitados')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'rejeitados'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Recusados</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/10 font-bold">
                {availableUsers.filter(u => u.status === 'rejeitado').length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
        </div>

        {/* Body - List of Users */}
        <div className="p-4 sm:p-6 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">
                Nenhum perfil encontrado nesta secção
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {activeSubTab === 'pendentes'
                  ? 'Não existem novos registos a aguardar validação de momento.'
                  : 'Nenhum registo corresponde aos filtros aplicados.'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* User Info Left */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                  />

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                        {user.name}
                      </h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                      {user.requestedCategory && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                          {user.requestedCategory}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </span>
                      {user.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone}</span>
                        </span>
                      )}
                      {user.birthDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.birthDate}</span>
                        </span>
                      )}
                    </div>

                    {user.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1 italic">
                        &ldquo;{user.notes}&rdquo;
                      </p>
                    )}

                    {user.status === 'aprovado' && user.approvedByCoachName && (
                      <p className="text-[11px] text-emerald-700 font-medium pt-0.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Aprovado por {user.approvedByCoachName} em {user.approvedAt || 'data recente'}
                      </p>
                    )}

                    {user.status === 'rejeitado' && user.rejectionReason && (
                      <p className="text-[11px] text-red-600 font-medium pt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Motivo: {user.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Right */}
                <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                  {user.status === 'pendente_aprovacao' && (
                    <>
                      <button
                        onClick={() => approveUser(user.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovar Perfil</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectingUser(user);
                          setRejectReason('');
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Recusar</span>
                      </button>
                    </>
                  )}

                  {user.status === 'rejeitado' && (
                    <button
                      onClick={() => approveUser(user.id)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Reconsiderar / Aprovar</span>
                    </button>
                  )}

                  {user.status === 'aprovado' && user.id !== currentUser.id && (
                    <button
                      onClick={() => {
                        setRejectingUser(user);
                        setRejectReason('');
                      }}
                      className="px-3 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Revogar Acesso
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          ℹ️ Ao aprovar um atleta, a sua ficha é automaticamente sincronizada na base de dados do clube.
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Recusar Registo de {rejectingUser.name}
              </h4>
              <button
                onClick={() => setRejectingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <p className="text-xs text-slate-600">
                Indique o motivo pelo qual este registo não foi validado (esta mensagem será exibida ao utilizador ao tentar aceder):
              </p>

              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ex: Vagas esgotadas para o escalão pretendido / Contacte a secretaria para entrega de documentos..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 text-xs font-medium"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Confirmar Recusa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
