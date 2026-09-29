export interface SchemaColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
  description: string;
}

export interface SchemaTable {
  name: string;
  label: string;
  description: string;
  category: string;
  columns: SchemaColumn[];
}

export const SUPABASE_TABLES_SCHEMA: SchemaTable[] = [
  {
    name: 'club_info',
    label: 'Informações do Clube',
    category: 'Institucional',
    description: 'Dados institucionais do clube, contactos, NIF, logótipos e links sociais.',
    columns: [
      { name: 'id', type: 'SERIAL (INTEGER)', isPrimary: true, description: 'Identificador único do clube (registo único id=1)' },
      { name: 'name', type: 'TEXT', isNullable: false, description: 'Nome oficial do clube desportivo' },
      { name: 'modality', type: 'TEXT', isNullable: false, description: 'Modalidade principal (ex: Natação & Triatlo)' },
      { name: 'logo_url', type: 'TEXT', isNullable: true, description: 'URL da imagem do emblema/logótipo do clube' },
      { name: 'banner_url', type: 'TEXT', isNullable: true, description: 'URL do banner da página inicial e cabeçalho' },
      { name: 'address', type: 'TEXT', isNullable: true, description: 'Morada da sede ou complexo desportivo' },
      { name: 'nif', type: 'TEXT', isNullable: true, description: 'Número de Identificação Fiscal do clube' },
      { name: 'phone', type: 'TEXT', isNullable: true, description: 'Contacto telefónico geral da secretaria' },
      { name: 'email', type: 'TEXT', isNullable: true, description: 'Email geral para contacto institucional' },
      { name: 'foundation_year', type: 'INTEGER', isNullable: true, defaultValue: '1998', description: 'Ano de fundação do clube' },
      { name: 'president_name', type: 'TEXT', isNullable: true, description: 'Nome do Presidente da Direção' },
      { name: 'description', type: 'TEXT', isNullable: true, description: 'Resumo institucional da história e missão do clube' },
      { name: 'facilities', type: 'TEXT', isNullable: true, description: 'Instalações e piscinas onde decorrem os treinos' },
      { name: 'instagram', type: 'TEXT', isNullable: true, description: 'Link ou utilizador da página do Instagram' },
      { name: 'facebook', type: 'TEXT', isNullable: true, description: 'Link da página oficial no Facebook' },
      { name: 'website', type: 'TEXT', isNullable: true, description: 'Endereço do website oficial' },
      { name: 'regulations_pdf_url', type: 'TEXT', isNullable: true, description: 'URL do PDF com o Regulamento Interno do Clube' },
      { name: 'primary_color', type: 'TEXT', isNullable: true, defaultValue: "'#2563eb'", description: 'Cor predominante personalizada da aplicação (HEX)' },
      { name: 'documents', type: 'JSONB / TEXT', isNullable: true, description: 'Documentos anexados pelo treinador (instalações, apoio médico, horários e regulamentos)' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: true, defaultValue: 'NOW()', description: 'Data e hora da última atualização' }
    ]
  },
  {
    name: 'age_categories',
    label: 'Escalões por Nascimento',
    category: 'Técnico',
    description: 'Definição dos escalões etários calculados pelas datas de nascimento dos atletas.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único do escalão (ex: cat-juvenis-a)' },
      { name: 'name', type: 'TEXT', isNullable: false, description: 'Nome do escalão (ex: Benjamins, Juvenis A, Juniores)' },
      { name: 'code', type: 'TEXT', isNullable: true, description: 'Código abreviado federativo (ex: JUV-A, JUN, MAS)' },
      { name: 'birth_date_start', type: 'DATE', isNullable: false, description: 'Data de nascimento mínima (início do intervalo)' },
      { name: 'birth_date_end', type: 'DATE', isNullable: false, description: 'Data de nascimento máxima (fim do intervalo)' },
      { name: 'season_start_date', type: 'DATE', isNullable: false, description: 'Início da época desportiva de vigência' },
      { name: 'season_end_date', type: 'DATE', isNullable: false, description: 'Fim da época desportiva de vigência' },
      { name: 'gender', type: 'TEXT', isNullable: true, defaultValue: "'todos'", description: 'Gênero elegível: masculino, feminino ou todos' },
      { name: 'notes', type: 'TEXT', isNullable: true, description: 'Observações e regulamentação técnica federativa' },
      { name: 'color', type: 'TEXT', isNullable: true, defaultValue: "'bg-blue-600'", description: 'Classe Tailwind CSS de cor para o emblema visual' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data de registo do escalão' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data da última alteração' }
    ]
  },
  {
    name: 'athletes',
    label: 'Fichas dos Atletas',
    category: 'Desportivo',
    description: 'Registo completo dos atletas, dados médicos, contactos e encarregados.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único do atleta (ex: ath-1)' },
      { name: 'name', type: 'TEXT', isNullable: false, description: 'Nome completo do atleta' },
      { name: 'birth_date', type: 'DATE', isNullable: false, description: 'Data de nascimento (usada para atribuição automática do escalão)' },
      { name: 'address', type: 'TEXT', isNullable: true, description: 'Morada de residência do atleta' },
      { name: 'phone', type: 'TEXT', isNullable: true, description: 'Telefone de contacto do atleta' },
      { name: 'email', type: 'TEXT', isNullable: false, description: 'Endereço de email do atleta' },
      { name: 'photo_url', type: 'TEXT', isNullable: true, description: 'Foto de perfil / rosto do atleta' },
      { name: 'federation_number', type: 'TEXT', isNullable: false, description: 'Número de licença na Federação Portuguesa de Natação' },
      { name: 'category', type: 'TEXT', isNullable: false, description: 'Escalão desportivo atual' },
      { name: 'guardian_name', type: 'TEXT', isNullable: false, description: 'Nome do Encarregado de Educação' },
      { name: 'guardian_phone', type: 'TEXT', isNullable: false, description: 'Telefone de emergência do Encarregado' },
      { name: 'guardian_email', type: 'TEXT', isNullable: false, description: 'Email do Encarregado de Educação' },
      { name: 'medical_exam_expiry', type: 'DATE', isNullable: false, description: 'Data de validade do exame médico desportivo' },
      { name: 'medical_status', type: 'TEXT', isNullable: false, description: 'Estado do exame: valido, expirado ou pendente' },
      { name: 'emergency_contact', type: 'TEXT', isNullable: false, description: 'Contacto telefónico rápido para emergências' },
      { name: 'attendance_rate', type: 'NUMERIC(5,2)', isNullable: true, defaultValue: '100', description: 'Taxa de assiduidade aos treinos (%)' },
      { name: 'notes', type: 'TEXT', isNullable: true, description: 'Notas clínicas, alergias ou observações técnicas' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data de criação da ficha' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data da última alteração' }
    ]
  },
  {
    name: 'coaches',
    label: 'Treinadores & Cédulas',
    category: 'Equipa Técnica',
    description: 'Equipa técnica do clube, graus de treinador TPTD, diplomas e escalões.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único do treinador' },
      { name: 'name', type: 'TEXT', isNullable: false, description: 'Nome completo do treinador' },
      { name: 'birth_date', type: 'DATE', isNullable: false, description: 'Data de nascimento do treinador' },
      { name: 'address', type: 'TEXT', isNullable: true, description: 'Morada do treinador' },
      { name: 'phone', type: 'TEXT', isNullable: false, description: 'Contacto telefónico do treinador' },
      { name: 'email', type: 'TEXT', isNullable: false, description: 'Email oficial do treinador' },
      { name: 'photo_url', type: 'TEXT', isNullable: true, description: 'Foto de perfil do treinador' },
      { name: 'license_number', type: 'TEXT', isNullable: false, description: 'Número do Título Profissional de Treinador de Desporto (TPTD)' },
      { name: 'license_grade', type: 'TEXT', isNullable: false, description: 'Grau do Treinador (campo de texto livre, ex: Grau II)' },
      { name: 'diploma_url', type: 'TEXT', isNullable: true, description: 'URL do diploma ou certificado carregado' },
      { name: 'diploma_name', type: 'TEXT', isNullable: true, description: 'Nome original do ficheiro do diploma' },
      { name: 'diploma_type', type: 'TEXT', isNullable: true, description: 'Extensão ou formato do ficheiro (pdf, imagem)' },
      { name: 'assigned_categories', type: 'TEXT[]', isNullable: false, defaultValue: "'{}'", description: 'Array com os escalões sob responsabilidade deste treinador' },
      { name: 'experience_years', type: 'INTEGER', isNullable: true, defaultValue: '0', description: 'Anos de experiência acumulada como treinador' },
      { name: 'bio', type: 'TEXT', isNullable: true, description: 'Apresentação curricular e percurso desportivo' },
      { name: 'is_admin', type: 'BOOLEAN', isNullable: true, defaultValue: 'false', description: 'Indica se o treinador tem privilégios de Administrador do Clube' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data de registo do treinador' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data da última alteração' }
    ]
  },
  {
    name: 'calendar_events',
    label: 'Eventos & Presenças (RSVP)',
    category: 'Agenda & Treinos',
    description: 'Sessões de treino, competições, tarefas e respostas de presenças dos atletas.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único do evento (ex: evt-1)' },
      { name: 'title', type: 'TEXT', isNullable: false, description: 'Título da sessão ou prova (ex: Treino de Velocidade)' },
      { name: 'type', type: 'TEXT', isNullable: false, description: 'Tipo de evento: treino, competicao ou tarefa' },
      { name: 'date', type: 'DATE', isNullable: false, description: 'Data do evento (YYYY-MM-DD)' },
      { name: 'time', type: 'TEXT', isNullable: false, description: 'Hora de início (ex: 18:00)' },
      { name: 'end_time', type: 'TEXT', isNullable: true, description: 'Hora de conclusão (ex: 20:00)' },
      { name: 'location', type: 'TEXT', isNullable: true, description: 'Local (Piscina Olímpica, Complexo Municipal, etc.)' },
      { name: 'target_categories', type: 'TEXT[]', defaultValue: "'{}'", description: 'Array de escalões alvo' },
      { name: 'description', type: 'TEXT', isNullable: true, description: 'Detalhes da convocatória, objetivos e equipamento' },
      { name: 'official_pdf_url', type: 'TEXT', isNullable: true, description: 'Link para o PDF do regulamento / programa da prova' },
      { name: 'created_by_role', type: 'TEXT', isNullable: false, description: 'Papel do criador: treinador, atleta, encarregado' },
      { name: 'creator_name', type: 'TEXT', isNullable: false, description: 'Nome de quem criou o evento' },
      { name: 'creator_id', type: 'TEXT', isNullable: false, description: 'ID do utilizador autor' },
      { name: 'athlete_id', type: 'TEXT', isNullable: true, description: 'ID do atleta quando se trata de tarefa individual privada' },
      { name: 'is_completed', type: 'BOOLEAN', defaultValue: 'false', description: 'Indica se a tarefa ou sessão já foi concluída' },
      { name: 'rsvps', type: 'JSONB', defaultValue: "'{}'", description: 'Objeto JSON com presenças: status (confirmado/ausente/justificado), notas e horas' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data de criação do evento' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data da última alteração' }
    ]
  },
  {
    name: 'training_plans',
    label: 'Planos de Treino',
    category: 'Agenda & Treinos',
    description: 'Planos técnicos de treino, blocos de séries, intensidades e avaliações RPE.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único do plano' },
      { name: 'title', type: 'TEXT', isNullable: false, description: 'Título do plano de treino' },
      { name: 'modality', type: 'TEXT', isNullable: false, description: 'Disciplina ou modalidade' },
      { name: 'target_category', type: 'TEXT', isNullable: false, description: 'Escalão a que se destina o plano' },
      { name: 'duration_minutes', type: 'INTEGER', isNullable: false, description: 'Duração prevista da sessão em minutos' },
      { name: 'intensity_level', type: 'TEXT', isNullable: false, description: 'Intensidade: moderada, alta ou muito alta' },
      { name: 'objective', type: 'TEXT', isNullable: true, description: 'Objetivo fisiológico ou técnico da sessão' },
      { name: 'blocks', type: 'JSONB', isNullable: false, defaultValue: "'[]'", description: 'Blocos e séries de treino (aquecimento, parte principal, etc.)' },
      { name: 'created_by_coach_name', type: 'TEXT', isNullable: false, description: 'Nome do treinador autor do plano' },
      { name: 'tags', type: 'TEXT[]', defaultValue: "'{}'", description: 'Tags de estilo e tipo de esforço (aeróbio, força, etc.)' },
      { name: 'assigned_athlete_ids', type: 'TEXT[]', defaultValue: "'{}'", description: 'Atletas designados para este plano' },
      { name: 'completed_by_athlete_ids', type: 'JSONB', defaultValue: "'[]'", description: 'Registos de conclusão: atleta, data, escala RPE (1-10) e feedback' },
      { name: 'scheduled_date', type: 'DATE', isNullable: true, description: 'Data agendada no calendário para realização do treino' },
      { name: 'scheduled_time', type: 'TEXT', isNullable: true, description: 'Hora de início prevista para a sessão' },
      { name: 'scheduled_dates', type: 'TEXT[]', defaultValue: "'{}'", description: 'Múltiplas datas agendadas no calendário' },
      { name: 'created_at', type: 'DATE', defaultValue: 'CURRENT_DATE', description: 'Data de publicação do plano' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Data de última edição' }
    ]
  },
  {
    name: 'competition_results',
    label: 'Resultados de Competições',
    category: 'Competição',
    description: 'Resultados oficiais, medalhas, pódios, relatórios PDF e fotografias.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único do resultado' },
      { name: 'title', type: 'TEXT', isNullable: false, description: 'Nome da competição / torneio' },
      { name: 'competition_date', type: 'DATE', isNullable: false, description: 'Data de realização da prova' },
      { name: 'location', type: 'TEXT', isNullable: false, description: 'Cidade ou complexo aquático onde decorreu' },
      { name: 'category', type: 'TEXT', isNullable: false, description: 'Escalões em competição' },
      { name: 'pdf_url', type: 'TEXT', isNullable: true, description: 'URL do PDF de classificações oficiais' },
      { name: 'pdf_title', type: 'TEXT', isNullable: true, description: 'Nome do documento PDF' },
      { name: 'pdf_file_size', type: 'TEXT', isNullable: true, description: 'Tamanho do ficheiro PDF' },
      { name: 'summary', type: 'TEXT', isNullable: false, description: 'Resumo da prestação da equipa' },
      { name: 'podium', type: 'JSONB', defaultValue: "'[]'", description: 'Lista de medalhas ganhas (atleta, prova, lugar, tempo)' },
      { name: 'highlights', type: 'JSONB', defaultValue: "'[]'", description: 'Recordes pessoais e destaques alcançados' },
      { name: 'photos', type: 'JSONB', defaultValue: "'[]'", description: 'Galeria fotográfica do evento' },
      { name: 'published_by_coach_name', type: 'TEXT', isNullable: false, description: 'Treinador responsável pela publicação' },
      { name: 'published_at', type: 'DATE', defaultValue: 'CURRENT_DATE', description: 'Data de publicação dos resultados' }
    ]
  },
  {
    name: 'notifications',
    label: 'Notificações & Avisos',
    category: 'Comunicação',
    description: 'Comunicados, avisos de exames médicos e convocatórias enviadas aos membros.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único da notificação' },
      { name: 'title', type: 'TEXT', isNullable: false, description: 'Título do aviso ou comunicado' },
      { name: 'message', type: 'TEXT', isNullable: false, description: 'Mensagem detalhada' },
      { name: 'date', type: 'TEXT', isNullable: false, description: 'Data e hora de emissão' },
      { name: 'type', type: 'TEXT', isNullable: false, description: 'Tipo: urgente, exame, convocatória, comunicado' },
      { name: 'target_audience', type: 'TEXT', isNullable: false, description: 'Destinatários: todos, atletas, treinadores, pais' },
      { name: 'target_category', type: 'TEXT', isNullable: true, description: 'Filtro por escalão desportivo' },
      { name: 'target_athlete_id', type: 'TEXT', isNullable: true, description: 'Atleta específico destinatário' },
      { name: 'target_athlete_name', type: 'TEXT', isNullable: true, description: 'Nome do atleta específico' },
      { name: 'target_athlete_ids', type: 'TEXT[]', isNullable: true, description: 'Array de atletas convocados' },
      { name: 'target_user_id', type: 'TEXT', isNullable: true, description: 'Utilizador específico de destino' },
      { name: 'is_read', type: 'BOOLEAN', defaultValue: 'false', description: 'Indica se a notificação foi lida pelo utilizador' },
      { name: 'author_name', type: 'TEXT', isNullable: false, description: 'Nome do autor ou Clube' },
      { name: 'action_label', type: 'TEXT', isNullable: true, description: 'Texto do botão de ação rápida' },
      { name: 'action_tab', type: 'TEXT', isNullable: true, description: 'Separador de destino ao clicar no botão' }
    ]
  },
  {
    name: 'profiles',
    label: 'Perfis de Utilizador',
    category: 'Segurança & Contas',
    description: 'Contas registadas, credenciais, papéis (Role) e aprovações de treinador.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador do perfil' },
      { name: 'auth_user_id', type: 'UUID', isNullable: true, description: 'Referência ao utilizador do Supabase Auth (auth.users)' },
      { name: 'name', type: 'TEXT', isNullable: false, description: 'Nome completo do utilizador' },
      { name: 'email', type: 'TEXT', isNullable: false, description: 'Email de login e contacto' },
      { name: 'role', type: 'TEXT', isNullable: false, description: 'Papel no clube: treinador, atleta ou encarregado' },
      { name: 'status', type: 'TEXT', defaultValue: "'pendente_aprovacao'", description: 'Estado: aprovado, pendente_aprovacao ou rejeitado' },
      { name: 'avatar_url', type: 'TEXT', isNullable: true, description: 'Foto de avatar' },
      { name: 'phone', type: 'TEXT', isNullable: true, description: 'Contacto telefónico' },
      { name: 'birth_date', type: 'DATE', isNullable: true, description: 'Data de nascimento' },
      { name: 'address', type: 'TEXT', isNullable: true, description: 'Morada' },
      { name: 'password', type: 'TEXT', isNullable: true, description: 'Palavra-passe de autenticação (armazenada com cifra RGPD)' },
      { name: 'coach_grade', type: 'TEXT', isNullable: true, description: 'Grau de treinador informado no registo (texto livre)' },
      { name: 'diploma_url', type: 'TEXT', isNullable: true, description: 'URL do diploma anexado no registo' },
      { name: 'diploma_name', type: 'TEXT', isNullable: true, description: 'Nome do ficheiro de diploma' },
      { name: 'diploma_type', type: 'TEXT', isNullable: true, description: 'Tipo do ficheiro de diploma' },
      { name: 'requested_category', type: 'TEXT', isNullable: true, description: 'Escalão pretendido pelo atleta ou treinado pelo treinador' },
      { name: 'federation_number', type: 'TEXT', isNullable: true, description: 'Número federativo ou TPTD' },
      { name: 'notes', type: 'TEXT', isNullable: true, description: 'Notas e observações da inscrição' },
      { name: 'approved_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Data e hora da aprovação' },
      { name: 'approved_by_coach_name', type: 'TEXT', isNullable: true, description: 'Nome do treinador que aprovou' },
      { name: 'rejection_reason', type: 'TEXT', isNullable: true, description: 'Motivo da rejeição caso não seja aprovado' },
      { name: 'related_athlete_ids', type: 'TEXT[]', defaultValue: "'{}'", description: 'IDs dos atletas associados (caso encarregado de educação)' },
      { name: 'athlete_profile_id', type: 'TEXT', isNullable: true, description: 'Ligação à ficha na tabela athletes' },
      { name: 'coach_profile_id', type: 'TEXT', isNullable: true, description: 'Ligação à ficha na tabela coaches' },
      { name: 'is_admin', type: 'BOOLEAN', isNullable: true, defaultValue: 'false', description: 'Indica se o utilizador tem estatuto de Administrador do Clube' }
    ]
  },
  {
    name: 'parent_authorizations',
    label: 'Autorizações Parentais',
    category: 'Famílias & Pais',
    description: 'Termos de autorização para deslocações, competições e assinaturas digitais.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único do termo' },
      { name: 'athlete_id', type: 'TEXT', isNullable: false, description: 'ID do atleta que participa no evento' },
      { name: 'athlete_name', type: 'TEXT', isNullable: false, description: 'Nome do atleta' },
      { name: 'parent_id', type: 'TEXT', isNullable: false, description: 'ID do encarregado de educação' },
      { name: 'parent_name', type: 'TEXT', isNullable: false, description: 'Nome do encarregado de educação' },
      { name: 'event_id', type: 'TEXT', isNullable: false, description: 'ID da competição ou estágio associado' },
      { name: 'event_title', type: 'TEXT', isNullable: false, description: 'Designação do evento' },
      { name: 'event_date', type: 'DATE', isNullable: false, description: 'Data de realização do evento' },
      { name: 'location', type: 'TEXT', isNullable: true, description: 'Localidade de realização' },
      { name: 'status', type: 'TEXT', defaultValue: "'pendente'", description: 'Estado: pendente, autorizado ou recusado' },
      { name: 'signed_at', type: 'TEXT', isNullable: true, description: 'Timestamp de assinatura eletrónica' },
      { name: 'notes', type: 'TEXT', isNullable: true, description: 'Observações, restrições alimentares ou condições' }
    ]
  },
  {
    name: 'carpool_offers',
    label: 'Bolsa de Boleias Partilhadas',
    category: 'Famílias & Pais',
    description: 'Ofertas de boleia entre pais para treinos e deslocações a provas.',
    columns: [
      { name: 'id', type: 'TEXT', isPrimary: true, description: 'Identificador único da viagem partilhada' },
      { name: 'parent_id', type: 'TEXT', isNullable: false, description: 'ID do encarregado condutor' },
      { name: 'parent_name', type: 'TEXT', isNullable: false, description: 'Nome do pai/mãe condutor' },
      { name: 'athlete_name', type: 'TEXT', isNullable: false, description: 'Nome do filho/educando do condutor' },
      { name: 'event_id', type: 'TEXT', isNullable: false, description: 'Evento para o qual se deslocam' },
      { name: 'event_title', type: 'TEXT', isNullable: false, description: 'Nome do evento' },
      { name: 'event_date', type: 'DATE', isNullable: false, description: 'Data da viagem' },
      { name: 'available_seats', type: 'INTEGER', isNullable: false, description: 'Número total de lugares vagos no automóvel' },
      { name: 'departure_location', type: 'TEXT', isNullable: false, description: 'Ponto de encontro para partida' },
      { name: 'departure_time', type: 'TEXT', isNullable: false, description: 'Horário de partida' },
      { name: 'contact_phone', type: 'TEXT', isNullable: false, description: 'Telefone do condutor para combinar' },
      { name: 'notes', type: 'TEXT', isNullable: true, description: 'Observações da rota' },
      { name: 'claimed_seats', type: 'JSONB', defaultValue: "'[]'", description: 'Lugares reservados por outras famílias (nome e vagas)' }
    ]
  }
];
