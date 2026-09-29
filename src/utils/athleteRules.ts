import { Athlete, AgeCategory, NotificationItem } from '../types';

/**
 * Calcula o estado clínico e de aptidão do exame médico desportivo
 * de acordo com a data de validade.
 * 
 * Regra:
 * - Sem data ou data inválida: 'expirado' (Pendente)
 * - Restam mais de 15 dias: 'valido'
 * - Faltam 15 dias ou menos (>= 0 dias): 'a_expirar' (Alerta aos 15 dias)
 * - Data ultrapassada (< 0 dias): 'expirado'
 */
export function calculateMedicalStatus(expiryDate?: string): {
  status: 'valido' | 'a_expirar' | 'expirado';
  daysRemaining: number | null;
  label: string;
  badgeColor: string;
} {
  if (!expiryDate || !expiryDate.trim()) {
    return {
      status: 'expirado',
      daysRemaining: null,
      label: 'Sem Exame Registado (Pendente)',
      badgeColor: 'bg-red-50 text-red-700 border-red-200'
    };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Suporta formato YYYY-MM-DD com parsing seguro
    const parts = expiryDate.split('-');
    let expiry: Date;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      expiry = new Date(year, month, day);
    } else {
      expiry = new Date(expiryDate);
    }
    expiry.setHours(0, 0, 0, 0);

    if (isNaN(expiry.getTime())) {
      return {
        status: 'expirado',
        daysRemaining: null,
        label: 'Data de Exame Inválida',
        badgeColor: 'bg-red-50 text-red-700 border-red-200'
      };
    }

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        status: 'expirado',
        daysRemaining: diffDays,
        label: daysAgo === 1 ? 'Expirou ontem!' : `Expirado há ${daysAgo} dia(s)`,
        badgeColor: 'bg-red-50 text-red-700 border-red-200'
      };
    } else if (diffDays <= 15) {
      return {
        status: 'a_expirar',
        daysRemaining: diffDays,
        label: diffDays === 0 ? 'Expira hoje!' : `Expira em ${diffDays} dia(s) (Alerta 15 dias)`,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    } else {
      return {
        status: 'valido',
        daysRemaining: diffDays,
        label: `Válido (${diffDays} dias restantes)`,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
  } catch {
    return {
      status: 'expirado',
      daysRemaining: null,
      label: 'Erro na data do exame',
      badgeColor: 'bg-red-50 text-red-700 border-red-200'
    };
  }
}

/**
 * Determina o escalão / categoria competitiva do atleta automaticamente
 * com base na sua data de nascimento.
 * Caso não haja nenhum escalão correspondente, atribui "Em Análise".
 */
export function determineAgeCategory(
  birthDate?: string,
  ageCategories: AgeCategory[] = []
): string {
  if (!birthDate || !birthDate.trim()) {
    return 'Em Análise';
  }

  if (!ageCategories || ageCategories.length === 0) {
    return 'Em Análise';
  }

  const matched = ageCategories.find(cat => {
    if (!cat.birthDateStart || !cat.birthDateEnd) return false;
    return birthDate >= cat.birthDateStart && birthDate <= cat.birthDateEnd;
  });

  return matched ? matched.name : 'Em Análise';
}

/**
 * Gera a notificação automática para o atleta e para o seu encarregado de educação
 * quando o exame médico estiver a 15 dias ou menos de expirar (ou já expirado).
 */
export function createMedicalExpiryNotification(
  athlete: Athlete
): NotificationItem | null {
  const { status, daysRemaining } = calculateMedicalStatus(athlete.medicalExamExpiry);

  // Se o exame é válido com mais de 15 dias, não gera aviso
  if (status === 'valido') {
    return null;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (status === 'a_expirar') {
    const daysText = daysRemaining === 0 
      ? 'termina hoje' 
      : `expira em ${daysRemaining} dia(s) (aviso prévio de 15 dias)`;

    return {
      id: `notif-exam-expiring-${athlete.id}-${athlete.medicalExamExpiry}`,
      title: `⚠️ Exame Médico a Expirar: ${athlete.name}`,
      message: `Atenção: O Exame Médico Desportivo do atleta ${athlete.name} ${daysText}, a ${athlete.medicalExamExpiry}. Solicitamos ao atleta e ao encarregado de educação a marcação urgente de nova consulta médica desportiva para manter a aptidão clínica e não suspender a participação em treinos e provas oficiais.`,
      date: todayStr,
      type: 'urgente',
      targetAudience: 'todos',
      targetAthleteId: athlete.id,
      targetAthleteName: athlete.name,
      isRead: false,
      authorName: '',
      actionLabel: 'Ver Ficha do Atleta',
      actionTab: 'atletas'
    };
  }

  // Expirado
  return {
    id: `notif-exam-expired-${athlete.id}-${athlete.medicalExamExpiry || 'pendente'}`,
    title: `🚨 Exame Médico Expirado: ${athlete.name}`,
    message: `Urgente: O Exame Médico Desportivo do atleta ${athlete.name} encontra-se EXPIRADO ${athlete.medicalExamExpiry ? `desde ${athlete.medicalExamExpiry}` : '(sem data registada)'}. Por imperativo legal e regulamentar da Federação, o atleta e o encarregado de educação devem regularizar o exame médico com a máxima brevidade para recuperar a aptidão desportiva.`,
    date: todayStr,
    type: 'urgente',
    targetAudience: 'todos',
    targetAthleteId: athlete.id,
    targetAthleteName: athlete.name,
    isRead: false,
    authorName: '',
    actionLabel: 'Ver Ficha do Atleta',
    actionTab: 'atletas'
  };
}
