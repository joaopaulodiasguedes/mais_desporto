import {
  ClubInfo,
  ClubDocument,
  Athlete,
  Coach,
  TrainingPlan,
  CalendarEvent,
  CompetitionResult,
  NotificationItem,
  ParentAuthorization,
  CarpoolOffer,
  UserProfile,
  RolePermissions,
  AgeCategory
} from '../types';

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user-coach-guedes',
    name: 'Prof. João Paulo Dias Guedes',
    email: 'joaopaulodiasguedes@gmail.com',
    password: '123',
    role: 'treinador',
    status: 'aprovado',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    phone: '+351 912 345 678',
    coachProfileId: 'coach-1',
    birthDate: '1978-06-20',
    isAdmin: true,
    approvedAt: '2026-01-01',
    approvedByCoachName: 'Direção do Clube Cork'
  },
  {
    id: 'user-coach-1',
    name: 'Prof. Carlos Silva',
    email: 'carlos.silva@maisdesporto.pt',
    password: '123',
    role: 'treinador',
    status: 'aprovado',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    phone: '+351 912 345 678',
    coachProfileId: 'coach-1',
    birthDate: '1984-04-12',
    isAdmin: false,
    approvedAt: '2026-01-10',
    approvedByCoachName: 'Direção do Clube'
  },
  {
    id: 'user-athlete-1',
    name: 'Marta Santos',
    email: 'marta.santos@maisdesporto.pt',
    password: '123',
    role: 'atleta',
    status: 'aprovado',
    avatarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
    phone: '+351 925 111 222',
    athleteProfileId: 'ath-1',
    birthDate: '2009-06-18',
    requestedCategory: 'Juvenis (Sub-16)',
    approvedAt: '2026-02-01',
    approvedByCoachName: 'Prof. Carlos Silva'
  },
  {
    id: 'user-athlete-2',
    name: 'Lucas Ferreira',
    email: 'lucas.f@gmail.com',
    password: '123',
    role: 'atleta',
    status: 'aprovado',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    phone: '+351 913 222 333',
    athleteProfileId: 'ath-2',
    birthDate: '2008-03-24',
    requestedCategory: 'Juniores (Sub-18)',
    approvedAt: '2026-02-05',
    approvedByCoachName: 'Prof. Carlos Silva'
  },
  {
    id: 'user-parent-1',
    name: 'António Santos (Pai)',
    email: 'antonio.santos@gmail.com',
    password: '123',
    role: 'encarregado',
    status: 'aprovado',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    phone: '+351 963 888 999',
    relatedAthleteIds: ['ath-1', 'ath-3'],
    birthDate: '1979-11-03',
    approvedAt: '2026-02-02',
    approvedByCoachName: 'Prof. Carlos Silva'
  },
  {
    id: 'user-parent-2',
    name: 'Maria João Ferreira (Mãe)',
    email: 'maria.ferreira@hotmail.com',
    password: '123',
    role: 'encarregado',
    status: 'aprovado',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    phone: '+351 919 444 555',
    relatedAthleteIds: ['ath-2'],
    birthDate: '1981-05-19',
    approvedAt: '2026-02-04',
    approvedByCoachName: 'Prof. Carlos Silva'
  },
  {
    id: 'user-pending-1',
    name: 'Tiago Ribeiro',
    email: 'tiago.ribeiro@exemplo.pt',
    password: '123',
    role: 'atleta',
    status: 'pendente_aprovacao',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    phone: '+351 919 444 333',
    birthDate: '2008-09-14',
    requestedCategory: 'Juniores',
    federationNumber: 'FPN-99882',
    notes: 'Ex-atleta do SC Braga. Pretende integrar a equipa de velocidade e mariposas.',
    registeredAt: '2026-08-30'
  },
  {
    id: 'user-pending-2',
    name: 'Sofia Martins',
    email: 'sofia.martins@exemplo.pt',
    password: '123',
    role: 'atleta',
    status: 'pendente_aprovacao',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    phone: '+351 933 222 111',
    birthDate: '2011-03-22',
    requestedCategory: 'Infantis',
    notes: 'Nova inscrição para o escalão Infantil. Contacto da mãe: Teresa Martins.',
    registeredAt: '2026-08-31'
  }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<'treinador' | 'atleta' | 'encarregado', RolePermissions> = {
  treinador: {
    canEditClubInfo: true,
    canManageAthletes: true,
    canManageCoaches: true,
    canCreateTrainingPlans: true,
    canLogPersonalTraining: true,
    canAddCompetitions: true,
    canAddResults: true,
    canBroadcastNotifications: true,
    canAuthorizeTournaments: true,
    canOfferCarpool: true,
  },
  atleta: {
    canEditClubInfo: false,
    canManageAthletes: false,
    canManageCoaches: false,
    canCreateTrainingPlans: false,
    canLogPersonalTraining: true,
    canAddCompetitions: false,
    canAddResults: false,
    canBroadcastNotifications: false,
    canAuthorizeTournaments: false,
    canOfferCarpool: false,
  },
  encarregado: {
    canEditClubInfo: false,
    canManageAthletes: false,
    canManageCoaches: false,
    canCreateTrainingPlans: false,
    canLogPersonalTraining: false,
    canAddCompetitions: false,
    canAddResults: false,
    canBroadcastNotifications: false,
    canAuthorizeTournaments: true,
    canOfferCarpool: true,
  }
};

