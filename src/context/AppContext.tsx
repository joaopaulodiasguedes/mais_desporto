import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserProfile,
  UserStatus,
  ClubInfo,
  Athlete,
  Coach,
  TrainingPlan,
  CalendarEvent,
  CompetitionResult,
  NotificationItem,
  ParentAuthorization,
  CarpoolOffer,
  RolePermissions,
  AgeCategory
} from '../types';
import {
  INITIAL_PROFILES,
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_CLUB_INFO,
  INITIAL_ATHLETES,
  INITIAL_COACHES,
  INITIAL_TRAINING_PLANS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_RESULTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PARENT_AUTHORIZATIONS,
  INITIAL_CARPOOLS,
  INITIAL_AGE_CATEGORIES
} from '../data/initialData';
import { applyClubTheme } from '../utils/theme';
import {
  calculateMedicalStatus,
  determineAgeCategory,
  createMedicalExpiryNotification
} from '../utils/athleteRules';
import {
  getSupabase,
  getSupabaseConfig,
  fetchAllFromSupabase,
  upsertCalendarEventInSupabase,
  deleteCalendarEventInSupabase,
  upsertEventRsvpInSupabase,
  upsertResultInSupabase,
  deleteResultInSupabase,
  upsertNotificationInSupabase,
  deleteNotificationInSupabase,
  upsertAthleteInSupabase,
  deleteAthleteInSupabase,
  upsertCoachInSupabase,
  deleteCoachInSupabase,
  upsertTrainingPlanInSupabase,
  deleteTrainingPlanInSupabase,
  upsertClubInfoInSupabase,
  upsertAgeCategoryInSupabase,
  deleteAgeCategoryInSupabase,
  upsertParentAuthorizationInSupabase,
  upsertCarpoolOfferInSupabase,
  deleteCarpoolOfferInSupabase,
  upsertUserProfileInSupabase,
  deleteUserProfileInSupabase,
  mapCalendarEventFromDb,
  mapNotificationFromDb
} from '../lib/supabase';

export interface PasswordResetEmailPreview {
  to: string;
  recipientName: string;
  code: string;
  sentAt: string;
  expiresInMinutes: number;
  clubName: string;
}

interface AppContextType {
  // User & Authentication
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isCurrentUserAdmin: boolean;
  availableUsers: UserProfile[];
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  switchUserAccount: (user: UserProfile) => void;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  requestPasswordResetEmail: (email: string) => Promise<{
    success: boolean;
    message: string;
    emailPreview?: PasswordResetEmailPreview;
  }>;
  verifyResetCodeAndSetPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => { success: boolean; message: string };
  resetPassword: (email: string, newPassword: string) => { success: boolean; message: string };
  register: (data: {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    birthDate?: string;
    password?: string;
    requestedCategory?: string;
    federationNumber?: string;
    notes?: string;
    address?: string;
    coachGrade?: string;
    diplomaUrl?: string;
    diplomaName?: string;
    diplomaType?: 'pdf' | 'image' | 'doc' | 'other';
    relatedAthleteName?: string;
  }) => { success: boolean; message?: string; user?: UserProfile };
  logout: () => void;

  // Coach Approvals
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason?: string) => void;
  updateUserProfile: (userId: string, updated: Partial<UserProfile>) => void;
  pendingUsers: UserProfile[];
  pendingApprovalsCount: number;
  isApprovalsModalOpen: boolean;
  setIsApprovalsModalOpen: (open: boolean) => void;

  // Permissions
  rolePermissions: Record<UserRole, RolePermissions>;
  updateRolePermissions: (role: UserRole, permissions: Partial<RolePermissions>) => void;
  hasPermission: (permission: keyof RolePermissions) => boolean;

  // Active Tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Mobile Shell Preview vs Full Width
  isMobileDeviceView: boolean;
  setIsMobileDeviceView: (val: boolean) => void;

  // Club
  clubInfo: ClubInfo;
  updateClubInfo: (info: Partial<ClubInfo>) => void;

  // Athletes
  athletes: Athlete[];
  addAthlete: (athlete: Omit<Athlete, 'id'>) => void;
  updateAthlete: (id: string, athlete: Partial<Athlete>) => void;
  deleteAthlete: (id: string) => void;

  // Coaches
  coaches: Coach[];
  addCoach: (coach: Omit<Coach, 'id'>) => void;
  updateCoach: (id: string, coach: Partial<Coach>) => void;
  deleteCoach: (id: string) => void;

  // Guardians (Encarregados de Educação)
  addGuardian: (guardian: {
    name: string;
    email: string;
    phone: string;
    altPhone?: string;
    nif?: string;
    relation: string;
    address?: string;
    profession?: string;
    notes?: string;
    athleteIds?: string[];
    avatarUrl?: string;
  }) => string;
  updateGuardian: (
    id: string,
    guardian: {
      name: string;
      email: string;
      phone: string;
      altPhone?: string;
      nif?: string;
      relation: string;
      address?: string;
      profession?: string;
      notes?: string;
      athleteIds?: string[];
      avatarUrl?: string;
    },
    oldGuardianInfo?: { email?: string; name?: string }
  ) => void;
  deleteGuardian: (id: string, fallbackEmail?: string, fallbackName?: string) => void;

  // Training Plans
  trainingPlans: TrainingPlan[];
  addTrainingPlan: (plan: Omit<TrainingPlan, 'id' | 'createdAt'>) => void;
  updateTrainingPlan: (id: string, plan: Partial<TrainingPlan>) => void;
  deleteTrainingPlan: (id: string) => void;
  completeTrainingPlan: (
    planId: string,
    athleteId: string,
    rpeOrOptions: number | {
      rpeRating: number;
      feedback?: string;
      status?: 'cumpriu' | 'nao_cumpriu' | 'parcial';
      date?: string;
    },
    legacyFeedback?: string
  ) => void;
  removeTrainingPlanCompletion: (planId: string, athleteId: string, date?: string) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'rsvps'>) => void;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  toggleEventCompletion: (id: string) => void;
  setEventRsvp: (eventId: string, status: 'confirmado' | 'ausente' | 'justificado', note?: string) => void;

  // Results
  results: CompetitionResult[];
  addResult: (result: Omit<CompetitionResult, 'id' | 'publishedAt'>) => void;
  updateResult: (id: string, result: Partial<CompetitionResult>) => void;
  deleteResult: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: Omit<NotificationItem, 'id' | 'date' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  // Parent Area
  authorizations: ParentAuthorization[];
  updateAuthorizationStatus: (id: string, status: 'autorizado' | 'recusado', notes?: string) => void;
  carpools: CarpoolOffer[];
  addCarpoolOffer: (offer: Omit<CarpoolOffer, 'id' | 'claimedSeats'>) => void;
  deleteCarpoolOffer: (carpoolId: string) => void;
  claimCarpoolSeat: (carpoolId: string, parentName: string, athleteName: string, seats: number) => void;

  // Age Categories (Escalões por Data de Nascimento)
  ageCategories: AgeCategory[];
  addAgeCategory: (category: Omit<AgeCategory, 'id'>) => void;
  updateAgeCategory: (id: string, category: Partial<AgeCategory>) => void;
  deleteAgeCategory: (id: string) => void;
  applyAgeCategoriesToAthletes: () => { updatedCount: number };

  // Supabase Sync
  supabaseStatus: 'connected' | 'connecting' | 'local' | 'error';
  isSupabaseConfigured: boolean;
  syncWithSupabase: () => Promise<void>;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;

  // Reset to default data
  resetAllData: () => void;

  // Toast / feedback message
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  toast: { message: string; type: 'success' | 'info' | 'error'; id: number } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const isNotificationVisibleForUser = (notif: NotificationItem, user: UserProfile, athletesList: Athlete[]): boolean => {
  if (notif.targetUserId) {
    return notif.targetUserId === user.id;
  }
  const athleteProfile = athletesList.find(a =>
    a.id === user.athleteProfileId ||
    (user.name && a.name.toLowerCase() === user.name.toLowerCase()) ||
    (user.email && a.email?.toLowerCase() === user.email?.toLowerCase())
  );
  const athleteId = user.athleteProfileId || athleteProfile?.id;

  if (notif.targetAthleteId) {
    if (user.role === 'treinador') return true;
    if (user.role === 'encarregado') {
      const isRelatedById = !!(user.relatedAthleteIds && user.relatedAthleteIds.includes(notif.targetAthleteId));
      const isRelatedByGuardian = athletesList.some(a => a.id === notif.targetAthleteId && (
        (user.email && a.guardianEmail && a.guardianEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.name && a.guardianName && a.guardianName.toLowerCase() === user.name.toLowerCase())
      ));
      return isRelatedById || isRelatedByGuardian;
    }
    return athleteId === notif.targetAthleteId;
  }

  if (notif.targetAthleteIds && notif.targetAthleteIds.length > 0) {
    if (user.role === 'treinador') return true;
    if (user.role === 'encarregado') {
      const isRelatedById = !!(user.relatedAthleteIds && notif.targetAthleteIds.some(id => user.relatedAthleteIds?.includes(id)));
      const isRelatedByGuardian = athletesList.some(a => notif.targetAthleteIds?.includes(a.id) && (
        (user.email && a.guardianEmail && a.guardianEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.name && a.guardianName && a.guardianName.toLowerCase() === user.name.toLowerCase())
      ));
      return isRelatedById || isRelatedByGuardian;
    }
    return !!(athleteId && notif.targetAthleteIds.includes(athleteId));
  }

  if (user.role === 'atleta') {
    if (notif.targetAudience === 'treinadores' || notif.targetAudience === 'pais') {
      return false;
    }
    if (notif.targetCategory && notif.targetCategory.trim() !== '' && notif.targetCategory !== 'Todos' && notif.targetCategory !== 'todas') {
      const athleteCat = (athleteProfile?.category || user.requestedCategory || '').toLowerCase();
      const notifCat = notif.targetCategory.toLowerCase();
      const matches = athleteCat.includes(notifCat) || notifCat.includes(athleteCat) ||
        (athleteCat.includes('juvenis') && notifCat.includes('juvenis')) ||
        (athleteCat.includes('juniores') && notifCat.includes('juniores')) ||
        (athleteCat.includes('seniores') && notifCat.includes('seniores')) ||
        (athleteCat.includes('infantis') && notifCat.includes('infantis')) ||
        (athleteCat.includes('iniciados') && notifCat.includes('iniciados')) ||
        (athleteCat.includes('benjamins') && notifCat.includes('benjamins'));
      return matches;
    }
    return true;
  }

  if (user.role === 'encarregado') {
    if (notif.targetAudience === 'treinadores') return false;
    return true;
  }

  return true;
};

