import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Sliders,
  RotateCcw,
  Check,
  Lock,
  AlertCircle,
  Info
} from 'lucide-react';
import { UserRole, RolePermissions } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/initialData';

export const RulesManagement: React.FC = () => {
  const { rolePermissions, updateRolePermissions, currentUser, showToast } = useApp();

  const roles: { role: UserRole; title: string; desc: string; badgeColor: string }[] = [
    {
      role: 'treinador',
      title: 'Treinador',
      desc: 'Gestão técnica, treinos, convocações e validação de membros',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    {
      role: 'atleta',
      title: 'Atleta',
      desc: 'Consulta de planos, registo de treinos individuais e assiduidade',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      role: 'encarregado',
      title: 'Encarregado de Educação',
      desc: 'Autorizações de provas, transporte/boleias e acompanhamento',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  ];

  const permissionLabels: { key: keyof RolePermissions; label: string; desc: string }[] = [
    { key: 'canEditClubInfo', label: 'Editar Dados do Clube', desc: 'Modificar NIF, morada, logótipo e contactos oficiais' },
    { key: 'canManageAthletes', label: 'Adicionar / Editar Atletas', desc: 'Criar fichas de atletas e dados federativos' },
    { key: 'canManageCoaches', label: 'Adicionar / Editar Treinadores', desc: 'Gerir corpo técnico e cédulas TPTD' },
    { key: 'canCreateTrainingPlans', label: 'Criar Planos de Treino', desc: 'Elaborar blocos de exercícios e séries' },
    { key: 'canAddCompetitions', label: 'Adicionar Provas Oficiais', desc: 'Publicar torneios no calendário desportivo' },
    { key: 'canLogPersonalTraining', label: 'Registar Treinos Individuais', desc: 'Adicionar sessões autónomas no calendário' },
    { key: 'canAddResults', label: 'Publicar Resultados (PDFs)', desc: 'Carregar ficheiros de classificações e pódios' },
    { key: 'canBroadcastNotifications', label: 'Emitir Notificações & Avisos', desc: 'Enviar comunicados gerais a todos os membros' },
    { key: 'canAuthorizeTournaments', label: 'Assinar Autorizações de Provas', desc: 'Validar participação de menores em torneios' },
    { key: 'canOfferCarpool', label: 'Organizar Bolsa de Boleias', desc: 'Disponibilizar e reservar lugares para provas (atletas menores de 18 anos restritos por lei)' }
  ];

  const handleToggle = (role: UserRole, key: keyof RolePermissions) => {
    if (currentUser.role !== 'treinador') {
      showToast('Apenas treinadores podem modificar as regras de autorização.', 'error');
      return;
    }
    const current = rolePermissions[role]?.[key] ?? false;
    updateRolePermissions(role, { [key]: !current });
    showToast(
      `Permissão "${permissionLabels.find(p => p.key === key)?.label}" ${!current ? 'concedida' : 'revogada'} para ${role.toUpperCase()}.`,
      'info'
    );
  };

  const handleResetDefaults = () => {
    if (currentUser.role !== 'treinador') return;
    roles.forEach(r => {
      updateRolePermissions(r.role, DEFAULT_ROLE_PERMISSIONS[r.role]);
    });
    showToast('Regras de permissões restauradas para os valores predefinidos.', 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner / Explanation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 shadow-xs border border-amber-200">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Regras & Permissões por Perfil
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina o que cada tipo de perfil de utilizador tem autorização para visualizar, criar ou modificar no sistema.
            </p>
          </div>
        </div>

        {currentUser.role === 'treinador' && (
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-xs active:scale-95"
            title="Restaurar a matriz padrão recomendada"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Predefinições</span>
          </button>
        )}
      </div>

      {/* Informative Security Guideline */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-amber-900">Segurança de Dados:</strong> As alterações efetuadas nesta matriz têm aplicação imediata em toda a plataforma e persistem na sessão e na base de dados conectada.
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-extrabold text-slate-800 w-2/5">
                  Funcionalidade / Ação
                </th>
                {roles.map((r) => (
                  <th key={r.role} className="p-4 font-extrabold text-center text-slate-800 w-1/5">
                    <span className="block text-sm text-slate-900">{r.title}</span>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${r.badgeColor}`}>
                      {r.role}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {permissionLabels.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 text-xs block">{perm.label}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block leading-snug">{perm.desc}</span>
                  </td>

                  {roles.map((r) => {
                    const isAllowed = rolePermissions[r.role]?.[perm.key] ?? false;
                    return (
                      <td key={r.role} className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(r.role, perm.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                            isAllowed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-xs'
                              : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                          title={`Clique para ${isAllowed ? 'bloquear' : 'permitir'} "${perm.label}" para ${r.title}`}
                        >
                          {isAllowed ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Permitido</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Bloqueado</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