export const INITIAL_CLUB_DOCUMENTS: ClubDocument[] = [

];

export const INITIAL_CLUB_INFO: ClubInfo = {
  name: '+ Desporto Clube',
  modality: 'Atletismo',
  logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=300&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80',
  address: 'Av. do Desporto, Complexo Municipal nº 140, 4050-123 Porto, Portugal',
  nif: '509 876 543',
  phone: '+351 220 123 456',
  email: 'geral@desporto.pt',
  foundationYear: 1998,
  presidentName: 'Dr. Henrique Valente',
  description: 'O + Desporto é um clube dedicado à formação atlética e humana de jovens atletas nas modalidades aquáticas e pista, promovendo o rigor, espírito de equipa e alto rendimento.',
  facilities: 'Piscina Olímpica de 50m, Pista Sintética de 8 pistas, Ginásio de Condição Física e Gabinete Médico.',
  instagram: '@desportoclube',
  facebook: 'facebook.com/desportoficial',
  website: 'www.desporto.pt',
  primaryColor: '#2563eb',
  regulationsPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  documents: INITIAL_CLUB_DOCUMENTS
};

export const INITIAL_ATHLETES: Athlete[] = [
  {
    id: 'ath-2',
    name: 'Lucas Ferreira',
    birthDate: '2008-03-24',
    address: 'Av. da Boavista 890, Porto',
    phone: '+351 913 222 333',
    email: 'lucas.f@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    federationNumber: 'FPN-77312',
    category: 'Juniores (Sub-18)',
    guardianName: 'Maria João Ferreira',
    guardianPhone: '+351 919 444 555',
    guardianEmail: 'maria.ferreira@hotmail.com',
    medicalExamExpiry: '2026-09-20',
    medicalStatus: 'a_expirar',
    emergencyContact: '+351 919 444 555 (Mãe)',
    allergiesOrConditions: 'Alergia a frutos secos.',
    attendanceRate: 91,
    notes: 'Foco nos 400m e 800m Livres.'
  },
  {
    id: 'ath-3',
    name: 'Tomás Santos',
    birthDate: '2012-09-15',
    address: 'Rua das Flores 124, 2º Dto, Porto',
    phone: '+351 925 999 111',
    email: 'tomas.santos@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    federationNumber: 'FPN-99411',
    category: 'Infantis (Sub-14)',
    guardianName: 'António Santos',
    guardianPhone: '+351 963 888 999',
    guardianEmail: 'antonio.santos@gmail.com',
    guardianId: 'user-parent-1',
    medicalExamExpiry: '2027-02-15',
    medicalStatus: 'valido',
    emergencyContact: '+351 963 888 999 (Pai)',
    allergiesOrConditions: 'Sem restrições.',
    attendanceRate: 98,
    notes: 'Evolução muito positiva em Técnica de Bruços e Costas.'
  },
  {
    id: 'ath-4',
    name: 'Inês Matos Albuquerque',
    birthDate: '2010-12-01',
    address: 'Rua do Campo Alegre 312, Porto',
    phone: '+351 934 555 777',
    email: 'ines.matos@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    federationNumber: 'FPN-89104',
    category: 'Iniciados (Sub-15)',
    guardianName: 'Rodrigo Albuquerque',
    guardianPhone: '+351 938 123 987',
    guardianEmail: 'rodrigo.albuquerque@sapo.pt',
    medicalExamExpiry: '2026-08-10',
    medicalStatus: 'expirado',
    emergencyContact: '+351 938 123 987 (Pai)',
    allergiesOrConditions: 'Intolerância à lactose.',
    attendanceRate: 88,
    notes: 'A renovar exame médico desportivo urgente.'
  },
  {
    id: 'ath-5',
    name: 'Gonçalo Ribeiro',
    birthDate: '2005-07-09',
    address: 'Rua de Santa Catarina 550, Porto',
    phone: '+351 917 888 222',
    email: 'goncalo.ribeiro@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    federationNumber: 'FPN-61029',
    category: 'Seniores',
    guardianName: 'Próprio / Auto-responsável',
    guardianPhone: '+351 917 888 222',
    guardianEmail: 'goncalo.ribeiro@gmail.com',
    medicalExamExpiry: '2027-01-20',
    medicalStatus: 'valido',
    emergencyContact: '+351 917 888 222',
    attendanceRate: 95,
    notes: 'Capitão da equipa de velocidade.'
  }
];

