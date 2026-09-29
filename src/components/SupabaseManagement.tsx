import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  KeyRound,
  Globe,
  Trash2,
  Save,
  Zap,
  Table,
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sliders,
  Copy,
  Check,
  X,
  FileCode,
  Code2,
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
  SupabaseConfig,
  SupabaseTestResult,
  encryptAndSyncAllPersonalDataToSupabase
} from '../lib/supabase';
import {
  getEncryptionKeyId,
  getMasterEncryptionPassphrase,
  setMasterEncryptionPassphrase,
  resetMasterEncryptionPassphrase,
  getEncryptionSecurityReport,
  encryptText,
  decryptText
} from '../lib/encryption';
import { useApp } from '../context/AppContext';
import { SUPABASE_TABLES_SCHEMA } from '../data/supabaseSchemaData';
import { SUPABASE_UPDATE_SQL } from '../data/supabaseSqlScripts';

interface SupabaseManagementProps {
  onClose?: () => void;
}

export const SupabaseManagement: React.FC<SupabaseManagementProps> = ({ onClose }) => {
  const {
    showToast,
    syncWithSupabase,
    supabaseStatus,
    athletes,
    coaches,
    availableUsers,
    authorizations,
    carpools
  } = useApp();

  const [activeTab, setActiveTab] = useState<'connection' | 'schema' | 'scripts' | 'guide' | 'encryption'>('connection');
  const [config, setConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    tablesList?: SupabaseTestResult['tablesList'];
  }>({
    tested: false,
    success: false,
    message: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Encryption Tab state
  const [encryptionKeyId, setEncryptionKeyId] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isEncryptSyncing, setIsEncryptSyncing] = useState(false);
  const [encryptSyncStats, setEncryptSyncStats] = useState<{
    success?: boolean;
    message?: string;
    athletesCount?: number;
    coachesCount?: number;
    profilesCount?: number;
    authorizationsCount?: number;
    carpoolsCount?: number;
  } | null>(null);

  // Encryption Interactive Test
  const [testPlaintext, setTestPlaintext] = useState('+351 912 345 678');
  const [testEncryptedOutput, setTestEncryptedOutput] = useState('');
  const [testDecryptedOutput, setTestDecryptedOutput] = useState('');
  const [isTestingEncryption, setIsTestingEncryption] = useState(false);

  const secReport = getEncryptionSecurityReport();

  // Schema Tab state
  const [schemaSearch, setSchemaSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    club_info: true,
    athletes: true,
    age_categories: true
  });
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [copiedUpdateSql, setCopiedUpdateSql] = useState(false);
  const [copiedCoachSql, setCopiedCoachSql] = useState(false);

  useEffect(() => {
    const current = getSupabaseConfig();
    setConfig(current);
    setUrlInput(current.url);
    setKeyInput(current.anonKey);
    setTestResult({ tested: false, success: false, message: '' });
    getEncryptionKeyId().then(setEncryptionKeyId);
    setPassphraseInput(getMasterEncryptionPassphrase());
  }, []);

  const toggleTableExpand = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const handleExpandAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    SUPABASE_TABLES_SCHEMA.forEach(t => {
      updated[t.name] = expand;
    });
    setExpandedTables(updated);
  };

  const handleCopySqlQuery = () => {
    const query = `-- Listar todas as colunas, tipos de dados e tabelas do Supabase
SELECT 
    table_name AS "Tabela",
    column_name AS "Campo",
    data_type AS "Tipo",
    is_nullable AS "Opcional",
    column_default AS "Valor_Padrao"
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name, ordinal_position;`;
    navigator.clipboard.writeText(query);
    setCopiedQuery(true);
    showToast('Comando SQL copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedQuery(false), 2500);
  };

  const handleCopyUpdateSql = () => {
    navigator.clipboard.writeText(SUPABASE_UPDATE_SQL);
    setCopiedUpdateSql(true);
    showToast('Script de Atualização copiado com sucesso! Cole no SQL Editor do Supabase.', 'success');
    setTimeout(() => setCopiedUpdateSql(false), 3000);
  };

  const handleCopyCoachSql = () => {
    const coachSql = `-- Atualização da Tabela de Treinadores e Perfis (Coluna de Administrador)
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`;
    navigator.clipboard.writeText(coachSql);
    setCopiedCoachSql(true);
    showToast('SQL para tabela de Treinadores copiado com sucesso!', 'success');
    setTimeout(() => setCopiedCoachSql(false), 3000);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult({ tested: false, success: false, message: '' });

    if (urlInput.trim() && keyInput.trim() && (urlInput !== config.url || keyInput !== config.anonKey)) {
      saveCustomSupabaseConfig(urlInput.trim(), keyInput.trim());
      setConfig(getSupabaseConfig());
    }

    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message,
      tablesList: res.tablesList
    });

    if (res.success) {
      showToast('Ligação ao Supabase verificada com sucesso!', 'success');
    } else {
      showToast('Falha no teste de ligação ao Supabase', 'error');
    }
  };

  const handleSave = async () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      showToast('Preencha o Project URL e a Anon Key.', 'error');
      return;
    }

    if (!urlInput.startsWith('https://')) {
      showToast('O URL do Supabase deve começar com https://', 'error');
      return;
    }

    saveCustomSupabaseConfig(urlInput.trim(), keyInput.trim());
    const updated = getSupabaseConfig();
    setConfig(updated);

    showToast('Credenciais guardadas! A testar ligação...', 'info');
    setIsTesting(true);
    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message,
      tablesList: res.tablesList
    });

    if (res.success) {
      showToast('Supabase conectado com sucesso!', 'success');
      handleSync();
    } else {
      showToast('Credenciais guardadas mas a ligação falhou. Verifique os dados.', 'error');
    }
  };

  const handleClear = () => {
    clearCustomSupabaseConfig();
    const updated = getSupabaseConfig();
    setConfig(updated);
    setUrlInput(updated.url);
    setKeyInput(updated.anonKey);
    setTestResult({ tested: false, success: false, message: '' });
    showToast('Configuração personalizada removida. A usar modo local ou variáveis de ambiente.', 'info');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithSupabase();
      showToast('Dados sincronizados com o Supabase!', 'success');
    } catch {
      showToast('Erro ao sincronizar com o Supabase', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCustomPassphrase = async () => {
    if (!passphraseInput.trim()) {
      showToast('A chave de cifra não pode estar vazia.', 'error');
      return;
    }
    setMasterEncryptionPassphrase(passphraseInput.trim());
    const newKeyId = await getEncryptionKeyId();
    setEncryptionKeyId(newKeyId);
    showToast('Chave de cifra do clube atualizada com sucesso!', 'success');
  };

  const handleResetPassphrase = async () => {
    resetMasterEncryptionPassphrase();
    setPassphraseInput(getMasterEncryptionPassphrase());
    const newKeyId = await getEncryptionKeyId();
    setEncryptionKeyId(newKeyId);
    showToast('Chave de cifra restaurada para a predefinição.', 'info');
  };

  const handleRunEncryptionTest = async () => {
    if (!testPlaintext.trim()) return;
    setIsTestingEncryption(true);
    try {
      const encrypted = await encryptText(testPlaintext);
      setTestEncryptedOutput(encrypted || '');
      if (encrypted) {
        const decrypted = await decryptText(encrypted);
        setTestDecryptedOutput(decrypted || '');
      }
    } catch (err: any) {
      showToast('Erro no teste de cifra: ' + (err?.message || ''), 'error');
    } finally {
      setIsTestingEncryption(false);
    }
  };

  const handleBulkEncryptAndSync = async () => {
    setIsEncryptSyncing(true);
    setEncryptSyncStats(null);
    try {
      const res = await encryptAndSyncAllPersonalDataToSupabase({
        athletes,
        coaches,
        profiles: availableUsers,
        authorizations,
        carpools
      });
      setEncryptSyncStats(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast('Erro ao cifrar e sincronizar dados: ' + (err?.message || ''), 'error');
    } finally {
      setIsEncryptSyncing(false);
    }
  };

  const categories = ['todas', ...Array.from(new Set(SUPABASE_TABLES_SCHEMA.map(t => t.category)))];

  const filteredTables = SUPABASE_TABLES_SCHEMA.filter(table => {
    const matchesCategory = selectedCategory === 'todas' || table.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!schemaSearch.trim()) return true;
    const query = schemaSearch.toLowerCase();
    const matchesTableName = table.name.toLowerCase().includes(query) || table.label.toLowerCase().includes(query);
    const matchesColumns = table.columns.some(c => 
      c.name.toLowerCase().includes(query) || 
      c.description.toLowerCase().includes(query) ||
      c.type.toLowerCase().includes(query)
    );
    return matchesTableName || matchesColumns;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-xs border border-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900">
                Base de Dados Cloud & Supabase
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : supabaseStatus === 'connecting'
                  ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {supabaseStatus === 'connected' ? 'Conectado' : supabaseStatus === 'connecting' ? 'A Ligar' : 'Modo Local'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Conectividade, sincronização e gestão das tabelas da base de dados PostgreSQL.
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

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 pb-2.5 bg-slate-50/90 border-b border-slate-200 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'connection'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ligação & Teste</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Campos & Tabelas ({SUPABASE_TABLES_SCHEMA.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'scripts'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-600" />
            <span>Scripts SQL & Atualização</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
              Seguro
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guia no Painel Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('encryption')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'encryption'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cifra & RGPD</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
              AES-256
            </span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-5 sm:p-6 text-slate-800">
          {/* TAB 1: CONNECTION */}
          {activeTab === 'connection' && (
            <div className="space-y-5">
              {/* RGPD Encryption Banner in Connection tab */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-800/40">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                        Cifra de Dados Pessoais Ativa (AES-GCM 256-bit)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        RGPD Art. 9º / 32º
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Telefones, emails, moradas e registos de saúde de atletas, treinadores e encarregados são cifrados diretamente no navegador antes de serem enviados para a base de dados PostgreSQL.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('encryption')}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Gerir Cifra & Chave</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 flex-wrap ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : config.isConfigured
                  ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    supabaseStatus === 'connected'
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-400'
                      : config.isConfigured
                      ? 'bg-blue-500 shadow-sm shadow-blue-400'
                      : 'bg-amber-500 shadow-sm shadow-amber-400'
                  }`} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">
                      {supabaseStatus === 'connected'
                        ? 'Base de Dados Conectada e Ativa'
                        : config.isConfigured
                        ? 'Credenciais Configuradas'
                        : 'Modo Local (Armazenamento no Navegador)'}
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {supabaseStatus === 'connected'
                        ? `Origem: ${config.source === 'env' ? 'Variáveis de Ambiente (.env)' : 'Configuração Personalizada (UI)'}`
                        : config.isConfigured
                        ? 'Execute o teste de ligação abaixo para validar a conectividade.'
                        : 'Insira o Project URL e a Anon Key abaixo para conectar a uma base de dados Supabase.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={!config.isConfigured || isSyncing}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    title="Descarregar dados mais recentes do Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'A Sincronizar...' : 'Sincronizar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={isTesting || (!urlInput && !config.url)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'A Testar...' : 'Testar Ligação'}</span>
                  </button>
                </div>
              </div>

              {/* Test Result Message */}
              {testResult.tested && (
                <div className="space-y-2.5 animate-in fade-in">
                  <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 border ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-red-50 text-red-900 border-red-300'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold">{testResult.success ? 'Conexão Bem-Sucedida' : 'Falha na Ligação'}</p>
                      <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{testResult.message}</p>
                    </div>
                  </div>

                  {testResult.tablesList && testResult.tablesList.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Verificação Individual das Tabelas ({testResult.tablesList.filter(t => t.status === 'ok').length}/{testResult.tablesList.length}):</span>
                        <span className="text-[10px] font-mono text-slate-500">PostgreSQL public.*</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {testResult.tablesList.map((tbl) => (
                          <div
                            key={tbl.name}
                            className={`flex items-center justify-between p-2 rounded-xl text-[11px] border transition-colors ${
                              tbl.status === 'ok'
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : 'bg-red-50/70 border-red-200 text-red-900'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {tbl.status === 'ok' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              )}
                              <span className="font-semibold truncate">{tbl.label}</span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/70 border border-slate-200/50 shrink-0 ml-1">
                              {tbl.status === 'ok' ? `${tbl.count ?? 0} reg.` : 'Erro'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {testResult.tablesList.some(t => t.status !== 'ok') ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs mt-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-950">Tabelas não criadas ou com colunas em falta!</p>
                              <p className="text-amber-800 text-[11px] mt-0.5">
                                Execute o nosso Script de Atualização no SQL Editor do Supabase para criar/atualizar tudo em 5 segundos sem perder dados.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('scripts')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <span>Ver Script</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-3 text-[11px] mt-2 text-emerald-900">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Para sincronizar novos campos (ex: documentos anexados, autorizações parentais), consulte os <strong>Scripts SQL</strong>.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('scripts')}
                            className="text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0 cursor-pointer text-[11px]"
                          >
                            Ver Scripts
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Credentials Form */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-slate-600" />
                    Credenciais do Projeto Supabase
                  </h4>
                  {config.source === 'custom' && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar chaves guardadas
                    </button>
                  )}
                </div>

                {/* Project URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project URL (VITE_SUPABASE_URL)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://xyzprojectid.supabase.co"
                      className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Encontra este valor no Supabase Dashboard em <strong>Project Settings &gt; API &gt; Project URL</strong>.
                  </p>
                </div>

                {/* Project Anon Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project API Key (Anon / Public - VITE_SUPABASE_ANON_KEY)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    A chave anónima pública (anon / public) é segura para ser utilizada na aplicação web com as regras de segurança RLS ativas.
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar e Ligar ao Supabase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schemaSearch}
                    onChange={(e) => setSchemaSearch(e.target.value)}
                    placeholder="Pesquisar tabela ou campo (ex: birth_date, nif, grau)..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                  {schemaSearch && (
                    <button
                      onClick={() => setSchemaSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExpandAll(true)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Expandir Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpandAll(false)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Recolher
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full capitalize text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Tables List */}
              <div className="space-y-3">
                {filteredTables.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                    Nenhum campo ou tabela encontrado para o termo &ldquo;{schemaSearch}&rdquo;.
                  </div>
                ) : (
                  filteredTables.map((table) => {
                    const isExpanded = !!expandedTables[table.name];
                    return (
                      <div
                        key={table.name}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                      >
                        <div
                          onClick={() => toggleTableExpand(table.name)}
                          className="px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  public.{table.name}
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {table.label}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                                  {table.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {table.description} &bull; {table.columns.length} campos
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">
                            {isExpanded ? 'Ocultar' : 'Ver Campos'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100/60 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                                  <th className="py-2.5 px-4">Nome do Campo</th>
                                  <th className="py-2.5 px-4">Tipo PostgreSQL</th>
                                  <th className="py-2.5 px-4">Chave / Opcional</th>
                                  <th className="py-2.5 px-4">Descrição & Conteúdo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {table.columns.map((col) => {
                                  const isHighlighted = schemaSearch && (
                                    col.name.toLowerCase().includes(schemaSearch.toLowerCase()) ||
                                    col.description.toLowerCase().includes(schemaSearch.toLowerCase())
                                  );

                                  return (
                                    <tr
                                      key={col.name}
                                      className={`hover:bg-slate-50/80 transition-colors ${
                                        isHighlighted ? 'bg-amber-50/70' : ''
                                      }`}
                                    >
                                      <td className="py-2 px-4 font-mono font-bold text-slate-900 text-[11px]">
                                        {col.name}
                                      </td>
                                      <td className="py-2 px-4 font-mono text-emerald-700 text-[11px]">
                                        {col.type}
                                      </td>
                                      <td className="py-2 px-4 whitespace-nowrap">
                                        {col.isPrimary ? (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                            PRIMARY KEY
                                          </span>
                                        ) : col.isNullable === false ? (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                            NOT NULL
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400">
                                            Opcional
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-4 text-[11px] text-slate-600 leading-snug">
                                        {col.description}
                                        {col.defaultValue && (
                                          <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                                            (Padrão: {col.defaultValue})
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SCRIPTS SQL & ATUALIZAÇÃO */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              {/* Top Explanatory Banner */}
              <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold border border-emerald-400/30">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        Script de Atualização & Migração da Base de Dados
                      </h4>
                      <p className="text-xs text-emerald-200">
                        100% seguro &bull; Não apaga dados existentes &bull; Adiciona novos campos e tabelas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUpdateSql}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
                    >
                      {copiedUpdateSql ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedUpdateSql ? 'Copiado para a Área de Transferência!' : 'Copiar Script de Atualização'}</span>
                    </button>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 transition-all"
                    >
                      <span>Abrir Supabase</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-emerald-100 border-t border-emerald-800/60">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Novos documentos do clube (PDFs)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Destinatário específico em comunicados</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Cédula TPTD, diplomas e autorizações</span>
                  </div>
                </div>
              </div>

              {/* Destaque: Atualização Específica da Tabela de Treinadores */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-amber-950 dark:text-amber-200">
                        Alteração na Tabela de Treinadores: Coluna &quot;is_admin&quot;
                      </h5>
                      <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                        Para ativar e persistir o estatuto de Administrador diretamente na base de dados Supabase, adicione a coluna <code className="font-mono bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded text-[10px]">is_admin</code> à tabela <code className="font-mono bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded text-[10px]">coaches</code> e <code className="font-mono bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded text-[10px]">profiles</code>.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCoachSql}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    {copiedCoachSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCoachSql ? 'Copiado!' : 'Copiar SQL Treinadores'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                  <pre>{`ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;\nALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`}</pre>
                </div>
              </div>

              {/* Instructions Step-by-Step */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Como Executar no Supabase em 4 Passos Simples:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black inline-flex items-center justify-center">1</span>
                    <p className="font-bold text-slate-900 text-[11px]">Copiar o Script</p>
                    <p className="text-[10px] text-slate-500">Clique no botão verde acima &ldquo;Copiar Script de Atualização&rdquo;.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black inline-flex items-center justify-center">2</span>
                    <p className="font-bold text-slate-900 text-[11px]">Ir ao SQL Editor</p>
                    <p className="text-[10px] text-slate-500">No menu lateral esquerdo do Supabase, clique em <strong>SQL Editor</strong> &gt; <strong>+ New query</strong>.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black inline-flex items-center justify-center">3</span>
                    <p className="font-bold text-slate-900 text-[11px]">Colar e Executar</p>
                    <p className="text-[10px] text-slate-500">Cole o código na janela do editor e clique no botão verde <strong>RUN</strong>.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black inline-flex items-center justify-center">4</span>
                    <p className="font-bold text-slate-900 text-[11px]">Testar Ligação</p>
                    <p className="text-[10px] text-slate-500">Volte ao separador &ldquo;Ligação & Teste&rdquo; e clique em <strong>Testar Ligação</strong> para confirmar!</p>
                  </div>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 text-slate-300 flex items-center justify-between text-xs font-mono border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-white">supabase_update.sql</span>
                    <span className="text-slate-500 text-[10px]">(PostgreSQL / Supabase DDL)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpdateSql}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedUpdateSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpdateSql ? 'Copiado!' : 'Copiar Tudo'}</span>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto p-4 bg-slate-950 font-mono text-[11px] text-slate-300 leading-relaxed">
                  <pre className="whitespace-pre">{SUPABASE_UPDATE_SQL}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950">
                <p className="font-extrabold text-sm text-emerald-900 mb-1">
                  Existem 3 formas de visualizar os campos diretamente no Supabase:
                </p>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Pode usar a interface visual tipo folha de cálculo (Table Editor), o inspetor técnico de esquemas (Database &gt; Tables) ou correr uma consulta SQL rápida.
                </p>
              </div>

              {/* Method 1: Table Editor */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Editor de Tabelas (Table Editor) &mdash; O Mais Visual e Intuitivo
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                  No painel do Supabase, no menu lateral esquerdo, clique no ícone da grelha de tabela (<strong>Table Editor</strong>). 
                  Clique em qualquer uma das 11 tabelas (ex: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">athletes</code> ou <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">age_categories</code>). 
                  Irá ver os dados em formato de folha de cálculo com todas as colunas no cabeçalho.
                </p>
              </div>

              {/* Method 2: Database -> Tables */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Menu Database &gt; Tables &mdash; Estrutura Técnica Completa
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                  No menu lateral esquerdo, clique no ícone de cilindro de base de dados (<strong>Database</strong>) e selecione <strong>Tables</strong>. 
                  Ao clicar numa tabela, abre-se a lista exata com colunas, tipos de dados e chaves.
                </p>
              </div>

              {/* Method 3: SQL Query */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-800 font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      SQL Editor &mdash; Listar Todos os Campos de Uma Só Vez
                    </h4>
                  </div>
                  <button
                    onClick={handleCopySqlQuery}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedQuery ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                  No <strong>SQL Editor</strong> do Supabase, pode colar esta consulta para ver imediatamente todas as colunas de todas as tabelas:
                </p>
                <div className="pl-8">
                  <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto leading-relaxed">
{`SELECT 
    table_name AS "Tabela",
    column_name AS "Campo",
    data_type AS "Tipo",
    is_nullable AS "Opcional"
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;`}
                  </pre>
                </div>
              </div>

              {/* Direct Link */}
              <div className="pt-2 flex justify-end">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Abrir Painel do Supabase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 5: ENCRYPTION & RGPD */}
          {activeTab === 'encryption' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white shadow-xs border border-emerald-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-white">
                          Cifra Zero-Knowledge & RGPD (Artigo 9º e 32º)
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                          AES-GCM 256-bit ATIVA
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Todos os dados pessoais e dados de saúde de atletas, treinadores e encarregados são cifrados diretamente no navegador com recurso à <strong>Web Crypto API</strong> antes de serem transmitidos para o Supabase/PostgreSQL. Nem mesmo o administrador do servidor da base de dados consegue visualizar estes dados em texto simples.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBulkEncryptAndSync}
                      disabled={isEncryptSyncing || !config.isConfigured}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock className={`w-4 h-4 ${isEncryptSyncing ? 'animate-spin' : ''}`} />
                      <span>{isEncryptSyncing ? 'A Cifrar...' : 'Cifrar & Guardar Dados no Supabase'}</span>
                    </button>
                  </div>
                </div>

                {/* Specs Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-emerald-800/40 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Algoritmo</span>
                    <span className="font-mono text-white text-xs font-bold">AES-GCM 256-bit</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Derivação KDF</span>
                    <span className="font-mono text-white text-xs font-bold">PBKDF2 (100k iter)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Norma Criptográfica</span>
                    <span className="font-mono text-white text-xs font-bold">Web Crypto API</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Formato na BD</span>
                    <span className="font-mono text-white text-xs font-bold">enc:v1:iv:cipher</span>
                  </div>
                </div>
              </div>

              {/* Bulk Sync Stats Feedback */}
              {encryptSyncStats && (
                <div className={`p-4 rounded-2xl border ${
                  encryptSyncStats.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                } flex items-start gap-3`}>
                  {encryptSyncStats.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{encryptSyncStats.message}</p>
                    {encryptSyncStats.success && (
                      <p className="text-[11px] text-emerald-800">
                        Atletas cifrados: <strong>{encryptSyncStats.athletesCount}</strong> | Treinadores cifrados: <strong>{encryptSyncStats.coachesCount}</strong> | Perfis & Encarregados: <strong>{encryptSyncStats.profilesCount}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Protected Fields Grid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span>Campos Pessoais e de Saúde Cifrados por Entidade</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Campos que contêm dados pessoais identificáveis ou categorias especiais de dados segundo o RGPD.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {secReport.protectedFieldsCount} Campos Protegidos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Athletes */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Atletas ({athletes.length} registados)
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        9 campos
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600">
                      <li className="flex items-center justify-between">
                        <span>Telefone do Atleta</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">phone</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Email do Atleta</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">email</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Morada Residencial</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">address</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Nome Encarregado</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">guardian_name</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Telefone Encarregado</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">guardian_phone</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Email Encarregado</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">guardian_email</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Contacto Emergência</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">emergency_contact</code>
                      </li>
                      <li className="flex items-center justify-between text-emerald-800 font-bold bg-emerald-50/70 px-2 py-1 rounded-lg border border-emerald-200/60">
                        <span>Alergias & Saúde (Art. 9º)</span>
                        <code className="text-[10px] bg-emerald-200/60 px-1.5 py-0.5 rounded text-emerald-900">allergies</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Observações Privadas</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">notes</code>
                      </li>
                    </ul>
                  </div>

                  {/* Coaches */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        Treinadores ({coaches.length} registados)
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                        5 campos
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600">
                      <li className="flex items-center justify-between">
                        <span>Telefone Pessoal</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">phone</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Email de Contacto</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">email</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Morada Residencial</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">address</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Cédula de Treinador</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">license_number</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Biografia / Notas</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">bio</code>
                      </li>
                    </ul>
                  </div>

                  {/* Guardians and Profiles */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Encarregados & Boleias
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                        5 campos
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600">
                      <li className="flex items-center justify-between">
                        <span>Telefone no Perfil</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">phone</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Morada no Perfil</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">address</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Contacto para Boleias</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">contact_phone</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Notas da Boleia</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">notes</code>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Notas de Autorização</span>
                        <code className="text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">notes</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Master Key Configuration Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>Gestão da Frase-Chave Mestra do Clube</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      A Frase-Chave é usada para derivar a chave de 256 bits através de PBKDF2. Deve ser idêntica em todos os dispositivos que acedem à mesma base de dados.
                    </p>
                  </div>
                  {encryptionKeyId && (
                    <span className="font-mono text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                      ID: {encryptionKeyId}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Frase-Chave de Cifra</span>
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {showPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassphrase ? 'Ocultar' : 'Mostrar'}</span>
                      </button>
                    </label>
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphraseInput}
                      onChange={e => setPassphraseInput(e.target.value)}
                      placeholder="Introduza a frase-chave secreta do clube..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCustomPassphrase}
                      className="flex-1 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPassphrase}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Repor Frase-Chave Predefinida"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  🔒 <strong>Nota de Segurança:</strong> A chave mestra nunca é enviada pela rede nem gravada na base de dados Supabase. Permanece exclusivamente na memória do navegador e no armazenamento seguro do dispositivo.
                </p>
              </div>

              {/* Interactive Cipher Playground */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Simulador Interativo de Cifra AES-GCM (Testador ao Vivo)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Teste como qualquer dado confidencial (contacto, morada, alergia médica) é cifrado antes de ser gravado na base de dados.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={testPlaintext}
                      onChange={e => setTestPlaintext(e.target.value)}
                      placeholder="Escreva um dado confidencial para testar (ex: +351 912 345 678)..."
                      className="flex-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleRunEncryptionTest}
                      disabled={isTestingEncryption || !testPlaintext.trim()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isTestingEncryption ? 'A Cifrar...' : 'Testar Cifra AES-GCM'}</span>
                    </button>
                  </div>

                  {testEncryptedOutput && (
                    <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 space-y-2 border border-slate-800 font-mono text-[11px]">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                          Valor Guardado no Supabase / PostgreSQL (Ciphertext):
                        </span>
                        <p className="break-all text-emerald-300 bg-slate-950/80 p-2 rounded-lg mt-1 border border-emerald-900/50">
                          {testEncryptedOutput}
                        </p>
                      </div>
                      {testDecryptedOutput && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                              Valor Decifrado na Aplicação:
                            </span>
                            <span className="text-white font-bold">{testDecryptedOutput}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            100% Integridade Validada
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bulk Encrypt and Save Callout */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="font-extrabold text-xs text-slate-900">
                    Sincronização Cifrada Imediata para o Supabase
                  </h5>
                  <p className="text-xs text-slate-500">
                    Clique no botão para cifrar todos os dados locais existentes ({athletes.length} atletas, {coaches.length} treinadores, {availableUsers?.length || 0} utilizadores) e sincronizá-los com o Supabase com segurança reforçada.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBulkEncryptAndSync}
                  disabled={isEncryptSyncing || !config.isConfigured}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Lock className={`w-4 h-4 ${isEncryptSyncing ? 'animate-spin' : ''}`} />
                  <span>{isEncryptSyncing ? 'A Cifrar e Enviar...' : 'Cifrar & Guardar Agora'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