export const getLinkedAthletesForGuardian = (user: UserProfile, athletesList: Athlete[]): Athlete[] => {
  if (user.role !== 'encarregado') return [];

  // 1. Verificação por IDs relacionados explícitos
  if (user.relatedAthleteIds && user.relatedAthleteIds.length > 0) {
    const ids = user.relatedAthleteIds.map(String);
    const found = athletesList.filter((a) => ids.includes(String(a.id)));
    if (found.length > 0) return found;
  }

  const cleanUserName = (user.name || '').replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();

  // 2. Verificação por guardianId, email ou nome em ambas as direções
  return athletesList.filter((a) => {
    if (a.guardianId && String(a.guardianId) === String(user.id)) return true;
    if (userEmail && a.guardianEmail && a.guardianEmail.trim().toLowerCase() === userEmail) return true;
    if (a.guardianName) {
      const cleanGuardianName = a.guardianName.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
      if (cleanGuardianName && cleanUserName) {
        if (cleanUserName.includes(cleanGuardianName) || cleanGuardianName.includes(cleanUserName)) {
          return true;
        }
      }
    }
    return false;
  });
};

export const isCalendarEventVisibleForUser = (evt: CalendarEvent, user: UserProfile, athletesList: Athlete[]): boolean => {
  // As tarefas e eventos adicionados pelo treinador todos visualizam
  if (evt.createdByRole === 'treinador') {
    return true;
  }

  const athleteProfile = athletesList.find(a => a.id === user.athleteProfileId || a.email?.toLowerCase() === user.email?.toLowerCase());
  const userAthleteId = user.athleteProfileId || athleteProfile?.id;

  // No perfil de atleta: cada um vê as suas próprias tarefas e treinos individuais
  if (user.role === 'atleta') {
    return evt.creatorId === user.id || (!!userAthleteId && evt.athleteId === userAthleteId);
  }

  // No perfil de encarregado: visualiza tarefas dos seus educandos
  if (user.role === 'encarregado') {
    const linked = getLinkedAthletesForGuardian(user, athletesList);
    return !!(evt.athleteId && linked.some((a) => a.id === evt.athleteId));
  }

  // Treinador pode visualizar todas as tarefas para acompanhamento desportivo
  if (user.role === 'treinador') {
    return true;
  }

  return false;
};

export const isTrainingPlanVisibleForUser = (plan: TrainingPlan, user: UserProfile, athletesList: Athlete[]): boolean => {
  if (user.role === 'treinador') {
    return true;
  }

  if (user.role === 'atleta') {
    const athleteProfile = athletesList.find(a => a.id === user.athleteProfileId || a.email?.toLowerCase() === user.email?.toLowerCase());
    const athleteId = user.athleteProfileId || athleteProfile?.id;

    // 1. Se atribuído diretamente a atletas específicos
    if (plan.assignedAthleteIds && plan.assignedAthleteIds.length > 0) {
      return !!(athleteId && plan.assignedAthleteIds.includes(athleteId));
    }

    // 2. Se for pelo escalão / categoria do atleta
    const athleteCat = (athleteProfile?.category || user.requestedCategory || '').toLowerCase();
    const planCat = (plan.targetCategory || '').toLowerCase();

    if (planCat.includes('geral') || planCat === 'todos' || planCat === 'todas') {
      return true;
    }

    return athleteCat.includes(planCat) || planCat.includes(athleteCat) ||
      (athleteCat.includes('juvenis') && planCat.includes('juvenis')) ||
      (athleteCat.includes('juniores') && planCat.includes('juniores')) ||
      (athleteCat.includes('seniores') && planCat.includes('seniores')) ||
      (athleteCat.includes('infantis') && planCat.includes('infantis')) ||
      (athleteCat.includes('iniciados') && planCat.includes('iniciados')) ||
      (athleteCat.includes('benjamins') && planCat.includes('benjamins'));
  }

  // No perfil de encarregado de educação: só vê planos de treino dos atletas a seu cargo
  if (user.role === 'encarregado') {
    const linkedAthletes = getLinkedAthletesForGuardian(user, athletesList);
    if (linkedAthletes.length === 0) {
      return false;
    }

    return linkedAthletes.some((ath) => {
      // 1. Se atribuído especificamente a atletas
      if (plan.assignedAthleteIds && plan.assignedAthleteIds.length > 0) {
        return plan.assignedAthleteIds.includes(ath.id);
      }

      // 2. Se for pelo escalão do atleta a seu cargo
      const athleteCat = (ath.category || '').toLowerCase();
      const planCat = (plan.targetCategory || '').toLowerCase();

      if (planCat.includes('geral') || planCat === 'todos' || planCat === 'todas') {
        return true;
      }

      return athleteCat.includes(planCat) || planCat.includes(athleteCat) ||
        (athleteCat.includes('juvenis') && planCat.includes('juvenis')) ||
        (athleteCat.includes('juniores') && planCat.includes('juniores')) ||
        (athleteCat.includes('seniores') && planCat.includes('seniores')) ||
        (athleteCat.includes('infantis') && planCat.includes('infantis')) ||
        (athleteCat.includes('iniciados') && planCat.includes('iniciados')) ||
        (athleteCat.includes('benjamins') && planCat.includes('benjamins'));
    });
  }

  return true;
};

const LOCAL_STORAGE_KEY = 'plus_desporto_app_state_v1';
const SESSION_AUTH_KEY = 'plus_desporto_session_auth';
const SESSION_USER_KEY = 'plus_desporto_session_user';