export const INITIAL_COACHES: Coach[] = [
  {
    id: 'coach-1',
    name: 'João Paulo Dias Guedes',
    birthDate: '1978-06-20',
    address: 'Cortiçadas de Lavre, Montemor-o-Novo',
    phone: '+351 912 345 678',
    email: 'joaopaulodiasguedes@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    licenseNumber: 'TPTD-74291',
    licenseGrade: 'Grau III - Alto Rendimento / Atletismo',
    diplomaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    diplomaName: 'Cedula_Treinador_Grau_III_IPDJ.pdf',
    diplomaType: 'pdf',
    assignedCategories: ['Benjamins (Sub-12)', 'Infantis (Sub-14)', 'Iniciados (Sub-15)', 'Juvenis (Sub-16)', 'Juniores (Sub-18)', 'Seniores', 'Veteranos'],
    experienceYears: 18,
    bio: 'Treinador Principal e Diretor Técnico do Cork - Cortiçadas Clube Alentejo. Especialista em Atletismo, Corta-Mato, Trail e Fundo.',
    isAdmin: true
  },
  {
    id: 'coach-carlos',
    name: 'Prof. Carlos Silva',
    birthDate: '1984-04-12',
    address: 'Rua Gonçalo Cristóvão 210, Porto',
    phone: '+351 912 345 678',
    email: 'carlos.silva@maisdesporto.pt',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    licenseNumber: 'TPTD-74292',
    licenseGrade: 'Grau III - Alto Rendimento',
    diplomaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    diplomaName: 'Cédula_TPTD_Grau_III_IPDJ.pdf',
    diplomaType: 'pdf',
    assignedCategories: ['Juvenis (Sub-16)', 'Juniores (Sub-18)', 'Seniores'],
    experienceYears: 16,
    bio: 'Mestrado em Treino Desportivo pela FADEUP. Antigo atleta e treinador-adjunto.',
    isAdmin: false
  },
  {
    id: 'coach-3',
    name: 'Prof. Miguel Oliveira',
    birthDate: '1988-11-30',
    address: 'Rua de Costa Cabral 415, Porto',
    phone: '+351 964 123 789',
    email: 'miguel.oliveira@maisdesporto.pt',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    licenseNumber: 'TPTD-81045',
    licenseGrade: 'Grau II - Preparação Física',
    diplomaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    diplomaName: 'Certificado_CSCS_Preparacao_Fisica.pdf',
    diplomaType: 'pdf',
    assignedCategories: ['Todos os Escalões (Físico/Ginásio)'],
    experienceYears: 11,
    bio: 'Preparador físico certificado CSCS, focado na prevenção de lesões e potência muscular.',
    isAdmin: false
  }
];

