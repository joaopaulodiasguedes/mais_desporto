import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  MapPin,
  FileText,
  Phone,
  Mail,
  Award,
  Globe,
  Instagram,
  Facebook,
  Edit3,
  Check,
  X,
  ExternalLink,
  Users,
  Calendar,
  Sparkles,
  Layers,
  ShieldAlert,
  Database,
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  FolderPlus,
  FileCheck,
  AlertCircle,
  Palette,
  UserCheck,
  Contact
} from 'lucide-react';
import { ClubInfo, ClubDocument } from '../types';
import { INITIAL_CLUB_DOCUMENTS } from '../data/initialData';
import { openOriginalDocument } from '../utils/documentUtils';
import { CLUB_COLOR_PRESETS, applyClubTheme } from '../utils/theme';

interface ClubTabProps {
  onOpenPdf: (title: string, url: string) => void;
}

export const ClubTab: React.FC<ClubTabProps> = ({ onOpenPdf }) => {
  const {
    clubInfo,
    updateClubInfo,
    hasPermission,
    currentUser,
    athletes,
    coaches,
    availableUsers,
    calendarEvents,
    results,
    setActiveTab,
    resetAllData,
    setIsSupabaseModalOpen,
    supabaseStatus,
    showToast
  } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ClubInfo>(clubInfo);

  // Estados para Gestão de Documentos em "Instalações & Apoio"
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docFormData, setDocFormData] = useState<{
    title: string;
    category: string;
    description: string;
    fileUrl: string;
    fileName: string;
    fileType: 'pdf' | 'image' | 'doc' | 'other';
    fileSize: string;
  }>({
    title: '',
    category: 'Instalações & Recintos',
    description: '',
    fileUrl: '',
    fileName: '',
    fileType: 'pdf',
    fileSize: ''
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canEdit = hasPermission('canEditClubInfo') || currentUser.role === 'treinador';

  // Lista de documentos associados ao clube e instalações (com fallback para os documentos iniciais)
  const documentsList: ClubDocument[] =
    clubInfo.documents && clubInfo.documents.length > 0
      ? clubInfo.documents
      : INITIAL_CLUB_DOCUMENTS;

  const handleOpenInsertDocModal = () => {
    setDocFormData({
      title: '',
      category: 'Instalações & Recintos',
      description: '',
      fileUrl: '',
      fileName: '',
      fileType: 'pdf',
      fileSize: ''
    });
    setUploadError(null);
    setIsDocModalOpen(true);
  };

  const handleFileProcess = (file: File) => {
    setUploadError(null);
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('O ficheiro é demasiado grande (tamanho máximo de 15MB).');
      return;
    }

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    let fileType: 'pdf' | 'image' | 'doc' | 'other' = 'other';
    if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      fileType = 'pdf';
    } else if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerName.endsWith('.odt')) {
      fileType = 'doc';
    }

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setDocFormData(prev => ({
        ...prev,
        fileUrl: result,
        fileName: fileName,
        fileType: fileType,
        fileSize: formatSize(file.size),
        title: prev.title.trim() ? prev.title : fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
    };
    reader.onerror = () => {
      setUploadError('Erro ao carregar o ficheiro local.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormData.title.trim()) {
      setUploadError('Por favor indique o título do documento.');
      return;
    }
    if (!docFormData.fileUrl.trim()) {
      setUploadError('Por favor selecione um ficheiro local ou introduza um link URL válido.');
      return;
    }

    const newDoc: ClubDocument = {
      id: `doc-${Date.now()}`,
      title: docFormData.title.trim(),
      category: docFormData.category,
      description: docFormData.description.trim() || undefined,
      fileUrl: docFormData.fileUrl.trim(),
      fileName: docFormData.fileName || (docFormData.fileUrl.startsWith('data:') ? 'documento.pdf' : docFormData.fileUrl.split('/').pop() || 'documento.pdf'),
      fileType: docFormData.fileType,
      fileSize: docFormData.fileSize || 'N/D',
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedByCoachName: currentUser.name
    };

    const currentDocs = clubInfo.documents && clubInfo.documents.length > 0
      ? clubInfo.documents
      : INITIAL_CLUB_DOCUMENTS;

    const updatedDocs = [newDoc, ...currentDocs];
    updateClubInfo({ documents: updatedDocs });
    showToast('Documento inserido em Instalações e Apoio com sucesso!', 'success');
    setIsDocModalOpen(false);
  };

  const handleDeleteDoc = (docId: string, docTitle: string) => {
    if (window.confirm(`Tem a certeza que deseja remover o documento "${docTitle}" de Instalações e Apoio?`)) {
      const currentDocs = clubInfo.documents && clubInfo.documents.length > 0
        ? clubInfo.documents
        : INITIAL_CLUB_DOCUMENTS;
      const updatedDocs = currentDocs.filter(d => d.id !== docId);
      updateClubInfo({ documents: updatedDocs });
      showToast('Documento removido com sucesso.', 'info');
    }
  };

  const handleViewDoc = (doc: ClubDocument) => {
    // Abre logo o documento original diretamente
    openOriginalDocument(doc.fileUrl, doc.fileName || `${doc.title}.pdf`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateClubInfo(formData);
    setIsEditing(false);
  };

  const handleOpenEdit = () => {
    setFormData(clubInfo);
    setIsEditing(true);
  };

  const upcomingEventsCount = calendarEvents.filter(e => new Date(e.date) >= new Date()).length;

  const guardiansCount = useMemo(() => {
    const processedEmails = new Set<string>();
    const processedNames = new Set<string>();
    let count = 0;

    // 1. Process explicit user accounts with role === 'encarregado'
    const parentUsers = availableUsers.filter((u) => u.role === 'encarregado');
    parentUsers.forEach((u) => {
      count++;
      if (u.email) processedEmails.add(u.email.toLowerCase());
      processedNames.add(u.name.toLowerCase());
    });

    // 2. Process any other guardians present in athletes list not yet processed
    athletes.forEach((ath) => {
      const gName = ath.guardianName?.trim();
      const gEmail = ath.guardianEmail?.trim()?.toLowerCase();
      const isSelf =
        gName?.toLowerCase().includes('próprio') ||
        gName?.toLowerCase().includes('auto-responsável');

      if (gName && !isSelf) {
        const alreadyExists =
          (gEmail && processedEmails.has(gEmail)) ||
          processedNames.has(gName.toLowerCase());

        if (!alreadyExists) {
          count++;
          if (gEmail) processedEmails.add(gEmail);
          processedNames.add(gName.toLowerCase());
        }
      }
    });

    return count;
  }, [availableUsers, athletes]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner & Hero Header */}
      <div className="relative rounded-3xl overflow-hidden shadow-xs border border-slate-200 bg-white">
        <div className="h-44 sm:h-56 w-full relative bg-slate-900">
          <img
            src={clubInfo.bannerUrl}
            alt={clubInfo.name}
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

          {/* Action button if coach */}
          {canEdit && !isEditing && (
            <button
              onClick={handleOpenEdit}
              className="absolute top-4 right-4 bg-white/95 hover:bg-white text-slate-800 font-semibold px-3.5 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 border border-slate-200"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Editar Dados</span>
            </button>
          )}

          {/* Quick Tag */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white font-bold text-xs shadow-xs">
              <Sparkles className="w-3 h-3" />
              {clubInfo.modality}
            </span>
          </div>
        </div>

        {/* Club Profile Bar */}
        <div className="px-6 pb-6 pt-5 sm:pt-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              <div className="-mt-14 sm:-mt-18 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-white overflow-hidden shrink-0 z-10">
                <img
                  src={clubInfo.logoUrl}
                  alt="Logótipo do Clube"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="pt-2 sm:pt-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {clubInfo.name}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-blue-600 flex items-center gap-1.5 mt-1.5">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  Fundado em {clubInfo.foundationYear} • {clubInfo.modality}
                </p>
              </div>
            </div>

            {/* Quick Contact Badges */}
            <div className="flex items-center gap-2 flex-wrap sm:self-center pt-2 sm:pt-0">
              <a
                href={`tel:${clubInfo.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>{clubInfo.phone}</span>
              </a>
              <a
                href={`mailto:${clubInfo.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>{clubInfo.email}</span>
              </a>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {clubInfo.description}
          </p>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Treinadores */}
        <div
          onClick={() => setActiveTab('treinadores')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Treinadores</span>
            <UserCheck className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 text-center py-2">{coaches.length}</p>
        </div>

        {/* 2. Atletas */}
        <div
          onClick={() => setActiveTab('atletas')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Atletas</span>
            <Users className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 text-center py-2">{athletes.length}</p>
        </div>

        {/* 3. Enc. Educação */}
        <div
          onClick={() => setActiveTab('encarregados')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enc. Educação</span>
            <Contact className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 text-center py-2">{guardiansCount}</p>
        </div>

        {/* 4. Eventos */}
        <div
          onClick={() => setActiveTab('calendario')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eventos</span>
            <Calendar className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 text-center py-2">{upcomingEventsCount}</p>
        </div>

        {/* 5. Resultados */}
        <div
          onClick={() => setActiveTab('resultados')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resultados</span>
            <Award className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 text-center py-2">{results.length}</p>
        </div>
      </div>

      {/* Main Details Grid: Address, NIF, Contacts, Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Informações Institucionais & Fiscais */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Informação Institucional
              </h2>
              <p className="text-xs text-slate-500">Dados legais e localização do clube</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 font-medium">Modalidade</span>
              <span className="font-semibold text-slate-900">{clubInfo.modality}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 font-medium">NIF</span>
              <span className="font-semibold text-slate-900 font-mono">{clubInfo.nif}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 font-medium">Presidente</span>
              <span className="font-semibold text-slate-900">{clubInfo.presidentName}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 font-medium">Contacto</span>
              <span className="font-semibold text-slate-900">{clubInfo.phone}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 font-medium">Email</span>
              <a href={`mailto:${clubInfo.email}`} className="font-semibold text-blue-600 hover:underline">
                {clubInfo.email}
              </a>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 font-medium block mb-1">Morada</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800 leading-relaxed">{clubInfo.address}</span>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(clubInfo.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg shrink-0 flex items-center gap-1 transition-colors"
                >
                  <span>Mapa</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Contactos, Instalações & Regulamento */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    Instalações e Apoio
                  </h2>
                  <p className="text-xs text-slate-500">Pavilhões, horários, regulamentos e apoios ao atleta</p>
                </div>
              </div>

              {/* Secção de Documentos Oficiais em Instalações & Apoio */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Documentos Oficiais | Regulamentos</span>
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded-full">
                      {documentsList.length}
                    </span>
                  </span>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleOpenInsertDocModal}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {documentsList.map((doc) => {
                    const isPdf =
                      doc.fileType === 'pdf' ||
                      doc.fileUrl.toLowerCase().includes('.pdf') ||
                      doc.fileUrl.startsWith('data:application/pdf');

                    return (
                      <div
                        key={doc.id}
                        className="p-3 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${isPdf
                              ? 'bg-red-50 text-red-600 border border-red-200/60'
                              : doc.fileType === 'image'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                              }`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {doc.title}
                              </h4>
                              {doc.category && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                                  {doc.category}
                                </span>
                              )}
                            </div>

                            {doc.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mb-1 font-normal">
                                {doc.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-medium flex-wrap">
                              {doc.fileSize && <span>{doc.fileSize}</span>}
                              {doc.uploadedAt && <span>• {doc.uploadedAt}</span>}
                              {doc.uploadedByCoachName && (
                                <span className="text-indigo-600/80">• Por {doc.uploadedByCoachName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleViewDoc(doc)}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            title={isPdf ? 'Abrir PDF original em novo separador' : 'Abrir documento original'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isPdf ? 'Ver PDF' : 'Abrir'}</span>
                            <ExternalLink className="w-3 h-3 text-blue-200" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Remover documento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{documentsList.length} documento(s) em Instalações e Apoio</span>
            <span className="font-semibold text-blue-600">Documentação Validada</span>
          </div>
        </div>
      </div>

      {/* Edit Club Modal (Treinador / Admin) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Editar Dados do Clube</h3>
                  <p className="text-xs text-slate-500">Atualize informações de contacto, morada, NIF e imagens</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Clube</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Modalidade Principal</label>
                  <input
                    type="text"
                    required
                    value={formData.modality}
                    onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Ex: Atletismo"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">NIF</label>
                  <input
                    type="text"
                    required
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ano de Fundação</label>
                  <input
                    type="number"
                    value={formData.foundationYear}
                    onChange={(e) => setFormData({ ...formData, foundationYear: parseInt(e.target.value) || 1990 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contacto Telefónico</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">E-mail Oficial</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Morada Completa</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL da Imagem de Logótipo</label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL da Imagem de Capa (Banner)</label>
                  <input
                    type="url"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Presidente da Direção</label>
                <input
                  type="text"
                  value={formData.presidentName}
                  onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Descrição / Missão do Clube</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Instalações Desportivas</label>
                <textarea
                  rows={2}
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Cor Predominante da Aplicação */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-blue-600" />
                    <span>Cor Predominante da Aplicação (+ Desporto)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
                      {formData.primaryColor || '#2563eb'}
                    </span>
                    <div
                      className="w-5 h-5 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: formData.primaryColor || '#2563eb' }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Personalize a cor principal do clube para botões, indicadores de navegação, destaques e cartões.
                </p>

                {/* Seletor de Paleta / Cores Predefinidas */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {CLUB_COLOR_PRESETS.map((preset) => {
                    const isSelected = (formData.primaryColor || '#2563eb').toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, primaryColor: preset.hex });
                          applyClubTheme(preset.hex);
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center cursor-pointer ${isSelected
                          ? 'border-slate-800 bg-white ring-2 ring-slate-800/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        title={`${preset.name}: ${preset.description}`}
                      >
                        <span
                          className="w-6 h-6 rounded-full shadow-xs flex items-center justify-center text-white text-[10px]"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 truncate w-full">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Seletor Livre HEX */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">#</span>
                    <input
                      type="text"
                      placeholder="2563eb"
                      maxLength={7}
                      value={(formData.primaryColor || '#2563eb').replace(/^#/, '')}
                      onChange={(e) => {
                        const val = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                        setFormData({ ...formData, primaryColor: val });
                        if (val.length === 7) applyClubTheme(val);
                      }}
                      className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="color"
                      value={formData.primaryColor?.startsWith('#') && formData.primaryColor.length === 7 ? formData.primaryColor : '#2563eb'}
                      onChange={(e) => {
                        setFormData({ ...formData, primaryColor: e.target.value });
                        applyClubTheme(e.target.value);
                      }}
                      className="w-8 h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white"
                      title="Escolher no seletor de cor do sistema"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">Seletor Livre</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Inserir Documento em Instalações & Apoio (Treinador) */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Inserir Documento</h3>
                  <p className="text-xs text-slate-500">Secção Instalações e Apoio do Clube</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título do Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Normas de Utilização"
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Categoria / Âmbito *
                </label>
                <select
                  value={docFormData.category}
                  onChange={(e) => setDocFormData({ ...docFormData, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                >
                  <option value="Instalações">Instalações</option>
                  <option value="Horários">Horários</option>
                  <option value="Regulamento Interno">Regulamento Interno</option>
                  <option value="Geral">Documentação Geral</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição / Notas Explicativas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Instruções de utilização dos cacifos e contactos de urgência."
                  value={docFormData.description}
                  onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Upload de Ficheiro */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ficheiro do Documento (PDF, Imagem, DOCX) *
                </label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${isDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : docFormData.fileUrl
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                    }`}
                >
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".pdf,image/*,.doc,.docx,.odt,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileProcess(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {docFormData.fileUrl ? (
                      <div className="flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-800 truncate block">
                              {docFormData.fileName || 'Ficheiro Selecionado'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {docFormData.fileSize} • Tipo: {docFormData.fileType.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDocFormData(prev => ({ ...prev, fileUrl: '', fileName: '', fileSize: '' }));
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100 rounded-lg shrink-0 transition-colors cursor-pointer"
                        >
                          Trocar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                        <span className="text-xs font-bold text-slate-700 block">
                          Clique para escolher ou arraste o documento
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          PDF, Imagens, Word ou Texto (até 15MB)
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Ou Inserir URL Web */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ou Inserir URL Web (Google Drive, Dropbox, etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/documento.pdf"
                  value={docFormData.fileUrl.startsWith('data:') ? '' : docFormData.fileUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    const fileName = url.split('/').pop() || 'documento_online.pdf';
                    setDocFormData({
                      ...docFormData,
                      fileUrl: url,
                      fileName: fileName,
                      fileType: url.toLowerCase().includes('.pdf') ? 'pdf' : 'other',
                      fileSize: 'Web Link'
                    });
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  O documento inserido ficará disponível para consulta e leitura por toda a equipa, atletas e encarregados de educação.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!docFormData.fileUrl || !docFormData.title}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Inserir Documento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubTab;
