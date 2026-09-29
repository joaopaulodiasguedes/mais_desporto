-- ==============================================================================
-- SCRIPT DE BASE DE DADOS COMPLETO PARA SUPABASE (POSTGRESQL)
-- Aplicação: Mais Desporto - Gestão de Clube Desportivo, Treinos e Competições
-- ==============================================================================
-- Instruções:
-- 1. Aceda ao seu painel do Supabase (https://supabase.com/dashboard)
-- 2. Selecione o seu projeto e abra o "SQL Editor"
-- 3. Crie uma "New Query", cole todo o conteúdo deste ficheiro e clique em "Run"
-- ==============================================================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ==============================================================================

-- 2.1 Informações do Clube
CREATE TABLE IF NOT EXISTS public.club_info (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Clube Náutico & Desportivo Mais Desporto',
    modality TEXT NOT NULL DEFAULT 'Natação & Triatlo',
    logo_url TEXT,
    banner_url TEXT,
    address TEXT,
    nif TEXT,
    phone TEXT,
    email TEXT,
    foundation_year INTEGER DEFAULT 1998,
    president_name TEXT,
    description TEXT,
    facilities TEXT,
    instagram TEXT,
    facebook TEXT,
    website TEXT,
    regulations_pdf_url TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    documents JSONB DEFAULT '[]'::JSONB,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.2 Perfis de Utilizador (Treinador, Atleta, Encarregado de Educação)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('treinador', 'atleta', 'encarregado')),
    status TEXT NOT NULL DEFAULT 'pendente_aprovacao' CHECK (status IN ('aprovado', 'pendente_aprovacao', 'rejeitado')),
    avatar_url TEXT,
    phone TEXT,
    birth_date DATE,
    address TEXT,
    coach_grade TEXT, -- Grau de Treinador (texto livre com sugestões)
    diploma_url TEXT, -- URL do ficheiro do diploma/cédula
    diploma_name TEXT, -- Nome original do ficheiro
    diploma_type TEXT CHECK (diploma_type IS NULL OR diploma_type IN ('pdf', 'image', 'doc', 'other')),
    requested_category TEXT, -- Escalão pretendido
    federation_number TEXT,
    notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by_coach_name TEXT,
    rejection_reason TEXT,
    related_athlete_ids TEXT[] DEFAULT '{}',
    athlete_profile_id TEXT,
    coach_profile_id TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    password TEXT,
    registered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.3 Atletas (Fichas Desportivas e Clínicas)
CREATE TABLE IF NOT EXISTS public.athletes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    federation_number TEXT,
    category TEXT NOT NULL, -- Ex: Benjamins, Infantis, Iniciados, Juvenis, Juniores, Seniores, Masters
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    guardian_id TEXT,
    medical_exam_expiry DATE,
    medical_status TEXT NOT NULL DEFAULT 'valido' CHECK (medical_status IN ('valido', 'a_expirar', 'expirado')),
    emergency_contact TEXT,
    allergies_or_conditions TEXT,
    attendance_rate NUMERIC(5,2) DEFAULT 100.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.4 Treinadores
CREATE TABLE IF NOT EXISTS public.coaches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    birth_date DATE,
    address TEXT,
    phone TEXT,
    email TEXT NOT NULL,
    photo_url TEXT,
    license_number TEXT, -- Cédula TPTD
    license_grade TEXT, -- Grau de Treinador (Grau I, Grau II, etc.)
    diploma_url TEXT,
    diploma_name TEXT,
    diploma_type TEXT CHECK (diploma_type IS NULL OR diploma_type IN ('pdf', 'image', 'doc', 'other')),
    assigned_categories TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.5 Planos de Treino
CREATE TABLE IF NOT EXISTS public.training_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    modality TEXT NOT NULL,
    target_category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    intensity_level INTEGER NOT NULL CHECK (intensity_level BETWEEN 1 AND 5),
    objective TEXT,
    blocks JSONB DEFAULT '[]'::JSONB, -- Blocos de exercícios (aquecimento, principal, etc.)
    created_by_coach_name TEXT,
    tags TEXT[] DEFAULT '{}',
    assigned_athlete_ids TEXT[] DEFAULT '{}',
    completed_by_athlete_ids JSONB DEFAULT '[]'::JSONB,
    scheduled_date DATE,
    scheduled_time TEXT,
    scheduled_dates TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.6 Calendário de Eventos, Atividades e Tarefas (com Confirmações RSVP)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prova', 'treino_oficial', 'treino_individual', 'estagio', 'reuniao', 'tarefa')),
    date DATE NOT NULL,
    time TEXT NOT NULL, -- HH:mm
    end_time TEXT,
    location TEXT,
    target_categories TEXT[] DEFAULT '{}',
    description TEXT,
    official_pdf_url TEXT,
    created_by_role TEXT NOT NULL CHECK (created_by_role IN ('treinador', 'atleta', 'encarregado')),
    creator_name TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    athlete_id TEXT, -- Para tarefas/treinos privados de atletas
    is_completed BOOLEAN DEFAULT FALSE,
    -- RSVPs: mapa com chave do id do utilizador/atleta contendo status ('confirmado' | 'ausente' | 'justificado')
    rsvps JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.7 Resultados de Competição
CREATE TABLE IF NOT EXISTS public.competition_results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    competition_date DATE NOT NULL,
    event_id TEXT,
    modality TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    pdf_url TEXT,
    pdf_title TEXT,
    pdf_file_size TEXT,
    summary TEXT,
    podium JSONB DEFAULT '[]'::JSONB, -- Array de lugares de pódio
    highlights TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    published_by_coach_name TEXT,
    published_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.8 Notificações e Avisos
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    type TEXT NOT NULL CHECK (type IN ('convocatoria', 'aviso_treino', 'mensalidade', 'comunicado', 'urgente')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('todos', 'atletas', 'pais', 'treinadores')),
    target_category TEXT,
    target_athlete_id TEXT,
    target_athlete_name TEXT,
    target_athlete_ids TEXT[] DEFAULT '{}',
    target_user_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    author_name TEXT NOT NULL,
    action_label TEXT,
    action_tab TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.9 Autorizações Parentais para Torneios / Competições
CREATE TABLE IF NOT EXISTS public.parent_authorizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    athlete_id TEXT NOT NULL,
    athlete_name TEXT NOT NULL,
    parent_id TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_date DATE NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'autorizado', 'recusado')),
    signed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.10 Bolsas de Boleias Partilhadas (Carpool)
