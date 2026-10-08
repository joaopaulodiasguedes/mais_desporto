import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Trash2,
  Edit2,
  X,
  Check,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Upload,
  Download,
  Eye,
  FileCheck,
  Paperclip,
  Layers,
  Shield,
  Camera
} from 'lucide-react';
import { Coach } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CategoriesManagement } from './CategoriesManagement';
import { PendingApprovalsManagement } from './PendingApprovalsManagement';

interface CoachesTabProps {
  onOpenPdf?: (title: string, url: string) => void;
}

export const CoachesTab: React.FC<CoachesTabProps> = ({ onOpenPdf }) => {
  const {
    coaches,
    addCoach,
    updateCoach,
    deleteCoach,
    hasPermission,
    currentUser,
    pendingApprovalsCount,
    ageCategories
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'coaches' | 'categories' | 'approvals'>('coaches');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null);

  const canManage = hasPermission('canManageCoaches') || currentUser.role === 'treinador';

  const [formData, setFormData] = useState<Omit<Coach, 'id'>>({
    name: '',
    birthDate: '1985-05-10',
    address: '',
    phone: '',
    email: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    licenseNumber: 'TPTD-',
    licenseGrade: 'Grau II - Treinador de Desporto',
    diplomaUrl: '',
    diplomaName: '',
    diplomaType: 'pdf',
    assignedCategories: ['Juvenis (Sub-16)'],
    experienceYears: 10,
    bio: '',
    isAdmin: false
  });

  const getAge = (birthDateStr: string) => {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      birthDate: '1988-04-12',
      address: '',
      phone: '',
      email: '',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      licenseNumber: `TPTD-${Math.floor(10000 + Math.random() * 90000)}`,
      licenseGrade: 'Grau II - Treinador de Desporto',
      diplomaUrl: '',
      diplomaName: '',
      diplomaType: 'pdf',
      assignedCategories: ['Infantis (Sub-14)', 'Juvenis (Sub-16)'],
      experienceYears: 8,
      bio: '',
      isAdmin: false
    });
    setEditingCoach(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      birthDate: coach.birthDate,
      address: coach.address || '',
      phone: coach.phone,
      email: coach.email || '',
      photoUrl: coach.photoUrl,
      licenseNumber: coach.licenseNumber,
      licenseGrade: coach.licenseGrade || 'Grau II - Treinador de Desporto',
      diplomaUrl: coach.diplomaUrl || '',
      diplomaName: coach.diplomaName || '',
      diplomaType: coach.diplomaType || 'pdf',
      assignedCategories: coach.assignedCategories,
      experienceYears: coach.experienceYears,
      bio: coach.bio,
      isAdmin: coach.isAdmin ?? false
    });
    setIsAddModalOpen(true);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, photoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDiplomaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    let fileType: 'pdf' | 'image' | 'doc' | 'other' = 'other';
    if (file.type.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (
      file.type.includes('word') ||
      file.type.includes('officedocument') ||
      fileName.toLowerCase().endsWith('.doc') ||
      fileName.toLowerCase().endsWith('.docx')
    ) {
      fileType = 'doc';
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        diplomaUrl: result,
        diplomaName: fileName,
        diplomaType: fileType
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDirectCoachUpload = (coachId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    let fileType: 'pdf' | 'image' | 'doc' | 'other' = 'other';
    if (file.type.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (
      file.type.includes('word') ||
      file.type.includes('officedocument') ||
      fileName.toLowerCase().endsWith('.doc') ||
      fileName.toLowerCase().endsWith('.docx')
    ) {
      fileType = 'doc';
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      const targetCoach = coaches.find((c) => c.id === coachId);
      if (targetCoach) {
        const updated: Coach = {
          ...targetCoach,
          diplomaUrl: result,
          diplomaName: fileName,
          diplomaType: fileType
        };
        updateCoach(coachId, updated);
        if (selectedCoach && selectedCoach.id === coachId) {
          setSelectedCoach(updated);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDirectCoachRemove = (coachId: string) => {
    const targetCoach = coaches.find((c) => c.id === coachId);
    if (targetCoach) {
      const updated: Coach = {
        ...targetCoach,
        diplomaUrl: '',
        diplomaName: '',
        diplomaType: undefined
      };
      updateCoach(coachId, updated);
      if (selectedCoach && selectedCoach.id === coachId) {
        setSelectedCoach(updated);
      }
    }
  };

  const handleViewDiploma = (coach: Coach) => {
    if (!coach.diplomaUrl) return;

    const isPdf =
      coach.diplomaType === 'pdf' ||
      coach.diplomaUrl.toLowerCase().includes('.pdf') ||
      coach.diplomaUrl.startsWith('data:application/pdf');

    if (isPdf && onOpenPdf) {
      onOpenPdf(coach.diplomaName || `Diploma - ${coach.name}`, coach.diplomaUrl);
    } else {
      window.open(coach.diplomaUrl, '_blank');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoach) {
      updateCoach(editingCoach.id, formData);
      if (selectedCoach?.id === editingCoach.id) {
        setSelectedCoach({ ...editingCoach, ...formData });
      }
    } else {
      addCoach(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleDelete = (coach: Coach) => {
    setCoachToDelete(coach);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            Corpo Técnico & Treinadores
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {coaches.length} treinadores certificados pelo IPDJ / TPTD
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Treinador</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs: Exclusivo para Treinadores */}
      {currentUser.role === 'treinador' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full overflow-x-auto">
            <button
              id="subtab-coaches"
              onClick={() => setActiveSubTab('coaches')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeSubTab === 'coaches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Equipa Técnica ({coaches.length})</span>
            </button>

            <button
              id="subtab-categories"
              onClick={() => setActiveSubTab('categories')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeSubTab === 'categories'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Gestão de Escalões ({ageCategories.length})</span>
            </button>

            <button
              id="subtab-approvals"
              onClick={() => setActiveSubTab('approvals')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeSubTab === 'approvals'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ShieldCheck className={`w-4 h-4 ${pendingApprovalsCount > 0 ? 'text-amber-500' : 'text-slate-500'}`} />
              <span>Validar Inscrições</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* View Switch: Grelha de Treinadores vs Escalões vs Aprovações */}
      {currentUser.role === 'treinador' && activeSubTab === 'categories' ? (
        <CategoriesManagement />
      ) : currentUser.role === 'treinador' && activeSubTab === 'approvals' ? (
        <PendingApprovalsManagement />
      ) : (
        /* Coaches Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => {
            const age = getAge(coach.birthDate);
            return (
              <div
                key={coach.id}
                onClick={() => setSelectedCoach(coach)}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={coach.photoUrl}
                      alt={coach.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-100 group-hover:ring-teal-400 transition-all shadow-xs shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors truncate">
                          {coach.name}
                        </h3>
                        {coach.isAdmin && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9px] font-black border border-amber-200 shrink-0 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5 text-amber-600" /> Administrador
                          </span>
                        )}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200 max-w-full truncate">
                        {coach.licenseGrade}
                      </span>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        {coach.licenseNumber}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{coach.birthDate} {age ? `(${age} anos)` : ''}</span>
                    </div>
                    {coach.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{coach.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700">{coach.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{coach.experienceYears} anos de experiência</span>
                    </div>
                  </div>

                  {/* Categories badges */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Escalões atribuídos:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {coach.assignedCategories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Diploma Badge in Card */}
                  {coach.diplomaUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDiploma(coach);
                      }}
                      className="w-full mt-2 py-1.5 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">Ver Diploma / Certificado</span>
                    </button>
                  )}
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <a
                    href={`tel:${coach.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{coach.phone}</span>
                  </a>
                  <span className="text-[11px] text-slate-400 font-medium">Ver Ficha &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coach Detail Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedCoach.photoUrl}
                  alt={selectedCoach.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-500/30 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{selectedCoach.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 inline-block">
                    {selectedCoach.licenseGrade}
                  </span>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Cédula: {selectedCoach.licenseNumber} • {selectedCoach.experienceYears} anos exp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCoach(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
                  Contactos & Localização
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Nascimento:</span>
                    <span className="font-medium text-slate-900">
                      {selectedCoach.birthDate} {getAge(selectedCoach.birthDate) ? `(${getAge(selectedCoach.birthDate)} anos)` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Telemóvel:</span>
                    <span className="font-medium text-slate-900">{selectedCoach.phone}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold">E-mail (Obrigatório):</span>
                    <a
                      href={`mailto:${selectedCoach.email}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {selectedCoach.email}
                    </a>
                  </div>
                  {selectedCoach.address ? (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] text-slate-400 block font-semibold">Morada:</span>
                      <span className="font-medium text-slate-900">{selectedCoach.address}</span>
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] text-slate-400 block font-semibold">Morada:</span>
                      <span className="text-slate-400 italic">Não especificada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Perfil de Acesso / Administrador */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">Perfil de Administrador:</span>
                    <span className="text-[11px] text-amber-900/80">
                      {selectedCoach.isAdmin
                        ? 'Tem acesso ao separador exclusivo'
                        : 'Treinador padrão'}
                    </span>
                  </div>
                </div>
                <div>
                  {selectedCoach.isAdmin ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-extrabold text-xs shadow-2xs whitespace-nowrap">
                      É Administrador
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs whitespace-nowrap">
                      Não é Administrador
                    </span>
                  )}
                </div>
              </div>

              {/* Diploma & Certification Section */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-teal-700" />
                    Diploma / Certificação Oficial
                  </h4>
                  {selectedCoach.diplomaUrl && (
                    <span className="px-2 py-0.5 rounded-md bg-teal-200 text-teal-900 text-[10px] font-extrabold uppercase">
                      {selectedCoach.diplomaType === 'pdf'
                        ? 'PDF'
                        : selectedCoach.diplomaType === 'image'
                          ? 'Imagem'
                          : 'Documento'}
                    </span>
                  )}
                </div>

                {selectedCoach.diplomaUrl ? (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-white border border-teal-100 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {selectedCoach.diplomaName || 'Diploma_Treinador.pdf'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={selectedCoach.diplomaUrl}
                          download={selectedCoach.diplomaName || `Diploma_${selectedCoach.name.replace(/\s+/g, '_')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Descarregar Diploma"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDirectCoachRemove(selectedCoach.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover Documento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDiploma(selectedCoach)}
                        className="flex-1 py-2 px-3 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizar Documento</span>
                      </button>
                      <label className="py-2 px-3 bg-white hover:bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-teal-600" />
                        <span>Substituir</span>
                        <input
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleDirectCoachUpload(selectedCoach.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-teal-300 hover:border-teal-400 bg-white/90 hover:bg-white rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-1 group">
                    <Upload className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-slate-800">
                      Colocar documento / certificado
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Clique para carregar PDF, Imagem ou Word
                    </p>
                    <input
                      type="file"
                      accept=".pdf,image/*,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleDirectCoachUpload(selectedCoach.id, e)}
                    />
                  </label>
                )}
              </div>

              {/* Bio & Experience */}
              <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1.5">
                <h4 className="font-bold text-teal-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-teal-600" />
                  Perfil Profissional & Habilitações
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedCoach.bio || 'Treinador com formação em Ciências do Desporto e experiência no treino de jovens atletas.'}
                </p>
              </div>

              {/* Teams Assigned */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-2">
                  Grupos de Treino / Escalões
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCoach.assignedCategories.map((cat, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white text-teal-800 font-bold rounded-lg border border-teal-200 text-xs shadow-2xs"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCoach(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>

              {canManage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const c = selectedCoach;
                      setSelectedCoach(null);
                      handleOpenEdit(c);
                    }}
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar Treinador"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedCoach)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Remover Treinador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Coach */}
      <ConfirmDeleteModal
        isOpen={coachToDelete !== null}
        onClose={() => setCoachToDelete(null)}
        onConfirm={() => {
          if (coachToDelete) {
            deleteCoach(coachToDelete.id);
            if (selectedCoach?.id === coachToDelete.id) {
              setSelectedCoach(null);
            }
            setCoachToDelete(null);
          }
        }}
        title="Remover Treinador"
        itemTitle={coachToDelete?.name}
        description="Tem a certeza de que deseja remover este treinador da equipa técnica?"
        confirmText="Sim, Remover"
      />

      {/* Add / Edit Coach Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                {editingCoach ? 'Editar Treinador' : 'Registar Novo Treinador'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="Ex: Prof. Carlos Silva"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nº Diploma / Cédula / Certificado *</label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="TPTD-74291"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Grau de Treinador
                  </label>
                  <input
                    type="text"
                    value={formData.licenseGrade}
                    onChange={(e) => setFormData({ ...formData, licenseGrade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="Ex: Grau II - Treinador de Desporto, UEFA Pro, etc."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Anos de Experiência</label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contacto Telefónico *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="+351 912 345 678"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                    placeholder="treinador@clube.pt"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Morada Completa <span className="text-slate-400 font-normal">(Não obrigatório)</span>
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="Rua, Cidade, Código Postal (opcional)"
                />
              </div>

              {/* Diploma / Certificate Upload Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Diploma / Cédula / Certificado <span className="text-slate-400 font-normal">(PDF ou outro)</span>
                  </label>
                  {formData.diplomaUrl && (
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase">
                      {formData.diplomaType === 'pdf' ? 'PDF' : formData.diplomaType === 'image' ? 'Imagem' : 'Documento'}
                    </span>
                  )}
                </div>

                {formData.diplomaUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-teal-200 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-teal-50 text-teal-700 rounded-lg shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {formData.diplomaName || 'Diploma_Treinador'}
                        </p>
                        <p className="text-[10px] text-teal-700 font-medium">
                          Ficheiro carregado com sucesso
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, diplomaUrl: '', diplomaName: '', diplomaType: 'pdf' })}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remover ficheiro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl bg-white hover:bg-teal-50/40 transition-all cursor-pointer group">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-teal-600 mb-1 transition-colors" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-teal-700">
                        Carregar Diploma (PDF, Imagem, DOCX...)
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Clique para selecionar ou arraste o ficheiro
                      </span>
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx,.odt"
                        onChange={handleDiplomaFileUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Ou link web:</span>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formData.diplomaUrl || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setFormData({
                            ...formData,
                            diplomaUrl: url,
                            diplomaName: url ? url.split('/').pop() || 'Diploma_Online.pdf' : '',
                            diplomaType: url.toLowerCase().includes('.pdf') ? 'pdf' : 'other'
                          });
                        }}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-600" />
                    Foto de Perfil do Treinador
                  </label>
                  {formData.photoUrl && (
                    <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Foto configurada
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={formData.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'}
                    alt="Pré-visualização"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500/40 shadow-xs shrink-0 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Carregar Foto do Computador / Telemóvel</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="Ou cole aqui o link / URL da foto..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Pergunta se é Administrador */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <label className="text-xs font-extrabold text-amber-950">
                    É Administrador do Clube? *
                  </label>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  Defina se este treinador tem privilégios de administrador. Se for administrador, consegue ver o separador <strong>Administrador</strong> (Regras & Permissões e Base de Dados Cloud). Se não for, não tem acesso ao separador.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAdmin: true })}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${formData.isAdmin
                      ? 'bg-white border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                      : 'bg-amber-100/40 border-amber-200 text-slate-600 hover:bg-white'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${formData.isAdmin ? 'border-amber-600 bg-amber-600' : 'border-slate-400 bg-white'
                      }`}>
                      {formData.isAdmin && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${formData.isAdmin ? 'text-amber-950' : 'text-slate-800'}`}>
                        Sim, é Administrador
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                        Consegue ver o separador Administrador
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAdmin: false })}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${!formData.isAdmin
                      ? 'bg-white border-teal-600 ring-2 ring-teal-400/40 shadow-xs'
                      : 'bg-amber-100/40 border-amber-200 text-slate-600 hover:bg-white'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${!formData.isAdmin ? 'border-teal-600 bg-teal-600' : 'border-slate-400 bg-white'
                      }`}>
                      {!formData.isAdmin && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${!formData.isAdmin ? 'text-slate-900' : 'text-slate-800'}`}>
                        Não, é Treinador normal
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                        Não consegue ver o separador Administrador
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Biografia / Habilitações</label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="Formação académica, certificações, percurso..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingCoach ? 'Atualizar Treinador' : 'Registar Treinador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
