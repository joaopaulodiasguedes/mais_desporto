import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sliders,
  Database,
  ShieldCheck,
  Lock,
  RotateCcw,
  RefreshCw,
  Server,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { RulesManagement } from './RulesManagement';
import { SupabaseManagement } from './SupabaseManagement';

export const AdminTab: React.FC = () => {
  const {
    isCurrentUserAdmin,
    supabaseStatus,
    currentUser,
    syncWithSupabase,
    resetAllData,
    setIsSupabaseModalOpen,
    showToast
  } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'supabase'>('rules');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await syncWithSupabase();
      showToast('Sincronização com o Supabase concluída com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao sincronizar com Supabase: ' + (err?.message || 'Falha de rede'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Tem a certeza que deseja repor todos os dados para os valores padrão de fábrica? Quaisquer dados locais serão redefinidos.')) {
      resetAllData();
      showToast('Dados de demonstração restaurados com sucesso!', 'info');
    }
  };

  if (!isCurrentUserAdmin) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Acesso Restrito ao Administrador</h3>
        <p className="text-sm text-slate-500">
          Esta área é reservada exclusivamente a treinadores com permissões de Administrador do Clube.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Administração do Clube
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gestão de regras de acesso por perfil e sincronização da base de dados Supabase
          </p>
        </div>
      </div>

      {/* Estado do Sistema e Sincronização (Por cima dos separadores) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Estado do Sistema e Sincronização</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Faça a gestão da ligação à nuvem (Supabase), sincronize dados em tempo real ou reponha o estado original.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Sincronizar Agora */}
            <button
              id="admin-sync-now-btn"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-blue-200 bg-blue-50/70 text-blue-700 hover:bg-blue-100 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Forçar sincronização de dados com a nuvem Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'A Sincronizar...' : 'Sincronizar Agora'}</span>
            </button>

            {/* Botão Supabase Config / Abrir Sub-Tab */}
            <button
              id="admin-open-supabase-btn"
              onClick={() => setActiveSubTab('supabase')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Abrir painel de gestão do Supabase"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>{supabaseStatus === 'connected' ? 'Supabase Conectado' : 'Configurar Supabase'}</span>
            </button>

            {/* Botão Restaurar Dados */}
            <button
              id="admin-reset-demo-btn"
              onClick={handleResetData}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              title="Limpar cache local e restaurar todos os atletas, treinos e clubes para o estado original"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Dados</span>
            </button>
          </div>
        </div>

        {/* Indicadores de Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-500 block mb-1">Armazenamento & Nuvem</span>
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-500 shadow-xs shadow-emerald-400'
                    : supabaseStatus === 'connecting'
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              {supabaseStatus === 'connected' ? 'Supabase Cloud (PostgreSQL)' : 'Cache Local do Navegador'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-500 block mb-1">Modo de Operação</span>
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-400" />
              Pronto para Vercel / PWA & Offline
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-500 block mb-1">Perfil em Sessão</span>
            <span className="font-bold text-slate-800 capitalize flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs shadow-purple-400" />
              {currentUser.name} ({currentUser.role})
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full overflow-x-auto">
          <button
            id="admin-subtab-rules"
            onClick={() => setActiveSubTab('rules')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'rules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Regras & Permissões</span>
          </button>

          <button
            id="admin-subtab-supabase"
            onClick={() => setActiveSubTab('supabase')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'supabase'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database
              className={`w-4 h-4 ${
                supabaseStatus === 'connected' ? 'text-emerald-600' : 'text-slate-500'
              }`}
            />
            <span>Base de Dados Supabase</span>
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-500'
                  : supabaseStatus === 'connecting'
                  ? 'bg-blue-500 animate-ping'
                  : 'bg-amber-400'
              }`}
              title={
                supabaseStatus === 'connected'
                  ? 'Supabase Conectado'
                  : 'Modo Local / A Configurar'
              }
            />
          </button>
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === 'rules' && <RulesManagement />}
        {activeSubTab === 'supabase' && <SupabaseManagement />}
      </div>
    </div>
  );
};

export default AdminTab;
