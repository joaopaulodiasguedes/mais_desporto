import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Users,
  ShieldCheck,
  ShieldAlert,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  LogOut,
  Sparkles,
  Search,
  Check,
  Award
} from 'lucide-react';
import { UserProfile, UserRole, Athlete } from '../types';

interface ProfileSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser?: (user: UserProfile) => void;
}

export const ProfileSwitcherModal: React.FC<ProfileSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSelectUser
}) => {
  const {
    availableUsers,
    currentUser,
    switchUserAccount,
    athletes,
    coaches,
    logout,
    clubInfo
  } = useApp();

  const getUserAvatar = (user: UserProfile) => {
    if (user.role === 'treinador' || user.coachProfileId) {
      const c = coaches?.find(coach =>
        coach.id === user.coachProfileId ||
        (coach.email && user.email && coach.email.toLowerCase() === user.email.toLowerCase()) ||
        (coach.name && user.name && coach.name.toLowerCase() === user.name.toLowerCase())
      );
      if (c?.photoUrl && c.photoUrl.trim() !== '') return c.photoUrl;
    }
    if (user.role === 'atleta' || user.athleteProfileId) {
      const a = athletes?.find(ath =>
        ath.id === user.athleteProfileId ||
        (ath.email && user.email && ath.email.toLowerCase() === user.email.toLowerCase()) ||
        (ath.name && user.name && ath.name.toLowerCase() === user.name.toLowerCase())
      );
      if (a?.photoUrl && a.photoUrl.trim() !== '') return a.photoUrl;
    }
    return user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
  };

  const [filterRole, setFilterRole] = useState<'todos' | UserRole>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Helper to find athletes linked to a guardian profile
  const getLinkedAthletesForGuardian = (user: UserProfile): Athlete[] => {
    if (user.role !== 'encarregado') return [];
    
    // Check by relatedAthleteIds
    if (user.relatedAthleteIds && user.relatedAthleteIds.length > 0) {
      const found = athletes.filter(a => user.relatedAthleteIds?.includes(a.id));
      if (found.length > 0) return found;
    }

    // Check by guardianId, email or name matching
    return athletes.filter(
      a =>
        a.guardianId === user.id ||
        (a.guardianEmail && a.guardianEmail.toLowerCase() === user.email.toLowerCase()) ||
        (a.guardianName && user.name.toLowerCase().includes(a.guardianName.toLowerCase()))
    );
  };

  // Helper to find the guardian of an athlete profile
  const getGuardianForAthlete = (user: UserProfile) => {
    if (user.role !== 'atleta') return null;
    
    // Find matching athlete record in athletes collection
    const ath = athletes.find(
      a => a.id === user.athleteProfileId || a.email.toLowerCase() === user.email.toLowerCase()
    );

    if (!ath) return null;

    // Find parent user profile if exists
    const parentUser = availableUsers.find(
      u =>
        u.role === 'encarregado' &&
        (u.id === ath.guardianId ||
          (u.relatedAthleteIds && u.relatedAthleteIds.includes(ath.id)) ||
          u.email.toLowerCase() === ath.guardianEmail?.toLowerCase())
    );

    return {
      athlete: ath,
      guardianName: ath.guardianName || parentUser?.name || 'Não inserido',
      guardianPhone: ath.guardianPhone || parentUser?.phone || '',
      guardianEmail: ath.guardianEmail || parentUser?.email || '',
      parentUser
    };
  };

  // Filter users based on role and search query
  const filteredUsers = availableUsers.filter(u => {
    if (filterRole !== 'todos' && u.role !== filterRole) {
      return false;
    }
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = u.name.toLowerCase().includes(query);
    const matchesEmail = u.email.toLowerCase().includes(query);
    
    // Check if matching linked athlete
    if (u.role === 'encarregado') {
      const linked = getLinkedAthletesForGuardian(u);
      const matchesChild = linked.some(a => a.name.toLowerCase().includes(query));
      if (matchesChild) return true;
    }

    return matchesName || matchesEmail;
  });

  const handleSwitch = (user: UserProfile) => {
    if (onSelectUser) {
      onSelectUser(user);
    } else {
      switchUserAccount(user);
    }
    onClose();
  };

  const getRoleBadge = (user: UserProfile) => {
    if (user.role === 'treinador') {
      if (user.isAdmin || user.email.toLowerCase().includes('guedes')) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <ShieldAlert className="w-3 h-3 text-amber-700" />
            Treinador Principal & Admin
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
          <ShieldCheck className="w-3 h-3 text-blue-700" />
          Treinador
        </span>
      );
    }

    if (user.role === 'encarregado') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
          <HeartHandshake className="w-3 h-3 text-purple-700" />
          Encarregado de Educação
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200">
        <Award className="w-3 h-3 text-indigo-700" />
        Atleta
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Alternar Perfil de Utilizador
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30">
                  Demonstração 100% Funcional
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Explore a aplicação como Encarregado de Educação, Atleta ou Treinador e veja os dados vinculados em tempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500">Sessão Ativa:</span>
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-300"
            />
            <span className="text-xs font-extrabold text-slate-900">
              {currentUser.name}
            </span>
            {getRoleBadge(currentUser)}
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 self-end sm:self-auto hover:underline cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminar Sessão / Ir para Início de Sessão</span>
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setFilterRole('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterRole === 'todos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({availableUsers.length})
            </button>
            <button
              onClick={() => setFilterRole('encarregado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterRole === 'encarregado'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Encarregados ({availableUsers.filter(u => u.role === 'encarregado').length})</span>
            </button>
            <button
              onClick={() => setFilterRole('atleta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterRole === 'atleta'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Atletas ({availableUsers.filter(u => u.role === 'atleta').length})</span>
            </button>
            <button
              onClick={() => setFilterRole('treinador')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterRole === 'treinador'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Treinadores ({availableUsers.filter(u => u.role === 'treinador').length})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome ou educando..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Users Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
              Nenhum utilizador encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map(user => {
                const isActive = currentUser.id === user.id;
                const linkedAthletes = getLinkedAthletesForGuardian(user);
                const athleteGuardianInfo = getGuardianForAthlete(user);

                return (
                  <div
                    key={user.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between gap-4 bg-white shadow-xs relative ${
                      isActive
                        ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/10'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Active Ribbon */}
                    {isActive && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Sessão Ativa
                      </div>
                    )}

                    {/* User Header */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5 pr-16">
                        <img
                          src={getUserAvatar(user)}
                          alt={user.name}
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                              {user.name}
                            </h3>
                          </div>
                          <div className="mb-2">
                            {getRoleBadge(user)}
                          </div>
                          <div className="space-y-0.5 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* GUARDIAN SPECIFIC INFO: SHOW LINKED ATHLETES */}
                      {user.role === 'encarregado' && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-purple-950 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-purple-600" />
                              Educando(s) a Cargo:
                            </span>
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              {linkedAthletes.length > 0
                                ? `${linkedAthletes.length} Atleta(s)`
                                : '⚠️ Não inserido'}
                            </span>
                          </div>

                          {linkedAthletes.length > 0 ? (
                            <div className="space-y-1.5">
                              {linkedAthletes.map(ath => (
                                <div
                                  key={ath.id}
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-purple-50/70 border border-purple-100"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={ath.photoUrl}
                                      alt={ath.name}
                                      className="w-7 h-7 rounded-lg object-cover border border-purple-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold text-purple-950 truncate">
                                        {ath.name}
                                      </p>
                                      <p className="text-[10px] text-purple-700 font-medium">
                                        {ath.category} • {ath.federationNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-purple-800 border border-purple-200 shrink-0">
                                    {ath.medicalStatus === 'valido' ? '✓ Exame Válido' : 'Exame a Expirar'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                              <p className="font-semibold">Nenhum atleta associado atualmente.</p>
                              <p className="text-[11px] text-amber-700 mt-0.5">
                                Pode associar ou registar um educando na "Ficha do Atleta a Cargo".
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ATHLETE SPECIFIC INFO: SHOW GUARDIAN */}
                      {user.role === 'atleta' && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                              <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
                              Encarregado de Educação:
                            </span>
                            {athleteGuardianInfo?.athlete.category && (
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                {athleteGuardianInfo.athlete.category}
                              </span>
                            )}
                          </div>

                          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-indigo-950">
                                {athleteGuardianInfo?.guardianName || 'Não inserido'}
                              </span>
                              {athleteGuardianInfo?.athlete.federationNumber && (
                                <span className="text-[10px] text-indigo-600 font-bold">
                                  {athleteGuardianInfo.athlete.federationNumber}
                                </span>
                              )}
                            </div>
                            {athleteGuardianInfo?.guardianPhone && (
                              <div className="flex items-center gap-1.5 text-[11px] text-indigo-800 font-medium">
                                <Phone className="w-3 h-3 text-indigo-500" />
                                <span>{athleteGuardianInfo.guardianPhone}</span>
                              </div>
                            )}
                            {athleteGuardianInfo?.guardianEmail && (
                              <div className="flex items-center gap-1.5 text-[11px] text-indigo-800 font-medium">
                                <Mail className="w-3 h-3 text-indigo-500" />
                                <span className="truncate">{athleteGuardianInfo.guardianEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* COACH SPECIFIC INFO */}
                      {user.role === 'treinador' && (
                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              Responsabilidades Técnicas:
                            </span>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              {user.isAdmin ? 'Acesso Total' : 'Equipa Técnica'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            {user.isAdmin
                              ? 'Coordenação geral, planeamento de treinos, gestão de atletas, autorizações e validação de aprovações.'
                              : 'Supervisão técnica de escalões e acompanhamento de treinos diários.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Switch Button */}
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={() => handleSwitch(user)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                        isActive
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : user.role === 'encarregado'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white active:scale-98'
                          : user.role === 'atleta'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98'
                          : 'bg-slate-900 hover:bg-slate-800 text-amber-400 active:scale-98'
                      }`}
                    >
                      {isActive ? (
                        <span>Perfil Atual em Utilização</span>
                      ) : (
                        <>
                          <span>Mudar para este Perfil ({user.name.split(' ')[0]})</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            A alternância de perfil permite verificar permissões, autorizações parentais, dados médicos e bolsa de boleias.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer self-end sm:self-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
