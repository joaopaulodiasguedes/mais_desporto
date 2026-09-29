export type UserRole = 'treinador' | 'atleta' | 'encarregado';
export type UserStatus = 'aprovado' | 'pendente_aprovacao' | 'rejeitado';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  phone: string;
  birthDate?: string;
  status: UserStatus;
  password?: string;
  registeredAt?: string;
  approvedAt?: string;
  approvedByCoachName?: string;
  rejectionReason?: string;
  requestedCategory?: string; // Escalão solicitado (ex: Juvenis, Juniores, etc.)
  federationNumber?: string;
  notes?: string;
  address?: string; // Morada completa (opcional)
  nif?: string; // NIF do encarregado ou utilizador
  profession?: string; // Profissão do encarregado
  altPhone?: string; // Contacto alternativo ou de emergência
  relation?: string; // Grau de parentesco (Pai, Mãe, Tutor, etc.)
  coachGrade?: string; // Grau de Treinador (texto livre)
  diplomaUrl?: string; // Diploma/certificado em formato PDF ou outro
  diplomaName?: string;
  diplomaType?: 'pdf' | 'image' | 'doc' | 'other';
  relatedAthleteIds?: string[]; // Para Encarregados de Educação
  athleteProfileId?: string; // Se for Atleta, ID da sua ficha
  coachProfileId?: string; // Se for Treinador, ID da sua ficha
  isAdmin?: boolean; // Se for Administrador do Clube
}

export interface ClubDocument {
  id: string;
  title: string;
  category: string; // ex: 'Instalações & Recintos', 'Regulamento Interno', 'Apoio Médico & Seguro', 'Horários & Reservas'
  description?: string;
  fileUrl: string;
  fileName?: string;
  fileType?: 'pdf' | 'image' | 'doc' | 'other';
  fileSize?: string;
  uploadedAt: string;
  uploadedByCoachName?: string;
}

export interface ClubInfo {
  name: string;
  modality: string;
  logoUrl: string;
  bannerUrl: string;
  address: string;
  nif: string;
  phone: string;
  email: string;
  foundationYear: number;
  presidentName: string;
  description: string;
  facilities: string;
  primaryColor?: string; // Cor predominante da aplicação (código HEX)
  instagram?: string;
  facebook?: string;
  website?: string;
  regulationsPdfUrl?: string;
  documents?: ClubDocument[];
}

export interface Athlete {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  address: string;
  phone: string;
  email: string;
  photoUrl: string;
  federationNumber: string;
  category: string; // Escalão: ex. Benjamins, Infantis, Iniciados, Juvenis, Juniores, Seniores, Masters
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianId?: string;
  guardianRelation?: string; // Grau de parentesco: Pai, Mãe, Tutor, etc.
  guardianNif?: string; // NIF do Encarregado de Educação
  nif?: string; // NIF do próprio atleta
  gender?: string; // Género (masculino, feminino)
  medicalExamExpiry: string; // YYYY-MM-DD
  medicalStatus: 'valido' | 'a_expirar' | 'expirado';
  emergencyContact: string;
  allergiesOrConditions?: string;
  attendanceRate: number; // percentagem (ex: 94)
  notes?: string;
}

export interface Coach {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  address?: string; // Morada Completa (não obrigatório)
  phone: string;
  email: string; // e-mail (campo obrigatório)
  photoUrl: string;
  licenseNumber: string; // Cédula de Treinador TPTD
  licenseGrade: string; // Grau de Treinador (Texto livre)
  diplomaUrl?: string; // Diploma/Certificado em formato PDF, Imagem ou outro documento
  diplomaName?: string; // Nome do ficheiro do diploma
  diplomaType?: 'pdf' | 'image' | 'doc' | 'other'; // Tipo de documento
  assignedCategories: string[]; // Escalões / Turmas atribuídas
  experienceYears: number;
  bio: string;
  isAdmin?: boolean; // Se for Administrador do Clube
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: string;
  repsOrDuration: string;
  rest: string;
  intensity: string;
  notes?: string;
}

export interface ExerciseBlock {
  id: string;
  title: string;
  type: 'aquecimento' | 'principal' | 'complementar' | 'retorno_calma';
  exercises: ExerciseItem[];
}

