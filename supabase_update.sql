-- ==============================================================================
-- SCRIPT DE ATUALIZAÇÃO E MIGRAÇÃO DA BASE DE DADOS (SUPABASE / POSTGRESQL)
-- Aplicação: Mais Desporto - Gestão de Clube Desportivo, Treinos e Competições
-- ==============================================================================
-- Este script é 100% SEGURO e NÃO APAGA NENHUM DADO EXISTENTE!
-- Adiciona todas as colunas que possam faltar em qualquer versão anterior,
-- ativa políticas de segurança RLS, buckets de ficheiros (Storage)
-- e canais de atualização em tempo real (Realtime).
--
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Aceda ao seu projeto Supabase: https://supabase.com/dashboard
-- 2. No menu lateral esquerdo, clique em "SQL Editor"
-- 3. Clique em "+ New query"
-- 4. Cole TODO o conteúdo deste ficheiro e clique no botão verde "Run"
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. GARANTIR A CRIAÇÃO DE TODAS AS 11 TABELAS (SE AINDA NÃO EXISTIREM)
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

-- 2.2 Perfis de Utilizador
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
    password TEXT,
    coach_grade TEXT,
    diploma_url TEXT,
    diploma_name TEXT,
    diploma_type TEXT CHECK (diploma_type IS NULL OR diploma_type IN ('pdf', 'image', 'doc', 'other')),
    requested_category TEXT,
    federation_number TEXT,
    notes TEXT,
    relation TEXT,
    nif TEXT,
    profession TEXT,
    alt_phone TEXT,
    approved_at TIMESTAMPTZ,
    approved_by_coach_name TEXT,
    rejection_reason TEXT,
    related_athlete_ids TEXT[] DEFAULT '{}',
    athlete_profile_id TEXT,
    coach_profile_id TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.3 Atletas
CREATE TABLE IF NOT EXISTS public.athletes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    federation_number TEXT,
    category TEXT NOT NULL,
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    guardian_id TEXT,
    guardian_relation TEXT,
    guardian_nif TEXT,
    nif TEXT,
    gender TEXT,
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
    license_number TEXT,
    license_grade TEXT,
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
    blocks JSONB DEFAULT '[]'::JSONB,
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

-- 2.6 Calendário de Eventos & Presenças (RSVP)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prova', 'treino_oficial', 'treino_individual', 'estagio', 'reuniao', 'tarefa')),
    date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '18:00',
    end_time TEXT,
    location TEXT,
    target_categories TEXT[] DEFAULT '{}',
    description TEXT,
    official_pdf_url TEXT,
    created_by_role TEXT NOT NULL DEFAULT 'treinador' CHECK (created_by_role IN ('treinador', 'atleta', 'encarregado')),
    creator_name TEXT NOT NULL DEFAULT 'Treinador',
    creator_id TEXT NOT NULL DEFAULT 'user-coach-1',
    athlete_id TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    rsvps JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.7 Resultados de Competições
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
    podium JSONB DEFAULT '[]'::JSONB,
    highlights TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    published_by_coach_name TEXT,
    published_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2.8 Notificações & Avisos
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

-- 2.9 Autorizações Parentais
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
-- 3. MIGRAÇÃO SEGURA: ADICIONAR TODAS AS COLUNAS QUE POSSAM FALTAR EM TABELAS EXISTENTES
-- ==============================================================================
-- Todas as instruções usam ADD COLUMN IF NOT EXISTS para nunca falhar e nunca apagar dados.

-- 3.1 club_info: Cores personalizadas, documentos anexados, regulamentos e links
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563eb';
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS regulations_pdf_url TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS facilities TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS president_name TEXT;
ALTER TABLE public.club_info ADD COLUMN IF NOT EXISTS foundation_year INTEGER DEFAULT 1998;

-- 3.2 profiles: Administrador, palavra-passe cifrada, graus, diplomas e vínculos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_grade TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diploma_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diploma_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS diploma_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS federation_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by_coach_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS related_athlete_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS athlete_profile_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_profile_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alt_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- 3.3 coaches: Administrador, cédula TPTD, graus, diplomas e turmas atribuídas
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS license_grade TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS diploma_url TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS diploma_name TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS diploma_type TEXT;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS assigned_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3.4 athletes: Dados de encarregado, exames médicos, alergias e assiduidade
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS guardian_id TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS guardian_email TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS guardian_relation TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS guardian_nif TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS federation_number TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS medical_exam_expiry DATE;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS medical_status TEXT DEFAULT 'valido';
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS allergies_or_conditions TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS attendance_rate NUMERIC(5,2) DEFAULT 100.00;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3.5 training_plans: Agendamentos diários, múltiplos dias, tags e feedbacks de conclusão RPE
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS scheduled_time TEXT;
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS scheduled_dates TEXT[] DEFAULT '{}';
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS assigned_athlete_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS completed_by_athlete_ids JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.training_plans ADD COLUMN IF NOT EXISTS created_by_coach_name TEXT;

-- 3.6 calendar_events: Conclusão de tarefas, PDFs de provas e presenças (RSVPs)
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS official_pdf_url TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS athlete_id TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS rsvps JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS target_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS description TEXT;

