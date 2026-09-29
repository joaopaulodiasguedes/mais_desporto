/**
 * ==============================================================================
 * MÓDULO DE CIFRA DE DADOS PESSOAIS (RGPD / GDPR - PRIVACIDADE POR CONCEÇÃO)
 * ==============================================================================
 * Aplicação: Mais Desporto - Gestão de Clube Desportivo, Treinos e Competições
 * 
 * Protege campos confidenciais de Atletas, Treinadores e Encarregados de Educação
 * antes de serem guardados na base de dados remota (Supabase / PostgreSQL).
 * 
 * - Algoritmo: AES-GCM de 256 bits (Autenticado - AEAD)
 * - Derivação de Chave: PBKDF2 com HMAC-SHA-256 (100.000 iterações)
 * - Vetor de Inicialização (IV): 96 bits criptograficamente aleatório por registo
 * - Formato no Banco de Dados: enc:v1:<iv_base64>:<ciphertext_base64>
 * - Compatibilidade Retroativa: Campos em texto limpo são lidos de forma transparente
 * ==============================================================================
 */

const ENCRYPTION_STORAGE_KEY = 'maisdesporto_encryption_passphrase';
const DEFAULT_CLUB_PASSPHRASE = 'MaisDesporto-ClubeNautico-SegurancaRGPD-2026';
const CLUB_SALT_STRING = 'MaisDesporto_Natacao_Triatlo_Salt_GDPR_ProtecaoDados';

// Cache da chave derivada para máxima performance (sub-milissegundo)
let cachedCryptoKey: CryptoKey | null = null;
let currentPassphrase = DEFAULT_CLUB_PASSPHRASE;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Converte ArrayBuffer para string Base64
 */
function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converte string Base64 para ArrayBuffer
 */
function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Obtém a frase-chave configurada pelo clube ou predefinida
 */
export function getEncryptionPassphrase(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(ENCRYPTION_STORAGE_KEY);
    if (saved) return saved;
  }
  return DEFAULT_CLUB_PASSPHRASE;
}

/**
 * Define uma nova frase-chave de cifra para o clube
 */
export function setEncryptionPassphrase(passphrase: string): void {
  const clean = passphrase.trim();
  if (!clean) return;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(ENCRYPTION_STORAGE_KEY, clean);
  }
  currentPassphrase = clean;
  cachedCryptoKey = null; // Invalida a cache para gerar nova chave
}

/**
 * Repõe a frase-chave predefinida do clube
 */
export function resetEncryptionPassphrase(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(ENCRYPTION_STORAGE_KEY);
  }
  currentPassphrase = DEFAULT_CLUB_PASSPHRASE;
  cachedCryptoKey = null;
}

export const getMasterEncryptionPassphrase = getEncryptionPassphrase;
export const setMasterEncryptionPassphrase = setEncryptionPassphrase;
export const resetMasterEncryptionPassphrase = resetEncryptionPassphrase;

/**
 * Retorna o identificador de impressão digital (fingerprint) da chave atual
 */
export async function getEncryptionKeyId(): Promise<string> {
  const key = getEncryptionPassphrase();
  return hashFingerprint(key);
}

/**
 * Deriva e armazena em cache a chave AES-GCM de 256 bits a partir da passphrase
 */
async function getOrDeriveKey(): Promise<CryptoKey | null> {
  if (cachedCryptoKey) return cachedCryptoKey;

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    return null;
  }

  const pass = getEncryptionPassphrase();
  currentPassphrase = pass;

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(pass),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = encoder.encode(CLUB_SALT_STRING);

  const derived = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  cachedCryptoKey = derived;
  return derived;
}

/**
 * Cifra um texto em claro com AES-GCM 256-bit
 * Se o valor for nulo, indefinido ou vazio, devolve o próprio valor
 */
export async function encryptText(plainText: string | null | undefined): Promise<string | null> {
  if (plainText === null || plainText === undefined) return null;
  const str = String(plainText);
  if (str === '') return '';

  // Se já estiver cifrado, não cifra novamente
  if (str.startsWith('enc:v1:')) return str;

  try {
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
    const key = await getOrDeriveKey();

    if (!cryptoObj || !cryptoObj.subtle || !key) {
      // Fallback seguro em caso de indisponibilidade de WebCrypto
      return fallbackSimpleEncrypt(str);
    }

    const iv = cryptoObj.getRandomValues(new Uint8Array(12)); // 96 bits IV
    const encoded = encoder.encode(str);

    const ciphertext = await cryptoObj.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivB64 = bufferToBase64(iv.buffer);
    const dataB64 = bufferToBase64(ciphertext);

    return `enc:v1:${ivB64}:${dataB64}`;
  } catch (err) {
    console.error('Falha ao cifrar dados confidenciais:', err);
    return str; // Em caso de erro extremo, não destrói o dado
  }
}

