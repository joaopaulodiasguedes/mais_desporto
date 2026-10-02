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
  Contact,
  Sparkles,
  Shield,
  X
} from 'lucide-react';

interface SidebarProps {
  onOpenPermissions?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenPermissions,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const {
    activeTab,
    setActiveTab,
    unreadCount,
    athletes,
    clubInfo,
    isCurrentUserAdmin
  } = useApp();

  const navCategories = [
    {
      title: 'Gestão',
      items: [
        ...(isCurrentUserAdmin ? [{
          id: 'administrador',
          label: 'Administrador',
          icon: ShieldAlert,
          badge: null
        }] : []),
        {
          id: 'clube',
          label: 'Clube',
          icon: ShieldCheck,
          badge: null
        },
        {
          id: 'treinadores',
          label: 'Treinadores',
          icon: UserCheck,
          badge: null
        },
        {
          id: 'atletas',
          label: 'Atletas',
          icon: Users,
          badge: null
        },
        {
          id: 'encarregados',
          label: 'Enc. Educação',
          icon: Contact,
          badge: null
        }
      ]
    },
    {
      title: 'Actividades',
      items: [
        {
          id: 'planos_treino',
          altId: 'planos',
          label: 'Planos de Treino',
          icon: Dumbbell,
          badge: null
        },
        {
          id: 'calendario',
          label: 'Calendário',
          icon: CalendarDays,
          badge: null
        },
        {
          id: 'resultados',
          label: 'Resultados',
          icon: Trophy,
          badge: null
        },
        {
          id: 'pais',
          label: 'Área dos Enc.',
          icon: HeartHandshake,
          badge: null
        }
      ]
    }
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Aside Container */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 lg:z-20 w-64 bg-[#0F172A] text-slate-400 flex flex-col shrink-0 h-screen transition-transform duration-300 ease-in-out border-r border-slate-800/80 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand Header */}
        <div className="p-6 sm:p-7 flex items-center justify-between border-b border-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-lg shadow-blue-500/20 shrink-0 flex items-center justify-center">
              {clubInfo.logoUrl ? (
                <img
                  src={clubInfo.logoUrl}
                  alt={clubInfo.name || "Logótipo do Clube"}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  +D
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-xl tracking-tight leading-none truncate">
                + Desporto
              </span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-1 truncate">
                Gestão Desportiva
              </span>
            </div>
          </div>

          {/* Close mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navCategories.map((category) => (
            <div key={category.title}>
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {category.title}
              </div>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const isActive =
                    activeTab === item.id ||
                    (item.altId && activeTab === item.altId);
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-${item.id}`}
                      onClick={() => handleSelectTab(item.id)}
                      style={isActive ? {
                        backgroundColor: 'var(--club-primary-light)',
                        color: 'var(--club-primary)',
                        borderColor: 'var(--club-primary-border)'
                      } : undefined}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive
                        ? 'bg-blue-600/10 text-blue-400 rounded-xl border border-blue-600/20 font-semibold shadow-xs'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={isActive ? { backgroundColor: 'var(--club-primary)' } : undefined}
                          className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-blue-500 shadow-xs shadow-blue-400' : 'bg-slate-600'
                            }`}
                        />
                        <Icon
                          style={isActive ? { color: 'var(--club-primary)' } : undefined}
                          className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500'
                            }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