export const INITIAL_TRAINING_PLANS: TrainingPlan[] = [
  {
    id: 'plan-1',
    title: 'Capacidade Aeróbia & Limiar Anaeróbio (A2/A3)',
    modality: 'Natação Pura',
    targetCategory: 'Juvenis (Sub-16)',
    assignedAthleteIds: ['ath-1'],
    durationMinutes: 90,
    intensityLevel: 4,
    objective: 'Desenvolvimento do consumo máximo de oxigénio e tolerância ao lactato em ritmo de prova.',
    createdByCoachName: 'Prof. Carlos Silva',
    createdAt: '2026-08-28',
    scheduledDate: '2026-09-16',
    scheduledDates: ['2026-09-14', '2026-09-16', '2026-09-18', '2026-09-21', '2026-09-23', '2026-09-25'],
    scheduledTime: '18:00',
    tags: ['Aeróbio', 'Técnica', 'Resistência'],
    completedByAthleteIds: [
      {
        athleteId: 'ath-1',
        completedAt: '2026-09-14T19:40:00.000Z',
        status: 'cumpriu',
        rpeRating: 7,
        feedback: 'Série principal concluída com boa cadência e sem quebra no final.',
        date: '2026-09-14'
      }
    ],
    blocks: [
      {
        id: 'b-1',
        title: 'Aquecimento Geral & Ativação',
        type: 'aquecimento',
        exercises: [
          {
            id: 'ex-1',
            name: '400m Crol / Costas alternado a cada 100m',
            sets: '1',
            repsOrDuration: '400m',
            rest: '30s',
            intensity: 'R1 (Muito Leve)',
            notes: 'Foco no alinhamento corporal e rotação de tronco.'
          },
          {
            id: 'ex-2',
            name: '6 x 50m Pés c/ prancha (25m Forte / 25m Suave)',
            sets: '6',
            repsOrDuration: '50m',
            rest: '20s',
            intensity: 'R2-R3',
            notes: 'Manter tornozelos descontraídos e frequência alta nos 25m fortes.'
          }
        ]
      },
      {
        id: 'b-2',
        title: 'Série Principal: Blocos Fracionados',
        type: 'principal',
        exercises: [
          {
            id: 'ex-3',
            name: '5 x 200m Crol Ritmo de Prova',
            sets: '5',
            repsOrDuration: '200m',
            rest: '45s',
            intensity: 'R4 (Limiar)',
            notes: 'Desvio máximo de 1.5s entre repetições. Controlo de braçadas.'
          },
          {
            id: 'ex-4',
            name: '8 x 100m Estilos (25 Mariposa + 25 Costas + 25 Bruços + 25 Crol)',
            sets: '8',
            repsOrDuration: '100m',
            rest: '30s',
            intensity: 'R3-R4',
            notes: 'Excelentes viragens e deslizes subaquáticos até aos 7 metros.'
          }
        ]
      },
      {
        id: 'b-3',
        title: 'Retorno à Calma & Soltura',
        type: 'retorno_calma',
        exercises: [
          {
            id: 'ex-5',
            name: '300m Costas / Bruços suave descompressão',
            sets: '1',
            repsOrDuration: '300m',
            rest: '0s',
            intensity: 'R1',
            notes: 'Respiração profunda e relaxamento dos ombros.'
          }
        ]
      }
    ]
  },
  {
    id: 'plan-2',
    title: 'Velocidade Pura & Partidas Rápidas',
    modality: 'Natação / Atletismo',
    targetCategory: 'Juniores (Sub-18)',
    assignedAthleteIds: ['ath-2'],
    durationMinutes: 75,
    intensityLevel: 5,
    objective: 'Potência aláctica, tempo de reação nas partidas e aceleração nos primeiros 15 metros.',
    createdByCoachName: 'Prof. Carlos Silva',
    createdAt: '2026-08-30',
    scheduledDate: '2026-09-16',
    scheduledDates: ['2026-09-14', '2026-09-16', '2026-09-19', '2026-09-22'],
    scheduledTime: '17:30',
    tags: ['Velocidade', 'Potência', 'Partidas'],
    blocks: [
      {
        id: 'b-4',
        title: 'Ativação Dinâmica em Terra',
        type: 'aquecimento',
        exercises: [
          {
            id: 'ex-6',
            name: 'Mobilidade articular + 4x10 Saltos pliométricos',
            sets: '4',
            repsOrDuration: '10 reps',
            rest: '45s',
            intensity: 'Moderado',
            notes: 'Ativação rápida dos gémeos e quadricípites.'
          }
        ]
      },
      {
        id: 'b-5',
        title: 'Série de Sprints Máximos',
        type: 'principal',
        exercises: [
          {
            id: 'ex-7',
            name: '10 x 25m Sprint Máximo do bloco de partida',
            sets: '10',
            repsOrDuration: '25m',
            rest: '1m30s',
            intensity: 'R5 (100% Máximo)',
            notes: 'Cronometragem aos 15m e 25m. Entrada limpa na água.'
          }
        ]
      },
      {
        id: 'b-6',
        title: 'Regeneração',
        type: 'retorno_calma',
        exercises: [
          {
            id: 'ex-8',
            name: '400m Nado livre solto com palas',
            sets: '1',
            repsOrDuration: '400m',
            rest: '0s',
            intensity: 'R1',
            notes: 'Descontração.'
          }
        ]
      }
    ]
  },
  {
    id: 'plan-3',
    title: 'Força Específica & Resistência Muscular Localizada',
    modality: 'Natação Pura',
    targetCategory: 'Juvenis (Sub-16)',
    assignedAthleteIds: ['ath-3'],
    durationMinutes: 80,
    intensityLevel: 4,
    objective: 'Trabalho de tração com palas e elásticos para incremento da força propulsiva e eficiência de remada.',
    createdByCoachName: 'Prof. Carlos Silva',
    createdAt: '2026-09-02',
    scheduledDate: '2026-09-16',
    scheduledDates: ['2026-09-15', '2026-09-16', '2026-09-18', '2026-09-20'],
    scheduledTime: '19:00',
    tags: ['Força', 'Palas', 'Propulsão'],
    blocks: [
      {
        id: 'b-7',
        title: 'Ativação & Mobilidade Escapular',
        type: 'aquecimento',
        exercises: [
          {
            id: 'ex-9',
            name: '300m Crol progressivo + 4x50m estilos',
            sets: '1',
            repsOrDuration: '500m',
            rest: '30s',
            intensity: 'R1-R2',
            notes: 'Aquecimento articular amplo dos ombros.'
          }
        ]
      },
      {
        id: 'b-8',
        title: 'Bloco de Força com Resistência',
        type: 'principal',
        exercises: [
          {
            id: 'ex-10',
            name: '8 x 75m Crol com Palas Médias e Pullbuoy (25m Forte / 50m Médio)',
            sets: '8',
            repsOrDuration: '75m',
            rest: '35s',
            intensity: 'R4',
            notes: 'Manter cotovelo alto na fase de agarre.'
          }
        ]
      },
      {
        id: 'b-9',
        title: 'Soltura Articular',
        type: 'retorno_calma',
        exercises: [
          {
            id: 'ex-11',
            name: '200m Nado suave e descompressão',
            sets: '1',
            repsOrDuration: '200m',
            rest: '0s',
            intensity: 'R1',
            notes: 'Alongamentos suaves na borda da piscina.'
          }
        ]
      }
    ]
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Torneio Regional de Abertura da Época',
    type: 'prova',
    date: '2026-09-12',
    time: '09:00',
    endTime: '18:00',
    location: 'Piscina Municipal de Guimarães',
    targetCategories: ['Juvenis (Sub-16)', 'Juniores (Sub-18)', 'Seniores'],
    description: 'Primeira prova oficial de apuramento para os Campeonatos Nacionais. Presença obrigatória de todos os atletas convocados às 08h00 no cais da piscina.',
    officialPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdByRole: 'treinador',
    creatorName: 'Prof. Carlos Silva',
    creatorId: 'user-coach-1',
    rsvps: {
      'ath-1': {
        status: 'confirmado',
        responderName: 'Marta Santos (Atleta)',
        role: 'atleta',
        note: 'Vou nadar os 100L e 200E.',
        updatedAt: '2026-08-29 10:30'
      },
      'ath-2': {
        status: 'confirmado',
        responderName: 'Lucas Ferreira',
        role: 'atleta',
        note: 'Confirmado.',
        updatedAt: '2026-08-29 11:15'
      },
      'ath-3': {
        status: 'confirmado',
        responderName: 'António Santos (Pai de Tomás)',
        role: 'encarregado',
        note: 'Vamos em carro próprio.',
        updatedAt: '2026-08-30 14:20'
      }
    }
  },
  {
    id: 'evt-2',
    title: 'Treino Oficial de Equipa - Foco Técnico',
    type: 'treino_oficial',
    date: '2026-09-04',
    time: '17:30',
    endTime: '19:30',
    location: 'Complexo Municipal do Porto (Piscina Olímpica)',
    targetCategories: ['Juvenis (Sub-16)', 'Juniores (Sub-18)'],
    description: 'Sessão de filmagem subaquática de viragens e análise biométrica.',
    createdByRole: 'treinador',
    creatorName: 'Prof. Carlos Silva',
    creatorId: 'user-coach-1',
    rsvps: {
      'ath-1': {
        status: 'confirmado',
        responderName: 'Marta Santos',
        role: 'atleta',
        updatedAt: '2026-08-30 09:00'
      }
    }
  },
  {
    id: 'evt-3',
    title: 'Campeonato Nacional de Clubes - 1ª Divisão',
    type: 'prova',
    date: '2026-09-26',
    time: '08:30',
    endTime: '19:00',
    location: 'Complexo Desportivo do Jamor, Lisboa',
    targetCategories: ['Juniores (Sub-18)', 'Seniores'],
    description: 'Competição máxima de clubes. Deslocação em autocarro do clube com partida na sexta-feira às 15h.',
    officialPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdByRole: 'treinador',
    creatorName: 'Prof. Carlos Silva',
    creatorId: 'user-coach-1',
    rsvps: {}
  },
  {
    id: 'evt-4',
    title: 'Treino Individual de Flexibilidade & Mobilidade',
    type: 'treino_individual',
    date: '2026-09-03',
    time: '07:30',
    endTime: '08:15',
    location: 'Casa / Parque da Cidade',
    targetCategories: ['Juvenis (Sub-16)'],
    description: '45 min de foam rolling e alongamentos estáticos pós-treino intenso.',
    createdByRole: 'atleta',
    creatorName: 'Marta Santos',
    creatorId: 'user-athlete-1',
    athleteId: 'ath-1',
    rsvps: {}
  },
  {
    id: 'evt-task-coach-1',
    title: 'Entrega da Ficha de Equipamentos Oficiais',
    type: 'tarefa',
    date: '2026-09-08',
    time: '18:00',
    location: 'Secretaria / Gabinete Técnico',
    targetCategories: ['Todos'],
    description: 'Todos os atletas devem entregar a folha de tamanhos e personalização do novo fato de treino oficial do clube.',
    createdByRole: 'treinador',
    creatorName: 'Prof. Carlos Silva',
    creatorId: 'user-coach-1',
    isCompleted: false,
    rsvps: {}
  },
  {
    id: 'evt-task-ath-1',
    title: 'Comprar óculos espelhados de competição e touca extra',
    type: 'tarefa',
    date: '2026-09-06',
    time: '11:00',
    location: 'Loja Desportiva',
    targetCategories: ['Juvenis (Sub-16)'],
    description: 'Verificar ajuste de ventosas e elástico para o Torneio de Guimarães.',
    createdByRole: 'atleta',
    creatorName: 'Marta Santos',
    creatorId: 'user-athlete-1',
    athleteId: 'ath-1',
    isCompleted: false,
    rsvps: {}
  },
  {
    id: 'evt-task-ath-2',
    title: 'Revisão fisioterapia e massagem miofascial ombro',
    type: 'tarefa',
    date: '2026-09-07',
    time: '14:30',
    location: 'Clínica de Fisioterapia do Desporto',
    targetCategories: ['Juniores (Sub-18)'],
    description: 'Prevenção de sobrecarga nos tendões da coifa dos rotadores.',
    createdByRole: 'atleta',
    creatorName: 'Lucas Ferreira',
    creatorId: 'user-athlete-2',
    athleteId: 'ath-2',
    isCompleted: false,
    rsvps: {}
  }
];