export const getTabForRole = (role?: UserRole): string => {
  switch (role) {
    case 'treinador':
      return 'treinadores';
    case 'atleta':
      return 'atletas';
    case 'encarregado':
      return 'encarregados';
    default:
      return 'clube';
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Proactively clear any legacy persistent login keys in localStorage so accessing the link ALWAYS requires login
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_is_auth`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_user`);
    localStorage.removeItem('plus_desporto_require_login_v1');
  }

  // Active session user: only set from sessionStorage if explicitly authenticated
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const sessionUser = sessionStorage.getItem(SESSION_USER_KEY);
      if (sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          if (parsed && parsed.email) {
            return {
              ...parsed,
              isAdmin: parsed.email.toLowerCase() === 'joaopaulodiasguedes@gmail.com' ? true : (parsed.isAdmin ?? false),
              status: parsed.status || 'aprovado'
            };
          }
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_PROFILES[0];
  });

  // Authentication state: MUST BE FALSE on initial link access, only true if active in sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const sessionAuth = sessionStorage.getItem(SESSION_AUTH_KEY);
      const sessionUser = sessionStorage.getItem(SESSION_USER_KEY);
      if (sessionAuth === 'true' && sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          return Boolean(parsed && parsed.email);
        } catch {
          return false;
        }
      }
    }
    return false;
  });

  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(() => {
    const config = getSupabaseConfig();
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users_list`);
    if (saved) {
      try {
        const parsed: UserProfile[] = JSON.parse(saved);
        // Ensure status and isAdmin exist on each profile
        const list: UserProfile[] = parsed.map(u => ({
          ...u,
          isAdmin: u.email?.toLowerCase() === 'joaopaulodiasguedes@gmail.com' ? true : (u.isAdmin ?? false),
          status: u.status || 'aprovado'
        }));
        // When Supabase is configured, do not re-inject fictional mock profiles
        if (config.isConfigured) {
          const hasGuedes = list.some(u => u.email.toLowerCase() === 'joaopaulodiasguedes@gmail.com');
          if (!hasGuedes) {
            list.unshift(INITIAL_PROFILES[0]);
          }
          const MOCK_PROFILE_IDS = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6'];
          return list.filter(u => u.email.toLowerCase() === 'joaopaulodiasguedes@gmail.com' || !MOCK_PROFILE_IDS.includes(u.id));
        }
        // Local mode fallback
        INITIAL_PROFILES.forEach(initP => {
          if (!list.some(u => u.email.toLowerCase() === initP.email.toLowerCase())) {
            list.unshift(initP);
          }
        });
        return list;
      } catch {
        return config.isConfigured ? [INITIAL_PROFILES[0]] : INITIAL_PROFILES;
      }
    }
    return config.isConfigured ? [INITIAL_PROFILES[0]] : INITIAL_PROFILES;
  });

  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState<boolean>(false);

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_permissions`);
    return saved ? JSON.parse(saved) : DEFAULT_ROLE_PERMISSIONS;
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return getTabForRole(currentUser?.role);
  });
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);

  const [clubInfo, setClubInfo] = useState<ClubInfo>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_club`);
    return saved ? JSON.parse(saved) : INITIAL_CLUB_INFO;
  });

  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    const config = getSupabaseConfig();
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_athletes`);
    if (config.isConfigured) {
      if (saved) {
        try {
          const parsed: Athlete[] = JSON.parse(saved);
          // If cached items are the hardcoded initial mock athletes, don't show them
          const isMock = parsed.length > 0 && parsed.every(a => a.id.startsWith('ath-') && Number(a.id.replace('ath-', '')) <= 8);
          if (!isMock) {
            return parsed.map(a => ({
              ...a,
              medicalStatus: calculateMedicalStatus(a.medicalExamExpiry).status
            }));
          }
        } catch {
          return [];
        }
      }
      return [];
    }
    const initialList: Athlete[] = saved ? JSON.parse(saved) : INITIAL_ATHLETES;
    return initialList.map(a => ({
      ...a,
      medicalStatus: calculateMedicalStatus(a.medicalExamExpiry).status
    }));
  });

  const [coaches, setCoaches] = useState<Coach[]>(() => {
    const config = getSupabaseConfig();
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_coaches`);
    if (saved) {
      try {
        const parsed: Coach[] = JSON.parse(saved);
        const mapped = parsed.map(c => ({
          ...c,
          isAdmin: c.email?.toLowerCase() === 'joaopaulodiasguedes@gmail.com' ? (c.isAdmin ?? true) : (c.isAdmin ?? false)
        }));
        const hasGuedes = mapped.some(c => c.email.toLowerCase() === 'joaopaulodiasguedes@gmail.com');
        if (!hasGuedes) {
          const updated = [INITIAL_COACHES[0], ...mapped];
          return updated;
        }
        if (config.isConfigured) {
          // Filter out dummy coaches (except admin Prof. João Paulo Dias Guedes)
          return mapped.filter(c => c.email.toLowerCase() === 'joaopaulodiasguedes@gmail.com' || !c.id.startsWith('coach-'));
        }
        return mapped;
      } catch {
        return config.isConfigured ? [INITIAL_COACHES[0]] : INITIAL_COACHES;
      }
    }
    return config.isConfigured ? [INITIAL_COACHES[0]] : INITIAL_COACHES;
  });

  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_plans`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isMock = parsed.length > 0 && parsed.every((p: any) => p.id?.startsWith('plan-'));
          return isMock ? [] : parsed;
        } catch {
          return [];
        }
      }
      return [];
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_plans`);
    return saved ? JSON.parse(saved) : INITIAL_TRAINING_PLANS;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_calendar`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isMock = parsed.length > 0 && parsed.every((e: any) => e.id?.startsWith('event-'));
          return isMock ? [] : parsed;
        } catch {
          return [];
        }
      }
      return [];
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_calendar`);
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
  });

  const [results, setResults] = useState<CompetitionResult[]>(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_results`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isMock = parsed.length > 0 && parsed.every((r: any) => r.id?.startsWith('res-'));
          return isMock ? [] : parsed;
        } catch {
          return [];
        }
      }
      return [];
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_results`);
    return saved ? JSON.parse(saved) : INITIAL_RESULTS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifs`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isMock = parsed.length > 0 && parsed.every((n: any) => n.id?.startsWith('notif-'));
          return isMock ? [] : parsed;
        } catch {
          return [];
        }
      }
      return [];
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifs`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [authorizations, setAuthorizations] = useState<ParentAuthorization[]>(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auths`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isMock = parsed.length > 0 && parsed.every((a: any) => a.id?.startsWith('auth-'));
          return isMock ? [] : parsed;
        } catch {
          return [];
        }
      }
      return [];
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_auths`);
    return saved ? JSON.parse(saved) : INITIAL_PARENT_AUTHORIZATIONS;
  });

  const [carpools, setCarpools] = useState<CarpoolOffer[]>(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_carpools`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isMock = parsed.length > 0 && parsed.every((c: any) => c.id?.startsWith('carpool-'));
          return isMock ? [] : parsed;
        } catch {
          return [];
        }
      }
      return [];
    }
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_carpools`);
    return saved ? JSON.parse(saved) : INITIAL_CARPOOLS;
  });

  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_age_categories`);
    return saved ? JSON.parse(saved) : INITIAL_AGE_CATEGORIES;
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; id: number } | null>(null);

  // Administrator role check
  const isCurrentUserAdmin = Boolean(
    currentUser.role === 'treinador' && (
      currentUser.isAdmin === true ||
      coaches.some(c =>
        (c.id === currentUser.coachProfileId ||
         (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase())) &&
        c.isAdmin === true
      )
    )
  );

  useEffect(() => {
    if (!isCurrentUserAdmin && activeTab === 'administrador') {
      setActiveTab('clube');
    }
  }, [isCurrentUserAdmin, activeTab]);

  // Supabase Connection State
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'connecting' | 'local' | 'error'>(() => {
    return getSupabaseConfig().isConfigured ? 'connecting' : 'local';
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Sync data from Supabase
  const syncWithSupabase = async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      setSupabaseStatus('local');
      return;
    }
    setSupabaseStatus('connecting');
    try {
      const data = await fetchAllFromSupabase();
      if (data) {
        if (Array.isArray(data.events)) {
          setCalendarEvents(data.events);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_events`, JSON.stringify(data.events));
        }
        if (Array.isArray(data.athletes)) {
          setAthletes(data.athletes);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_athletes`, JSON.stringify(data.athletes));
        }
        if (Array.isArray(data.coaches)) {
          setCoaches(data.coaches);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_coaches`, JSON.stringify(data.coaches));
        }
        if (Array.isArray(data.trainingPlans)) setTrainingPlans(data.trainingPlans);
        if (Array.isArray(data.results)) setResults(data.results);
        if (Array.isArray(data.notifications)) setNotifications(data.notifications);
        if (data.clubInfo) {
          setClubInfo(data.clubInfo);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_club`, JSON.stringify(data.clubInfo));
        }
        if (Array.isArray(data.ageCategories)) setAgeCategories(data.ageCategories);
        if (Array.isArray(data.authorizations)) setAuthorizations(data.authorizations);
        if (Array.isArray(data.carpools)) setCarpools(data.carpools);
        if (Array.isArray(data.profiles)) {
          // Keep current administrator João Paulo Dias Guedes so login/admin permission is preserved
          const hasGuedes = data.profiles.some(p => p.email?.toLowerCase() === 'joaopaulodiasguedes@gmail.com');
          const mergedProfiles = (!hasGuedes && currentUser) ? [currentUser, ...data.profiles] : data.profiles;
          setAvailableUsers(mergedProfiles);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(mergedProfiles));
        }
        setSupabaseStatus('connected');
      } else {
        setSupabaseStatus('connected');
      }
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
      setSupabaseStatus('error');
    }
  };

  // On mount: fetch Supabase data if configured and set up Realtime channel
  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      syncWithSupabase();

      const client = getSupabase();
      if (client) {
        const channel = client
          .channel('schema-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, (payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const mapped = mapCalendarEventFromDb(payload.new);
              setCalendarEvents(prev => {
                const idx = prev.findIndex(e => e.id === mapped.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = mapped;
                  return copy;
                }
                return [mapped, ...prev];
              });
            } else if (payload.eventType === 'DELETE' && payload.old?.id) {
              setCalendarEvents(prev => prev.filter(e => e.id !== payload.old.id));
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const mapped = mapNotificationFromDb(payload.new);
              setNotifications(prev => [mapped, ...prev]);
            }
          })
          .subscribe();

        return () => {
          client.removeChannel(channel);
        };
      }
    } else {
      setSupabaseStatus('local');
    }
  }, []);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_is_auth`, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(availableUsers));
  }, [availableUsers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_permissions`, JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_club`, JSON.stringify(clubInfo));
    applyClubTheme(clubInfo.primaryColor);
  }, [clubInfo]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_athletes`, JSON.stringify(athletes));
  }, [athletes]);

  // Sincronização automática contínua da foto do currentUser com a respetiva ficha (Treinadores, Atletas, Enc. Educação)
  useEffect(() => {
    if (currentUser.role === 'treinador' || currentUser.coachProfileId) {
      const coach = coaches.find(
        c =>
          c.id === currentUser.coachProfileId ||
          (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (c.name && currentUser.name && c.name.toLowerCase() === currentUser.name.toLowerCase())
      );
      if (coach?.photoUrl && coach.photoUrl.trim() !== '' && coach.photoUrl !== currentUser.avatarUrl) {
        setCurrentUser(prev => ({ ...prev, avatarUrl: coach.photoUrl }));
      }
    } else if (currentUser.role === 'atleta' || currentUser.athleteProfileId) {
      const athlete = athletes.find(
        a =>
          a.id === currentUser.athleteProfileId ||
          (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (a.name && currentUser.name && a.name.toLowerCase() === currentUser.name.toLowerCase())
      );
      if (athlete?.photoUrl && athlete.photoUrl.trim() !== '' && athlete.photoUrl !== currentUser.avatarUrl) {
        setCurrentUser(prev => ({ ...prev, avatarUrl: athlete.photoUrl }));
      }
    } else if (currentUser.role === 'encarregado') {
      const gUser = availableUsers.find(
        u =>
          u.id === currentUser.id ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (gUser?.avatarUrl && gUser.avatarUrl.trim() !== '' && gUser.avatarUrl !== currentUser.avatarUrl) {
        setCurrentUser(prev => ({ ...prev, avatarUrl: gUser.avatarUrl }));
      }
    }
  }, [coaches, athletes, availableUsers, currentUser.email, currentUser.id, currentUser.role, currentUser.avatarUrl]);

  // Verificação e Notificação Automática de Exames Médicos a 15 dias de expirar para Atletas e Encarregados
  useEffect(() => {
    if (!athletes || athletes.length === 0) return;

    const newExamNotifs: NotificationItem[] = [];
    athletes.forEach(ath => {
      const notif = createMedicalExpiryNotification(ath);
      if (notif) {
        const exists = notifications.some(
          n => n.id === notif.id || 
            (n.targetAthleteId === ath.id && n.title.includes('Exame Médico') && !n.isRead && n.date === notif.date)
        );
        if (!exists) {
          newExamNotifs.push(notif);
          upsertNotificationInSupabase(notif);
        }
      }
    });

    if (newExamNotifs.length > 0) {
      setNotifications(prev => [...newExamNotifs, ...prev]);
    }
  }, [athletes]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_coaches`, JSON.stringify(coaches));
  }, [coaches]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_plans`, JSON.stringify(trainingPlans));
  }, [trainingPlans]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_calendar`, JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_results`, JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_notifs`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_auths`, JSON.stringify(authorizations));
  }, [authorizations]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_carpools`, JSON.stringify(carpools));
  }, [carpools]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_age_categories`, JSON.stringify(ageCategories));
  }, [ageCategories]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Helper permission checker
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!currentUser || currentUser.status !== 'aprovado') return false;

    // Regra legal e de segurança rodoviária: atletas menores de 18 anos não podem disponibilizar lugares na bolsa de boleias
    if (permission === 'canOfferCarpool' && currentUser.role === 'atleta') {
      const birthDate = currentUser.birthDate || athletes.find(a => a.id === currentUser.athleteProfileId || a.name.toLowerCase() === currentUser.name.toLowerCase())?.birthDate;
      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 18) return false;
      } else {
        return false;
      }
    }

    const perms = rolePermissions[currentUser.role];
    return !!perms?.[permission];
  };

  const switchRole = (role: UserRole) => {
    const targetUser = availableUsers.find(u => u.role === role && u.status === 'aprovado') || {
      id: `user-${role}-${Date.now()}`,
      name: role === 'treinador' ? 'Treinador' : role === 'atleta' ? 'Atleta' : 'Encarregado de Educação',
      email: `${role}@clube.pt`,
      role,
      status: 'aprovado' as UserStatus,
      avatarUrl: '',
      phone: '',
      relatedAthleteIds: role === 'encarregado' && athletes.length > 0 ? [athletes[0].id] : undefined
    };
    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(targetUser));
    }
    setActiveTab(getTabForRole(role));
    showToast(`Perfil alterado para: ${role.toUpperCase()} (${targetUser.name})`, 'info');
  };

  const switchUserAccount = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    }
    setActiveTab(getTabForRole(user.role));
    showToast(`Sessão ativa: ${user.name} (${user.role.toUpperCase()})`, 'info');
  };

  // Authentication: Login
  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let found = availableUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      found = INITIAL_PROFILES.find(u => u.email.toLowerCase() === cleanEmail);
      if (found) {
        setAvailableUsers(prev => [found!, ...prev.filter(u => u.email.toLowerCase() !== cleanEmail)]);
      }
    }

    if (!found && (cleanEmail.includes('guedes') || cleanEmail.includes('joaopaulo'))) {
      found = INITIAL_PROFILES[0];
    }

    if (!found) {
      return {
        success: false,
        message: 'Utilizador não encontrado. Verifique o endereço de email ou crie um novo registo.'
      };
    }

    if (found.password && password && found.password !== password) {
      return {
        success: false,
        message: 'Palavra-passe incorreta. Se esqueceu a sua palavra-passe, utilize a opção de recuperação.'
      };
    }

    setCurrentUser(found);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(found));
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_is_auth`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_user`);
    }
    setActiveTab(getTabForRole(found.role));

    if (found.status === 'pendente_aprovacao') {
      showToast(`Bem-vindo, ${found.name}. O teu perfil aguarda validação do treinador.`, 'info');
    } else if (found.status === 'rejeitado') {
      showToast(`Atenção: O registo de ${found.name} foi recusado pela equipa técnica.`, 'error');
    } else {
      showToast(`Sessão iniciada como ${found.name} (${found.role.toUpperCase()})`, 'success');
    }

    return { success: true };
  };

  // Password recovery via Email with 6-digit OTP code & 15-minute expiration
  const requestPasswordResetEmail = async (email: string): Promise<{
    success: boolean;
    message: string;
    emailPreview?: PasswordResetEmailPreview;
  }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Por favor indique o seu endereço de email registado.' };
    }

    const targetUser = availableUsers.find(u => u.email.toLowerCase() === cleanEmail) ||
      INITIAL_PROFILES.find(u => u.email.toLowerCase() === cleanEmail);

    if (!targetUser) {
      return {
        success: false,
        message: 'Não foi encontrada nenhuma conta associada a este endereço de correio eletrónico.'
      };
    }

    // Generate secure 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMinutes = 15;
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

    // Persist active token securely in localStorage for validation
    try {
      const storedTokensStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pwd_reset_tokens`);
      const storedTokens = storedTokensStr ? JSON.parse(storedTokensStr) : {};
      storedTokens[cleanEmail] = {
        code,
        expiresAt,
        createdAt: Date.now(),
        userName: targetUser.name
      };
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_pwd_reset_tokens`, JSON.stringify(storedTokens));
    } catch (e) {
      console.error('Erro ao guardar token de recuperação:', e);
    }

    // If Supabase Auth is configured, also trigger official Supabase Auth reset email
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin
        });
      }
    } catch (sbErr) {
      console.warn('Tentativa de envio via Supabase Auth:', sbErr);
    }

    const preview: PasswordResetEmailPreview = {
      to: cleanEmail,
      recipientName: targetUser.name,
      code,
      sentAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      expiresInMinutes,
      clubName: clubInfo.name
    };

    showToast(`Email de recuperação enviado para ${cleanEmail}`, 'info');

    return {
      success: true,
      message: `Enviámos uma mensagem para ${cleanEmail} com o código de segurança para redefinição.`,
      emailPreview: preview
    };
  };

  const verifyResetCodeAndSetPassword = (
    email: string,
    code: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanCode) {
      return { success: false, message: 'Por favor introduza o código de segurança de 6 dígitos recebido por email.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'A nova palavra-passe deve conter pelo menos 6 carateres.' };
    }

    // Retrieve active token
    let tokenData: { code: string; expiresAt: number; userName: string } | null = null;
    try {
      const storedTokensStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pwd_reset_tokens`);
      if (storedTokensStr) {
        const storedTokens = JSON.parse(storedTokensStr);
        tokenData = storedTokens[cleanEmail] || null;
      }
    } catch (e) {
      console.error('Erro ao ler tokens de recuperação:', e);
    }

    if (!tokenData) {
      return {
        success: false,
        message: 'Nenhum pedido de recuperação ativo encontrado para este email. Por favor solicite um novo envio.'
      };
    }

    if (Date.now() > tokenData.expiresAt) {
      return {
        success: false,
        message: 'O código de segurança expirou (validade de 15 minutos excedida). Solicite um novo email de recuperação.'
      };
    }

    if (tokenData.code !== cleanCode) {
      return {
        success: false,
        message: 'Código de segurança incorreto. Verifique atentamente o código de 6 dígitos recebido por email.'
      };
    }

    // Code is valid! Update the password for the user
    let userIndex = availableUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    let targetUser: UserProfile | undefined;

    if (userIndex !== -1) {
      targetUser = availableUsers[userIndex];
    } else {
      targetUser = INITIAL_PROFILES.find(u => u.email.toLowerCase() === cleanEmail);
      if (targetUser) {
        setAvailableUsers(prev => [targetUser!, ...prev]);
        userIndex = 0;
      }
    }

    if (!targetUser) {
      return {
        success: false,
        message: 'Conta de utilizador não encontrada.'
      };
    }

    const updatedUser: UserProfile = { ...targetUser, password: newPassword };
    const updatedList = availableUsers.map(u => u.email.toLowerCase() === cleanEmail ? updatedUser : u);
    if (!availableUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      updatedList.unshift(updatedUser);
    }

    setAvailableUsers(updatedList);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(updatedList));
    upsertUserProfileInSupabase(updatedUser);

    // Invalidate the token so it cannot be reused
    try {
      const storedTokensStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pwd_reset_tokens`);
      if (storedTokensStr) {
        const storedTokens = JSON.parse(storedTokensStr);
        delete storedTokens[cleanEmail];
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_pwd_reset_tokens`, JSON.stringify(storedTokens));
      }
    } catch (e) {
      console.error('Erro ao limpar token de recuperação:', e);
    }

    showToast('Palavra-passe atualizada com segurança! Pode agora iniciar sessão.', 'success');
    return { success: true, message: 'Palavra-passe alterada com sucesso!' };
  };

  // Password recovery / reset legacy helper
  const resetPassword = (email: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let userIndex = availableUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
    let targetUser: UserProfile | undefined;

    if (userIndex !== -1) {
      targetUser = availableUsers[userIndex];
    } else {
      targetUser = INITIAL_PROFILES.find(u => u.email.toLowerCase() === cleanEmail);
      if (targetUser) {
        setAvailableUsers(prev => [targetUser!, ...prev]);
        userIndex = 0;
      }
    }

    if (!targetUser) {
      return {
        success: false,
        message: 'Não foi encontrada nenhuma conta associada a este endereço de email.'
      };
    }

    const updatedUser: UserProfile = { ...targetUser, password: newPassword };
    const updatedList = availableUsers.map(u => u.email.toLowerCase() === cleanEmail ? updatedUser : u);
    if (!availableUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      updatedList.unshift(updatedUser);
    }

    setAvailableUsers(updatedList);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(updatedList));
    upsertUserProfileInSupabase(updatedUser);

    showToast('Palavra-passe redefinida com sucesso! Pode agora iniciar sessão.', 'success');
    return { success: true, message: 'Palavra-passe redefinida com sucesso!' };
  };

  // Authentication: Register (Always creates with status 'pendente_aprovacao')
  const register = (data: {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    birthDate?: string;
    password?: string;
    requestedCategory?: string;
    federationNumber?: string;
    notes?: string;
    address?: string;
    coachGrade?: string;
    diplomaUrl?: string;
    diplomaName?: string;
    diplomaType?: 'pdf' | 'image' | 'doc' | 'other';
    relatedAthleteName?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = availableUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'Já existe uma conta associada a este endereço de email.'
      };
    }

    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      phone: (data.phone || '').trim(),
      birthDate: data.birthDate || '2008-01-01',
      password: data.password || '',
      status: 'pendente_aprovacao',
      registeredAt: new Date().toISOString().split('T')[0],
      requestedCategory: data.requestedCategory || (data.role === 'atleta' ? 'Juvenis A' : undefined),
      federationNumber: data.federationNumber || '',
      address: data.address || '',
      coachGrade: data.coachGrade || (data.role === 'treinador' ? 'Grau II - Treinador de Desporto' : undefined),
      diplomaUrl: data.diplomaUrl || '',
      diplomaName: data.diplomaName || '',
      diplomaType: data.diplomaType || 'pdf',
      notes: data.notes || (data.relatedAthleteName ? `Educando: ${data.relatedAthleteName}` : ''),
      avatarUrl:
        data.role === 'treinador'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
          : data.role === 'atleta'
          ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
    };

    const updatedList = [newProfile, ...availableUsers];
    setAvailableUsers(updatedList);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(updatedList));
    upsertUserProfileInSupabase(newProfile);

    setCurrentUser(newProfile);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(newProfile));
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_is_auth`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_user`);
    }
    setActiveTab(getTabForRole(newProfile.role));

    // Send broadcast notification for coaches
    const notif: NotificationItem = {
      id: `notif-reg-${Date.now()}`,
      title: 'Novo Registo para Aprovação',
      message: `${newProfile.name} registou-se como ${newProfile.role.toUpperCase()}${newProfile.requestedCategory ? ` (${newProfile.requestedCategory})` : ''} e aguarda aprovação da equipa técnica.`,
      type: 'urgente',
      targetAudience: 'treinadores',
      date: new Date().toISOString().split('T')[0],
      isRead: false,
      authorName: 'Portal de Inscrições'
    };
    setNotifications(prev => [notif, ...prev]);

    showToast('Registo submetido com sucesso! Aguarda validação pelo treinador.', 'info');
    return { success: true, user: newProfile };
  };

  // Authentication: Logout
  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_is_auth`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_user`);
    }
    showToast('Sessão terminada.', 'info');
  };

  // Coach Approval Handler
  const approveUser = (userId: string) => {
    const userToApprove = availableUsers.find(u => u.id === userId);
    if (!userToApprove) return;

    const coachName = currentUser?.role === 'treinador' ? currentUser.name : 'Prof. Carlos Silva';
    const today = new Date().toISOString().split('T')[0];

    let athleteId = userToApprove.athleteProfileId;
    let coachId = userToApprove.coachProfileId;

    // If athlete, auto-create Athlete record if not linked
    if (userToApprove.role === 'atleta' && !athleteId) {
      const existingAth = athletes.find(
        a => a.email.toLowerCase() === userToApprove.email.toLowerCase() ||
             a.name.toLowerCase() === userToApprove.name.toLowerCase()
      );
      if (existingAth) {
        athleteId = existingAth.id;
      } else {
        const newAth: Athlete = {
          id: `ath-${Date.now()}`,
          name: userToApprove.name,
          birthDate: userToApprove.birthDate || '',
          address: userToApprove.address || '',
          phone: userToApprove.phone || '',
          email: userToApprove.email,
          photoUrl: userToApprove.avatarUrl,
          federationNumber: userToApprove.federationNumber || '',
          category: userToApprove.requestedCategory || '',
          guardianName: 'Encarregado de Educação',
          guardianPhone: userToApprove.phone || '',
          guardianEmail: userToApprove.email,
          medicalExamExpiry: (userToApprove as any).medicalExamExpiry || '',
          medicalStatus: (userToApprove as any).medicalExamExpiry ? calculateMedicalStatus((userToApprove as any).medicalExamExpiry).status : 'expirado',
          emergencyContact: userToApprove.phone || '',
          attendanceRate: undefined,
          notes: userToApprove.notes || ''
        };
        setAthletes(prev => [newAth, ...prev]);
        athleteId = newAth.id;
      }
    } else if (userToApprove.role === 'treinador' && !coachId) {
      const existingCoach = coaches.find(c => c.email.toLowerCase() === userToApprove.email.toLowerCase());
      if (existingCoach) {
        coachId = existingCoach.id;
      } else {
        const newCoach: Coach = {
          id: `coach-${Date.now()}`,
          name: userToApprove.name,
          birthDate: userToApprove.birthDate || '',
          address: userToApprove.address || '',
          phone: userToApprove.phone || '',
          email: userToApprove.email,
          photoUrl: userToApprove.avatarUrl,
          licenseNumber: userToApprove.federationNumber || '',
          licenseGrade: userToApprove.coachGrade || '',
          diplomaUrl: userToApprove.diplomaUrl || '',
          diplomaName: userToApprove.diplomaName || '',
          diplomaType: userToApprove.diplomaType || 'pdf',
          assignedCategories: [userToApprove.requestedCategory || 'Juvenis', 'Juniores'],
          experienceYears: 5,
          bio: userToApprove.notes || 'Treinador aprovado pela coordenação desportiva.'
        };
        setCoaches(prev => [newCoach, ...prev]);
        coachId = newCoach.id;
      }
    }

    const updatedList = availableUsers.map(u => {
      if (u.id === userId) {
        const approved: UserProfile = {
          ...u,
          status: 'aprovado' as UserStatus,
          approvedAt: today,
          approvedByCoachName: coachName,
          athleteProfileId: athleteId,
          coachProfileId: coachId,
          rejectionReason: undefined
        };
        upsertUserProfileInSupabase(approved);
        return approved;
      }
      return u;
    });

    setAvailableUsers(updatedList);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(updatedList));

    // If current logged-in user is the one approved
    if (currentUser.id === userId) {
      const updatedCurrent = {
        ...currentUser,
        status: 'aprovado' as UserStatus,
        approvedAt: today,
        approvedByCoachName: coachName,
        athleteProfileId: athleteId,
        coachProfileId: coachId,
        rejectionReason: undefined
      };
      setCurrentUser(updatedCurrent);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(updatedCurrent));
    }

    // Congratulatory Notification
    const approvalNotif: NotificationItem = {
      id: `notif-appr-${Date.now()}`,
      title: '🎉 Perfil Aprovado pelo Treinador',
      message: `O perfil de ${userToApprove.name} (${userToApprove.role.toUpperCase()}) foi aprovado pelo Treinador ${coachName}.`,
      type: 'comunicado',
      targetAudience: 'todos',
      date: today,
      isRead: false,
      authorName: coachName
    };
    setNotifications(prev => [approvalNotif, ...prev]);

    showToast(`Perfil de "${userToApprove.name}" aprovado com sucesso!`, 'success');
  };

  // Coach Rejection Handler
  const rejectUser = (userId: string, reason?: string) => {
    const userToReject = availableUsers.find(u => u.id === userId);
    if (!userToReject) return;

    const finalReason = reason || 'Inscrição recusada pela equipa técnica. Para esclarecimentos, contacte o clube.';

    const updatedList = availableUsers.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'rejeitado' as UserStatus,
          rejectionReason: finalReason
        };
      }
      return u;
    });

    setAvailableUsers(updatedList);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(updatedList));

    if (currentUser.id === userId) {
      const updatedCurrent = {
        ...currentUser,
        status: 'rejeitado' as UserStatus,
        rejectionReason: finalReason
      };
      setCurrentUser(updatedCurrent);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(updatedCurrent));
    }

    showToast(`Registo de "${userToReject.name}" recusado.`, 'info');
  };

  const updateUserProfile = (userId: string, updated: Partial<UserProfile>) => {
    let updatedProfile: UserProfile | undefined;

    setAvailableUsers(prev => {
      const nextList = prev.map(u => {
        if (u.id === userId) {
          const item = { ...u, ...updated };
          updatedProfile = item;
          upsertUserProfileInSupabase(item);
          return item;
        }
        return u;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(nextList));
      return nextList;
    });

    if (currentUser.id === userId) {
      setCurrentUser(prev => {
        const item = { ...prev, ...updated };
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(item));
        return item;
      });
    }

    showToast('Dados do utilizador atualizados com sucesso!', 'success');
  };

  const pendingUsers = availableUsers.filter(u => u.status === 'pendente_aprovacao');
  const pendingApprovalsCount = pendingUsers.length;

  const updateRolePermissions = (role: UserRole, permissions: Partial<RolePermissions>) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...permissions
      }
    }));
    showToast(`Autorizações atualizadas para perfil ${role}`, 'success');
  };

  // Club Operations
  const updateClubInfo = (info: Partial<ClubInfo>) => {
    setClubInfo(prev => {
      const merged = { ...prev, ...info };
      upsertClubInfoInSupabase(merged);
      return merged;
    });
    showToast('Dados do clube atualizados com sucesso!');
  };

  // Athletes Operations
  const addAthlete = (athleteData: Omit<Athlete, 'id'>) => {
    const medicalStatus = calculateMedicalStatus(athleteData.medicalExamExpiry).status;
    const category = athleteData.category && athleteData.category.trim() !== '' && athleteData.category !== 'Em Análise'
      ? athleteData.category
      : determineAgeCategory(athleteData.birthDate, ageCategories);

    const newAthlete: Athlete = {
      ...athleteData,
      medicalStatus,
      category,
      id: `ath-${Date.now()}`
    };
    setAthletes(prev => [newAthlete, ...prev]);
    upsertAthleteInSupabase(newAthlete);
    if (currentUser.role === 'atleta' && !currentUser.athleteProfileId) {
      setCurrentUser(prev => ({ ...prev, athleteProfileId: newAthlete.id }));
    }

    const examNotif = createMedicalExpiryNotification(newAthlete);
    if (examNotif) {
      setNotifications(prev => [examNotif, ...prev]);
      upsertNotificationInSupabase(examNotif);
    }

    showToast(`Atleta "${newAthlete.name}" registado com sucesso!`);
  };

  const updateAthlete = (id: string, updated: Partial<Athlete>) => {
    let matchedAthleteEmail: string | undefined;
    let matchedAthleteName: string | undefined;

    setAthletes(prev => prev.map(a => {
      if (a.id === id) {
        matchedAthleteEmail = a.email;
        matchedAthleteName = a.name;
        const expiryToUse = updated.medicalExamExpiry !== undefined ? updated.medicalExamExpiry : a.medicalExamExpiry;
        const medicalStatus = calculateMedicalStatus(expiryToUse).status;

        let categoryToUse = updated.category !== undefined ? updated.category : a.category;
        if (updated.birthDate && (!updated.category || updated.category === a.category)) {
          categoryToUse = determineAgeCategory(updated.birthDate, ageCategories);
        }

        const item = {
          ...a,
          ...updated,
          medicalStatus,
          category: categoryToUse
        };
        upsertAthleteInSupabase(item);

        const examNotif = createMedicalExpiryNotification(item);
        if (examNotif) {
          setNotifications(prevNotifs => {
            const exists = prevNotifs.some(n => n.id === examNotif.id || (n.targetAthleteId === item.id && !n.isRead && n.title.includes('Exame Médico')));
            if (!exists) {
              upsertNotificationInSupabase(examNotif);
              return [examNotif, ...prevNotifs];
            }
            return prevNotifs;
          });
        }

        return item;
      }
      return a;
    }));

    // Sincronizar availableUsers se este atleta corresponder a um utilizador registado
    const newPhoto = updated.photoUrl;
    const newName = updated.name;
    const newEmail = updated.email;

    setAvailableUsers(prevUsers => {
      const next = prevUsers.map(u => {
        const isTarget =
          u.athleteProfileId === id ||
          (newEmail && u.email && u.email.toLowerCase() === newEmail.toLowerCase()) ||
          (matchedAthleteEmail && u.email && u.email.toLowerCase() === matchedAthleteEmail.toLowerCase()) ||
          (newName && u.name && u.name.toLowerCase() === newName.toLowerCase()) ||
          (matchedAthleteName && u.name && u.name.toLowerCase() === matchedAthleteName.toLowerCase());

        if (isTarget) {
          return {
            ...u,
            ...(newPhoto ? { avatarUrl: newPhoto } : {}),
            ...(newName ? { name: newName } : {}),
            ...(newEmail ? { email: newEmail } : {})
          };
        }
        return u;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(next));
      return next;
    });

    // Sincronizar o currentUser se for este atleta
    setCurrentUser(curr => {
      const isTarget =
        curr.athleteProfileId === id ||
        (newEmail && curr.email && curr.email.toLowerCase() === newEmail.toLowerCase()) ||
        (matchedAthleteEmail && curr.email && curr.email.toLowerCase() === matchedAthleteEmail.toLowerCase()) ||
        (newName && curr.name && curr.name.toLowerCase() === newName.toLowerCase()) ||
        (matchedAthleteName && curr.name && curr.name.toLowerCase() === matchedAthleteName.toLowerCase());

      if (isTarget) {
        const next = {
          ...curr,
          ...(newPhoto ? { avatarUrl: newPhoto } : {}),
          ...(newName ? { name: newName } : {}),
          ...(newEmail ? { email: newEmail } : {})
        };
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(next));
        return next;
      }
      return curr;
    });

    showToast('Ficha do atleta atualizada com sucesso!');
  };

  const deleteAthlete = (id: string) => {
    setAthletes(prev => prev.filter(a => a.id !== id));
    deleteAthleteInSupabase(id);
    showToast('Atleta removido com sucesso!', 'info');
  };

  // Coaches Operations
  const addCoach = (coachData: Omit<Coach, 'id'>) => {
    const newCoach: Coach = {
      ...coachData,
      isAdmin: coachData.isAdmin ?? false,
      id: `coach-${Date.now()}`
    };
    setCoaches(prev => [newCoach, ...prev]);
    upsertCoachInSupabase(newCoach);
    showToast(`Treinador "${newCoach.name}" registado com sucesso!`);
  };

  const updateCoach = (id: string, updated: Partial<Coach>) => {
    let matchedCoachEmail: string | undefined;
    let matchedCoachName: string | undefined;

    setCoaches(prev => prev.map(c => {
      if (c.id === id) {
        matchedCoachEmail = c.email;
        matchedCoachName = c.name;
        const item = { ...c, ...updated };
        upsertCoachInSupabase(item);
        return item;
      }
      return c;
    }));

    const newPhoto = updated.photoUrl;
    const newName = updated.name;
    const newEmail = updated.email;

    // Sincronizar lista de utilizadores disponíveis
    setAvailableUsers(prevUsers => {
      const next = prevUsers.map(u => {
        const isTarget =
          u.coachProfileId === id ||
          (newEmail && u.email && u.email.toLowerCase() === newEmail.toLowerCase()) ||
          (matchedCoachEmail && u.email && u.email.toLowerCase() === matchedCoachEmail.toLowerCase()) ||
          (newName && u.name && u.name.toLowerCase() === newName.toLowerCase()) ||
          (matchedCoachName && u.name && u.name.toLowerCase() === matchedCoachName.toLowerCase());

        if (isTarget) {
          return {
            ...u,
            ...(newPhoto ? { avatarUrl: newPhoto } : {}),
            ...(newName ? { name: newName } : {}),
            ...(newEmail ? { email: newEmail } : {}),
            ...(updated.isAdmin !== undefined ? { isAdmin: updated.isAdmin } : {})
          };
        }
        return u;
      });
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(next));
      return next;
    });

    // Sincronizar o utilizador atualmente com sessão iniciada (canto superior direito e sessão)
    setCurrentUser(curr => {
      const isTarget =
        curr.coachProfileId === id ||
        (newEmail && curr.email && curr.email.toLowerCase() === newEmail.toLowerCase()) ||
        (matchedCoachEmail && curr.email && curr.email.toLowerCase() === matchedCoachEmail.toLowerCase()) ||
        (newName && curr.name && curr.name.toLowerCase() === newName.toLowerCase()) ||
        (matchedCoachName && curr.name && curr.name.toLowerCase() === matchedCoachName.toLowerCase());

      if (isTarget) {
        const next = {
          ...curr,
          ...(newPhoto ? { avatarUrl: newPhoto } : {}),
          ...(newName ? { name: newName } : {}),
          ...(newEmail ? { email: newEmail } : {}),
          ...(updated.isAdmin !== undefined ? { isAdmin: updated.isAdmin } : {})
        };
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(next));
        return next;
      }
      return curr;
    });

    showToast('Ficha do treinador atualizada com sucesso!');
  };

  const deleteCoach = (id: string) => {
    setCoaches(prev => prev.filter(c => c.id !== id));
    deleteCoachInSupabase(id);
    showToast('Treinador removido.', 'info');
  };

  // Guardians Operations (CRUD de Encarregados de Educação)
  const addGuardian = (data: {
    name: string;
    email: string;
    phone: string;
    altPhone?: string;
    nif?: string;
    relation: string;
    address?: string;
    profession?: string;
    notes?: string;
    athleteIds?: string[];
    avatarUrl?: string;
  }): string => {
    const guardianId = `guard-${Date.now()}`;
    const cleanName = data.name.trim();
    const formattedName = data.relation ? `${cleanName} (${data.relation})` : cleanName;

    const newGuardianUser: UserProfile = {
      id: guardianId,
      name: formattedName,
      email: data.email.trim(),
      phone: data.phone.trim(),
      role: 'encarregado',
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      status: 'aprovado',
      notes: data.notes?.trim() || undefined,
      address: data.address?.trim() || undefined,
      nif: data.nif?.trim() || undefined,
      profession: data.profession?.trim() || undefined,
      altPhone: data.altPhone?.trim() || undefined,
      relation: data.relation || 'Pai / Mãe',
      relatedAthleteIds: data.athleteIds || [],
      registeredAt: new Date().toISOString().split('T')[0],
      approvedAt: new Date().toISOString().split('T')[0],
      approvedByCoachName: currentUser.name || 'Treinador Principal'
    };

    setAvailableUsers(prev => {
      const next = [newGuardianUser, ...prev];
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(next));
      return next;
    });
    upsertUserProfileInSupabase(newGuardianUser);

    // Update athletes
    if (data.athleteIds && data.athleteIds.length > 0) {
      setAthletes(prev => {
        const next = prev.map(a => {
          if (data.athleteIds?.includes(a.id)) {
            const emergency = data.altPhone || `${cleanName} (${data.relation}) - ${data.phone}`;
            const updatedAth: Athlete = {
              ...a,
              guardianId,
              guardianName: cleanName,
              guardianPhone: data.phone,
              guardianEmail: data.email,
              emergencyContact: emergency
            };
            upsertAthleteInSupabase(updatedAth);
            return updatedAth;
          }
          return a;
        });
        return next;
      });
    }

    showToast(`Encarregado "${cleanName}" adicionado com sucesso!`, 'success');
    return guardianId;
  };

  const updateGuardian = (
    id: string,
    data: {
      name: string;
      email: string;
      phone: string;
      altPhone?: string;
      nif?: string;
      relation: string;
      address?: string;
      profession?: string;
      notes?: string;
      athleteIds?: string[];
      avatarUrl?: string;
    },
    oldGuardianInfo?: { email?: string; name?: string }
  ) => {
    const cleanName = data.name.trim();
    const formattedName = data.relation ? `${cleanName} (${data.relation})` : cleanName;

    const oldEmail = oldGuardianInfo?.email?.trim().toLowerCase();
    const oldName = oldGuardianInfo?.name?.trim().toLowerCase();

    setAvailableUsers(prev => {
      const exists = prev.some(
        u => u.id === id || (oldEmail && u.email?.toLowerCase() === oldEmail)
      );
      let next: UserProfile[];
      if (exists) {
        next = prev.map(u => {
          if (u.id === id || (oldEmail && u.email?.toLowerCase() === oldEmail)) {
            const updatedUser: UserProfile = {
              ...u,
              id: u.id || id,
              name: formattedName,
              email: data.email.trim(),
              phone: data.phone.trim(),
              address: data.address?.trim() || undefined,
              notes: data.notes?.trim() || undefined,
              nif: data.nif?.trim() || undefined,
              profession: data.profession?.trim() || undefined,
              altPhone: data.altPhone?.trim() || undefined,
              relation: data.relation || u.relation || 'Pai / Mãe',
              avatarUrl: data.avatarUrl || u.avatarUrl,
              relatedAthleteIds: data.athleteIds || []
            };
            upsertUserProfileInSupabase(updatedUser);
            return updatedUser;
          }
          return u;
        });
      } else {
        const created: UserProfile = {
          id,
          name: formattedName,
          email: data.email.trim(),
          phone: data.phone.trim(),
          role: 'encarregado',
          avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
          status: 'aprovado',
          notes: data.notes?.trim() || undefined,
          address: data.address?.trim() || undefined,
          nif: data.nif?.trim() || undefined,
          profession: data.profession?.trim() || undefined,
          altPhone: data.altPhone?.trim() || undefined,
          relation: data.relation || 'Pai / Mãe',
          relatedAthleteIds: data.athleteIds || [],
          registeredAt: new Date().toISOString().split('T')[0]
        };
        upsertUserProfileInSupabase(created);
        next = [created, ...prev];
      }
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(next));
      return next;
    });

    // Update athletes: sync links
    setAthletes(prev => {
      const targetIds = new Set(data.athleteIds || []);
      const next = prev.map(a => {
        const wasLinked =
          a.guardianId === id ||
          (oldEmail && a.guardianEmail && a.guardianEmail.toLowerCase() === oldEmail) ||
          (oldName && a.guardianName && a.guardianName.toLowerCase() === oldName) ||
          (a.guardianEmail && a.guardianEmail.toLowerCase() === data.email.toLowerCase()) ||
          (a.guardianName && a.guardianName.toLowerCase() === cleanName.toLowerCase());

        if (targetIds.has(a.id)) {
          const emergency = data.altPhone || `${cleanName} (${data.relation}) - ${data.phone}`;
          const updatedAth: Athlete = {
            ...a,
            guardianId: id,
            guardianName: cleanName,
            guardianPhone: data.phone,
            guardianEmail: data.email,
            emergencyContact: emergency
          };
          upsertAthleteInSupabase(updatedAth);
          return updatedAth;
        } else if (wasLinked) {
          const updatedAth: Athlete = {
            ...a,
            guardianId: undefined,
            guardianName: '',
            guardianPhone: '',
            guardianEmail: '',
            emergencyContact: ''
          };
          upsertAthleteInSupabase(updatedAth);
          return updatedAth;
        }
        return a;
      });
      return next;
    });

    // Sincronizar o utilizador atual com sessão iniciada se for este encarregado
    setCurrentUser(curr => {
      const isTarget =
        curr.id === id ||
        (oldEmail && curr.email && curr.email.toLowerCase() === oldEmail) ||
        (curr.email && data.email && curr.email.toLowerCase() === data.email.trim().toLowerCase()) ||
        (curr.name && cleanName && curr.name.toLowerCase().includes(cleanName.toLowerCase()));

      if (isTarget) {
        const next = {
          ...curr,
          name: formattedName,
          email: data.email.trim(),
          phone: data.phone.trim(),
          avatarUrl: data.avatarUrl || curr.avatarUrl
        };
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_user`, JSON.stringify(next));
        return next;
      }
      return curr;
    });

    showToast(`Dados de "${cleanName}" atualizados com sucesso!`, 'success');
  };

  const deleteGuardian = (id: string, fallbackEmail?: string, fallbackName?: string) => {
    const guardianUser = availableUsers.find(
      u => u.id === id || (fallbackEmail && u.email?.toLowerCase() === fallbackEmail.toLowerCase())
    );
    const targetEmail = (guardianUser?.email || fallbackEmail)?.toLowerCase();
    const rawTargetName = guardianUser?.name || fallbackName || '';
    const targetName = rawTargetName.replace(/\s*\((Pai|Mãe|Tutor|Avô|Avó|Outro|Encarregado)\)\s*/gi, '').trim().toLowerCase();

    setAvailableUsers(prev => {
      const next = prev.filter(u => u.id !== id && (targetEmail ? u.email?.toLowerCase() !== targetEmail : true));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users_list`, JSON.stringify(next));
      return next;
    });

    setAthletes(prev => {
      const next = prev.map(a => {
        const isMatch = a.guardianId === id ||
          (targetEmail && a.guardianEmail && a.guardianEmail.toLowerCase() === targetEmail) ||
          (targetName && a.guardianName && a.guardianName.toLowerCase() === targetName);

        if (isMatch) {
          const updatedAth: Athlete = {
            ...a,
            guardianId: undefined,
            guardianName: '',
            guardianPhone: '',
            guardianEmail: '',
            emergencyContact: ''
          };
          upsertAthleteInSupabase(updatedAth);
          return updatedAth;
        }
        return a;
      });
      return next;
    });

    deleteUserProfileInSupabase(id);
    showToast('Encarregado de educação removido com sucesso!', 'info');
  };

  // Age Categories Operations (Gestão de Escalões por Data de Nascimento)
  const addAgeCategory = (catData: Omit<AgeCategory, 'id'>) => {
    const newCat: AgeCategory = {
      ...catData,
      id: `cat-${Date.now()}`
    };
    setAgeCategories(prev => [...prev, newCat]);
    upsertAgeCategoryInSupabase(newCat);
    showToast(`Escalão "${newCat.name}" criado com sucesso!`);
  };

  const updateAgeCategory = (id: string, updatedData: Partial<AgeCategory>) => {
    setAgeCategories(prev => prev.map(c => {
      if (c.id === id) {
        const item = { ...c, ...updatedData };
        upsertAgeCategoryInSupabase(item);
        return item;
      }
      return c;
    }));
    showToast('Escalão atualizado com sucesso!');
  };

  const deleteAgeCategory = (id: string) => {
    setAgeCategories(prev => prev.filter(c => c.id !== id));
    deleteAgeCategoryInSupabase(id);
    showToast('Escalão removido com sucesso.', 'info');
  };

  const applyAgeCategoriesToAthletes = (): { updatedCount: number } => {
    let updatedCount = 0;
    setAthletes(prevAthletes => {
      return prevAthletes.map(ath => {
        const targetCategory = determineAgeCategory(ath.birthDate, ageCategories);
        if (ath.category !== targetCategory) {
          updatedCount++;
          const updated = {
            ...ath,
            category: targetCategory
          };
          upsertAthleteInSupabase(updated);
          return updated;
        }
        return ath;
      });
    });

    if (updatedCount > 0) {
      showToast(`${updatedCount} atletas enquadrados automaticamente nos escalões!`, 'success');
    } else {
      showToast('Todos os atletas já estão alinhados com os escalões das suas datas de nascimento.', 'info');
    }

    return { updatedCount };
  };

  // Training Plans
  const addTrainingPlan = (planData: Omit<TrainingPlan, 'id' | 'createdAt'>) => {
    const newPlan: TrainingPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTrainingPlans(prev => [newPlan, ...prev]);
    upsertTrainingPlanInSupabase(newPlan);
    showToast(`Plano de treino "${newPlan.title}" criado!`);
  };

  const updateTrainingPlan = (id: string, updated: Partial<TrainingPlan>) => {
    setTrainingPlans(prev => prev.map(p => {
      if (p.id === id) {
        const item = { ...p, ...updated };
        upsertTrainingPlanInSupabase(item);
        return item;
      }
      return p;
    }));
    showToast('Plano de treino atualizado!');
  };

  const deleteTrainingPlan = (id: string) => {
    setTrainingPlans(prev => prev.filter(p => p.id !== id));
    deleteTrainingPlanInSupabase(id);
    showToast('Plano de treino eliminado.', 'info');
  };

  const completeTrainingPlan = (
    planId: string,
    athleteId: string,
    rpeOrOptions: number | {
      rpeRating: number;
      feedback?: string;
      status?: 'cumpriu' | 'nao_cumpriu' | 'parcial';
      date?: string;
    },
    legacyFeedback?: string
  ) => {
    let rpeRating = 7;
    let feedback = legacyFeedback;
    let status: 'cumpriu' | 'nao_cumpriu' | 'parcial' = 'cumpriu';
    let date = new Date().toISOString().split('T')[0];

    if (typeof rpeOrOptions === 'object') {
      rpeRating = rpeOrOptions.rpeRating;
      feedback = rpeOrOptions.feedback;
      status = rpeOrOptions.status || 'cumpriu';
      date = rpeOrOptions.date || date;
    } else {
      rpeRating = rpeOrOptions;
    }

    setTrainingPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const completed = p.completedByAthleteIds || [];
        const filtered = completed.filter(c => {
          if (c.athleteId !== athleteId) return true;
          if (date && c.date && c.date !== date) return true;
          return false;
        });
        const updatedPlan = {
          ...p,
          completedByAthleteIds: [
            ...filtered,
            {
              athleteId,
              completedAt: new Date().toISOString(),
              status,
              rpeRating,
              feedback,
              date
            }
          ]
        };
        upsertTrainingPlanInSupabase(updatedPlan);
        return updatedPlan;
      }
      return p;
    }));

    if (status === 'cumpriu') {
      showToast('Treino registado como CUMPRIDO! Bom trabalho!', 'success');
    } else if (status === 'nao_cumpriu') {
      showToast('Treino registado como Não Realizado.', 'info');
    } else {
      showToast('Treino registado como Parcial / Adaptado.', 'info');
    }
  };

  const removeTrainingPlanCompletion = (planId: string, athleteId: string, date?: string) => {
    setTrainingPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const completed = p.completedByAthleteIds || [];
        const filtered = completed.filter(c => {
          if (c.athleteId !== athleteId) return true;
          if (date && c.date && c.date !== date) return true;
          return false;
        });
        const updatedPlan = {
          ...p,
          completedByAthleteIds: filtered
        };
        upsertTrainingPlanInSupabase(updatedPlan);
        return updatedPlan;
      }
      return p;
    }));
    showToast('Registo de realização removido.', 'info');
  };

  // Calendar
  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id' | 'rsvps'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      rsvps: {}
    };
    setCalendarEvents(prev => [newEvent, ...prev]);
    upsertCalendarEventInSupabase(newEvent);
    showToast(`Evento "${newEvent.title}" adicionado ao calendário!`);
  };

  const updateCalendarEvent = (id: string, updated: Partial<CalendarEvent>) => {
    setCalendarEvents(prev => prev.map(e => {
      if (e.id === id) {
        const item = { ...e, ...updated };
        upsertCalendarEventInSupabase(item);
        return item;
      }
      return e;
    }));
    showToast('Evento atualizado no calendário.');
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    deleteCalendarEventInSupabase(id);
    showToast('Evento removido do calendário.', 'info');
  };

  const toggleEventCompletion = (id: string) => {
    setCalendarEvents(prev => prev.map(e => {
      if (e.id === id) {
        const nextState = !e.isCompleted;
        showToast(nextState ? 'Tarefa marcada como concluída!' : 'Tarefa marcada como pendente.');
        const item = { ...e, isCompleted: nextState };
        upsertCalendarEventInSupabase(item);
        return item;
      }
      return e;
    }));
  };

  const setEventRsvp = (eventId: string, status: 'confirmado' | 'ausente' | 'justificado', note?: string) => {
    setCalendarEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const key = currentUser.athleteProfileId || currentUser.id;
        const now = new Date();
        const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
        const updatedRsvps = {
          ...evt.rsvps,
          [key]: {
            status,
            responderName: currentUser.name,
            role: currentUser.role,
            note,
            updatedAt: formattedDate
          }
        };
        const updatedEvt = {
          ...evt,
          rsvps: updatedRsvps
        };
        upsertEventRsvpInSupabase(eventId, updatedRsvps);
        return updatedEvt;
      }
      return evt;
    }));
    showToast(status === 'confirmado' ? 'Presença confirmada (✓ Visto Verde)!' : status === 'ausente' ? 'Marcado como ausente (✕ Cruz Vermelha).' : 'Ausência justificada.');
  };

  // Results
  const addResult = (resultData: Omit<CompetitionResult, 'id' | 'publishedAt'>) => {
    const newResult: CompetitionResult = {
      ...resultData,
      id: `res-${Date.now()}`,
      publishedAt: new Date().toISOString().split('T')[0]
    };
    setResults(prev => [newResult, ...prev]);
    upsertResultInSupabase(newResult);
    showToast(`Resultados de "${newResult.title}" publicados com sucesso!`);
  };

  const updateResult = (id: string, updated: Partial<CompetitionResult>) => {
    setResults(prev => prev.map(r => {
      if (r.id === id) {
        const item = { ...r, ...updated };
        upsertResultInSupabase(item);
        return item;
      }
      return r;
    }));
    showToast('Resultados atualizados com sucesso!');
  };

  const deleteResult = (id: string) => {
    setResults(prev => prev.filter(r => String(r.id) !== String(id)));
    deleteResultInSupabase(id);
    showToast('Resultados eliminados com sucesso.', 'info');
  };

  // Notifications
  const unreadCount = notifications.filter(n => !n.isRead && isNotificationVisibleForUser(n, currentUser, athletes)).length;

  const addNotification = (itemData: Omit<NotificationItem, 'id' | 'date' | 'isRead'>) => {
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
    const newNotif: NotificationItem = {
      ...itemData,
      id: `notif-${Date.now()}`,
      date: formatted,
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    upsertNotificationInSupabase(newNotif);
    const targetAthName = itemData.targetAthleteName || (itemData.targetAthleteId ? athletes.find(a => a.id === itemData.targetAthleteId)?.name : null);
    if (targetAthName) {
      showToast(`Comunicado enviado com sucesso para ${targetAthName}!`, 'success');
    } else {
      showToast('Notificação transmitida com sucesso!', 'success');
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('Todas as notificações marcadas como lidas.');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteNotificationInSupabase(id);
  };

  // Parent Area
  const updateAuthorizationStatus = (id: string, status: 'autorizado' | 'recusado', notes?: string) => {
    setAuthorizations(prev => prev.map(a => {
      if (a.id === id) {
        const updated = {
          ...a,
          status,
          notes: notes || a.notes,
          signedAt: status === 'autorizado' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined
        };
        upsertParentAuthorizationInSupabase(updated);
        return updated;
      }
      return a;
    }));
    showToast(status === 'autorizado' ? 'Termo de autorização assinado com sucesso!' : 'Autorização recusada.');
  };

  const addCarpoolOffer = (offerData: Omit<CarpoolOffer, 'id' | 'claimedSeats'>) => {
    // Atletas menores de 18 anos não podem disponibilizar lugares na bolsa de boleias
    if (currentUser.role === 'atleta') {
      const birthDate = currentUser.birthDate || athletes.find(a => a.id === currentUser.athleteProfileId || a.name.toLowerCase() === currentUser.name.toLowerCase())?.birthDate;
      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 18) {
          showToast('Atletas menores de 18 anos não podem disponibilizar lugares na bolsa de boleias.', 'error');
          return;
        }
      } else {
        showToast('Atletas menores de 18 anos não podem disponibilizar lugares na bolsa de boleias.', 'error');
        return;
      }
    }

    const newCarpool: CarpoolOffer = {
      ...offerData,
      id: `carp-${Date.now()}`,
      claimedSeats: []
    };
    setCarpools(prev => [newCarpool, ...prev]);
    upsertCarpoolOfferInSupabase(newCarpool);
    showToast('Disponibilidade de boleia partilhada com as famílias!');
  };

  const claimCarpoolSeat = (carpoolId: string, parentName: string, athleteName: string, seats: number) => {
    setCarpools(prev => prev.map(c => {
      if (c.id === carpoolId) {
        const totalClaimed = c.claimedSeats.reduce((acc, curr) => acc + curr.seats, 0);
        if (totalClaimed + seats > c.availableSeats) {
          showToast('Lugares insuficientes disponíveis nesta viagem.', 'error');
          return c;
        }
        const updated = {
          ...c,
          claimedSeats: [
            ...c.claimedSeats,
            { parentName, athleteName, seats }
          ]
        };
        upsertCarpoolOfferInSupabase(updated);
        return updated;
      }
      return c;
    }));
    showToast('Lugar na boleia reservado com sucesso!');
  };

  const deleteCarpoolOffer = (carpoolId: string) => {
    const carpool = carpools.find(c => c.id === carpoolId);
    if (!carpool) return;

    // Notify all passengers who reserved seats that the carpool was cancelled and became void
    if (carpool.claimedSeats && carpool.claimedSeats.length > 0) {
      const now = new Date();
      const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
      const newNotifs: NotificationItem[] = [];

      carpool.claimedSeats.forEach((claim, idx) => {
        const matchedAthlete = athletes.find(
          a => a.name.toLowerCase() === claim.athleteName.toLowerCase()
        );
        const matchedUser = availableUsers.find(
          u => u.name.toLowerCase() === claim.parentName.toLowerCase()
        );

        const notif: NotificationItem = {
          id: `notif-carpool-cancelled-${Date.now()}-${idx}`,
          title: '🚫 Boleia Cancelada / Ficou Sem Efeito',
          message: `Atenção: A boleia oferecida por ${carpool.parentName} para "${carpool.eventTitle}" (${carpool.eventDate} às ${carpool.departureTime}) foi eliminada e ficou sem efeito. A sua reserva de ${claim.seats} lugar(es) para ${claim.athleteName} foi cancelada.`,
          date: formattedDate,
          type: 'urgente',
          targetAudience: 'pais',
          targetAthleteId: matchedAthlete?.id,
          targetUserId: matchedUser?.id,
          isRead: false,
          authorName: carpool.parentName,
          actionTab: 'pais'
        };

        newNotifs.push(notif);
        upsertNotificationInSupabase(notif);
      });

      // Also create a club-level notice in notifications
      const broadcastNotif: NotificationItem = {
        id: `notif-carpool-bc-${Date.now()}`,
        title: '🚗 Oferta de Boleia Cancelada',
        message: `A oferta de boleia para "${carpool.eventTitle}" (${carpool.eventDate}) oferecida por ${carpool.parentName} foi eliminada pelo responsável e ficou sem efeito.`,
        date: formattedDate,
        type: 'comunicado',
        targetAudience: 'pais',
        isRead: false,
        authorName: carpool.parentName,
        actionTab: 'pais'
      };
      newNotifs.push(broadcastNotif);
      upsertNotificationInSupabase(broadcastNotif);

      setNotifications(prev => [...newNotifs, ...prev]);
      showToast(
        `Boleia eliminada. ${carpool.claimedSeats.length} família(s) que tinham reservado lugar foram notificadas de que a viagem ficou sem efeito.`,
        'info'
      );
    } else {
      showToast('Oferta de boleia eliminada com sucesso.', 'info');
    }

    setCarpools(prev => prev.filter(c => c.id !== carpoolId));
    deleteCarpoolOfferInSupabase(carpoolId);
  };

  const resetAllData = () => {
    localStorage.clear();
    setClubInfo(INITIAL_CLUB_INFO);
    setAthletes(INITIAL_ATHLETES);
    setCoaches(INITIAL_COACHES);
    setTrainingPlans(INITIAL_TRAINING_PLANS);
    setCalendarEvents(INITIAL_CALENDAR_EVENTS);
    setResults(INITIAL_RESULTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuthorizations(INITIAL_PARENT_AUTHORIZATIONS);
    setCarpools(INITIAL_CARPOOLS);
    setAgeCategories(INITIAL_AGE_CATEGORIES);
    setCurrentUser(INITIAL_PROFILES[0]);
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    showToast('Dados restaurados para o padrão de demonstração!', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isCurrentUserAdmin,
        availableUsers,
        setCurrentUser,
        switchRole,
        switchUserAccount,
        login,
        requestPasswordResetEmail,
        verifyResetCodeAndSetPassword,
        resetPassword,
        register,
        logout,
        approveUser,
        rejectUser,
        updateUserProfile,
        pendingUsers,
        pendingApprovalsCount,
        isApprovalsModalOpen,
        setIsApprovalsModalOpen,
        rolePermissions,
        updateRolePermissions,
        hasPermission,
        activeTab,
        setActiveTab,
        isMobileDeviceView,
        setIsMobileDeviceView,
        clubInfo,
        updateClubInfo,
        athletes,
        addAthlete,
        updateAthlete,
        deleteAthlete,
        coaches,
        addCoach,
        updateCoach,
        deleteCoach,
        addGuardian,
        updateGuardian,
        deleteGuardian,
        ageCategories,
        addAgeCategory,
        updateAgeCategory,
        deleteAgeCategory,
        applyAgeCategoriesToAthletes,
        trainingPlans,
        addTrainingPlan,
        updateTrainingPlan,
        deleteTrainingPlan,
        completeTrainingPlan,
        removeTrainingPlanCompletion,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        toggleEventCompletion,
        setEventRsvp,
        results,
        addResult,
        updateResult,
        deleteResult,
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        authorizations,
        updateAuthorizationStatus,
        carpools,
        addCarpoolOffer,
        deleteCarpoolOffer,
        claimCarpoolSeat,
        supabaseStatus,
        isSupabaseConfigured: getSupabaseConfig().isConfigured,
        syncWithSupabase,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        resetAllData,
        showToast,
        toast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
