import React, { useState, useEffect } from 'react';
import { useApp, PasswordResetEmailPreview } from '../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Eye,
  EyeOff,
  KeyRound,
  X,
  CheckCircle2,
  HelpCircle,
  Send,
  RefreshCw,
  Copy,
  Check,
  Inbox
} from 'lucide-react';
import { UserRole } from '../types';

export const AuthScreen: React.FC = () => {
  const {
    login,
    requestPasswordResetEmail,
    verifyResetCodeAndSetPassword,
    register,
    clubInfo
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Secure Password Recovery (Email-first + 6-digit OTP verification)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'success'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailPreviewData, setEmailPreviewData] = useState<PasswordResetEmailPreview | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('2009-05-15');
  const [regRole, setRegRole] = useState<UserRole>('atleta');
  const [regFedNumber, setRegFedNumber] = useState('');
  const [regCoachGrade, setRegCoachGrade] = useState('Grau II - Treinador de Desporto');
  const [regNotes, setRegNotes] = useState('');
  const [regGuardianName, setRegGuardianName] = useState('');
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = login(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.message || 'Erro ao iniciar sessão.');
    }
  };

  const openForgotModal = (emailToUse?: string) => {
    setForgotEmail(emailToUse || loginEmail);
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotFeedback(null);
    setForgotStep('request');
    setEmailPreviewData(null);
    setCopiedCode(false);
    setIsForgotModalOpen(true);
  };

  // Step 1: Request verification email
  const handleRequestResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setForgotFeedback({ type: 'error', message: 'Por favor indique o seu endereço de email.' });
      return;
    }

    setIsSendingResetEmail(true);
    try {
      const res = await requestPasswordResetEmail(cleanEmail);
      if (res.success) {
        setEmailPreviewData(res.emailPreview || null);
        setForgotStep('verify');
        setForgotFeedback({
          type: 'success',
          message: `Código de recuperação gerado e enviado para ${cleanEmail}.`
        });
      } else {
        setForgotFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setForgotFeedback({ type: 'error', message: 'Ocorreu um erro ao processar o envio do email.' });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Step 2: Resend email
  const handleResendCode = async () => {
    setForgotFeedback(null);
    setIsSendingResetEmail(true);
    try {
      const res = await requestPasswordResetEmail(forgotEmail);
      if (res.success) {
        setEmailPreviewData(res.emailPreview || null);
        setForgotFeedback({
          type: 'success',
          message: `Novo código de segurança enviado com sucesso para ${forgotEmail}.`
        });
      } else {
        setForgotFeedback({ type: 'error', message: res.message });
      }
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Step 3: Validate code and set new password
  const handleVerifyAndResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);

    const cleanCode = forgotCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setForgotFeedback({
        type: 'error',
        message: 'Por favor introduza o código de segurança de 6 dígitos recebido no seu email.'
      });
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotFeedback({
        type: 'error',
        message: 'A nova palavra-passe deve ter pelo menos 6 carateres.'
      });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotFeedback({
        type: 'error',
        message: 'A confirmação da palavra-passe não coincide. Por favor tente novamente.'
      });
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = verifyResetCodeAndSetPassword(forgotEmail, cleanCode, forgotNewPassword);
      if (res.success) {
        setForgotStep('success');
        setLoginEmail(forgotEmail);
        setLoginPassword(forgotNewPassword);
      } else {
        setForgotFeedback({ type: 'error', message: res.message });
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (emailPreviewData?.code) {
      navigator.clipboard.writeText(emailPreviewData.code);
      setForgotCode(emailPreviewData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Por favor preencha todos os campos obrigatórios (Nome e Email).');
      return;
    }

    const res = register({
      name: regName,
      email: regEmail,
      role: regRole,
      phone: regPhone.trim() || undefined,
      birthDate: regBirthDate,
      password: regPassword || undefined,
      federationNumber: regFedNumber,
      coachGrade: regRole === 'treinador' ? regCoachGrade.trim() || undefined : undefined,
      notes: regRole !== 'treinador' ? regNotes : undefined,
      relatedAthleteName: regRole === 'encarregado' ? regGuardianName : undefined
    });

    if (!res.success) {
      setRegError(res.message || 'Erro no registo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-xl w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-xl shadow-amber-500/20 mb-2">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {clubInfo.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Plataforma Integrada de Gestão Desportiva
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-700/80">
            <button
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`py-4 text-center font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${mode === 'login'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
            >
              <Lock className="w-4 h-4" />
              <span>Iniciar Sessão</span>
            </button>
            <button
              onClick={() => {
                setMode('register');
                setRegError('');
              }}
              className={`py-4 text-center font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${mode === 'register'
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
            >
              <User className="w-4 h-4" />
              <span>Criar Nova Conta</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* LOGIN FORM */}
            {mode === 'login' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Bem-vindo de volta</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Insira as suas credenciais para aceder à plataforma do clube.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Endereço de Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="exemplo@maisdesporto.pt"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Palavra-passe
                      </label>
                      <button
                        type="button"
                        onClick={() => openForgotModal(loginEmail)}
                        className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-medium transition-colors cursor-pointer"
                      >
                        Esqueci-me da palavra-passe?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        title={showLoginPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Entrar no Clube</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Criar Novo Registo</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Preencha os seus dados para submeter a candidatura de filiação ao clube.
                  </p>
                </div>

                {/* Important Approval Warning */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-200 text-xs leading-relaxed">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 block mb-0.5 font-bold">Aprovação Obrigatória por Treinador</strong>
                    Todos os novos registos necessitam de validação prévia pela equipa técnica antes de ser concedido o acesso integral à plataforma.
                  </div>
                </div>

                {regError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Tipo de Perfil *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('atleta')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${regRole === 'atleta'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                      >
                        🏊 Atleta
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('encarregado')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${regRole === 'encarregado'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                      >
                        👨‍👩‍👦 Encarregado
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('treinador')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${regRole === 'treinador'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                      >
                        👔 Treinador
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nome Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          placeholder="Ex: João Miguel Santos"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="joao.santos@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Palavra-passe sem preenchimento por defeito e com toggle de visualização */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Palavra-passe *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                          title={showRegPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Telefone para Atleta, Encarregado e Treinador */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Telefone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          placeholder="Ex: 912 345 678"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Data Nascimento
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          value={regBirthDate}
                          onChange={e => setRegBirthDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Campos específicos para ATLETA */}
                  {regRole === 'atleta' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nº de Filiação
                      </label>
                      <input
                        type="text"
                        value={regFedNumber}
                        onChange={e => setRegFedNumber(e.target.value)}
                        placeholder="Ex: FPN-12345"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      />
                    </div>
                  )}

                  {/* Campos específicos para ENCARREGADO */}
                  {regRole === 'encarregado' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nome do(a) Atleta / Educando
                      </label>
                      <input
                        type="text"
                        value={regGuardianName}
                        onChange={e => setRegGuardianName(e.target.value)}
                        placeholder="Ex: Marta Santos"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      />
                    </div>
                  )}

                  {/* Campos específicos para TREINADOR: Apenas Grau e Cédula (Morada e Diploma retirados) */}
                  {regRole === 'treinador' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Grau de Treinador
                        </label>
                        <input
                          type="text"
                          value={regCoachGrade}
                          onChange={e => setRegCoachGrade(e.target.value)}
                          placeholder="Ex: Grau II - Treinador de Desporto"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Nº Cédula TPTD
                        </label>
                        <input
                          type="text"
                          value={regFedNumber}
                          onChange={e => setRegFedNumber(e.target.value)}
                          placeholder="Ex: TPTD-74291"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notas para o Treinador / Histórico: Apenas para Atleta e Encarregado (retirado para Treinador) */}
                  {regRole !== 'treinador' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Notas para o Treinador / Histórico Desportivo
                      </label>
                      <textarea
                        rows={2}
                        value={regNotes}
                        onChange={e => setRegNotes(e.target.value)}
                        placeholder="Ex: Pratico Natação nos mesmos dia dos treinos de Atletismo..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-sm"
                  >
                    <span>Submeter Pedido de Registo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          {clubInfo.name} &bull; Plataforma Oficial de Gestão Desportiva &bull; Época 2026/2027
        </p>
      </div>

      {/* Modal: Recuperação de Palavra-passe Segura por Email */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative my-8">
            <button
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotFeedback(null);
                setForgotStep('request');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                {forgotStep === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : forgotStep === 'verify' ? (
                  <Inbox className="w-6 h-6 text-amber-400" />
                ) : (
                  <Mail className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {forgotStep === 'success'
                    ? 'Palavra-passe Redefinida'
                    : forgotStep === 'verify'
                      ? 'Verificar Código de Segurança'
                      : 'Recuperar Palavra-passe por Email'}
                </h3>
                <p className="text-xs text-slate-400">
                  {clubInfo.name} &bull; Processo de Segurança Auditado
                </p>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="grid grid-cols-3 gap-2 py-1">
              <div className={`h-1.5 rounded-full transition-all ${forgotStep === 'request' ? 'bg-amber-400' : 'bg-emerald-500'
                }`} />
              <div className={`h-1.5 rounded-full transition-all ${forgotStep === 'verify' ? 'bg-amber-400' : forgotStep === 'success' ? 'bg-emerald-500' : 'bg-slate-800'
                }`} />
              <div className={`h-1.5 rounded-full transition-all ${forgotStep === 'success' ? 'bg-emerald-500' : 'bg-slate-800'
                }`} />
            </div>

            {/* Feedback Alert */}
            {forgotFeedback && (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs leading-relaxed ${forgotFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
              >
                {forgotFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                )}
                <span>{forgotFeedback.message}</span>
              </div>
            )}

            {/* STEP 1: Request Email */}
            {forgotStep === 'request' && (
              <form onSubmit={handleRequestResetEmail} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verificação Segura via Correio Eletrónico</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Para proteção integral da sua conta desportiva, não é permitida a alteração direta sem validação do titular. Introduza o seu endereço de email para receber um código temporário de utilização única (OTP).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Endereço de Email Registado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="exemplo@maisdesporto.pt"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotFeedback(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingResetEmail}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSendingResetEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A processar envio...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Código por Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify Code & Set New Password */}
            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                {/* Email dispatch preview card */}
                {emailPreviewData && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400">
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Notificação Enviada para o Correio Eletrónico</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Válido 15 min
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <div><span className="text-slate-500">Destinatário:</span> <strong className="text-white">{emailPreviewData.recipientName}</strong> &lt;{emailPreviewData.to}&gt;</div>
                      <div><span className="text-slate-500">Assunto:</span> Código de Segurança &bull; Reposição de Palavra-passe</div>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-700/80">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Código de Verificação:</div>
                        <div className="font-mono text-base font-black text-amber-300 tracking-widest mt-0.5">
                          {emailPreviewData.code}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Código Inserido!' : 'Inserir Código'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Input: Security Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Código de Segurança (6 Dígitos)
                    </label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isSendingResetEmail}
                      className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSendingResetEmail ? 'animate-spin' : ''}`} />
                      <span>Reenviar código</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={forgotCode}
                      onChange={e => setForgotCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono tracking-widest font-bold text-center"
                    />
                  </div>
                </div>

                {/* Input: New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nova Palavra-passe (mínimo 6 carateres)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="Nova palavra-passe segura..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      title={showForgotNewPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Input: Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirmar Nova Palavra-passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgotConfirmPassword}
                      onChange={e => setForgotConfirmPassword(e.target.value)}
                      placeholder="Repita a nova palavra-passe..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      title={showForgotConfirmPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request');
                      setForgotFeedback(null);
                    }}
                    className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Alterar Email</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        setForgotFeedback(null);
                        setForgotStep('request');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingCode}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isVerifyingCode ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>A validar...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Validar e Redefinir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: Success Confirmation */}
            {forgotStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-white">
                    Palavra-passe Redefinida com Sucesso!
                  </h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                    A sua conta <strong className="text-white">{forgotEmail}</strong> foi atualizada de forma segura após confirmação por correio eletrónico.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Registo de Auditoria de Segurança:</span>
                  </div>
                  <div>&bull; Validação de código OTP de 6 dígitos concluída</div>
                  <div>&bull; Nova credencial encriptada e pronta a utilizar</div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotFeedback(null);
                      setForgotStep('request');
                    }}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Concluir e Iniciar Sessão</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