export const INITIAL_RESULTS: CompetitionResult[] = [
  {
    id: 'res-1',
    title: 'Meeting Internacional Cidade do Porto 2026',
    competitionDate: '2026-07-18',
    modality: 'Natação Pura',
    category: 'Absolutos / Juvenis',
    location: 'Piscina de Campanhã, Porto',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfTitle: 'Resultados_Oficiais_Meeting_Porto_2026.pdf',
    pdfFileSize: '1.4 MB',
    summary: 'Excelente prestação do + Desporto Clube com 8 pódios conquistados e 14 novos recordes pessoais (RPs).',
    podium: [
      {
        position: 1,
        athleteName: 'Marta Santos',
        markOrScore: '58.42s (Recorde Regional)',
        category: '100m Livres Fem. - Juvenis A',
        clubOrOpponent: '+ Desporto Clube'
      },
      {
        position: 2,
        athleteName: 'Lucas Ferreira',
        markOrScore: '4:02.15s',
        category: '400m Livres Masc. - Juniores',
        clubOrOpponent: '+ Desporto Clube'
      },
      {
        position: 1,
        athleteName: 'Gonçalo Ribeiro',
        markOrScore: '23.10s',
        category: '50m Livres Masc. - Seniores',
        clubOrOpponent: '+ Desporto Clube'
      },
      {
        position: 3,
        athleteName: 'Estafeta 4x100m Estilos Fem.',
        markOrScore: '4:18.90s',
        category: 'Absolutos Feminino',
        clubOrOpponent: '+ Desporto Clube'
      }
    ],
    highlights: [
      'Marta Santos bateu o Recorde Regional Juvenil por 45 centésimos.',
      'Lucas Ferreira atingiu mínimo para os Campeonatos da Europa de Juniores.',
      '100% de finais A alcançadas pelos atletas convocados.'
    ],
    photos: [
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80'
    ],
    publishedByCoachName: 'Prof. Carlos Silva',
    publishedAt: '2026-07-19 20:00'
  },
  {
    id: 'res-2',
    title: 'Campeonato Regional de Infantis e Iniciados',
    competitionDate: '2026-06-22',
    modality: 'Natação Pura',
    category: 'Infantis & Iniciados',
    location: 'Piscina Municipal da Póvoa de Varzim',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfTitle: 'Classificacoes_Regionais_Infantis_Povoa.pdf',
    pdfFileSize: '980 KB',
    summary: 'A nossa formação mais jovem demonstrou grande evolução técnica e espírito de união desportiva.',
    podium: [
      {
        position: 1,
        athleteName: 'Tomás Santos',
        markOrScore: '1:12.40s',
        category: '100m Bruços - Infantis B',
        clubOrOpponent: '+ Desporto Clube'
      },
      {
        position: 2,
        athleteName: 'Inês Matos Albuquerque',
        markOrScore: '2:34.12s',
        category: '200m Costas - Iniciados',
        clubOrOpponent: '+ Desporto Clube'
      }
    ],
    highlights: [
      'Tomás Santos consagrou-se Campeão Regional de Infantis B.',
      'Inês Matos alcançou o 2º lugar com o seu melhor tempo do ano.'
    ],
    publishedByCoachName: 'Profª. Ana Beatriz Sousa',
    publishedAt: '2026-06-23 11:30'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Convocatória Oficial: Torneio Regional de Abertura',
    message: 'A lista final de atletas convocados para o Torneio de 12 de Setembro já se encontra disponível no separador Calendário e Documentos. Por favor confirmem a presença até 06/09.',
    date: '2026-09-01 09:00',
    type: 'convocatoria',
    targetAudience: 'todos',
    targetCategory: 'Juvenis, Juniores, Seniores',
    isRead: false,
    authorName: 'Prof. Carlos Silva',
    actionLabel: 'Ver no Calendário',
    actionTab: 'calendario'
  },
  {
    id: 'notif-2',
    title: 'Alteração de Horário no Treino de Quarta-feira',
    message: 'Devido a manutenção no bloco 2 da piscina olímpica, o treino das 17h30 passará excecionalmente para as 18h00 na quarta-feira.',
    date: '2026-08-31 16:45',
    type: 'aviso_treino',
    targetAudience: 'atletas',
    isRead: false,
    authorName: 'Prof. Carlos Silva'
  },
  {
    id: 'notif-3',
    title: 'Exames Médicos Desportivos: Regularização Urgente',
    message: 'Avisam-se os encarregados de educação dos atletas com exame a expirar em Setembro que devem entregar a nova ficha de aptidão física na secretaria do clube até dia 15.',
    date: '2026-08-30 11:00',
    type: 'urgente',
    targetAudience: 'pais',
    isRead: true,
    authorName: 'Secretaria do Clube',
    actionLabel: 'Área dos Pais',
    actionTab: 'pais'
  },
  {
    id: 'notif-4',
    title: 'Nova Linha de Equipamentos Oficiais 2026/27',
    message: 'Os novos fatos de treino e mochilas oficiais do clube já estão disponíveis para encomenda com 20% de desconto para sócios e atletas.',
    date: '2026-08-25 14:00',
    type: 'comunicado',
    targetAudience: 'todos',
    isRead: true,
    authorName: 'Direção + Desporto'
  },
  {
    id: 'notif-pers-1',
    title: 'Avaliação Individual: Resultados da Bioimpedância de Marta',
    message: 'A tua ficha de composição corporal e níveis de hidratação do início de Setembro já se encontra analisada pelo corpo técnico. Mantém o protocolo nutricional.',
    date: '2026-09-02 11:15',
    type: 'comunicado',
    targetAudience: 'atletas',
    targetAthleteId: 'ath-1',
    targetAthleteName: 'Marta Santos',
    isRead: false,
    authorName: 'Prof. Carlos Silva'
  },
  {
    id: 'notif-pers-2',
    title: 'Aviso de Exame Médico: Lucas Ferreira',
    message: 'O teu exame médico desportivo expira a 20 de Setembro. Por favor agenda a consulta com o médico assistente para não comprometer a inscrição no Nacional.',
    date: '2026-09-02 11:30',
    type: 'urgente',
    targetAudience: 'atletas',
    targetAthleteId: 'ath-2',
    targetAthleteName: 'Lucas Ferreira',
    isRead: false,
    authorName: 'Secretaria do Clube'
  }
];

