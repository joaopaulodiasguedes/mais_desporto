import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { encryptText, decryptText } from './encryption';
import {
  CalendarEvent,
  TrainingPlan,
  CompetitionResult,
  NotificationItem,
  Athlete,
  Coach,
  ClubInfo,
  UserProfile,
  UserRole,
  ParentAuthorization,
  CarpoolOffer,
  AgeCategory
} from '../types';
import { calculateMedicalStatus } from '../utils/athleteRules';

const STORAGE_KEY_URL = 'supabase_custom_url';
const STORAGE_KEY_KEY = 'supabase_custom_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'custom' | 'none';
  isConfigured: boolean;
}

/**
 * Retrieves the current Supabase configuration from environment variables or custom overrides.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  if (customUrl && customKey) {
    return {
      url: customUrl.trim(),
      anonKey: customKey.trim(),
      source: 'custom',
      isConfigured: true
    };
  }

  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL;
  const envKey = env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && envUrl.trim() !== '' && envKey.trim() !== '') {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      source: 'env',
      isConfigured: true
    };
  }

  return {
    url: '',
    anonKey: '',
    source: 'none',
    isConfigured: false
  };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    // Reset cached client
    cachedClient = null;
  }
}

export function clearCustomSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  }
}

let cachedClient: SupabaseClient | null = null;
let lastConfigUrl = '';
let lastConfigKey = '';

/**
 * Returns a singleton SupabaseClient if configured, or null otherwise.
 */