export interface TrainingPlanCompletion {
  athleteId: string;
  completedAt: string;
  status?: 'cumpriu' | 'nao_cumpriu' | 'parcial';
  rpeRating: number; // 1-10 (Nível de Dificuldade / Percepção de Esforço Borg)
  feedback?: string;
  date?: string; // YYYY-MM-DD
}

export interface TrainingPlan {
  id: string;
  title: string;
  modality: string;
  targetCategory: string; // Escalão
  durationMinutes: number;
  intensityLevel: 1 | 2 | 3 | 4 | 5; // 1 (Leve) a 5 (Máxima)
  objective: string;
  blocks: ExerciseBlock[];
  createdByCoachName: string;
  createdAt: string;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledDates?: string[]; // Múltiplas datas agendadas no calendário
  scheduledTime?: string; // HH:mm
  tags: string[];
  assignedAthleteIds?: string[];
  completedByAthleteIds?: TrainingPlanCompletion[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'prova' | 'treino_oficial' | 'treino_individual' | 'estagio' | 'reuniao' | 'tarefa';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime?: string;
  location: string;
  targetCategories: string[];
  description?: string;
  officialPdfUrl?: string;
  createdByRole: UserRole;
  creatorName: string;
  creatorId: string;
  athleteId?: string; // Para treinos individuais ou tarefas adicionadas por atletas
  isCompleted?: boolean; // Para tarefas com estado de conclusão
  rsvps: {
    [userIdOrAthleteId: string]: {
      status: 'confirmado' | 'ausente' | 'justificado';
      responderName: string;
      role: UserRole;
      note?: string;
      updatedAt: string;
    };
  };
}

export interface PodiumEntry {
  position: 1 | 2 | 3 | number;
  athleteName: string;
  markOrScore: string;
  category: string;
  clubOrOpponent?: string;
}

export interface CompetitionResult {
  id: string;
  title: string;
  competitionDate: string;
  eventId?: string;
  modality: string;
  category: string;
  location: string;
  pdfUrl: string;
  pdfTitle: string;
  pdfFileSize?: string;
  summary: string;
  podium: PodiumEntry[];
  highlights: string[];
  photos?: string[];
  publishedByCoachName: string;
  publishedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'convocatoria' | 'aviso_treino' | 'mensalidade' | 'comunicado' | 'urgente';
  targetAudience: 'todos' | 'atletas' | 'pais' | 'treinadores';
  targetCategory?: string;
  targetAthleteId?: string; // ID do atleta específico
  targetAthleteIds?: string[]; // Lista de IDs de atletas específicos
  targetAthleteName?: string; // Nome do atleta específico
  targetUserId?: string; // ID do utilizador específico
  isRead: boolean;
  authorName: string;
  actionLabel?: string;
  actionTab?: string;
}

export interface ParentAuthorization {
  id: string;
  athleteId: string;
  athleteName: string;
  parentId: string;
  parentName: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  status: 'pendente' | 'autorizado' | 'recusado';
  signedAt?: string;
  notes?: string;
}

export interface CarpoolOffer {
  id: string;
  parentId: string;
  parentName: string;
  athleteName: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  availableSeats: number;
  departureLocation: string;
  departureTime: string;
  contactPhone: string;
  notes?: string;
  claimedSeats: { parentName: string; athleteName: string; seats: number }[];
}

export interface RolePermissions {
  canEditClubInfo: boolean;
  canManageAthletes: boolean;
  canManageCoaches: boolean;
  canCreateTrainingPlans: boolean;
  canLogPersonalTraining: boolean;
  canAddCompetitions: boolean;
  canAddResults: boolean;
  canBroadcastNotifications: boolean;
  canAuthorizeTournaments: boolean;
  canOfferCarpool: boolean;
}

export interface AgeCategory {
  id: string;
  name: string;
  code?: string;
  birthDateStart: string; // Data de nascimento de início (ex: 2010-01-01)
  birthDateEnd: string; // Data de nascimento de fim (ex: 2011-12-31)
  seasonStartDate: string; // Data de início para essa gestão (ex: 2025-09-01)
  seasonEndDate: string; // Data de fim para essa gestão (ex: 2026-08-31)
  gender?: 'todos' | 'masculino' | 'feminino';
  notes?: string;
  color?: string;
}