export const INITIAL_PARENT_AUTHORIZATIONS: ParentAuthorization[] = [
  {
    id: 'auth-1',
    athleteId: 'ath-1',
    athleteName: 'Marta Santos',
    parentId: 'user-parent-1',
    parentName: 'António Santos',
    eventId: 'evt-1',
    eventTitle: 'Torneio Regional de Abertura da Época',
    eventDate: '2026-09-12',
    location: 'Piscina Municipal de Guimarães',
    status: 'autorizado',
    signedAt: '2026-08-30 14:22',
    notes: 'Autorizo a participação e deslocação com o grupo.'
  },
  {
    id: 'auth-2',
    athleteId: 'ath-3',
    athleteName: 'Tomás Santos',
    parentId: 'user-parent-1',
    parentName: 'António Santos',
    eventId: 'evt-1',
    eventTitle: 'Torneio Regional de Abertura da Época',
    eventDate: '2026-09-12',
    location: 'Piscina Municipal de Guimarães',
    status: 'pendente',
    notes: 'A aguardar confirmação de horário de trabalho.'
  }
];

export const INITIAL_CARPOOLS: CarpoolOffer[] = [
  {
    id: 'carp-1',
    parentId: 'user-parent-1',
    parentName: 'António Santos (Pai da Marta)',
    athleteName: 'Marta & Tomás Santos',
    eventId: 'evt-1',
    eventTitle: 'Torneio Regional de Abertura (Guimarães)',
    eventDate: '2026-09-12',
    availableSeats: 3,
    departureLocation: 'Parque de Estacionamento do Complexo do Porto',
    departureTime: '07:15',
    contactPhone: '+351 963 888 999',
    notes: 'Carro espaçoso, temos espaço para 2 atletas com sacos de equipamento desportivo.',
    claimedSeats: [
      {
        parentName: 'Maria João Ferreira',
        athleteName: 'Lucas Ferreira',
        seats: 1
      }
    ]
  }
];