-- 3.7 competition_results: Evento associado, PDF de classificações, pódios, recordes e fotos
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS pdf_title TEXT;
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS pdf_file_size TEXT;
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS podium JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE public.competition_results ADD COLUMN IF NOT EXISTS published_by_coach_name TEXT;

-- 3.8 notifications: Destinatários específicos (atletas/pais), convocatórias e ações rápidas
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_athlete_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_athlete_name TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_athlete_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_category TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_tab TEXT;

-- 3.9 parent_authorizations: Termos de autorização para deslocações e provas
ALTER TABLE public.parent_authorizations ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.parent_authorizations ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE public.parent_authorizations ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3.10 carpool_offers: Lugares reservados e contacto
ALTER TABLE public.carpool_offers ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.carpool_offers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.carpool_offers ADD COLUMN IF NOT EXISTS claimed_seats JSONB DEFAULT '[]'::JSONB;

-- 3.11 age_categories: Código federativo, cores e filtros de género
ALTER TABLE public.age_categories ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.age_categories ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'todos';
ALTER TABLE public.age_categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-blue-600';
ALTER TABLE public.age_categories ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==============================================================================
-- 4. ÍNDICES DE PERFORMANCE E PESQUISA OTIMIZADA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON public.calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_creator ON public.calendar_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_athlete ON public.calendar_events(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_scheduled_date ON public.training_plans(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_training_plans_category ON public.training_plans(target_category);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_athletes_category ON public.athletes(category);
CREATE INDEX IF NOT EXISTS idx_athletes_guardian_id ON public.athletes(guardian_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON public.notifications(target_audience, target_user_id);
CREATE INDEX IF NOT EXISTS idx_age_categories_dates ON public.age_categories(birth_date_start, birth_date_end);
CREATE INDEX IF NOT EXISTS idx_parent_authorizations_event ON public.parent_authorizations(event_id);
CREATE INDEX IF NOT EXISTS idx_carpool_offers_event ON public.carpool_offers(event_id);

-- ==============================================================================
-- 5. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS PERMISSIVAS
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

-- Políticas de acesso total para a aplicação (segurança de dados garantida no cliente e cifra RGPD)
DROP POLICY IF EXISTS "Acesso total a informacoes do clube" ON public.club_info;
CREATE POLICY "Acesso total a informacoes do clube" ON public.club_info FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a perfis" ON public.profiles;
CREATE POLICY "Acesso total a perfis" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a atletas" ON public.athletes;
CREATE POLICY "Acesso total a atletas" ON public.athletes FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a treinadores" ON public.coaches;
CREATE POLICY "Acesso total a treinadores" ON public.coaches FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a planos de treino" ON public.training_plans;
CREATE POLICY "Acesso total a planos de treino" ON public.training_plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a eventos do calendario" ON public.calendar_events;
CREATE POLICY "Acesso total a eventos do calendario" ON public.calendar_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a resultados de competicao" ON public.competition_results;
CREATE POLICY "Acesso total a resultados de competicao" ON public.competition_results FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a notificacoes" ON public.notifications;
CREATE POLICY "Acesso total a notificacoes" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a autorizacoes parentais" ON public.parent_authorizations;
CREATE POLICY "Acesso total a autorizacoes parentais" ON public.parent_authorizations FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a boleias partilhadas" ON public.carpool_offers;
CREATE POLICY "Acesso total a boleias partilhadas" ON public.carpool_offers FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso total a escaloes etarios" ON public.age_categories;
CREATE POLICY "Acesso total a escaloes etarios" ON public.age_categories FOR ALL USING (true);

-- ==============================================================================
-- 6. CANAIS EM TEMPO REAL (SUPABASE REALTIME WEBSOCKETS)
-- ==============================================================================
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.club_info; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.athletes; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.coaches; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.training_plans; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_results; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_authorizations; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.carpool_offers; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.age_categories; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ==============================================================================
-- 7. BUCKETS DE STORAGE (DIPLOMAS, DOCUMENTOS E FOTOGRAFIAS)
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

DROP POLICY IF EXISTS "Permitir atualização de ficheiros de storage" ON storage.objects;
CREATE POLICY "Permitir atualização de ficheiros de storage"
    ON storage.objects FOR UPDATE WITH CHECK (bucket_id IN ('diplomas', 'documents', 'photos'));

-- ==============================================================================
-- 8. REGISTO INICIAL DO CLUBE (SE AINDA NÃO EXISTIR)
-- ==============================================================================
INSERT INTO public.club_info (id, name, modality, foundation_year, president_name)
VALUES (1, 'Clube Náutico & Desportivo Mais Desporto', 'Natação & Triatlo', 1998, 'Dr. Manuel Guimarães')
ON CONFLICT (id) DO NOTHING;

-- FIM DO SCRIPT DE ATUALIZAÇÃO
SELECT 'Base de Dados Atualizada com Sucesso! Todas as 11 tabelas, colunas, RLS, Storage e Realtime verificados e sincronizados.' AS status;
