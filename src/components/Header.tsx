import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  User,
  Bell,
  Sliders,
  Smartphone,
  Monitor,
  Sparkles,
  RefreshCw,
  Menu,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  LogOut,
  Clock,
  Users,
  Database
} from 'lucide-react';

interface HeaderProps {
  onOpenPermissions: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPermissions,
  onToggleMobileSidebar
}) => {
  const {
    currentUser,
    switchRole,
    switchUserAccount,
    availableUsers,
    coaches,
    athletes,
    logout,
    unreadCount,
    pendingApprovalsCount,
    setIsApprovalsModalOpen,
    setActiveTab,
    clubInfo,
    isCurrentUserAdmin,
    supabaseStatus,
    setIsSupabaseModalOpen,
    syncWithSupabase,
    showToast
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Resolver a foto de perfil real diretamente a partir da respetiva ficha (Treinador, Atleta ou Encarregado)
  const currentPhoto = React.useMemo(() => {
    // 1. Treinador
    if (currentUser.role === 'treinador' || currentUser.coachProfileId) {
      const coach = coaches.find(
        (c) =>
          c.id === currentUser.coachProfileId ||
          (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (c.name && currentUser.name && c.name.toLowerCase() === currentUser.name.toLowerCase())
      );
      if (coach?.photoUrl && coach.photoUrl.trim() !== '') {
        return coach.photoUrl;
      }
    }

    // 2. Atleta
    if (currentUser.role === 'atleta' || currentUser.athleteProfileId) {
      const athlete = athletes.find(
        (a) =>
          a.id === currentUser.athleteProfileId ||
          (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (a.name && currentUser.name && a.name.toLowerCase() === currentUser.name.toLowerCase())
      );
      if (athlete?.photoUrl && athlete.photoUrl.trim() !== '') {
        return athlete.photoUrl;
      }
    }

    // 3. Encarregado de Educação
    if (currentUser.role === 'encarregado') {
      const guardianUser = availableUsers.find(
        (u) =>
          u.id === currentUser.id ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (guardianUser?.avatarUrl && guardianUser.avatarUrl.trim() !== '') {
        return guardianUser.avatarUrl;
      }
    }

    // 4. Utilizador na lista de perfis
    const userInList = availableUsers.find(
      (u) =>
        u.id === currentUser.id ||
        (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
    );
    if (userInList?.avatarUrl && userInList.avatarUrl.trim() !== '') {
      return userInList.avatarUrl;
    }

    // 5. Fallback para currentUser.avatarUrl ou padrão
    return currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
  }, [currentUser, coaches, athletes, availableUsers]);

  // Reset img error if photo changes
  React.useEffect(() => {
    setImgError(false);
  }, [currentPhoto]);

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
      {/* Club Title & Mobile Drawer Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 sm:p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden shrink-0"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0 truncate">
          <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight truncate">
            {clubInfo.name}
          </h1>
          <p className="text-xs text-slate-500 hidden md:block truncate">
            Dashboard Central de Gestão Desportiva
          </p>
        </div>
      </div>

      {/* Right Action Area */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
        {/* Supabase Status / Sync Button */}
        <button
          onClick={() => {
            if (supabaseStatus === 'connected') {
              syncWithSupabase();
              showToast('A atualizar dados do Supabase...', 'info');
            } else {
              setIsSupabaseModalOpen(true);
            }
          }}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
            supabaseStatus === 'connected'
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              : supabaseStatus === 'connecting'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
          }`}
          title={
            supabaseStatus === 'connected'
              ? 'Supabase Conectado — Clique para atualizar dados'
              : 'Configurar ou Ligar Supabase'
          }
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">
            {supabaseStatus === 'connected' ? 'Supabase' : supabaseStatus === 'connecting' ? 'A ligar...' : 'Ligar Supabase'}
          </span>
          {supabaseStatus === 'connected' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
          {supabaseStatus === 'connecting' && (
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
          )}
        </button>

        {/* Coach Pending Registrations Button */}
        {currentUser.role === 'treinador' && (
          <button
            id="coach-approvals-header-btn"
            onClick={() => setIsApprovalsModalOpen(true)}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
              pendingApprovalsCount > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
            title="Validar novos registos de utilizadores"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">Aprovações</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications Icon Button */}
        <button
          id="header-notifications-btn"
          onClick={() => setActiveTab('notificacoes')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 flex items-center justify-center relative bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
          title="Notificações e Avisos"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          {unreadCount > 0 && (
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></div>
          )}
        </button>

        {/* User Account / Logout Avatar Button */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer ring-1 ring-slate-200 hover:ring-slate-300"
            title="Conta de utilizador e Perfil"
          >
            <span className="text-xs font-bold text-slate-700 hidden sm:inline max-w-[120px] truncate">
              {currentUser.name.split(' ')[0]}
            </span>
            <img
              src={imgError ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' : currentPhoto}
              alt={currentUser.name}
              onError={() => setImgError(true)}
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={imgError ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' : currentPhoto}
                      alt={currentUser.name}
                      onError={() => setImgError(true)}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-xs shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-900 text-sm truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                      currentUser.role === 'treinador'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : currentUser.role === 'atleta'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {currentUser.role}
                    </span>
                    {currentUser.status === 'aprovado' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Aprovado
                      </span>
                    )}
                    {isCurrentUserAdmin && (
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-600" /> Administrador
                      </span>
                    )}
                  </div>
                </div>

                {/* Alternar Perfil Rápido */}
                <div className="p-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Alternar Role / Perfil
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        switchRole('treinador');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.role === 'treinador'
                          ? 'bg-blue-50 text-blue-800'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>👔 Treinador</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Treinadores</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        switchRole('atleta');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.role === 'atleta'
                          ? 'bg-indigo-50 text-indigo-800'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>🏊 Atleta</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Atletas</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        switchRole('encarregado');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.role === 'encarregado'
                          ? 'bg-purple-50 text-purple-800'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>👨‍👩‍👦 Encarregado</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Enc. Educação</span>
                    </button>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Terminar Sessão</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
