import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  Dumbbell,
  CalendarDays,
  Trophy,
  Bell,
  HeartHandshake,
  Contact
} from 'lucide-react';

export const TAB_CONFIG = [
  {
    id: 'administrador',
    label: 'Administrador',
    shortLabel: 'Administrador',
    icon: ShieldAlert,
    badgeColor: 'bg-amber-500',
    description: 'Regras, permissões e base de dados cloud',
    adminOnly: true
  },
  {
    id: 'clube',
    label: 'Clube',
    shortLabel: 'Clube',
    icon: ShieldCheck,
    badgeColor: 'bg-blue-500',
    description: 'Modalidade, contactos e dados do clube'
  },
  {
    id: 'treinadores',
    label: 'Treinadores',
    shortLabel: 'Equipa',
    icon: UserCheck,
    badgeColor: 'bg-blue-500',
    description: 'Equipa técnica e cédulas TPTD'
  },
  {
    id: 'atletas',
    label: 'Atletas',
    shortLabel: 'Atletas',
    icon: Users,
    badgeColor: 'bg-blue-500',
    description: 'Fichas, escalões e exames médicos'
  },
  {
    id: 'encarregados',
    label: 'Enc. Educação',
    shortLabel: 'Enc. Ed.',
    icon: Contact,
    badgeColor: 'bg-purple-500',
    description: 'Fichas, encarregados e atletas a cargo'
  },
  {
    id: 'planos_treino',
    altId: 'planos',
    label: 'Planos de Treino',
    shortLabel: 'Planos',
    icon: Dumbbell,
    badgeColor: 'bg-blue-500',
    description: 'Biblioteca e criação de treinos'
  },
  {
    id: 'calendario',
    label: 'Calendário',
    shortLabel: 'Agenda',
    icon: CalendarDays,
    badgeColor: 'bg-blue-500',
    description: 'Provas oficiais e treinos'
  },
  {
    id: 'resultados',
    label: 'Resultados',
    shortLabel: 'Resultados',
    icon: Trophy,
    badgeColor: 'bg-blue-500',
    description: 'Classificações oficiais e PDFs'
  },
  {
    id: 'notificacoes',
    label: 'Notificações',
    shortLabel: 'Avisos',
    icon: Bell,
    badgeColor: 'bg-red-500',
    description: 'Comunicados e alertas'
  },
  {
    id: 'pais',
    label: 'Área dos Pais',
    shortLabel: 'Pais',
    icon: HeartHandshake,
    badgeColor: 'bg-purple-500',
    description: 'Autorizações, assiduidade e boleias'
  }
];

export const DesktopTabBar: React.FC = () => {
  const { activeTab, setActiveTab, unreadCount, isCurrentUserAdmin } = useApp();
  const visibleTabs = TAB_CONFIG.filter(tab => !tab.adminOnly || isCurrentUserAdmin);

  const getTabBadge = (id: string) => {
    if (id === 'notificacoes' && unreadCount > 0) {
      return (
        <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-500 text-white">
          {unreadCount}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 min-w-max">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id || (tab.altId && activeTab === tab.altId);
          return (
            <button
              key={tab.id}
              id={`desktop-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              />
              <span>{tab.label}</span>
              {getTabBadge(tab.id)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MobileBottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, unreadCount, isCurrentUserAdmin } = useApp();
  const visibleTabs = TAB_CONFIG.filter(tab => !tab.adminOnly || isCurrentUserAdmin);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 py-1.5 px-2 shadow-lg lg:hidden">
      <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id || (tab.altId && activeTab === tab.altId);
          const isNotif = tab.id === 'notificacoes' && unreadCount > 0;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all relative ${
                isActive
                  ? 'text-blue-600 font-extrabold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.5px]' : 'stroke-2'
                  }`}
                />
                {isNotif && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </div>
              <span className="text-[10px] leading-tight mt-0.5 max-w-[48px] truncate text-center font-medium">
                {tab.shortLabel}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Navigation: React.FC = () => {
  return <MobileBottomNavigation />;
};

export default Navigation;