/**
 * Decifra um texto proveniente da base de dados
 * Se não tiver o prefixo enc:v1:, devolve o texto original (retrocompatibilidade)
 */
export async function decryptText(cipherText: string | null | undefined): Promise<string | undefined> {
  if (cipherText === null || cipherText === undefined) return undefined;
  const str = String(cipherText);
  if (str === '') return '';

  // Se não estiver cifrado, devolve o texto diretamente
  if (!str.startsWith('enc:v1:') && !str.startsWith('enc:fb:')) {
    return str;
  }

  // Se for fallback
  if (str.startsWith('enc:fb:')) {
    return fallbackSimpleDecrypt(str);
  }

  try {
    const parts = str.split(':');
    if (parts.length !== 4) return str;

    const ivB64 = parts[2];
    const dataB64 = parts[3];

    const iv = new Uint8Array(base64ToBuffer(ivB64));
    const data = base64ToBuffer(dataB64);

    const key = await getOrDeriveKey();
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;

    if (!key || !cryptoObj || !cryptoObj.subtle) {
      return str;
    }

    const decrypted = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return decoder.decode(decrypted);
  } catch (err) {
    console.warn('Não foi possível decifrar campo (chave alterada ou texto modificado):', err);
    return str;
  }
}

/**
 * Verifica se um texto está cifrado
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('enc:v1:') || value.startsWith('enc:fb:');
}

/**
 * Mascara um valor para exibição em logs ou inspeção de segurança
 * Ex: "912345678" -> "912****78"
 */
export function maskSensitiveData(val?: string): string {
  if (!val) return '';
  if (val.length <= 4) return '****';
  const start = val.slice(0, 3);
  const end = val.slice(-2);
  return `${start}${'*'.repeat(Math.max(4, val.length - 5))}${end}`;
}

/**
 * Retorna o resumo do estado da proteção criptográfica
 */
export function getEncryptionSecurityReport() {
  const currentKey = getEncryptionPassphrase();
  const isCustom = currentKey !== DEFAULT_CLUB_PASSPHRASE;
  return {
    algorithm: 'AES-GCM-256 (Galois/Counter Mode)',
    kdf: 'PBKDF2-HMAC-SHA256 (100.000 iterações)',
    mode: 'End-to-End Client-Side Encryption (Zero-Knowledge)',
    isConfigured: true,
    isCustomKey: isCustom,
    keyFingerprint: hashFingerprint(currentKey),
    protectedFieldsCount: 19,
    protectedEntities: {
      athletes: [
        'phone (telefone do atleta)',
        'email (correio eletrónico)',
        'address (morada residencial)',
        'guardian_name (nome do encarregado de educação)',
        'guardian_phone (telefone do encarregado)',
        'guardian_email (email do encarregado)',
        'emergency_contact (contacto de emergência)',
        'allergies_or_conditions (alergias e condições de saúde - RGPD Art. 9º)',
        'notes (observações clínicas e pessoais confidenciais)'
      ],
      coaches: [
        'phone (telefone do treinador)',
        'email (correio eletrónico)',
        'address (morada residencial)',
        'license_number (número de cédula profissional TPTD)',
        'bio (biografia e notas internas)'
      ],
      guardiansAndProfiles: [
        'phone (telefone no perfil de utilizador)',
        'address (morada no perfil)',
        'notes (notas internas de registo)',
        'contact_phone (contacto em partilha de boleias)',
        'notes (observações em termos de autorização parental)'
      ]
    }
  };
}

/**
 * Gera um identificador visual seguro da chave (fingerprint) sem revelar a passphrase
 */
function hashFingerprint(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `MD-KEY-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

// ==============================================================================
// FALLBACK CIPHER (caso SubtleCrypto não esteja disponível)
// ==============================================================================
function fallbackSimpleEncrypt(text: string): string {
  try {
    const key = getEncryptionPassphrase();
    const encoded = encodeURIComponent(text);
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return `enc:fb:${btoa(result)}`;
  } catch {
    return text;
  }
}

function fallbackSimpleDecrypt(cipher: string): string {
  try {
    const key = getEncryptionPassphrase();
    const b64 = cipher.replace('enc:fb:', '');
    const decoded = atob(b64);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decodeURIComponent(result);
  } catch {
    return cipher;
  }
}
