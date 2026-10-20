const AVATAR_COLORS = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#db2777', '#059669', '#dc2626', '#0284c7'];

/**
 * Iniciais do primeiro e último nome em maiúsculas (ex: "João Paulo Guedes" -> "JG").
 * Ignora texto entre parênteses (ex: "Maria Silva (Mãe)" -> "MS").
 */
export function getNameInitials(name?: string): string {
  const words = (name || '')
    .replace(/\(.*?\)/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return `${first}${last}`.toLocaleUpperCase('pt-PT');
}

/**
 * Foto de perfil por defeito: imagem SVG (data URI) com as iniciais do nome.
 * A cor de fundo é sempre a mesma para o mesmo nome.
 */
export function generateInitialsAvatar(name?: string): string {
  const initials = getNameInitials(name);
  const hash = Array.from(name || '').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">` +
    `<rect width="300" height="300" fill="${color}"/>` +
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#ffffff" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="700">${initials}</text>` +
    `</svg>`;
  return `${INITIALS_AVATAR_PREFIX}${encodeURIComponent(svg)}`;
}

const INITIALS_AVATAR_PREFIX = 'data:image/svg+xml;charset=UTF-8,';

/** Indica se a foto de perfil é o avatar de iniciais gerado automaticamente. */
export function isInitialsAvatar(url?: string): boolean {
  return !!url && url.startsWith(INITIALS_AVATAR_PREFIX);
}
