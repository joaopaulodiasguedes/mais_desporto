import React, { useState, useMemo } from 'react';
import { useApp, isNotificationVisibleForUser } from '../context/AppContext';
import {
  Bell,
  Plus,
  CheckCheck,
  Megaphone,
  AlertTriangle,
  Calendar,
  CreditCard,
  Info,
  Trash2,
  X,
  Check,
  ChevronRight,
  Send,
  Users,
  User,
  UserCheck,
  ShieldCheck,
  Search,
  Lock,
  Sparkles
} from 'lucide-react';
import { NotificationItem } from '../types';

export const NotificationsTab: React.FC = () => {
  const {
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    unreadCount,
    hasPermission,
    currentUser,
    athletes,
    setActiveTab,
    showToast
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<string>('todas');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationItem['type']>('comunicado');
  const [targetAudience, setTargetAudience] = useState<'todos' | 'atletas' | 'atleta_especifico' | 'pais' | 'treinadores'>('todos');
  const [targetCategory, setTargetCategory] = useState('');
  const [targetAthleteId, setTargetAthleteId] = useState('');
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('');
  const [actionTab, setActionTab] = useState<string>('');

  const canBroadcast = hasPermission('canBroadcastNotifications') || currentUser.role === 'treinador';

  const athleteMap = useMemo(() => {
    const map = new Map<string, (typeof athletes)[0]>();
    athletes.forEach(a => map.set(a.id, a));
    return map;
  }, [athletes]);

  // Perfil de atleta só pode ver as suas notificações
  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => isNotificationVisibleForUser(n, currentUser, athletes));
  }, [notifications, currentUser, athletes]);

  const individualNotifsCount = useMemo(() => {
    return visibleNotifications.filter(n => !!n.targetAthleteId).length;
  }, [visibleNotifications]);

  const filteredNotifs = visibleNotifications.filter((n) => {
    if (selectedFilter === 'nao_lidas') return !n.isRead;
    if (selectedFilter === 'individuais') return !!n.targetAthleteId;
    if (selectedFilter === 'convocatorias') return n.type === 'convocatoria';
    if (selectedFilter === 'treinos') return n.type === 'aviso_treino';
    if (selectedFilter === 'urgentes') return n.type === 'urgente';
    return true;
  });

  const selectedAthleteObj = useMemo(() => {
    if (!targetAthleteId) return null;
    return athleteMap.get(targetAthleteId) || null;
  }, [targetAthleteId, athleteMap]);

  const filteredAthletesForSelect = useMemo(() => {
    if (!athleteSearchQuery.trim()) return athletes;
    const q = athleteSearchQuery.toLowerCase();
    return athletes.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.federationNumber.toLowerCase().includes(q)
    );
  }, [athletes, athleteSearchQuery]);

  const handleOpenAddModal = (mode: 'geral' | 'atleta' = 'geral', preselectedAthleteId: string = '') => {
    if (mode === 'atleta') {
      setTargetAudience('atleta_especifico');
      setTargetAthleteId(preselectedAthleteId || (athletes[0]?.id || ''));
      setType('comunicado');
    } else {
      setTargetAudience('todos');
      setTargetAthleteId('');
      setType('comunicado');
    }
    setTitle('');
    setMessage('');
    setActionTab('');
    setTargetCategory('');
    setAthleteSearchQuery('');
    setIsAddModalOpen(true);
  };

  const applyTemplate = (preset: 'convocatoria' | 'feedback' | 'exame' | 'treino') => {
    const athleteName = selectedAthleteObj?.name || 'Atleta';
    if (preset === 'convocatoria') {
      setTitle(`Convocatória Oficial: ${athleteName}`);
      setType('convocatoria');
      setMessage(`Foste convocado(a) para a próxima prova oficial. Por favor consulta os detalhes no calendário e confirma a tua presença com a equipa técnica.`);
      setActionTab('calendario');
    } else if (preset === 'feedback') {
      setTitle(`Avaliação & Feedback Técnico: ${athleteName}`);
      setType('comunicado');
      setMessage(`Excelente trabalho e dedicação nos treinos desta semana. Continua com o foco nas correções técnicas indicadas durante as sessões.`);
      setActionTab('');
    } else if (preset === 'exame') {
      setTitle(`Aviso de Exame Médico Desportivo: ${athleteName}`);
      setType('urgente');
      setMessage(`Informamos que o teu exame médico desportivo está pendente ou próximo da data de validade. Por favor entrega a ficha atualizada na secretaria com urgência.`);
      setActionTab('');
    } else if (preset === 'treino') {
      setTitle(`Instruções de Treino / Horário: ${athleteName}`);
      setType('aviso_treino');
      setMessage(`Aviso individual relativo aos teus objetivos de treino específicos e horário de acompanhamento na próxima sessão.`);
      setActionTab('');
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (targetAudience === 'atleta_especifico' && !targetAthleteId) {
      showToast('Por favor selecione um atleta destinatário.', 'error');
      return;
    }

    const targetAth = targetAthleteId ? athleteMap.get(targetAthleteId) : null;

    addNotification({
      title: title.trim(),
      message: message.trim(),
      type,
      targetAudience: targetAudience === 'atleta_especifico' ? 'atletas' : targetAudience,
      targetCategory: targetCategory || undefined,
      targetAthleteId: targetAthleteId || undefined,
      targetAthleteName: targetAth?.name || undefined,
      authorName: currentUser.name || 'Direção / Treinador',
      actionTab: actionTab || undefined,
      actionLabel:
        actionTab === 'calendario'
          ? 'Ver no Calendário'
          : actionTab === 'pais'
          ? 'Abrir Área dos Pais'
          : actionTab === 'encarregados'
          ? 'Ver Encarregados de Educação'
          : actionTab === 'resultados'
          ? 'Ver Resultados'
          : actionTab === 'atletas'
          ? 'Ver Quadro de Atletas'
          : undefined
    });

    setIsAddModalOpen(false);
    setTitle('');
    setMessage('');
    setTargetAthleteId('');
    setTargetCategory('');
    setAthleteSearchQuery('');
  };

  const getNotifIcon = (t: NotificationItem['type']) => {
    switch (t) {
      case 'convocatoria':
        return <Calendar className="w-5 h-5 text-orange-600" />;
      case 'aviso_treino':
        return <Megaphone className="w-5 h-5 text-blue-600" />;
      case 'urgente':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'mensalidade':
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getNotifBg = (t: NotificationItem['type'], isRead: boolean, isIndividual: boolean) => {
    if (isIndividual && !isRead) {
      return 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300/60 shadow-xs';
    }
    if (isRead) return 'bg-white border-slate-200';
    switch (t) {
      case 'urgente':
        return 'bg-red-50/50 border-red-200 ring-1 ring-red-200';
      case 'convocatoria':
        return 'bg-orange-50/40 border-orange-200';
      case 'aviso_treino':
        return 'bg-blue-50/40 border-blue-200';
      default:
        return 'bg-emerald-50/30 border-emerald-200';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Centro de Notificações & Alertas
          </h2>
          <p className="text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} comunicados por ler` : 'Todas as mensagens lidas'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todas como lidas</span>
            </button>
          )}

          {canBroadcast && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAddModal('atleta')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                title="Emitir comunicado direcionado a um atleta em específico"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Para Atleta Específico</span>
              </button>

              <button
                onClick={() => handleOpenAddModal('geral')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Novo Comunicado Geral</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role notice for Athlete */}
      {currentUser.role === 'atleta' && (
        <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Área do Atleta:</strong> A visualizar exclusivamente as tuas notificações personalizadas, comunicados individuais do treinador e avisos do teu escalão ({currentUser.requestedCategory || 'Atleta'}).
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedFilter('todas')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedFilter === 'todas'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todas ({visibleNotifications.length})
        </button>
        <button
          onClick={() => setSelectedFilter('nao_lidas')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedFilter === 'nao_lidas'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Por Ler ({unreadCount})
        </button>
        {individualNotifsCount > 0 && (
          <button
            onClick={() => setSelectedFilter('individuais')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              selectedFilter === 'individuais'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Individuais / Por Atleta ({individualNotifsCount})</span>
          </button>
        )}
        <button
          onClick={() => setSelectedFilter('convocatorias')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedFilter === 'convocatorias'
              ? 'bg-orange-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Convocatórias
        </button>
        <button
          onClick={() => setSelectedFilter('treinos')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedFilter === 'treinos'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Avisos de Treino
        </button>
        <button
          onClick={() => setSelectedFilter('urgentes')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedFilter === 'urgentes'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Urgentes
        </button>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {filteredNotifs.map((notif) => {
          const isIndividual = !!notif.targetAthleteId;
          const targetAthlete = notif.targetAthleteId ? athleteMap.get(notif.targetAthleteId) : null;
          const targetDisplayName = notif.targetAthleteName || targetAthlete?.name;

          return (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative shadow-2xs hover:shadow-md ${getNotifBg(
                notif.type,
                notif.isRead,
                isIndividual
              )}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-white shadow-xs border border-slate-100 shrink-0">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {notif.title}
                      </h3>
                      {isIndividual && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold tracking-wide uppercase border border-blue-200">
                          <User className="w-2.5 h-2.5" />
                          Individual
                        </span>
                      )}
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {notif.date}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-500 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Emitido por: <strong className="text-slate-700">{notif.authorName}</strong>
                      </span>

                      {isIndividual ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-900 rounded-lg text-[11px] font-bold border border-blue-200/80 shadow-2xs">
                          <User className="w-3 h-3 text-blue-600" />
                          <span>
                            Para Atleta: <strong className="text-blue-950 font-extrabold">{targetDisplayName || 'Atleta'}</strong>
                            {targetAthlete?.category ? ` (${targetAthlete.category})` : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 bg-white rounded-md text-[10px] font-bold text-slate-600 border border-slate-200 uppercase">
                          Destinatários: {notif.targetAudience}
                          {notif.targetCategory ? ` • ${notif.targetCategory}` : ''}
                        </span>
                      )}
                    </div>

                    {notif.actionTab && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(notif.actionTab || 'clube');
                        }}
                        className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        <span>{notif.actionLabel || 'Ver Detalhes'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                {canBroadcast && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                    title="Eliminar Notificação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredNotifs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Nenhuma notificação encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não há comunicados pendentes no filtro selecionado.
          </p>
        </div>
      )}

      {/* Broadcast Modal (Treinador) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${targetAudience === 'atleta_especifico' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {targetAudience === 'atleta_especifico' ? <User className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                    {targetAudience === 'atleta_especifico'
                      ? 'Novo Comunicado para Atleta Específico'
                      : 'Emitir Comunicado / Notificação'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {targetAudience === 'atleta_especifico'
                      ? 'Mensagem direta com visibilidade restrita ao atleta e encarregado'
                      : 'Publicação de aviso oficial ou convocatória'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs sm:text-sm">
              {/* Audience selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Destinatários do Comunicado *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('atleta_especifico')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      targetAudience === 'atleta_especifico'
                        ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 text-blue-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white font-medium'
                    }`}
                  >
                    <User className={`w-4 h-4 shrink-0 ${targetAudience === 'atleta_especifico' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs">Atleta Específico</div>
                      <div className="text-[10px] text-slate-500 truncate">Mensagem individual</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetAudience('todos');
                      setTargetAthleteId('');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      targetAudience === 'todos'
                        ? 'border-red-500 bg-red-50/80 ring-2 ring-red-500/20 text-red-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white font-medium'
                    }`}
                  >
                    <Users className={`w-4 h-4 shrink-0 ${targetAudience === 'todos' ? 'text-red-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs">Todos os Membros</div>
                      <div className="text-[10px] text-slate-500 truncate">Geral do clube</div>
                    </div>
                  </button>
                </div>

                <div className="mt-2">
                  <select
                    value={targetAudience}
                    onChange={(e) => {
                      const val = e.target.value as typeof targetAudience;
                      setTargetAudience(val);
                      if (val !== 'atleta_especifico') {
                        setTargetAthleteId('');
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-medium text-xs bg-slate-50"
                  >
                    <option value="atleta_especifico">🎯 Atleta Específico (Individual)</option>
                    <option value="todos">🌐 Todos os Membros do Clube</option>
                    <option value="atletas">🏃 Apenas Atletas (Todos ou por Escalão)</option>
                    <option value="pais">👨‍👩‍👧 Apenas Encarregados de Educação</option>
                    <option value="treinadores">📋 Apenas Treinadores</option>
                  </select>
                </div>
              </div>

              {/* Individual Athlete Selector */}
              {targetAudience === 'atleta_especifico' && (
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" />
                      Selecionar Atleta Destinatário *
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                      {athletes.length} atletas disponíveis
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrar por nome, escalão ou nº federado..."
                        value={athleteSearchQuery}
                        onChange={(e) => setAthleteSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <select
                      value={targetAthleteId}
                      onChange={(e) => setTargetAthleteId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 text-slate-900"
                    >
                      <option value="">-- Selecione o Atleta --</option>
                      {filteredAthletesForSelect.map((ath) => (
                        <option key={ath.id} value={ath.id}>
                          {ath.name} • {ath.category} (Nº {ath.federationNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Athlete Preview Card */}
                  {selectedAthleteObj && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedAthleteObj.photoUrl}
                          alt={selectedAthleteObj.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-400 shadow-2xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">
                            {selectedAthleteObj.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Escalão: <span className="font-bold text-blue-600">{selectedAthleteObj.category}</span> • Federado: {selectedAthleteObj.federationNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="leading-tight">
                          Visível para <strong>{selectedAthleteObj.name}</strong> e Encarregado de Educação ({selectedAthleteObj.guardianName || 'associado'}).
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Templates */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Sugestões Rápidas de Comunicado:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTemplate('convocatoria')}
                        className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Convocatória Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('feedback')}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Feedback Técnico
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('exame')}
                        className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Aviso de Exame Médico
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('treino')}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Aviso de Treino
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Group category filter when audience is 'atletas' */}
              {targetAudience === 'atletas' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-semibold text-slate-700 block">Filtrar por Escalão (Opcional)</label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-xs bg-white"
                  >
                    <option value="">Todos os Escalões de Atletas</option>
                    <option value="Juvenis (Sub-16)">Juvenis (Sub-16)</option>
                    <option value="Juniores (Sub-18)">Juniores (Sub-18)</option>
                    <option value="Seniores">Seniores</option>
                    <option value="Infantis (Sub-14)">Infantis (Sub-14)</option>
                  </select>
                </div>
              )}

              {/* Type and Action Tab */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Notificação</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NotificationItem['type'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-xs bg-white"
                  >
                    <option value="comunicado">Comunicado Geral</option>
                    <option value="convocatoria">Convocatória de Prova</option>
                    <option value="aviso_treino">Aviso de Treino</option>
                    <option value="mensalidade">Mensalidades & Quotas</option>
                    <option value="urgente">Urgente / Importante</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Atalho de Ação Rápida</label>
                  <select
                    value={actionTab}
                    onChange={(e) => setActionTab(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-xs bg-white"
                  >
                    <option value="">Sem botão de atalho</option>
                    <option value="calendario">Redirecionar para Calendário</option>
                    <option value="resultados">Redirecionar para Resultados</option>
                    <option value="atletas">Redirecionar para Quadro de Atletas</option>
                    <option value="encarregados">Redirecionar para Encarregados de Educação</option>
                    <option value="pais">Redirecionar para Área dos Pais</option>
                  </select>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título do Comunicado *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 font-medium text-xs sm:text-sm"
                  placeholder="Ex: Convocatória Individual / Avaliação Técnica"
                />
              </div>

              {/* Message input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mensagem Completa *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 font-medium text-xs sm:text-sm"
                  placeholder="Escreva o texto completo do comunicado..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer text-xs sm:text-sm ${
                    targetAudience === 'atleta_especifico'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {targetAudience === 'atleta_especifico'
                      ? 'Enviar para o Atleta'
                      : 'Enviar Comunicado'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

