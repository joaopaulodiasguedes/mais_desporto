/**
 * Sistema Dinâmico de Cores e Tema do Clube (+ Desporto)
 * Permite que o treinador/administrador personalize a cor predominante da aplicação
 * e propaga as alterações para botões, destaques, menus e indicadores.
 */

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export const CLUB_COLOR_PRESETS: ColorPreset[] = [
  { id: 'blue', name: 'Azul Real', hex: '#2563eb', description: 'Azul original + Desporto' },
  { id: 'navy', name: 'Azul Marinho', hex: '#1d4ed8', description: 'Institucional sóbrio' },
  { id: 'cyan', name: 'Ciano Aquático', hex: '#0891b2', description: 'Natação e desportos aquáticos' },
  { id: 'emerald', name: 'Verde Esmeralda', hex: '#059669', description: 'Verde moderno desportivo' },
  { id: 'green', name: 'Verde Desportivo', hex: '#15803d', description: 'Verde atlético clássico' },
  { id: 'red', name: 'Vermelho Vivo', hex: '#dc2626', description: 'Energia e determinação' },
  { id: 'wine', name: 'Bordô / Grená', hex: '#991b1b', description: 'Carmesim distinto' },
  { id: 'orange', name: 'Laranja Dinâmico', hex: '#ea580c', description: 'Vitalidade e rendimento' },
  { id: 'amber', name: 'Âmbar Dourado', hex: '#d97706', description: 'Ouro e excelência' },
  { id: 'purple', name: 'Roxo Imperial', hex: '#7c3aed', description: 'Púrpura contemporâneo' },
  { id: 'pink', name: 'Magenta / Rosa', hex: '#db2777', description: 'Moderno e vibrante' },
  { id: 'slate', name: 'Grafite / Preto', hex: '#1e293b', description: 'Minimalista escuro' }
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const cleanHex = hex.replace(/^#/, '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

export function adjustBrightness(r: number, g: number, b: number, factor: number): string {
  const newR = Math.max(0, Math.min(255, Math.round(r * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b * factor)));
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export function getLightTint(r: number, g: number, b: number): string {
  // Mistura com branco suave (88% branco, 12% cor)
  const newR = Math.round(255 * 0.88 + r * 0.12);
  const newG = Math.round(255 * 0.88 + g * 0.12);
  const newB = Math.round(255 * 0.88 + b * 0.12);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export function getBorderTint(r: number, g: number, b: number): string {
  // Mistura com branco para bordas (72% branco, 28% cor)
  const newR = Math.round(255 * 0.72 + r * 0.28);
  const newG = Math.round(255 * 0.72 + g * 0.28);
  const newB = Math.round(255 * 0.72 + b * 0.28);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Aplica a cor predominante do clube a todo o ecossistema da aplicação
 */
export function applyClubTheme(hexColor?: string): void {
  if (typeof document === 'undefined') return;

  const validHex = hexColor && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hexColor)
    ? hexColor
    : '#2563eb';

  const rgb = hexToRgb(validHex) || { r: 37, g: 99, b: 235 };
  const hoverHex = adjustBrightness(rgb.r, rgb.g, rgb.b, 0.84);
  const darkHex = adjustBrightness(rgb.r, rgb.g, rgb.b, 0.65);
  const lightHex = getLightTint(rgb.r, rgb.g, rgb.b);
  const borderHex = getBorderTint(rgb.r, rgb.g, rgb.b);
  const glow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`;
  const subtleGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;

  // Define as variáveis de tema no documento
  const root = document.documentElement;
  root.style.setProperty('--club-primary', validHex);
  root.style.setProperty('--club-primary-hover', hoverHex);
  root.style.setProperty('--club-primary-dark', darkHex);
  root.style.setProperty('--club-primary-light', lightHex);
  root.style.setProperty('--club-primary-border', borderHex);
  root.style.setProperty('--club-primary-glow', glow);
  root.style.setProperty('--club-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

  // Injeta estilos dinâmicos CSS para garantir coerência global
  let styleEl = document.getElementById('club-theme-dynamic-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'club-theme-dynamic-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --club-primary: ${validHex};
      --club-primary-hover: ${hoverHex};
      --club-primary-dark: ${darkHex};
      --club-primary-light: ${lightHex};
      --club-primary-border: ${borderHex};
      --color-blue-500: ${validHex};
      --color-blue-600: ${validHex};
      --color-blue-700: ${hoverHex};
      --color-blue-800: ${darkHex};
      --color-blue-50: ${lightHex};
      --color-blue-100: ${lightHex};
      --color-blue-200: ${borderHex};
    }

    /* Sobrescritas para elementos estruturais com a cor predominante */
    .bg-blue-600, .bg-blue-500 {
      background-color: var(--club-primary) !important;
    }
    .hover\\:bg-blue-700:hover, .hover\\:bg-blue-600:hover {
      background-color: var(--club-primary-hover) !important;
    }
    .text-blue-600, .text-blue-500, .text-blue-400 {
      color: var(--club-primary) !important;
    }
    .text-blue-700, .text-blue-800, .text-blue-900 {
      color: var(--club-primary-dark) !important;
    }
    .border-blue-600, .border-blue-500 {
      border-color: var(--club-primary) !important;
    }
    .border-blue-200, .border-blue-300 {
      border-color: var(--club-primary-border) !important;
    }
    .hover\\:border-blue-300:hover, .hover\\:border-blue-400:hover {
      border-color: var(--club-primary-border) !important;
    }
    .bg-blue-50, .bg-blue-100 {
      background-color: var(--club-primary-light) !important;
    }
    .focus\\:ring-blue-500:focus, .focus\\:ring-blue-600:focus {
      --tw-ring-color: var(--club-primary) !important;
    }
    .ring-blue-500, .ring-blue-500\\/40, .ring-blue-400\\/50 {
      --tw-ring-color: var(--club-primary) !important;
    }
    .shadow-blue-500\\/20 {
      box-shadow: 0 10px 15px -3px ${glow}, 0 4px 6px -4px ${glow} !important;
    }
    .shadow-blue-500\\/10 {
      box-shadow: 0 4px 6px -1px ${subtleGlow}, 0 2px 4px -2px ${subtleGlow} !important;
    }
  `;
}
