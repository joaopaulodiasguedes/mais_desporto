import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  X,
  Check,
  RotateCcw,
  Sliders,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { UserRole, RolePermissions } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/initialData';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose }) => {
  const { rolePermissions, updateRolePermissions, currentUser } = useApp();

  if (!isOpen) return null;

  const roles: { role: UserRole; title: string; desc: string }[] = [
    { role: 'treinador', title: 'Treinador', desc: 'Gestão técnica, convocatórias, treinos e publicação de resultados' },
    { role: 'atleta', title: 'Atleta', desc: 'Consulta de planos, registo de treinos individuais e presenças' },
    { role: 'encarregado', title: 'Encarregado de Educação', desc: 'Autorizações de provas, boleias e acompanhamento' }
  ];

  const permissionLabels: { key: keyof RolePermissions; label: string; desc: string }[] = [
    { key: 'canEditClubInfo', label: 'Editar Dados do Clube', desc: 'Modificar NIF, morada, logótipo e contactos oficiais' },
    { key: 'canManageAthletes', label: 'Adicionar / Editar Atletas', desc: 'Criar fichas de atletas e dados federativos' },
    { key: 'canManageCoaches', label: 'Adicionar / Editar Treinadores', desc: 'Gerir corpo técnico e licenças TPTD' },
    { key: 'canCreateTrainingPlans', label: 'Criar Planos de Treino', desc: 'Elaborar blocos de exercícios e séries' },
    { key: 'canAddCompetitions', label: 'Adicionar Provas Oficiais', desc: 'Publicar torneios no calendário desportivo' },
    { key: 'canLogPersonalTraining', label: 'Registar Treinos Individuais', desc: 'Adicionar sessões autónomas no calendário' },
    { key: 'canAddResults', label: 'Publicar Resultados (PDFs)', desc: 'Carregar ficheiros de classificações e pódios' },
    { key: 'canBroadcastNotifications', label: 'Emitir Notificações & Avisos', desc: 'Enviar comunicados gerais a todos os membros' },
    { key: 'canAuthorizeTournaments', label: 'Assinar Autorizações de Provas', desc: 'Validar participação de menores em torneios' },
    { key: 'canOfferCarpool', label: 'Organizar Bolsa de Boleias', desc: 'Disponibilizar e reservar lugares para provas (atletas menores de 18 anos restritos por lei)' }
  ];

  const handleToggle = (role: UserRole, key: keyof RolePermissions) => {
    const current = rolePermissions[role]?.[key] ?? false;
    updateRolePermissions(role, { [key]: !current });
  };

  const handleResetDefaults = () => {
    roles.forEach(r => {
      updateRolePermissions(r.role, DEFAULT_ROLE_PERMISSIONS[r.role]);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900">
                Matriz de Autorizações & Permissões por Perfil
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste fino dos privilégios de acesso para Treinador, Atleta e Encarregado de Educação
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Note */}
        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Regra de Segurança do + Desporto:</span> Por predefinição, apenas os
            treinadores têm permissão para publicar resultados (PDFs) e criar planos de treino oficiais. Pode
            ajustar qualquer funcionalidade dinamicamente.
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3.5 font-extrabold text-slate-700 w-1/3">
                  Funcionalidade / Permissão
                </th>
                {roles.map((r) => (
                  <th key={r.role} className="p-3.5 font-extrabold text-center text-slate-800">
                    <span className="block text-sm">{r.title}</span>
                    <span className="text-[10px] font-normal text-slate-400 font-sans block">{r.desc.slice(0, 26)}...</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {permissionLabels.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{perm.label}</span>
                    <span className="text-[11px] text-slate-500">{perm.desc}</span>
                  </td>

                  {roles.map((r) => {
                    const isAllowed = rolePermissions[r.role]?.[perm.key] ?? false;
                    return (
                      <td key={r.role} className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(r.role, perm.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                            isAllowed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isAllowed ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Permitido</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
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

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-100">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Valores Predefinidos</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            Guardar & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