CREATE TABLE IF NOT EXISTS public.carpool_offers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    parent_id TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    athlete_name TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_date DATE NOT NULL,
    available_seats INTEGER NOT NULL DEFAULT 1,
    departure_location TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    notes TEXT,
    claimed_seats JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.11 Escalões Etários por Data de Nascimento e Época Desportiva
CREATE TABLE IF NOT EXISTS public.age_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    code TEXT,
    birth_date_start DATE NOT NULL,
    birth_date_end DATE NOT NULL,
    season_start_date DATE NOT NULL,
    season_end_date DATE NOT NULL,
    gender TEXT NOT NULL DEFAULT 'todos',
    color TEXT DEFAULT 'bg-blue-600',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 3. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON public.calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_creator ON public.calendar_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_athlete ON public.calendar_events(athlete_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_athletes_category ON public.athletes(category);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON public.notifications(target_audience, target_user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_category ON public.training_plans(target_category);
CREATE INDEX IF NOT EXISTS idx_training_plans_scheduled_date ON public.training_plans(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_age_categories_dates ON public.age_categories(birth_date_start, birth_date_end);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- ==============================================================================
ALTER TABLE public.club_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carpool_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_categories ENABLE ROW LEVEL SECURITY;

-- Políticas gerais para desenvolvimento e sincronização completa
DROP POLICY IF EXISTS "Acesso total a informacoes do clube" ON public.club_info;
DROP POLICY IF EXISTS "Permitir leitura pública das informações do clube" ON public.club_info;
CREATE POLICY "Acesso total a informacoes do clube"
    ON public.club_info FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a perfis" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfis aprovados" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção de novo perfil no registo" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil ou por treinador" ON public.profiles;
CREATE POLICY "Acesso total a perfis"
    ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a atletas" ON public.athletes;
DROP POLICY IF EXISTS "Permitir leitura de atletas autenticados" ON public.athletes;
CREATE POLICY "Acesso total a atletas"
    ON public.athletes FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a treinadores" ON public.coaches;
DROP POLICY IF EXISTS "Permitir leitura de treinadores" ON public.coaches;
CREATE POLICY "Acesso total a treinadores"
    ON public.coaches FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a planos de treino" ON public.training_plans;
DROP POLICY IF EXISTS "Permitir acesso a planos de treino" ON public.training_plans;
CREATE POLICY "Acesso total a planos de treino"
    ON public.training_plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a eventos do calendario" ON public.calendar_events;
DROP POLICY IF EXISTS "Acesso a eventos do calendário" ON public.calendar_events;
CREATE POLICY "Acesso total a eventos do calendario"
    ON public.calendar_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a resultados de competicao" ON public.competition_results;
DROP POLICY IF EXISTS "Acesso a resultados de competição" ON public.competition_results;
CREATE POLICY "Acesso total a resultados de competicao"
    ON public.competition_results FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a notificacoes" ON public.notifications;
DROP POLICY IF EXISTS "Acesso a notificações" ON public.notifications;
CREATE POLICY "Acesso total a notificacoes"
    ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a autorizacoes parentais" ON public.parent_authorizations;
DROP POLICY IF EXISTS "Acesso a autorizações parentais" ON public.parent_authorizations;
CREATE POLICY "Acesso total a autorizacoes parentais"
    ON public.parent_authorizations FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a boleias partilhadas" ON public.carpool_offers;
DROP POLICY IF EXISTS "Acesso a boleias partilhadas" ON public.carpool_offers;
CREATE POLICY "Acesso total a boleias partilhadas"
    ON public.carpool_offers FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a escaloes etarios" ON public.age_categories;
DROP POLICY IF EXISTS "Acesso a escaloes etarios" ON public.age_categories;
CREATE POLICY "Acesso total a escaloes etarios"
    ON public.age_categories FOR ALL USING (true);

-- ==============================================================================
-- 5. REALTIME (SUPABASE WEBSOCKETS)
-- ==============================================================================
-- Ativa atualizações em tempo real para todas as 11 tabelas da aplicação
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.club_info;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.athletes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.coaches;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.training_plans;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_results;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_authorizations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.carpool_offers;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.age_categories;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ==============================================================================
-- 6. STORAGE BUCKETS (DOCUMENTOS, REGULAMENTOS E DIPLOMAS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('diplomas', 'diplomas', true),
    ('documents', 'documents', true),
    ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Permitir acesso público a ficheiros de storage" ON storage.objects;
CREATE POLICY "Permitir acesso público a ficheiros de storage"
    ON storage.objects FOR SELECT USING (bucket_id IN ('diplomas', 'documents', 'photos'));

DROP POLICY IF EXISTS "Permitir upload de ficheiros de storage" ON storage.objects;
CREATE POLICY "Permitir upload de ficheiros de storage"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('diplomas', 'documents', 'photos'));

-- ==============================================================================
-- 7. DADOS INICIAIS (SEED DATA)
-- ==============================================================================

-- 7.1 Informações do Clube
INSERT INTO public.club_info (id, name, modality, logo_url, banner_url, address, nif, phone, email, foundation_year, president_name, description, facilities, instagram, facebook, website, regulations_pdf_url)
VALUES (
    1,
    'Clube Náutico & Desportivo Mais Desporto',
    'Natação & Triatlo',
    'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&auto=format&fit=crop&q=80',
    'Complexo Desportivo Municipal, Av. dos Desportos, Lote 4, 4700-001 Braga',
    '509 888 777',
    '+351 253 123 456',
    'geral@maisdesporto.pt',
    1998,
    'Dr. Manuel Guimarães',
    'O Clube Mais Desporto é uma referência na formação desportiva, dedicado à natação pura, águas abertas e triatlo. Promovemos o rigor técnico, o espírito de equipa e a saúde.',
    'Piscina Olímpica de 50m (coberta aquecida), Piscina de 25m, Sala de Musculação & Treino Funcional, Gabinete de Fisioterapia e Sala de Apoio ao Estudo.',
    '@maisdesporto_oficial',
    'ClubeMaisDesportoOficial',
    'https://www.maisdesporto.pt',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 7.2 Treinadores Iniciais
INSERT INTO public.coaches (id, name, birth_date, address, phone, email, photo_url, license_number, license_grade, assigned_categories, experience_years, bio)
VALUES
(
    'coach-1',
    'Prof. Carlos Silva',
    '1984-04-12',
    'Rua D. Afonso Henriques, 45, 2º Dto, 4710-001 Braga',
    '+351 912 345 678',
    'carlos.silva@maisdesporto.pt',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'TPTD-44582',
    'Grau III - Alto Rendimento',
    ARRAY['Juvenis (Sub-16)', 'Juniores (Sub-18)', 'Seniores'],
    16,
    'Treinador principal com título de Grau III pela Federação Portuguesa de Natação. Antigo nadador internacional e especialista em provas de velocidade e meio-fundo.'
),
(
    'coach-2',
    'Prof.ª Mariana Costa',
    '1990-09-28',
    'Avenida Central, 128, 4700-022 Braga',
    '+351 918 765 432',
    'mariana.costa@maisdesporto.pt',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    'TPTD-55891',
    'Grau II - Treinador de Jovens',
    ARRAY['Benjamins (Sub-10)', 'Infantis (Sub-12)', 'Iniciados (Sub-14)'],
    9,
    'Mestre em Ciências do Desporto e especialista em desenvolvimento motor infantojuvenil. Foco no aperfeiçoamento dos 4 estilos e motivação dos escalões de base.'
)
ON CONFLICT (id) DO NOTHING;

-- 7.3 Atletas Iniciais
INSERT INTO public.athletes (id, name, birth_date, address, phone, email, photo_url, federation_number, category, guardian_name, guardian_phone, guardian_email, guardian_id, medical_exam_expiry, medical_status, emergency_contact, allergies_or_conditions, attendance_rate, notes)
VALUES
(
    'ath-1',
    'Marta Santos',
    '2009-06-18',
    'Rua das Camélias, 14, Braga',
    '+351 925 111 222',
    'marta.santos@maisdesporto.pt',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
    'FPN-201089',
    'Juvenis (Sub-16)',
    'António Santos',
    '+351 963 888 999',
    'antonio.santos@gmail.com',
    'user-parent-1',
    '2026-11-30',
    'valido',
    '+351 963 888 999 (Pai)',
    'Sem alergias conhecidas',
    96.50,
    'Especialista em 100m e 200m Mariposa. Recordista regional de Juvenis.'
),
(
    'ath-2',
    'Lucas Ferreira',
    '2008-03-24',
    'Praceta do Estádio, 8, Braga',
    '+351 913 222 333',
    'lucas.f@gmail.com',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'FPN-198744',
    'Juniores (Sub-18)',
    'Helena Ferreira',
    '+351 917 555 444',
    'helena.ferreira@hotmail.com',
    NULL,
    '2026-10-15',
    'valido',
    '+351 917 555 444 (Mãe)',
    'Asma induzida por esforço (medicado, uso de Ventilan autorizado)',
    91.20,
    'Destaque em 50m e 100m Livres. Potencial para estafetas nacionais.'
)
ON CONFLICT (id) DO NOTHING;

-- 7.4 Perfis de Autenticação Iniciais
INSERT INTO public.profiles (id, name, email, role, status, avatar_url, phone, birth_date, address, coach_grade, coach_profile_id, athlete_profile_id, related_athlete_ids, approved_at, approved_by_coach_name)
VALUES
(
    'user-coach-1',
    'Prof. Carlos Silva',
    'carlos.silva@maisdesporto.pt',
    'treinador',
    'aprovado',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    '+351 912 345 678',
    '1984-04-12',
    'Rua D. Afonso Henriques, 45, 2º Dto, 4710-001 Braga',
    'Grau III - Alto Rendimento',
    'coach-1',
    NULL,
    '{}',
    '2026-01-10',
    'Direção do Clube'
),
(
    'user-athlete-1',
    'Marta Santos',
    'marta.santos@maisdesporto.pt',
    'atleta',
    'aprovado',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
    '+351 925 111 222',
    '2009-06-18',
    'Rua das Camélias, 14, Braga',
    NULL,
    NULL,
    'ath-1',
    '{}',
    '2026-02-01',
    'Prof. Carlos Silva'
),
(
    'user-athlete-2',
    'Lucas Ferreira',
    'lucas.f@gmail.com',
    'atleta',
    'aprovado',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    '+351 913 222 333',
    '2008-03-24',
    'Praceta do Estádio, 8, Braga',
    NULL,
    NULL,
    'ath-2',
    '{}',
    '2026-02-05',
    'Prof. Carlos Silva'
),
(
    'user-parent-1',
    'António Santos (Pai)',
    'antonio.santos@gmail.com',
    'encarregado',
    'aprovado',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    '+351 963 888 999',
    '1979-11-03',
    'Rua das Camélias, 14, Braga',
    NULL,
    NULL,
    NULL,
    ARRAY['ath-1'],
    '2026-02-02',
    'Prof. Carlos Silva'
)
ON CONFLICT (id) DO NOTHING;

-- 7.5 Eventos Iniciais do Calendário (Com Confirmação RSVP e Tarefas com Visto Verde/Cruz Vermelha)
INSERT INTO public.calendar_events (id, title, type, date, time, end_time, location, target_categories, description, official_pdf_url, created_by_role, creator_name, creator_id, athlete_id, is_completed, rsvps)
VALUES
(
    'evt-comp-1',
    'Campeonato Regional de Inverno - FPN',
    'prova',
    '2026-09-12',
    '08:30',
    '18:00',
    'Piscina Olímpica de Coimbra',
    ARRAY['Juvenis (Sub-16)', 'Juniores (Sub-18)', 'Seniores'],
    'Primeira prova oficial de apuramento para os Nacionais de Piscina Curta. Comparência obrigatória com equipamento oficial do clube.',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'treinador',
    'Prof. Carlos Silva',
    'user-coach-1',
    NULL,
    FALSE,
    '{"ath-1": {"status": "confirmado", "responderName": "Marta Santos", "role": "atleta", "updatedAt": "2026-09-01 10:30"}, "ath-2": {"status": "confirmado", "responderName": "Lucas Ferreira", "role": "atleta", "updatedAt": "2026-09-02 14:15"}}'::JSONB
),
(
    'evt-task-coach-1',
    'Entrega de Termo de Responsabilidade e Exame Médico',
    'tarefa',
    '2026-09-08',
    '17:00',
    '19:30',
    'Secretaria do Clube',
    ARRAY['Todos os Escalões'],
    'Todos os atletas convocados para as provas oficiais devem entregar a cédula desportiva e cópia do atestado médico validado.',
    NULL,
    'treinador',
    'Prof. Carlos Silva',
    'user-coach-1',
    NULL,
    FALSE,
    '{"ath-1": {"status": "confirmado", "responderName": "Marta Santos", "role": "atleta", "updatedAt": "2026-09-08 09:10"}, "ath-2": {"status": "ausente", "responderName": "Lucas Ferreira", "role": "atleta", "note": "Entrega via email amanhã", "updatedAt": "2026-09-08 11:45"}}'::JSONB
),
(
    'evt-train-1',
    'Treino de Velocidade e Saídas de Bloco',
    'treino_oficial',
    '2026-09-10',
    '18:00',
    '20:00',
    'Piscina Municipal 50m (Pista 4, 5 e 6)',
    ARRAY['Juvenis (Sub-16)', 'Juniores (Sub-18)'],
    'Aquecimento progressivo, teste de saídas de bloco com cronómetro eletrónico e viragens em ritmo de prova.',
    NULL,
    'treinador',
    'Prof. Carlos Silva',
    'user-coach-1',
    NULL,
    FALSE,
    '{"ath-1": {"status": "confirmado", "responderName": "Marta Santos", "role": "atleta", "updatedAt": "2026-09-03 16:00"}}'::JSONB
)
ON CONFLICT (id) DO NOTHING;

-- 7.6 Resultados Iniciais
INSERT INTO public.competition_results (id, title, competition_date, modality, category, location, pdf_url, pdf_title, pdf_file_size, summary, podium, highlights, photos, published_by_coach_name)
VALUES
(
    'res-1',
    'Meeting Internacional de Braga 2026',
    '2026-08-25',
    'Natação Pura',
    'Juvenis & Juniores',
    'Piscina Olímpica das Rodas, Braga',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'Resultados_Oficiais_Meeting_Braga_2026.pdf',
    '2.4 MB',
    'Excelente prestação da comitiva do Mais Desporto no Meeting Internacional de Braga com recorde de medalhas e novos mínimos alcançados.',
    '[{"position": 1, "athleteName": "Marta Santos", "markOrScore": "1:02.45 (RP)", "category": "100m Mariposa Juvenis", "clubOrOpponent": "Clube Náutico"}, {"position": 2, "athleteName": "Lucas Ferreira", "markOrScore": "23.88", "category": "50m Livres Juniores", "clubOrOpponent": "Sporting Clube"}]'::JSONB,
    ARRAY['Marta Santos sagrou-se campeã nos 100m Mariposa com novo Recorde Pessoal.', 'Lucas Ferreira alcançou o 2º lugar e bateu o mínimo para os Campeonatos Nacionais.'],
    ARRAY['https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80'],
    'Prof. Carlos Silva'
)
ON CONFLICT (id) DO NOTHING;

-- 7.7 Notificações Iniciais
INSERT INTO public.notifications (id, title, message, date, type, target_audience, is_read, author_name, action_label, action_tab)
VALUES
(
    'notif-1',
    'Convocatória Oficial - Campeonato Regional de Inverno',
    'Está publicada a lista de convocados e o horário de partida para a competição de Coimbra no dia 12 de Setembro. Por favor confirmem presença no vosso calendário.',
    TIMEZONE('utc', NOW()),
    'convocatoria',
    'atletas',
    FALSE,
    'Prof. Carlos Silva',
    'Ver Calendário',
    'calendario'
),
(
    'notif-2',
    'Bolsa de Boleias Aberta para Coimbra',
    'Encarregados de educação com lugares disponíveis no carro para a deslocação a Coimbra podem agora partilhar na aba de Comunidade e Boleias.',
    TIMEZONE('utc', NOW()),
    'comunicado',
    'pais',
    FALSE,
    'Direção do Clube',
    'Ver Boleias',
    'calendario'
)
ON CONFLICT (id) DO NOTHING;

-- 7.8 Escalões Etários por Nascimento Iniciais
INSERT INTO public.age_categories (id, name, code, birth_date_start, birth_date_end, season_start_date, season_end_date, gender, color, notes)
VALUES
('cat-1', 'Benjamins (Sub-12)', 'SUB-12', '2014-01-01', '2016-12-31', '2025-09-01', '2026-08-31', 'todos', 'bg-cyan-600', 'Iniciação desportiva e adaptação competitiva.'),
('cat-2', 'Infantis (Sub-14)', 'SUB-14', '2012-01-01', '2013-12-31', '2025-09-01', '2026-08-31', 'todos', 'bg-emerald-600', 'Desenvolvimento técnico das 4 técnicas e transições.'),
('cat-3', 'Iniciados (Sub-15)', 'SUB-15', '2011-01-01', '2011-12-31', '2025-09-01', '2026-08-31', 'todos', 'bg-blue-600', 'Transição para ritmo de prova oficial e cadência.'),
('cat-4', 'Juvenis (Sub-16)', 'SUB-16', '2009-01-01', '2010-12-31', '2025-09-01', '2026-08-31', 'todos', 'bg-indigo-600', 'Treino de capacidades aeróbias e força específica.'),
('cat-5', 'Juniores (Sub-18)', 'SUB-18', '2007-01-01', '2008-12-31', '2025-09-01', '2026-08-31', 'todos', 'bg-violet-600', 'Alto rendimento e apuramento para campeonatos nacionais.'),
('cat-6', 'Seniores', 'SEN', '1995-01-01', '2006-12-31', '2025-09-01', '2026-08-31', 'todos', 'bg-rose-600', 'Escalão absoluto e máxima performance desportiva.'),
('cat-7', 'Masters', 'MAS', '1900-01-01', '1994-12-31', '2025-09-01', '2026-08-31', 'todos', 'bg-amber-600', 'Competição veterana e manutenção da condição física.')
ON CONFLICT (id) DO NOTHING;

-- Concluído com sucesso
SELECT 'Base de dados Supabase configurada com sucesso!' AS status;