export const INITIAL_AGE_CATEGORIES: AgeCategory[] = [
  {
    id: 'cat-sub10',
    name: 'Benjamins B (Sub-10)',
    code: 'SUB-10',
    birthDateStart: '2016-01-01',
    birthDateEnd: '2017-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Iniciação desportiva e desenvolvimento motor fundamental.',
    color: 'emerald'
  },
  {
    id: 'cat-sub12',
    name: 'Benjamins A (Sub-12)',
    code: 'SUB-12',
    birthDateStart: '2014-01-01',
    birthDateEnd: '2015-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Aperfeiçoamento técnico e primeiros circuitos competitivos regionais.',
    color: 'teal'
  },
  {
    id: 'cat-sub14',
    name: 'Infantis (Sub-14)',
    code: 'SUB-14',
    birthDateStart: '2012-01-01',
    birthDateEnd: '2013-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Formação atlética, provas inter-regionais e consolidação de resistência.',
    color: 'blue'
  },
  {
    id: 'cat-sub15',
    name: 'Iniciados (Sub-15)',
    code: 'SUB-15',
    birthDateStart: '2010-01-01',
    birthDateEnd: '2011-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Treino estruturado com controlo de tempos e metas para torneios nacionais.',
    color: 'indigo'
  },
  {
    id: 'cat-sub16',
    name: 'Juvenis (Sub-16 / Sub-17)',
    code: 'SUB-16',
    birthDateStart: '2008-01-01',
    birthDateEnd: '2009-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Especialização por disciplinas e preparação para campeonatos de fundo/velocidade.',
    color: 'purple'
  },
  {
    id: 'cat-sub18',
    name: 'Juniores (Sub-18 / Sub-19)',
    code: 'SUB-18',
    birthDateStart: '2006-01-01',
    birthDateEnd: '2007-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Alto rendimento jovem e transição competitiva sénior.',
    color: 'amber'
  },
  {
    id: 'cat-seniores',
    name: 'Seniores / Absolutos',
    code: 'SENIOR',
    birthDateStart: '1990-01-01',
    birthDateEnd: '2005-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Equipa principal do clube e participação em circuitos federados abertos.',
    color: 'rose'
  },
  {
    id: 'cat-masters',
    name: 'Masters / Veteranos (+35)',
    code: 'MASTER',
    birthDateStart: '1940-01-01',
    birthDateEnd: '1989-12-31',
    seasonStartDate: '2025-09-01',
    seasonEndDate: '2026-08-31',
    gender: 'todos',
    notes: 'Condição física contínua e provas de veteranos nacionais e internacionais.',
    color: 'slate'
  }
];