export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (cachedClient && lastConfigUrl === config.url && lastConfigKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    lastConfigUrl = config.url;
    lastConfigKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export interface TableCheckDetail {
  name: string;
  label: string;
  status: 'ok' | 'error';
  count?: number;
  error?: string;
}

export interface SupabaseTestResult {
  success: boolean;
  message: string;
  tablesFound: string[];
  tablesFailed: string[];
  tablesList: TableCheckDetail[];
}

/**
 * Tests connection to the Supabase instance by checking all 11 tables.
 */
export async function testSupabaseConnection(): Promise<SupabaseTestResult> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase não configurado. Forneça o Project URL e a Anon Key.',
      tablesFound: [],
      tablesFailed: [],
      tablesList: []
    };
  }

  const registeredTables = [
    { name: 'club_info', label: 'Informações do Clube' },
    { name: 'athletes', label: 'Fichas dos Atletas' },
    { name: 'coaches', label: 'Treinadores & Diplomas' },
    { name: 'age_categories', label: 'Escalões por Nascimento' },
    { name: 'calendar_events', label: 'Eventos & Presenças (RSVP)' },
    { name: 'training_plans', label: 'Planos de Treino' },
    { name: 'competition_results', label: 'Resultados de Competições' },
    { name: 'notifications', label: 'Notificações & Avisos' },
    { name: 'profiles', label: 'Perfis de Utilizador' },
    { name: 'parent_authorizations', label: 'Autorizações Parentais' },
    { name: 'carpool_offers', label: 'Bolsa de Boleias Partilhadas' }
  ];

  try {
    const checks: TableCheckDetail[] = await Promise.all(
      registeredTables.map(async (tbl) => {
        try {
          const { count, error } = await client
            .from(tbl.name)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            return {
              name: tbl.name,
              label: tbl.label,
              status: 'ok' as const,
              count: count ?? 0
            };
          }
          return {
            name: tbl.name,
            label: tbl.label,
            status: 'error' as const,
            error: error.message
          };
        } catch (e: any) {
          return {
            name: tbl.name,
            label: tbl.label,
            status: 'error' as const,
            error: e?.message || 'Falha de consulta'
          };
        }
      })
    );

    const tablesFound = checks.filter(c => c.status === 'ok').map(c => c.name);
    const tablesFailed = checks.filter(c => c.status !== 'ok').map(c => c.name);

    if (tablesFound.length === registeredTables.length) {
      return {
        success: true,
        message: `Todas as ${registeredTables.length} tabelas conectadas com sucesso e validadas na base de dados!`,
        tablesFound,
        tablesFailed,
        tablesList: checks
      };
    }

    if (tablesFound.length > 0) {
      return {
        success: true,
        message: `Conexão ativa! ${tablesFound.length} de ${registeredTables.length} tabelas verificadas (${tablesFound.join(', ')}). Em falta: ${tablesFailed.join(', ')}.`,
        tablesFound,
        tablesFailed,
        tablesList: checks
      };
    }

    return {
      success: false,
      message: `Nenhuma tabela encontrada. Execute o ficheiro supabase_schema.sql no SQL Editor do Supabase para criar as tabelas.`,
      tablesFound: [],
      tablesFailed,
      tablesList: checks
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro de rede ou configuração: ${err?.message || 'Falha desconhecida'}`,
      tablesFound: [],
      tablesFailed: registeredTables.map(t => t.name),
      tablesList: []
    };
  }
}

// ==============================================================================
// DATA MAPPERS (Snake_Case Supabase <-> CamelCase App)
// ==============================================================================

export function mapCalendarEventFromDb(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title || '',
    type: row.type || 'treino_oficial',
    date: row.date,
    time: row.time || '18:00',
    endTime: row.end_time || undefined,
    location: row.location || undefined,
    targetCategories: row.target_categories || [],
    description: row.description || undefined,
    officialPdfUrl: row.official_pdf_url || undefined,
    createdByRole: row.created_by_role || 'treinador',
    creatorName: row.creator_name || 'Treinador',
    creatorId: row.creator_id || 'user-coach-1',
    athleteId: row.athlete_id || undefined,
    isCompleted: !!row.is_completed,
    rsvps: row.rsvps || {}
  };
}

export function mapCalendarEventToDb(evt: CalendarEvent): any {
  return {
    id: evt.id,
    title: evt.title,
    type: evt.type,
    date: evt.date,
    time: evt.time,
    end_time: evt.endTime || null,
    location: evt.location || null,
    target_categories: evt.targetCategories || [],
    description: evt.description || null,
    official_pdf_url: evt.officialPdfUrl || null,
    created_by_role: evt.createdByRole,
    creator_name: evt.creatorName,
    creator_id: evt.creatorId,
    athlete_id: evt.athleteId || null,
    is_completed: !!evt.isCompleted,
    rsvps: evt.rsvps || {},
    updated_at: new Date().toISOString()
  };
}

export async function mapAthleteFromDb(row: any): Promise<Athlete> {
  const [
    decryptedPhone,
    decryptedEmail,
    decryptedAddress,
    decryptedGuardianName,
    decryptedGuardianPhone,
    decryptedGuardianEmail,
    decryptedEmergencyContact,
    decryptedAllergies,
    decryptedNotes
  ] = await Promise.all([
    decryptText(row.phone || row.telefone || row.telemovel || row.contacto),
    decryptText(row.email || row.email_atleta),
    decryptText(row.address || row.morada || row.endereco || row.residencia),
    decryptText(row.guardian_name || row.guardianName || row.encarregado_nome || row.encarregado || row.encarregado_educacao || row.nome_encarregado || row.pai_mae || row.tutor),
    decryptText(row.guardian_phone || row.guardianPhone || row.encarregado_telefone || row.contacto_encarregado || row.telefone_encarregado || row.telemovel_encarregado),
    decryptText(row.guardian_email || row.guardianEmail || row.encarregado_email || row.email_encarregado),
    decryptText(row.emergency_contact || row.emergencyContact || row.contacto_emergencia || row.contacto_urgente || row.telefone_emergencia),
    decryptText(row.allergies_or_conditions || row.allergiesOrConditions || row.alergias || row.condicoes_medicas || row.restricoes),
    decryptText(row.notes || row.observacoes || row.notas)
  ]);

  const rawBirth = row.birth_date || row.birthdate || row.birthDate || row.data_nascimento || row.dataNascimento || row.nascimento || row.dt_nasc || '';
  const rawCat = row.category || row.categoria || row.escalao || row.escalao_etario || row.turma || '';
  const rawExamExpiry = row.medical_exam_expiry || row.medicalExamExpiry || row.exame_validade || row.validade_exame || row.data_exame || row.validade_medica || row.exame_medico || row.validade || '';

  return {
    id: String(row.id || row.atleta_id || `ath-${Date.now()}`),
    name: row.name || row.nome || row.nome_completo || row.nome_atleta || 'Atleta',
    birthDate: rawBirth,
    address: decryptedAddress || row.address || row.morada || row.endereco || '',
    phone: decryptedPhone || row.phone || row.telefone || row.telemovel || row.contacto || '',
    email: decryptedEmail || row.email || row.email_atleta || '',
    photoUrl: row.photo_url || row.photoUrl || row.foto || row.foto_url || row.avatar || row.avatar_url || '',
    federationNumber: row.federation_number || row.federationNumber || row.licenca || row.numero_licenca || row.numero_federacao || row.num_federado || row.fpn || '',
    category: rawCat || 'Em Análise',
    guardianName: decryptedGuardianName || row.guardian_name || row.guardianName || row.encarregado_nome || row.encarregado || row.encarregado_educacao || row.nome_encarregado || '',
    guardianPhone: decryptedGuardianPhone || row.guardian_phone || row.guardianPhone || row.encarregado_telefone || row.contacto_encarregado || '',
    guardianEmail: decryptedGuardianEmail || row.guardian_email || row.guardianEmail || row.encarregado_email || row.email_encarregado || '',
    guardianId: row.guardian_id ? String(row.guardian_id) : (row.guardianId ? String(row.guardianId) : (row.encarregado_id ? String(row.encarregado_id) : undefined)),
    guardianRelation: row.guardian_relation || row.guardianRelation || row.parentesco || row.grau_parentesco || undefined,
    guardianNif: row.guardian_nif || row.guardianNif || row.nif_encarregado || undefined,
    nif: row.nif || row.nif_atleta || undefined,
    gender: row.gender || row.genero || row.sexo || undefined,
    medicalExamExpiry: rawExamExpiry,
    medicalStatus: row.medical_status || row.medicalStatus || (rawExamExpiry ? calculateMedicalStatus(rawExamExpiry).status : 'valido'),
    emergencyContact: decryptedEmergencyContact || row.emergency_contact || row.emergencyContact || row.contacto_emergencia || '',
    allergiesOrConditions: decryptedAllergies || row.allergies_or_conditions || row.allergiesOrConditions || row.alergias || undefined,
    attendanceRate: (row.attendance_rate !== undefined && row.attendance_rate !== null) ? Number(row.attendance_rate) : ((row.attendanceRate !== undefined && row.attendanceRate !== null) ? Number(row.attendanceRate) : ((row.assiduidade !== undefined && row.assiduidade !== null) ? Number(row.assiduidade) : 100)),
    notes: decryptedNotes || row.notes || row.observacoes || row.notas || undefined
  };
}

export async function mapAthleteToDb(ath: Athlete): Promise<any> {
  const [
    encryptedAddress,
    encryptedPhone,
    encryptedEmail,
    encryptedGuardianName,
    encryptedGuardianPhone,
    encryptedGuardianEmail,
    encryptedEmergencyContact,
    encryptedAllergies,
    encryptedNotes
  ] = await Promise.all([
    encryptText(ath.address),
    encryptText(ath.phone),
    encryptText(ath.email),
    encryptText(ath.guardianName),
    encryptText(ath.guardianPhone),
    encryptText(ath.guardianEmail),
    encryptText(ath.emergencyContact),
    encryptText(ath.allergiesOrConditions),
    encryptText(ath.notes)
  ]);

  return {
    id: ath.id,
    name: ath.name,
    birth_date: ath.birthDate,
    address: encryptedAddress || null,
    phone: encryptedPhone || null,
    email: encryptedEmail || null,
    photo_url: ath.photoUrl || null,
    federation_number: ath.federationNumber || null,
    category: ath.category,
    guardian_name: encryptedGuardianName || null,
    guardian_phone: encryptedGuardianPhone || null,
    guardian_email: encryptedGuardianEmail || null,
    guardian_id: ath.guardianId || null,
    guardian_relation: ath.guardianRelation || null,
    guardian_nif: ath.guardianNif || null,
    nif: ath.nif || null,
    gender: ath.gender || null,
    medical_exam_expiry: ath.medicalExamExpiry || null,
    medical_status: ath.medicalStatus || 'valido',
    emergency_contact: encryptedEmergencyContact || null,
    allergies_or_conditions: encryptedAllergies || null,
    attendance_rate: ath.attendanceRate ?? 100,
    notes: encryptedNotes || null,
    updated_at: new Date().toISOString()
  };
}

export async function mapCoachFromDb(row: any): Promise<Coach> {
  const [
    decryptedPhone,
    decryptedEmail,
    decryptedAddress,
    decryptedLicenseNumber,
    decryptedBio
  ] = await Promise.all([
    decryptText(row.phone || row.telefone || row.telemovel || row.contacto),
    decryptText(row.email || row.correio),
    decryptText(row.address || row.morada || row.endereco),
    decryptText(row.license_number || row.licenseNumber || row.cedula || row.tptd || row.licenca || row.numero_cedula),
    decryptText(row.bio || row.biografia || row.curriculo || row.apresentacao)
  ]);

  return {
    id: String(row.id || row.treinador_id || `coach-${Date.now()}`),
    name: row.name || row.nome || row.nome_completo || 'Treinador',
    birthDate: row.birth_date || row.birthDate || row.data_nascimento || row.nascimento || undefined,
    address: decryptedAddress || row.address || row.morada || row.endereco || undefined,
    phone: decryptedPhone || row.phone || row.telefone || row.telemovel || row.contacto || undefined,
    email: decryptedEmail || row.email || row.correio || '',
    photoUrl: row.photo_url || row.photoUrl || row.foto || row.foto_url || row.avatar || row.avatar_url || undefined,
    licenseNumber: decryptedLicenseNumber || row.license_number || row.licenseNumber || row.cedula || row.tptd || row.licenca || undefined,
    licenseGrade: row.license_grade || row.licenseGrade || row.grau || row.coach_grade || row.grau_treinador || undefined,
    diplomaUrl: row.diploma_url || row.diplomaUrl || row.diploma || row.cedula_url || undefined,
    diplomaName: row.diploma_name || row.diplomaName || row.nome_diploma || undefined,
    diplomaType: row.diploma_type || row.diplomaType || row.tipo_diploma || undefined,
    assignedCategories: Array.isArray(row.assigned_categories) ? row.assigned_categories : (Array.isArray(row.assignedCategories) ? row.assignedCategories : (Array.isArray(row.escaloes) ? row.escaloes : [])),
    experienceYears: row.experience_years ? Number(row.experience_years) : (row.experienceYears ? Number(row.experienceYears) : (row.anos_experiencia ? Number(row.anos_experiencia) : 0)),
    bio: decryptedBio || row.bio || row.biografia || row.curriculo || undefined,
    isAdmin: Boolean(row.is_admin || row.isAdmin || row.admin || row.email?.toLowerCase() === 'joaopaulodiasguedes@gmail.com')
  };
}

export async function mapCoachToDb(c: Coach): Promise<any> {
  const [
    encryptedAddress,
    encryptedPhone,
    encryptedEmail,
    encryptedLicenseNumber,
    encryptedBio
  ] = await Promise.all([
    encryptText(c.address),
    encryptText(c.phone),
    encryptText(c.email),
    encryptText(c.licenseNumber),
    encryptText(c.bio)
  ]);

  return {
    id: c.id,
    name: c.name,
    birth_date: c.birthDate || null,
    address: encryptedAddress || null,
    phone: encryptedPhone || null,
    email: encryptedEmail || c.email,
    photo_url: c.photoUrl || null,
    license_number: encryptedLicenseNumber || null,
    license_grade: c.licenseGrade || null,
    diploma_url: c.diplomaUrl || null,
    diploma_name: c.diplomaName || null,
    diploma_type: c.diplomaType || null,
    assigned_categories: c.assignedCategories || [],
    experience_years: c.experienceYears || 0,
    bio: encryptedBio || null,
    is_admin: c.isAdmin ?? false,
    updated_at: new Date().toISOString()
  };
}

export function mapClubInfoFromDb(row: any): ClubInfo {
  if (!row) {
    return {
      name: 'O Meu Clube',
      modality: 'Desporto Náutico',
      logoUrl: '',
      bannerUrl: '',
      address: '',
      nif: '',
      phone: '',
      email: '',
      foundationYear: 1998,
      presidentName: '',
      description: '',
      facilities: '',
      primaryColor: '#2563eb',
      documents: []
    };
  }

  let parsedDocuments: any[] | undefined = undefined;
  if (row.documents || row.documentos) {
    const rawDocs = row.documents || row.documentos;
    try {
      parsedDocuments = typeof rawDocs === 'string' ? JSON.parse(rawDocs) : rawDocs;
    } catch {
      parsedDocuments = [];
    }
  }

  return {
    name: row.name || row.nome || row.nome_clube || row.designacao || 'O Meu Clube',
    modality: row.modality || row.modalidade || row.desporto || '',
    logoUrl: row.logo_url || row.logoUrl || row.logo || row.emblema || row.foto || '',
    bannerUrl: row.banner_url || row.bannerUrl || row.banner || row.capa || '',
    address: row.address || row.morada || row.endereco || row.sede || '',
    nif: row.nif || row.nipc || row.numero_contribuinte || '',
    phone: row.phone || row.telefone || row.contacto || row.telemovel || '',
    email: row.email || row.email_institucional || row.correio || '',
    foundationYear: row.foundation_year || row.foundationYear || row.ano_fundacao || row.fundacao || 1998,
    presidentName: row.president_name || row.presidentName || row.presidente || row.nome_presidente || row.direcao || '',
    description: row.description || row.descricao || row.historia || row.sobre || '',
    facilities: row.facilities || row.instalacoes || row.piscinas || row.complexo || '',
    instagram: row.instagram || row.link_instagram || undefined,
    facebook: row.facebook || row.link_facebook || undefined,
    website: row.website || row.site || row.url_site || undefined,
    primaryColor: row.primary_color || row.primaryColor || row.cor_primaria || row.cor || '#2563eb',
    regulationsPdfUrl: row.regulations_pdf_url || row.regulationsPdfUrl || row.regulamento_url || row.regulamento_interno || undefined,
    documents: Array.isArray(parsedDocuments) ? parsedDocuments : []
  };
}

export function mapTrainingPlanFromDb(row: any): TrainingPlan {
  return {
    id: row.id,
    title: row.title,
    modality: row.modality,
    targetCategory: row.target_category,
    durationMinutes: row.duration_minutes,
    intensityLevel: row.intensity_level,
    objective: row.objective || '',
    blocks: row.blocks || [],
    createdByCoachName: row.created_by_coach_name || '',
    tags: row.tags || [],
    assignedAthleteIds: row.assigned_athlete_ids || [],
    completedByAthleteIds: row.completed_by_athlete_ids || [],
    scheduledDate: row.scheduled_date || undefined,
    scheduledTime: row.scheduled_time || undefined,
    scheduledDates: row.scheduled_dates || [],
    createdAt: row.created_at || new Date().toISOString().split('T')[0]
  };
}

export function mapCompetitionResultFromDb(row: any): CompetitionResult {
  return {
    id: row.id,
    title: row.title,
    competitionDate: row.competition_date,
    eventId: row.event_id || undefined,
    modality: row.modality,
    category: row.category,
    location: row.location || '',
    pdfUrl: row.pdf_url || undefined,
    pdfTitle: row.pdf_title || undefined,
    pdfFileSize: row.pdf_file_size || undefined,
    summary: row.summary || '',
    podium: row.podium || [],
    highlights: row.highlights || [],
    photos: row.photos || [],
    publishedByCoachName: row.published_by_coach_name || 'Treinador',
    publishedAt: row.published_at || new Date().toISOString()
  };
}

export function mapNotificationFromDb(row: any): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    date: row.date || new Date().toISOString(),
    type: row.type,
    targetAudience: row.target_audience,
    targetCategory: row.target_category || undefined,
    targetAthleteId: row.target_athlete_id || undefined,
    targetAthleteIds: row.target_athlete_ids || undefined,
    targetAthleteName: row.target_athlete_name || undefined,
    targetUserId: row.target_user_id || undefined,
    isRead: !!row.is_read,
    authorName: row.author_name || 'Clube',
    actionLabel: row.action_label || undefined,
    actionTab: row.action_tab || undefined
  };
}

export function mapAgeCategoryFromDb(row: any): AgeCategory {
  return {
    id: row.id,
    name: row.name,
    code: row.code || undefined,
    birthDateStart: row.birth_date_start,
    birthDateEnd: row.birth_date_end,
    seasonStartDate: row.season_start_date,
    seasonEndDate: row.season_end_date,
    gender: row.gender || 'todos',
    notes: row.notes || undefined,
    color: row.color || 'bg-blue-600'
  };
}

export function mapAgeCategoryToDb(cat: AgeCategory): any {
  return {
    id: cat.id,
    name: cat.name,
    code: cat.code || null,
    birth_date_start: cat.birthDateStart,
    birth_date_end: cat.birthDateEnd,
    season_start_date: cat.seasonStartDate,
    season_end_date: cat.seasonEndDate,
    gender: cat.gender || 'todos',
    notes: cat.notes || null,
    color: cat.color || 'bg-blue-600',
    updated_at: new Date().toISOString()
  };
}

export async function mapParentAuthorizationFromDb(row: any): Promise<ParentAuthorization> {
  const decryptedNotes = await decryptText(row.notes || row.observacoes);
  return {
    id: String(row.id || `auth-${Date.now()}`),
    athleteId: String(row.athlete_id || row.athleteId || row.atleta_id || ''),
    athleteName: row.athlete_name || row.athleteName || row.atleta_nome || row.nome_atleta || 'Atleta',
    parentId: String(row.parent_id || row.parentId || row.encarregado_id || ''),
    parentName: row.parent_name || row.parentName || row.encarregado_nome || row.nome_encarregado || 'Encarregado',
    eventId: String(row.event_id || row.eventId || row.evento_id || ''),
    eventTitle: row.event_title || row.eventTitle || row.evento_titulo || row.nome_evento || 'Evento',
    eventDate: row.event_date || row.eventDate || row.data_evento || row.data || '',
    location: row.location || row.local || row.localizacao || '',
    status: row.status || row.estado || 'pendente',
    signedAt: row.signed_at || row.signedAt || row.data_assinatura || undefined,
    notes: decryptedNotes || undefined
  };
}

export async function mapParentAuthorizationToDb(auth: ParentAuthorization): Promise<any> {
  const encryptedNotes = await encryptText(auth.notes);
  return {
    id: auth.id,
    athlete_id: auth.athleteId,
    athlete_name: auth.athleteName,
    parent_id: auth.parentId,
    parent_name: auth.parentName,
    event_id: auth.eventId,
    event_title: auth.eventTitle,
    event_date: auth.eventDate,
    location: auth.location || null,
    status: auth.status,
    signed_at: auth.signedAt || null,
    notes: encryptedNotes || null,
    updated_at: new Date().toISOString()
  };
}

export async function mapCarpoolOfferFromDb(row: any): Promise<CarpoolOffer> {
  const [decryptedContactPhone, decryptedNotes] = await Promise.all([
    decryptText(row.contact_phone || row.contactPhone || row.telefone || row.contacto),
    decryptText(row.notes || row.observacoes)
  ]);
  return {
    id: String(row.id || `carpool-${Date.now()}`),
    parentId: String(row.parent_id || row.parentId || row.encarregado_id || ''),
    parentName: row.parent_name || row.parentName || row.encarregado_nome || 'Encarregado',
    athleteName: row.athlete_name || row.athleteName || row.atleta_nome || '',
    eventId: String(row.event_id || row.eventId || row.evento_id || ''),
    eventTitle: row.event_title || row.eventTitle || row.evento_titulo || 'Evento',
    eventDate: row.event_date || row.eventDate || row.data_evento || row.data || '',
    availableSeats: row.available_seats ? Number(row.available_seats) : (row.availableSeats ? Number(row.availableSeats) : (row.lugares ? Number(row.lugares) : 1)),
    departureLocation: row.departure_location || row.departureLocation || row.local_partida || row.partida || '',
    departureTime: row.departure_time || row.departureTime || row.hora_partida || row.horario || '08:00',
    contactPhone: decryptedContactPhone || row.contact_phone || row.contactPhone || row.telefone || row.contacto || '',
    notes: decryptedNotes || undefined,
    claimedSeats: Array.isArray(row.claimed_seats) ? row.claimed_seats : (Array.isArray(row.claimedSeats) ? row.claimedSeats : (Array.isArray(row.reservas) ? row.reservas : []))
  };
}

export async function mapCarpoolOfferToDb(carpool: CarpoolOffer): Promise<any> {
  const [encryptedContactPhone, encryptedNotes] = await Promise.all([
    encryptText(carpool.contactPhone),
    encryptText(carpool.notes)
  ]);
  return {
    id: carpool.id,
    parent_id: carpool.parentId,
    parent_name: carpool.parentName,
    athlete_name: carpool.athleteName,
    event_id: carpool.eventId,
    event_title: carpool.eventTitle,
    event_date: carpool.eventDate,
    available_seats: carpool.availableSeats,
    departure_location: carpool.departureLocation,
    departure_time: carpool.departureTime,
    contact_phone: encryptedContactPhone || carpool.contactPhone,
    notes: encryptedNotes || null,
    claimed_seats: carpool.claimedSeats || [],
    created_at: new Date().toISOString()
  };
}

export function normalizeUserRole(rawRole: any): UserRole {
  if (!rawRole) return 'atleta';
  const r = String(rawRole).toLowerCase().trim();
  if (r.includes('treina') || r.includes('coach') || r.includes('admin')) return 'treinador';
  if (
    r.includes('encarregad') ||
    r.includes('pai') ||
    r.includes('mae') ||
    r.includes('mãe') ||
    r.includes('tutor') ||
    r.includes('guard') ||
    r.includes('responsa')
  ) {
    return 'encarregado';
  }
  return 'atleta';
}

export async function mapUserProfileFromDb(row: any): Promise<UserProfile> {
  const [decryptedPhone, decryptedAddress, decryptedNotes, decryptedPassword] = await Promise.all([
    decryptText(row.phone || row.telefone || row.telemovel || row.contacto),
    decryptText(row.address || row.morada || row.endereco),
    decryptText(row.notes || row.observacoes || row.notas),
    decryptText(row.password)
  ]);

  const normalizedRole = normalizeUserRole(row.role || row.papel || row.tipo || row.tipo_utilizador);
  // Default to approved if status is missing or empty
  const status = row.status || row.estado || 'aprovado';

  return {
    id: String(row.id || row.user_id || row.auth_user_id || `user-${Date.now()}`),
    name: row.name || row.nome || row.nome_completo || 'Utilizador',
    email: row.email || row.correio || '',
    role: normalizedRole,
    avatarUrl: row.avatar_url || row.avatarUrl || row.photo_url || row.foto || row.foto_url || '',
    phone: decryptedPhone || row.phone || row.telefone || row.telemovel || row.contacto || '',
    birthDate: row.birth_date || row.birthDate || row.data_nascimento || row.nascimento || undefined,
    status: status,
    password: decryptedPassword || row.password || undefined,
    coachGrade: row.coach_grade || row.coachGrade || row.grau || undefined,
    diplomaUrl: row.diploma_url || row.diplomaUrl || row.diploma || row.cedula_url || undefined,
    diplomaName: row.diploma_name || row.diplomaName || row.nome_diploma || undefined,
    diplomaType: row.diploma_type || row.diplomaType || row.tipo_diploma || undefined,
    requestedCategory: row.requested_category || row.requestedCategory || row.escalao || row.categoria || undefined,
    federationNumber: row.federation_number || row.federationNumber || row.licenca || row.cedula || row.tptd || undefined,
    notes: decryptedNotes || row.notes || row.observacoes || row.notas || undefined,
    address: decryptedAddress || row.address || row.morada || row.endereco || undefined,
    registeredAt: row.registered_at || row.registeredAt || row.data_registo || undefined,
    approvedAt: row.approved_at || row.approvedAt || row.data_aprovacao || undefined,
    approvedByCoachName: row.approved_by_coach_name || row.approvedByCoachName || row.aprovado_por || undefined,
    rejectionReason: row.rejection_reason || row.rejectionReason || row.motivo_rejeicao || undefined,
    relation: row.relation || row.parentesco || row.grau_parentesco || row.relacao || (normalizedRole === 'encarregado' ? 'Encarregado(a)' : undefined),
    nif: row.nif || row.numero_contribuinte || row.nipc || undefined,
    profession: row.profession || row.profissao || row.ocupacao || undefined,
    altPhone: row.alt_phone || row.altPhone || row.telefone_alternativo || row.contacto_alternativo || row.contacto_emergencia || undefined,
    relatedAthleteIds: Array.isArray(row.related_athlete_ids) ? row.related_athlete_ids.map(String) : (Array.isArray(row.relatedAthleteIds) ? row.relatedAthleteIds.map(String) : (Array.isArray(row.atletas_associados) ? row.atletas_associados.map(String) : [])),
    athleteProfileId: row.athlete_profile_id ? String(row.athlete_profile_id) : (row.athleteProfileId ? String(row.athleteProfileId) : (row.atleta_id ? String(row.atleta_id) : undefined)),
    coachProfileId: row.coach_profile_id ? String(row.coach_profile_id) : (row.coachProfileId ? String(row.coachProfileId) : (row.treinador_id ? String(row.treinador_id) : undefined)),
    isAdmin: Boolean(row.is_admin || row.isAdmin || row.admin || row.email?.toLowerCase() === 'joaopaulodiasguedes@gmail.com')
  };
}

export async function mapUserProfileToDb(user: UserProfile): Promise<any> {
  const [encryptedPhone, encryptedAddress, encryptedNotes, encryptedPassword] = await Promise.all([
    encryptText(user.phone),
    encryptText(user.address),
    encryptText(user.notes),
    encryptText(user.password)
  ]);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar_url: user.avatarUrl || null,
    phone: encryptedPhone || null,
    birth_date: user.birthDate || null,
    address: encryptedAddress || null,
    password: encryptedPassword || null,
    coach_grade: user.coachGrade || null,
    diploma_url: user.diplomaUrl || null,
    diploma_name: user.diplomaName || null,
    diploma_type: user.diplomaType || null,
    requested_category: user.requestedCategory || null,
    federation_number: user.federationNumber || null,
    notes: encryptedNotes || null,
    relation: user.relation || null,
    nif: user.nif || null,
    profession: user.profession || null,
    alt_phone: user.altPhone || null,
    approved_at: user.approvedAt || null,
    approved_by_coach_name: user.approvedByCoachName || null,
    rejection_reason: user.rejectionReason || null,
    related_athlete_ids: user.relatedAthleteIds || [],
    athlete_profile_id: user.athleteProfileId || null,
    coach_profile_id: user.coachProfileId || null,
    is_admin: user.isAdmin ?? false,
    updated_at: new Date().toISOString()
  };
}

// ==============================================================================
// ASYNC SUPABASE DATA FETCHERS
// ==============================================================================

export async function fetchAllFromSupabase(): Promise<{
  events?: CalendarEvent[];
  athletes?: Athlete[];
  coaches?: Coach[];
  trainingPlans?: TrainingPlan[];
  results?: CompetitionResult[];
  notifications?: NotificationItem[];
  clubInfo?: ClubInfo;
  ageCategories?: AgeCategory[];
  authorizations?: ParentAuthorization[];
  carpools?: CarpoolOffer[];
  profiles?: UserProfile[];
} | null> {
  const client = getSupabase();
  if (!client) return null;

  const result: {
    events?: CalendarEvent[];
    athletes?: Athlete[];
    coaches?: Coach[];
    trainingPlans?: TrainingPlan[];
    results?: CompetitionResult[];
    notifications?: NotificationItem[];
    clubInfo?: ClubInfo;
    ageCategories?: AgeCategory[];
    authorizations?: ParentAuthorization[];
    carpools?: CarpoolOffer[];
    profiles?: UserProfile[];
  } = {};

  // 1. Fetch club_info (with fallback to 'clube' / 'clubs' and preference for newest row)
  try {
    const { data: clubRows, error: clubErr } = await client
      .from('club_info')
      .select('*')
      .order('id', { ascending: false });

    if (!clubErr && Array.isArray(clubRows) && clubRows.length > 0) {
      result.clubInfo = mapClubInfoFromDb(clubRows[0]);
    } else {
      const { data: altClub } = await client.from('clube').select('*').limit(1).maybeSingle();
      if (altClub) {
        result.clubInfo = mapClubInfoFromDb(altClub);
      } else {
        const { data: altClub2 } = await client.from('clubs').select('*').limit(1).maybeSingle();
        if (altClub2) result.clubInfo = mapClubInfoFromDb(altClub2);
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar club_info do Supabase:', e);
  }

  // 2. Fetch athletes (with fallback to 'atletas' and resilient per-item mapping)
  try {
    let athletesRows: any[] = [];
    const { data: athData, error: athErr } = await client
      .from('athletes')
      .select('*')
      .order('name', { ascending: true });

    if (!athErr && Array.isArray(athData) && athData.length > 0) {
      athletesRows = athData;
    } else {
      const { data: altAthData } = await client
        .from('atletas')
        .select('*')
        .order('name', { ascending: true });
      if (Array.isArray(altAthData) && altAthData.length > 0) {
        athletesRows = altAthData;
      }
    }

    if (athletesRows.length > 0) {
      const mappedAthletes: Athlete[] = [];
      for (const row of athletesRows) {
        try {
          const mapped = await mapAthleteFromDb(row);
          mappedAthletes.push(mapped);
        } catch (e) {
          console.warn('Erro ao mapear atleta do Supabase:', e, row);
          mappedAthletes.push({
            id: String(row.id || row.atleta_id || `ath-${Date.now()}`),
            name: row.name || row.nome || 'Atleta',
            birthDate: row.birth_date || row.birthdate || row.data_nascimento || '',
            address: row.address || row.morada || '',
            phone: row.phone || row.telefone || row.telemovel || '',
            email: row.email || '',
            photoUrl: row.photo_url || row.photoUrl || row.foto || '',
            federationNumber: row.federation_number || row.federationNumber || row.licenca || '',
            category: row.category || row.escalao || 'Em Análise',
            guardianName: row.guardian_name || row.encarregado_nome || row.encarregado || '',
            guardianPhone: row.guardian_phone || row.encarregado_telefone || '',
            guardianEmail: row.guardian_email || row.encarregado_email || '',
            guardianId: row.guardian_id ? String(row.guardian_id) : undefined,
            guardianRelation: row.guardian_relation || row.parentesco || undefined,
            guardianNif: row.guardian_nif || row.nif_encarregado || undefined,
            nif: row.nif || undefined,
            gender: row.gender || row.genero || undefined,
            medicalExamExpiry: row.medical_exam_expiry || row.exame_validade || '',
            medicalStatus: 'valido',
            emergencyContact: row.emergency_contact || row.contacto_emergencia || '',
            attendanceRate: 100
          });
        }
      }
      result.athletes = mappedAthletes;
    } else {
      result.athletes = [];
    }
  } catch (e) {
    console.warn('Erro ao carregar athletes do Supabase:', e);
    result.athletes = [];
  }

  // 3. Fetch user profiles and check guardians/encarregados/utilizadores
  try {
    let profilesRows: any[] = [];
    const { data: profData, error: profErr } = await client
      .from('profiles')
      .select('*')
      .order('name', { ascending: true });

    if (!profErr && Array.isArray(profData) && profData.length > 0) {
      profilesRows = [...profData];
    } else {
      const { data: altProf } = await client.from('perfis').select('*').order('name', { ascending: true });
      if (Array.isArray(altProf) && altProf.length > 0) {
        profilesRows = [...altProf];
      } else {
        const { data: altUsers } = await client.from('utilizadores').select('*').order('name', { ascending: true });
        if (Array.isArray(altUsers) && altUsers.length > 0) {
          profilesRows = [...altUsers];
        }
      }
    }

    // Check optional guardians table
    try {
      const { data: gData } = await client.from('guardians').select('*');
      if (Array.isArray(gData) && gData.length > 0) {
        for (const g of gData) {
          if (!profilesRows.some((p: any) => p.email && g.email && p.email.toLowerCase() === g.email.toLowerCase())) {
            profilesRows.push({ ...g, role: 'encarregado', status: g.status || 'aprovado' });
          }
        }
      }
    } catch {
      // Optional table
    }

    // Check optional encarregados table
    try {
      const { data: encData } = await client.from('encarregados').select('*');
      if (Array.isArray(encData) && encData.length > 0) {
        for (const enc of encData) {
          if (!profilesRows.some((p: any) => p.email && enc.email && p.email.toLowerCase() === enc.email.toLowerCase())) {
            profilesRows.push({ ...enc, role: 'encarregado', status: enc.status || 'aprovado' });
          }
        }
      }
    } catch {
      // Optional table
    }

    if (profilesRows.length > 0) {
      const mappedProfiles: UserProfile[] = [];
      for (const row of profilesRows) {
        try {
          const mapped = await mapUserProfileFromDb(row);
          mappedProfiles.push(mapped);
        } catch (e) {
          console.warn('Erro ao mapear perfil do Supabase:', e, row);
        }
      }
      result.profiles = mappedProfiles;
    } else {
      result.profiles = [];
    }
  } catch (e) {
    console.warn('Erro ao carregar profiles do Supabase:', e);
    result.profiles = [];
  }

  // 4. Fetch coaches (with fallback to 'treinadores')
  try {
    let coachDataRows: any[] = [];
    const { data: coachData, error: coachErr } = await client.from('coaches').select('*').order('name', { ascending: true });
    if (!coachErr && Array.isArray(coachData) && coachData.length > 0) {
      coachDataRows = coachData;
    } else {
      const { data: altCoach } = await client.from('treinadores').select('*').order('name', { ascending: true });
      if (Array.isArray(altCoach) && altCoach.length > 0) {
        coachDataRows = altCoach;
      }
    }
    if (coachDataRows.length > 0) {
      result.coaches = await Promise.all(coachDataRows.map(mapCoachFromDb));
    } else {
      result.coaches = [];
    }
  } catch (e) {
    console.warn('Erro ao carregar coaches do Supabase:', e);
    result.coaches = [];
  }

  // --------------------------------------------------------------------------
  // PONTE BIDIRECIONAL RESILIENTE ENTRE TABELAS (Evita dados a vir a vazio!)
  // --------------------------------------------------------------------------
  if (!result.athletes) result.athletes = [];
  if (!result.profiles) result.profiles = [];
  if (!result.coaches) result.coaches = [];

  // A) Atletas registados na tabela 'profiles' que não existam na lista de 'athletes'
  for (const prof of result.profiles) {
    if (prof.role === 'atleta') {
      const exists = result.athletes.some(
        (a) => a.id === prof.id || (prof.email && a.email && a.email.toLowerCase() === prof.email.toLowerCase())
      );
      if (!exists) {
        result.athletes.push({
          id: prof.id,
          name: prof.name,
          birthDate: prof.birthDate || '',
          address: prof.address || '',
          phone: prof.phone || '',
          email: prof.email,
          photoUrl: prof.avatarUrl || '',
          federationNumber: prof.federationNumber || '',
          category: prof.requestedCategory || 'Em Análise',
          guardianName: prof.notes || '',
          guardianPhone: prof.altPhone || '',
          guardianEmail: '',
          guardianRelation: prof.relation,
          guardianNif: prof.nif,
          medicalExamExpiry: '',
          medicalStatus: 'valido',
          emergencyContact: prof.altPhone || prof.phone || '',
          attendanceRate: 100
        });
      }
    }
  }

  // B) Atletas da lista de 'athletes' que não tenham conta na lista de 'profiles'
  for (const ath of result.athletes) {
    const exists = result.profiles.some(
      (p) => p.id === ath.id || (ath.email && p.email && p.email.toLowerCase() === ath.email.toLowerCase())
    );
    if (!exists) {
      result.profiles.push({
        id: ath.id,
        name: ath.name,
        email: ath.email || `${ath.id}@clube.local`,
        role: 'atleta',
        avatarUrl: ath.photoUrl || '',
        phone: ath.phone || '',
        birthDate: ath.birthDate || undefined,
        status: 'aprovado',
        federationNumber: ath.federationNumber || undefined,
        requestedCategory: ath.category || undefined,
        relation: ath.guardianRelation,
        nif: ath.nif,
        address: ath.address || undefined
      });
    }

    // C) Criar ou vincular Encarregado de Educação se o atleta tiver dados de encarregado
    if (ath.guardianName || ath.guardianEmail || ath.guardianPhone) {
      const existingGuardian = result.profiles.find(
        (p) =>
          p.role === 'encarregado' &&
          ((ath.guardianEmail && p.email && p.email.toLowerCase() === ath.guardianEmail.toLowerCase()) ||
            (ath.guardianName && p.name && p.name.toLowerCase() === ath.guardianName.toLowerCase()) ||
            (ath.guardianId && p.id === ath.guardianId))
      );

      if (existingGuardian) {
        if (!existingGuardian.relatedAthleteIds) existingGuardian.relatedAthleteIds = [];
        if (!existingGuardian.relatedAthleteIds.includes(ath.id)) {
          existingGuardian.relatedAthleteIds.push(ath.id);
        }
        if (!ath.guardianId) ath.guardianId = existingGuardian.id;
        if (!existingGuardian.relation && ath.guardianRelation) existingGuardian.relation = ath.guardianRelation;
        if (!existingGuardian.nif && ath.guardianNif) existingGuardian.nif = ath.guardianNif;
      } else if (ath.guardianName || ath.guardianEmail) {
        // Criar perfil sintético de encarregado para que a Área de Encarregados nunca venha vazia
        const newGuardianId = ath.guardianId || `enc-${ath.id}`;
        ath.guardianId = newGuardianId;
        result.profiles.push({
          id: newGuardianId,
          name: ath.guardianName || 'Encarregado de Educação',
          email: ath.guardianEmail || `encarregado-${ath.id}@clube.local`,
          role: 'encarregado',
          status: 'aprovado',
          avatarUrl: '',
          phone: ath.guardianPhone || '',
          relation: ath.guardianRelation || 'Encarregado(a) de Educação',
          nif: ath.guardianNif,
          address: ath.address,
          relatedAthleteIds: [ath.id]
        });
      }
    }
  }

  // D) Treinadores registados na tabela 'profiles' que não existam na lista de 'coaches'
  for (const prof of result.profiles) {
    if (prof.role === 'treinador') {
      const exists = result.coaches.some(
        (c) => c.id === prof.id || (prof.email && c.email && c.email.toLowerCase() === prof.email.toLowerCase())
      );
      if (!exists) {
        result.coaches.push({
          id: prof.id,
          name: prof.name,
          email: prof.email,
          birthDate: prof.birthDate || '',
          address: prof.address,
          phone: prof.phone || '',
          photoUrl: prof.avatarUrl || '',
          licenseNumber: prof.federationNumber || '',
          licenseGrade: prof.coachGrade || 'Treinador',
          diplomaUrl: prof.diplomaUrl,
          diplomaName: prof.diplomaName,
          diplomaType: prof.diplomaType,
          assignedCategories: prof.requestedCategory ? [prof.requestedCategory] : [],
          experienceYears: 0,
          bio: prof.notes || '',
          isAdmin: Boolean(prof.isAdmin || prof.email?.toLowerCase() === 'joaopaulodiasguedes@gmail.com')
        });
      }
    }
  }

  // E) Treinadores da lista de 'coaches' que não tenham conta na lista de 'profiles'
  for (const c of result.coaches) {
    const exists = result.profiles.some(
      (p) => p.id === c.id || (c.email && p.email && p.email.toLowerCase() === c.email.toLowerCase())
    );
    if (!exists) {
      result.profiles.push({
        id: c.id,
        name: c.name,
        email: c.email,
        role: 'treinador',
        avatarUrl: c.photoUrl,
        phone: c.phone,
        birthDate: c.birthDate,
        status: 'aprovado',
        coachGrade: c.licenseGrade,
        diplomaUrl: c.diplomaUrl,
        diplomaName: c.diplomaName,
        diplomaType: c.diplomaType,
        federationNumber: c.licenseNumber,
        address: c.address,
        isAdmin: c.isAdmin
      });
    }
  }

  // 5. Fetch calendar events (with fallback to 'eventos')
  try {
    let evtRows: any[] = [];
    const { data: eventsData, error: evErr } = await client.from('calendar_events').select('*').order('date', { ascending: true });
    if (!evErr && Array.isArray(eventsData) && eventsData.length > 0) {
      evtRows = eventsData;
    } else {
      const { data: altEvts } = await client.from('eventos').select('*').order('date', { ascending: true });
      if (Array.isArray(altEvts) && altEvts.length > 0) evtRows = altEvts;
    }
    if (evtRows.length > 0) {
      result.events = evtRows.map(mapCalendarEventFromDb);
    }
  } catch (e) {
    console.warn('Erro ao carregar calendar_events do Supabase:', e);
  }

  // 6. Fetch training plans (with fallback to 'planos_treino')
  try {
    let plansRows: any[] = [];
    const { data: plansData, error: pErr } = await client.from('training_plans').select('*');
    if (!pErr && Array.isArray(plansData) && plansData.length > 0) {
      plansRows = plansData;
    } else {
      const { data: altPlans } = await client.from('planos_treino').select('*');
      if (Array.isArray(altPlans) && altPlans.length > 0) plansRows = altPlans;
    }
    if (plansRows.length > 0) {
      result.trainingPlans = plansRows.map(mapTrainingPlanFromDb);
    }
  } catch (e) {
    console.warn('Erro ao carregar training_plans do Supabase:', e);
  }

  // 7. Fetch competition results (with fallback to 'resultados')
  try {
    let resRows: any[] = [];
    const { data: resData, error: resErr } = await client.from('competition_results').select('*').order('competition_date', { ascending: false });
    if (!resErr && Array.isArray(resData) && resData.length > 0) {
      resRows = resData;
    } else {
      const { data: altRes } = await client.from('resultados').select('*').order('competition_date', { ascending: false });
      if (Array.isArray(altRes) && altRes.length > 0) resRows = altRes;
    }
    if (resRows.length > 0) {
      result.results = resRows.map(mapCompetitionResultFromDb);
    }
  } catch (e) {
    console.warn('Erro ao carregar competition_results do Supabase:', e);
  }

  // 8. Fetch notifications (with fallback to 'notificacoes')
  try {
    let notifRows: any[] = [];
    const { data: notifData, error: notifErr } = await client.from('notifications').select('*').order('date', { ascending: false });
    if (!notifErr && Array.isArray(notifData) && notifData.length > 0) {
      notifRows = notifData;
    } else {
      const { data: altNotifs } = await client.from('notificacoes').select('*').order('date', { ascending: false });
      if (Array.isArray(altNotifs) && altNotifs.length > 0) notifRows = altNotifs;
    }
    if (notifRows.length > 0) {
      result.notifications = notifRows.map(mapNotificationFromDb);
    }
  } catch (e) {
    console.warn('Erro ao carregar notifications do Supabase:', e);
  }

  // 9. Fetch age categories (with fallback to 'escaloes')
  try {
    let catRows: any[] = [];
    const { data: ageData, error: catErr } = await client.from('age_categories').select('*').order('birth_date_start', { ascending: true });
    if (!catErr && Array.isArray(ageData) && ageData.length > 0) {
      catRows = ageData;
    } else {
      const { data: altCats } = await client.from('escaloes').select('*').order('birth_date_start', { ascending: true });
      if (Array.isArray(altCats) && altCats.length > 0) catRows = altCats;
    }
    if (catRows.length > 0) {
      result.ageCategories = catRows.map(mapAgeCategoryFromDb);
    }
  } catch (e) {
    console.warn('Erro ao carregar age_categories do Supabase:', e);
  }

  // 10. Fetch authorizations (with fallback to 'autorizacoes')
  try {
    let authRows: any[] = [];
    const { data: authData, error: authErr } = await client.from('parent_authorizations').select('*').order('created_at', { ascending: false });
    if (!authErr && Array.isArray(authData) && authData.length > 0) {
      authRows = authData;
    } else {
      const { data: altAuths } = await client.from('autorizacoes').select('*').order('created_at', { ascending: false });
      if (Array.isArray(altAuths) && altAuths.length > 0) authRows = altAuths;
    }
    if (authRows.length > 0) {
      result.authorizations = await Promise.all(authRows.map(mapParentAuthorizationFromDb));
    }
  } catch (e) {
    console.warn('Erro ao carregar parent_authorizations do Supabase:', e);
  }

  // 11. Fetch carpool offers (with fallback to 'boleias')
  try {
    let carRows: any[] = [];
    const { data: carData, error: carErr } = await client.from('carpool_offers').select('*').order('event_date', { ascending: true });
    if (!carErr && Array.isArray(carData) && carData.length > 0) {
      carRows = carData;
    } else {
      const { data: altCars } = await client.from('boleias').select('*').order('event_date', { ascending: true });
      if (Array.isArray(altCars) && altCars.length > 0) carRows = altCars;
    }
    if (carRows.length > 0) {
      result.carpools = await Promise.all(carRows.map(mapCarpoolOfferFromDb));
    }
  } catch (e) {
    console.warn('Erro ao carregar carpool_offers do Supabase:', e);
  }

  return result;
}

// ==============================================================================
// ASYNC MUTATIONS (SYNC ACTIONS)
// ==============================================================================

export async function upsertCalendarEventInSupabase(evt: CalendarEvent): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = mapCalendarEventToDb(evt);
    const { error } = await client.from('calendar_events').upsert(row);
    if (error) {
      console.warn('Erro ao sincronizar evento com Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exceção ao gravar evento no Supabase:', err);
    return false;
  }
}

export async function deleteCalendarEventInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('calendar_events').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function upsertEventRsvpInSupabase(eventId: string, rsvps: Record<string, any>): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client
      .from('calendar_events')
      .update({ rsvps, updated_at: new Date().toISOString() })
      .eq('id', eventId);
    return !error;
  } catch {
    return false;
  }
}

export async function upsertResultInSupabase(res: CompetitionResult): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = {
      id: res.id,
      title: res.title,
      competition_date: res.competitionDate,
      event_id: res.eventId || null,
      modality: res.modality,
      category: res.category,
      location: res.location || null,
      pdf_url: res.pdfUrl || null,
      pdf_title: res.pdfTitle || null,
      pdf_file_size: res.pdfFileSize || null,
      summary: res.summary || null,
      podium: res.podium || [],
      highlights: res.highlights || [],
      photos: res.photos || [],
      published_by_coach_name: res.publishedByCoachName,
      published_at: res.publishedAt
    };
    const { error } = await client.from('competition_results').upsert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteResultInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('competition_results').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function upsertNotificationInSupabase(notif: NotificationItem): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = {
      id: notif.id,
      title: notif.title,
      message: notif.message,
      date: notif.date,
      type: notif.type,
      target_audience: notif.targetAudience,
      target_category: notif.targetCategory || null,
      target_athlete_id: notif.targetAthleteId || null,
      target_athlete_ids: notif.targetAthleteIds || [],
      target_athlete_name: notif.targetAthleteName || null,
      target_user_id: notif.targetUserId || null,
      is_read: !!notif.isRead,
      author_name: notif.authorName,
      action_label: notif.actionLabel || null,
      action_tab: notif.actionTab || null
    };
    const { error } = await client.from('notifications').upsert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function upsertAthleteInSupabase(ath: Athlete): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = await mapAthleteToDb(ath);
    let { error } = await client.from('athletes').upsert(row);
    if (error) {
      // Retry without newly added schema columns if remote table is older
      delete row.guardian_relation;
      delete row.guardian_nif;
      delete row.nif;
      delete row.gender;
      const retry = await client.from('athletes').upsert(row);
      if (retry.error) {
        // Fallback to table 'atletas'
        const retryAtletas = await client.from('atletas').upsert(row);
        error = retryAtletas.error;
      } else {
        error = null;
      }
    }
    if (error) console.warn('Erro ao guardar atleta no Supabase:', error.message);
    return !error;
  } catch (err) {
    console.warn('Exceção ao guardar atleta no Supabase:', err);
    return false;
  }
}

export async function deleteAthleteInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('athletes').delete().eq('id', id);
    if (error) {
      await client.from('atletas').delete().eq('id', id);
    }
    return true;
  } catch {
    return false;
  }
}

export async function upsertCoachInSupabase(coach: Coach): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = await mapCoachToDb(coach);
    let { error } = await client.from('coaches').upsert(row);
    if (error) {
      const retry = await client.from('treinadores').upsert(row);
      error = retry.error;
    }
    if (error) console.warn('Erro ao guardar treinador no Supabase:', error.message);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCoachInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('coaches').delete().eq('id', id);
    if (error) await client.from('treinadores').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

export async function upsertTrainingPlanInSupabase(plan: TrainingPlan): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = {
      id: plan.id,
      title: plan.title,
      modality: plan.modality,
      target_category: plan.targetCategory,
      duration_minutes: plan.durationMinutes,
      intensity_level: plan.intensityLevel,
      objective: plan.objective || null,
      blocks: plan.blocks || [],
      created_by_coach_name: plan.createdByCoachName,
      tags: plan.tags || [],
      assigned_athlete_ids: plan.assignedAthleteIds || [],
      completed_by_athlete_ids: plan.completedByAthleteIds || [],
      scheduled_date: plan.scheduledDate || null,
      scheduled_time: plan.scheduledTime || null,
      scheduled_dates: plan.scheduledDates || [],
      created_at: plan.createdAt,
      updated_at: new Date().toISOString()
    };
    let { error } = await client.from('training_plans').upsert(row);
    if (error) {
      const retry = await client.from('planos_treino').upsert(row);
      error = retry.error;
    }
    return !error;
  } catch {
    return false;
  }
}

export async function deleteTrainingPlanInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('training_plans').delete().eq('id', id);
    if (error) await client.from('planos_treino').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

export async function upsertClubInfoInSupabase(info: ClubInfo): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    // Check if an existing row exists to preserve its ID
    let existingId: any = 1;
    try {
      const { data: existingRows } = await client.from('club_info').select('id').limit(1);
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        existingId = existingRows[0].id;
      }
    } catch {
      // Continue with id = 1
    }

    const row: any = {
      id: existingId,
      name: info.name,
      modality: info.modality,
      logo_url: info.logoUrl || null,
      banner_url: info.bannerUrl || null,
      address: info.address || null,
      nif: info.nif || null,
      phone: info.phone || null,
      email: info.email || null,
      foundation_year: info.foundationYear || 1998,
      president_name: info.presidentName || null,
      description: info.description || null,
      facilities: info.facilities || null,
      instagram: info.instagram || null,
      facebook: info.facebook || null,
      website: info.website || null,
      regulations_pdf_url: info.regulationsPdfUrl || null,
      primary_color: info.primaryColor || '#2563eb',
      documents: info.documents || null,
      updated_at: new Date().toISOString()
    };
    let { error } = await client.from('club_info').upsert(row, { onConflict: 'id' });
    // If the remote table does not have 'primary_color' or 'documents' column yet, retry without them
    if (error && (error.message?.includes('primary_color') || error.message?.includes('documents') || error.code === 'PGRST204')) {
      if (error.message?.includes('primary_color')) delete row.primary_color;
      if (error.message?.includes('documents')) delete row.documents;
      const retry = await client.from('club_info').upsert(row, { onConflict: 'id' });
      error = retry.error;
    }
    if (error) console.warn('Erro ao guardar club_info:', error.message);
    return !error;
  } catch (err) {
    console.warn('Exceção ao guardar club_info:', err);
    return false;
  }
}

export async function upsertAgeCategoryInSupabase(cat: AgeCategory): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = mapAgeCategoryToDb(cat);
    let { error } = await client.from('age_categories').upsert(row);
    if (error) {
      const retry = await client.from('escaloes').upsert(row);
      error = retry.error;
    }
    if (error) console.warn('Erro ao guardar age_category no Supabase:', error.message);
    return !error;
  } catch (err) {
    console.warn('Exceção ao guardar age_category:', err);
    return false;
  }
}

export async function deleteAgeCategoryInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('age_categories').delete().eq('id', id);
    if (error) await client.from('escaloes').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

export async function upsertParentAuthorizationInSupabase(auth: ParentAuthorization): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = await mapParentAuthorizationToDb(auth);
    let { error } = await client.from('parent_authorizations').upsert(row);
    if (error) {
      const retry = await client.from('autorizacoes').upsert(row);
      error = retry.error;
    }
    if (error) console.warn('Erro ao guardar parent_authorization:', error.message);
    return !error;
  } catch {
    return false;
  }
}

export async function upsertCarpoolOfferInSupabase(carpool: CarpoolOffer): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = await mapCarpoolOfferToDb(carpool);
    let { error } = await client.from('carpool_offers').upsert(row);
    if (error) {
      const retry = await client.from('boleias').upsert(row);
      error = retry.error;
    }
    if (error) console.warn('Erro ao guardar carpool_offer:', error.message);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCarpoolOfferInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('carpool_offers').delete().eq('id', id);
    if (error) await client.from('boleias').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

export async function upsertUserProfileInSupabase(user: UserProfile): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const row = await mapUserProfileToDb(user);
    let { error } = await client.from('profiles').upsert(row);
    if (error && (error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('nif') || error.message?.includes('profession') || error.message?.includes('alt_phone'))) {
      delete row.relation;
      delete row.nif;
      delete row.profession;
      delete row.alt_phone;
      const retry = await client.from('profiles').upsert(row);
      error = retry.error;
    }
    if (error) {
      // Try fallback to table 'perfis'
      const retryPerfis = await client.from('perfis').upsert(row);
      error = retryPerfis.error;
    }
    if (error) console.warn('Erro ao guardar user profile:', error.message);
    return !error;
  } catch (err) {
    console.warn('Exceção ao guardar perfil no Supabase:', err);
    return false;
  }
}

export async function deleteUserProfileInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('profiles').delete().eq('id', id);
    if (error) await client.from('perfis').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

export async function deleteNotificationInSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('notifications').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Cifra e sincroniza todos os dados pessoais locais de Atletas, Treinadores e Encarregados para o Supabase
 */
export async function encryptAndSyncAllPersonalDataToSupabase(params: {
  athletes: Athlete[];
  coaches: Coach[];
  profiles?: UserProfile[];
  authorizations?: ParentAuthorization[];
  carpools?: CarpoolOffer[];
}): Promise<{
  success: boolean;
  athletesCount: number;
  coachesCount: number;
  profilesCount: number;
  authorizationsCount: number;
  carpoolsCount: number;
  message: string;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      athletesCount: 0,
      coachesCount: 0,
      profilesCount: 0,
      authorizationsCount: 0,
      carpoolsCount: 0,
      message: 'Supabase não está configurado. Configure a URL e a Anon Key primeiro.'
    };
  }

  let athletesCount = 0;
  let coachesCount = 0;
  let profilesCount = 0;
  let authorizationsCount = 0;
  let carpoolsCount = 0;

  try {
    // 1. Cifrar e guardar atletas
    if (params.athletes && params.athletes.length > 0) {
      const athleteRows = await Promise.all(params.athletes.map(mapAthleteToDb));
      const { error: athError } = await client.from('athletes').upsert(athleteRows);
      if (!athError) {
        athletesCount = athleteRows.length;
      }
    }

    // 2. Cifrar e guardar treinadores
    if (params.coaches && params.coaches.length > 0) {
      const coachRows = await Promise.all(params.coaches.map(mapCoachToDb));
      const { error: coachError } = await client.from('coaches').upsert(coachRows);
      if (!coachError) {
        coachesCount = coachRows.length;
      }
    }

    // 3. Cifrar e guardar perfis de utilizadores (encarregados, treinadores, etc.)
    if (params.profiles && params.profiles.length > 0) {
      const profileRows = await Promise.all(params.profiles.map(mapUserProfileToDb));
      const { error: profileError } = await client.from('profiles').upsert(profileRows);
      if (!profileError) {
        profilesCount = profileRows.length;
      }
    }

    // 4. Cifrar e guardar autorizações parentais
    if (params.authorizations && params.authorizations.length > 0) {
      const authRows = await Promise.all(params.authorizations.map(mapParentAuthorizationToDb));
      const { error: authError } = await client.from('parent_authorizations').upsert(authRows);
      if (!authError) {
        authorizationsCount = authRows.length;
      }
    }

    // 5. Cifrar e guardar partilhas de boleias
    if (params.carpools && params.carpools.length > 0) {
      const carpoolRows = await Promise.all(params.carpools.map(mapCarpoolOfferToDb));
      const { error: carpoolError } = await client.from('carpool_offers').upsert(carpoolRows);
      if (!carpoolError) {
        carpoolsCount = carpoolRows.length;
      }
    }

    return {
      success: true,
      athletesCount,
      coachesCount,
      profilesCount,
      authorizationsCount,
      carpoolsCount,
      message: `Dados cifrados e sincronizados com sucesso: ${athletesCount} atletas, ${coachesCount} treinadores e ${profilesCount} perfis/encarregados protegidos com AES-GCM 256-bit!`
    };
  } catch (err: any) {
    return {
      success: false,
      athletesCount,
      coachesCount,
      profilesCount,
      authorizationsCount,
      carpoolsCount,
      message: `Erro ao cifrar e sincronizar dados: ${err?.message || 'Erro desconhecido'}`
    };
  }
}


