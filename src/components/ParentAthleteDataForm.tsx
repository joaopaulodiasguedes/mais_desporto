import React, { useState, useMemo } from 'react';
import { useApp, getLinkedAthletesForGuardian } from '../context/AppContext';
import { Athlete } from '../types';
import { calculateMedicalStatus } from '../utils/athleteRules';
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  CreditCard,
  Users,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Activity,
  Award
} from 'lucide-react';

interface ParentAthleteDataFormProps {
  activeAthlete?: Athlete | null;
  selectedAthleteId?: string;
  onSelectAthleteId?: (id: string) => void;
  onSuccess?: () => void;
}

export const ParentAthleteDataForm: React.FC<ParentAthleteDataFormProps> = ({
  activeAthlete,
  selectedAthleteId,
  onSelectAthleteId
}) => {
  const { currentUser, availableUsers, athletes, showToast } = useApp();

  // Modo de exibição: 'card' (Cartão Resumo de Ambos) ou 'ficha' (Ficha Completa de Ambos)
  const [viewMode, setViewMode] = useState<'card' | 'ficha'>('card');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Lista de atletas do encarregado
  const guardianAthletes = useMemo(() => {
    if (currentUser.role === 'encarregado') {
      const linked = getLinkedAthletesForGuardian(currentUser, athletes);
      if (linked.length > 0) return linked;
    }
    return athletes;
  }, [currentUser, athletes]);

  // Atleta em foco
  const currentAthlete = useMemo(() => {
    if (selectedAthleteId && selectedAthleteId !== 'nao_inserido') {
      const found = athletes.find((a) => a.id === selectedAthleteId);
      if (found) return found;
    }
    if (activeAthlete) return activeAthlete;
    return guardianAthletes[0] || null;
  }, [selectedAthleteId, activeAthlete, athletes, guardianAthletes]);

  // Resolução dos dados do Encarregado de Educação
  const guardianData = useMemo(() => {
    // 1. Se o utilizador atual for encarregado, priorizar o seu perfil oficial
    if (currentUser.role === 'encarregado') {
      const cleanName = currentUser.name.replace(/\s*\((Pai|Mãe|Tutor)\)\s*/gi, '').trim();
      let rel = currentUser.relation || '';
      if (!rel) {
        if (currentUser.name.toLowerCase().includes('mãe')) rel = 'Mãe';
        else if (currentUser.name.toLowerCase().includes('pai')) rel = 'Pai';
        else rel = 'Encarregado(a) de Educação';
      }

      return {
        id: currentUser.id,
        name: cleanName || currentUser.name,
        relation: rel,
        nif: currentUser.nif || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        altPhone: currentUser.altPhone || '',
        address: currentUser.address || '',
        profession: currentUser.profession || '',
        notes: currentUser.notes || '',
        avatarUrl: currentUser.avatarUrl || ''
      };
    }

    // 2. Se houver um atleta selecionado, procurar nos utilizadores registados
    if (currentAthlete) {
      const matchedUser = availableUsers.find(
        (u) =>
          u.role === 'encarregado' &&
          ((u.relatedAthleteIds && u.relatedAthleteIds.includes(currentAthlete.id)) ||
            (currentAthlete.guardianId && u.id === currentAthlete.guardianId) ||
            (currentAthlete.guardianEmail && u.email && u.email.toLowerCase() === currentAthlete.guardianEmail.toLowerCase()) ||
            (currentAthlete.guardianName && u.name && u.name.toLowerCase().includes(currentAthlete.guardianName.toLowerCase())))
      );

      if (matchedUser) {
        const cleanName = matchedUser.name.replace(/\s*\((Pai|Mãe|Tutor)\)\s*/gi, '').trim();
        let rel = matchedUser.relation || '';
        if (!rel) {
          if (matchedUser.name.toLowerCase().includes('mãe')) rel = 'Mãe';
          else if (matchedUser.name.toLowerCase().includes('pai')) rel = 'Pai';
          else rel = 'Encarregado(a) de Educação';
        }

        return {
          id: matchedUser.id,
          name: cleanName || matchedUser.name,
          relation: rel,
          nif: matchedUser.nif || '',
          phone: matchedUser.phone || currentAthlete.guardianPhone || '',
          email: matchedUser.email || currentAthlete.guardianEmail || '',
          altPhone: matchedUser.altPhone || currentAthlete.emergencyContact || '',
          address: matchedUser.address || currentAthlete.address || '',
          profession: matchedUser.profession || '',
          notes: matchedUser.notes || '',
          avatarUrl: matchedUser.avatarUrl || ''
        };
      }

      // 3. Fallback para os campos incorporados no atleta (vindos do Supabase)
      let rel = currentAthlete.guardianRelation || '';
      if (!rel) {
        if (currentAthlete.emergencyContact?.toLowerCase().includes('mãe')) rel = 'Mãe';
        else if (currentAthlete.emergencyContact?.toLowerCase().includes('pai')) rel = 'Pai';
        else if (currentAthlete.guardianName) rel = 'Encarregado(a) de Educação';
      }

      return {
        id: currentAthlete.guardianId || '',
        name: currentAthlete.guardianName || 'Encarregado de Educação',
        relation: rel || 'Encarregado de Educação',
        nif: currentAthlete.guardianNif || currentAthlete.nif || '',
        phone: currentAthlete.guardianPhone || '',
        email: currentAthlete.guardianEmail || '',
        altPhone: currentAthlete.emergencyContact || '',
        address: currentAthlete.address || '',
        profession: '',
        notes: currentAthlete.notes || '',
        avatarUrl: ''
      };
    }

    return {
      name: 'Encarregado de Educação',
      relation: 'Encarregado de Educação',
      nif: '',
      phone: '',
      email: '',
      altPhone: '',
      address: '',
      profession: '',
      notes: '',
      avatarUrl: ''
    };
  }, [currentUser, currentAthlete, availableUsers]);

  // Cálculo da Idade do Atleta
  const athleteAge = useMemo(() => {
    if (!currentAthlete?.birthDate) return null;
    const birth = new Date(currentAthlete.birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, [currentAthlete?.birthDate]);

  // Estado do Exame Médico Desportivo
  const medicalStatusInfo = useMemo(() => {
    if (!currentAthlete) {
      return {
        status: 'expirado',
        daysRemaining: null,
        label: 'Sem Exame Registado',
        badgeColor: 'bg-red-50 text-red-700 border-red-200'
      };
    }
    return calculateMedicalStatus(currentAthlete.medicalExamExpiry);
  }, [currentAthlete]);

  // Função para copiar texto com feedback
  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} copiado!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Se nenhum atleta estiver selecionado ou registado
  if (!currentAthlete) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <Users className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-extrabold text-slate-800">
            Nenhum Atleta a Cargo Selecionado
          </h3>
          <p className="text-xs text-slate-500">
            Selecione um atleta associado para visualizar o cartão informativo e a respetiva ficha oficial.
          </p>
        </div>
        {athletes.length > 0 && onSelectAthleteId && (
          <div className="pt-2">
            <select
              value=""
              onChange={(e) => onSelectAthleteId(e.target.value)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
            >
              <option value="">Selecione um atleta...</option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* MODO 1: CARTÃO COM A INFORMAÇÃO DE AMBOS (ENCARREGADO & ATLETA) */}
      {/* ========================================================================= */}
      {viewMode === 'card' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
          {/* Cabeçalho do Cartão */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                  Época 2026/2027
                </span>

                {/* Seleção rápida de educando (se o encarregado tiver mais de um atleta associado) */}
                {guardianAthletes.length > 1 && onSelectAthleteId && (
                  <div className="inline-flex items-center gap-1 bg-white/10 p-0.5 rounded-xl border border-white/20">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 text-purple-200">
                      Educando:
                    </span>
                    {guardianAthletes.map((ath) => (
                      <button
                        key={ath.id}
                        type="button"
                        onClick={() => onSelectAthleteId(ath.id)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentAthlete.id === ath.id
                            ? 'bg-white text-purple-900 shadow-xs'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {ath.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {guardianData.name} & {currentAthlete.name}
              </h2>
              <p className="text-xs text-purple-200">
                {guardianData.relation} • Ficha individual e acompanhamento desportivo
              </p>
            </div>
          </div>

          {/* Corpo do Cartão: Informação Lado a Lado de Ambos */}
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* LADO 1: INFORMAÇÃO DO ENCARREGADO DE EDUCAÇÃO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {guardianData.avatarUrl ? (
                    <img
                      src={guardianData.avatarUrl}
                      alt={guardianData.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shadow-xs bg-purple-50 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg shadow-2xs shrink-0">
                      {guardianData.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 block">
                      Encarregado(a) de Educação
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                      {guardianData.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-500">
                      Grau: <span className="text-purple-700">{guardianData.relation}</span>
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                  {guardianData.relation}
                </span>
              </div>

              {/* Detalhes de Contacto do Encarregado */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                {/* Telemóvel */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Telemóvel Principal:
                  </span>
                  {guardianData.phone ? (
                    <a
                      href={`tel:${guardianData.phone}`}
                      className="font-bold text-slate-800 hover:text-purple-700"
                    >
                      {guardianData.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 font-medium">Não registado</span>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Email Oficial:
                  </span>
                  {guardianData.email ? (
                    <a
                      href={`mailto:${guardianData.email}`}
                      className="font-bold text-slate-800 hover:text-purple-700 truncate max-w-[200px]"
                    >
                      {guardianData.email}
                    </a>
                  ) : (
                    <span className="text-slate-400 font-medium">Não registado</span>
                  )}
                </div>

                {/* NIF */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    NIF:
                  </span>
                  {guardianData.nif ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">
                        {guardianData.nif}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(guardianData.nif, 'nif_card', 'NIF do Encarregado')}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Copiar NIF"
                      >
                        {copiedKey === 'nif_card' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium">—</span>
                  )}
                </div>

                {/* Contacto Alternativo */}
                {guardianData.altPhone && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Urgência / Alternativo:</span>
                    <span className="font-bold text-slate-800">{guardianData.altPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* LADO 2: INFORMAÇÃO DO ATLETA A CARGO */}
            <div className="pt-6 lg:pt-0 lg:pl-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={currentAthlete.photoUrl}
                    alt={currentAthlete.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-200 shadow-xs bg-teal-50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 block">
                      Atleta a Cargo / Educando
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                      {currentAthlete.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-500">
                      Licença: <span className="font-mono text-slate-700">{currentAthlete.federationNumber || 'Pendente'}</span>
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100">
                  {currentAthlete.category}
                </span>
              </div>

              {/* Detalhes Desportivos & Clínicos do Atleta */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                {/* Escalão e Idade */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Idade / Nascimento:
                  </span>
                  <span className="font-bold text-slate-800">
                    {athleteAge !== null ? `${athleteAge} anos` : '—'}{' '}
                    {currentAthlete.birthDate ? `(${currentAthlete.birthDate})` : ''}
                  </span>
                </div>

                {/* Exame Médico Desportivo */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                    Exame Médico:
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded-lg border text-[11px] ${medicalStatusInfo.badgeColor}`}>
                    {medicalStatusInfo.label}
                  </span>
                </div>

                {/* Contacto de Emergência Federativo */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Emergência Oficial:
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentAthlete.emergencyContact || guardianData.phone || '—'}
                  </span>
                </div>

                {/* Assiduidade */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Assiduidade aos Treinos:</span>
                  <span className="font-black text-emerald-600 text-xs">
                    {currentAthlete.attendanceRate !== undefined && currentAthlete.attendanceRate !== null
                      ? `${currentAthlete.attendanceRate}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra Inferior de Estado */}
          <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ficha ativa e validada pela secretaria
              </span>
              {currentAthlete.allergiesOrConditions && (
                <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Alerta clínico registado
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 2: FICHA COMPLETA COM INFORMAÇÃO DE AMBOS (VISUALIZAÇÃO DETALHADA) */}
      {/* ========================================================================= */}
      {viewMode === 'ficha' && (
        <div className="space-y-6">
          {/* Barra de Ações da Ficha */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Cartão</span>
              </button>

              {guardianAthletes.length > 1 && onSelectAthleteId && (
                <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 text-slate-500">
                    Educando:
                  </span>
                  {guardianAthletes.map((ath) => (
                    <button
                      key={ath.id}
                      type="button"
                      onClick={() => onSelectAthleteId(ath.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentAthlete.id === ath.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      {ath.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Imprimir Ficha</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PAINEL 1: FICHA COMPLETA DO ENCARREGADO DE EDUCAÇÃO */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  {guardianData.avatarUrl ? (
                    <img
                      src={guardianData.avatarUrl}
                      alt={guardianData.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shadow-xs bg-purple-50 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg shadow-2xs shrink-0">
                      {guardianData.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 block">
                      Encarregado de Educação
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                      {guardianData.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Grau: <span className="font-bold text-purple-700">{guardianData.relation}</span>
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                  {guardianData.relation}
                </span>
              </div>

              {/* Grelha de Dados do Encarregado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* Nome Completo */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Nome Completo
                  </span>
                  <p className="font-extrabold text-slate-900">{guardianData.name}</p>
                </div>

                {/* Grau de Parentesco */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Grau de Parentesco
                  </span>
                  <p className="font-extrabold text-purple-900">{guardianData.relation}</p>
                </div>

                {/* NIF */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400">
                      NIF (Identificação Fiscal)
                    </span>
                    {guardianData.nif && (
                      <button
                        type="button"
                        onClick={() => handleCopy(guardianData.nif, 'nif_ficha', 'NIF')}
                        className="text-slate-400 hover:text-purple-600 cursor-pointer"
                        title="Copiar NIF"
                      >
                        {copiedKey === 'nif_ficha' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="font-mono font-bold text-slate-900">{guardianData.nif || '—'}</p>
                </div>

                {/* Telemóvel Principal */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Telemóvel Principal
                  </span>
                  {guardianData.phone ? (
                    <a
                      href={`tel:${guardianData.phone}`}
                      className="font-bold text-slate-900 hover:text-purple-700 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{guardianData.phone}</span>
                    </a>
                  ) : (
                    <p className="font-bold text-slate-400">—</p>
                  )}
                </div>

                {/* Email Oficial */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Email de Contacto Oficial
                  </span>
                  {guardianData.email ? (
                    <a
                      href={`mailto:${guardianData.email}`}
                      className="font-bold text-slate-900 hover:text-purple-700 flex items-center gap-1.5 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{guardianData.email}</span>
                    </a>
                  ) : (
                    <p className="font-bold text-slate-400">—</p>
                  )}
                </div>

                {/* Contacto Alternativo */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Contacto Alternativo / Urgência
                  </span>
                  <p className="font-bold text-slate-900">{guardianData.altPhone || '—'}</p>
                </div>

                {/* Profissão */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Profissão / Ocupação
                  </span>
                  <p className="font-bold text-slate-900">{guardianData.profession || '—'}</p>
                </div>

                {/* Morada de Residência */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Morada de Residência
                  </span>
                  <p className="font-bold text-slate-900 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>{guardianData.address || '—'}</span>
                  </p>
                </div>

                {/* Observações */}
                {guardianData.notes && (
                  <div className="sm:col-span-2 p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-1">
                      Observações Registadas
                    </span>
                    <p className="text-slate-700">{guardianData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* PAINEL 2: FICHA COMPLETA DO ATLETA A CARGO */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={currentAthlete.photoUrl}
                    alt={currentAthlete.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-200 shadow-xs bg-teal-50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 block">
                      Atleta a Cargo / Educando
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                      {currentAthlete.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Escalão: <span className="font-bold text-teal-800">{currentAthlete.category}</span>
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100">
                  {currentAthlete.category}
                </span>
              </div>

              {/* Grelha de Dados do Atleta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* Nome Completo */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Nome Completo do Atleta
                  </span>
                  <p className="font-extrabold text-slate-900">{currentAthlete.name}</p>
                </div>

                {/* Licença Federativa */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Nº de Licença Federativa
                  </span>
                  <p className="font-mono font-bold text-slate-900">
                    {currentAthlete.federationNumber || 'Pendente'}
                  </p>
                </div>

                {/* Data de Nascimento & Idade */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Data de Nascimento & Idade
                  </span>
                  <p className="font-bold text-slate-900">
                    {currentAthlete.birthDate || '—'} {athleteAge !== null && `(${athleteAge} anos)`}
                  </p>
                </div>

                {/* Escalão Desportivo */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Escalão Desportivo
                  </span>
                  <p className="font-bold text-teal-800">{currentAthlete.category}</p>
                </div>

                {/* Exame Médico Desportivo */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Exame Médico Desportivo
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Validade: {currentAthlete.medicalExamExpiry || 'Sem data registada'}
                    </span>
                  </div>
                  <span className={`font-bold px-3 py-1 rounded-xl border text-xs self-start sm:self-auto ${medicalStatusInfo.badgeColor}`}>
                    {medicalStatusInfo.label}
                  </span>
                </div>

                {/* Alergias / Condições Especiais de Saúde */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block mb-1 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
                    Alergias ou Cuidados Especiais de Saúde:
                  </span>
                  <p className="font-semibold text-amber-950 text-xs">
                    {currentAthlete.allergiesOrConditions || 'Nenhuma alergia ou condição médica declarada.'}
                  </p>
                </div>

                {/* Contacto de Emergência Federativo */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Contacto de Emergência Oficial
                  </span>
                  <p className="font-bold text-slate-900">
                    {currentAthlete.emergencyContact || guardianData.phone}
                  </p>
                </div>

                {/* Assiduidade aos Treinos */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Assiduidade Registada
                  </span>
                  <p className="font-extrabold text-emerald-600 text-sm">
                    {currentAthlete.attendanceRate !== undefined && currentAthlete.attendanceRate !== null
                      ? `${currentAthlete.attendanceRate}% de presenças`
                      : '—'}
                  </p>
                </div>

                {/* Telemóvel do Atleta */}
                {currentAthlete.phone && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Telemóvel do Atleta
                    </span>
                    <p className="font-bold text-slate-900">{currentAthlete.phone}</p>
                  </div>
                )}

                {/* Email do Atleta */}
                {currentAthlete.email && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Email do Atleta
                    </span>
                    <p className="font-bold text-slate-900 truncate">{currentAthlete.email}</p>
                  </div>
                )}

                {/* Morada do Atleta */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Morada do Atleta
                  </span>
                  <p className="font-bold text-slate-900 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{currentAthlete.address || guardianData.address || '—'}</span>
                  </p>
                </div>

                {/* Observações Desportivas */}
                {currentAthlete.notes && (
                  <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Notas Desportivas
                    </span>
                    <p className="text-slate-700">{currentAthlete.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
