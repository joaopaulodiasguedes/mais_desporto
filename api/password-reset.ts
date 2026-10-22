/**
 * Função serverless (Vercel) para recuperação de palavra-passe por email.
 *
 * POST /api/password-reset
 *   { action: 'request', email }        -> gera código de 6 dígitos, guarda o hash no Supabase e envia-o por email (Resend)
 *   { action: 'verify', email, code }   -> valida o código (15 min, máx. 5 tentativas) e invalida-o após uso
 *
 * Variáveis de ambiente (Vercel > Project > Settings > Environment Variables):
 *   RESEND_API_KEY            Chave API do Resend
 *   RESEND_FROM               Remetente verificado no Resend, ex: "Mais Desporto <noreply@oseudominio.pt>"
 *   SUPABASE_URL              URL do projeto Supabase (ou VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY Chave service_role do Supabase (nunca expor no frontend)
 *   CLUB_NAME                 (opcional) Nome do clube no email
 */
import { createClient } from '@supabase/supabase-js';
import { createHash, randomInt } from 'node:crypto';

const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const TOKENS_TABLE = 'password_reset_codes';

function hashCode(email: string, code: string): string {
  return createHash('sha256').update(`${email}:${code}`).digest('hex');
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}

async function sendResetEmail(to: string, name: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return { ok: false, error: 'Serviço de email não configurado (RESEND_API_KEY / RESEND_FROM).' };

  const clubName = process.env.CLUB_NAME || 'Mais Desporto';
  const safeName = escapeHtml(name || 'utilizador');
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px">${escapeHtml(clubName)} &middot; Recuperação de palavra-passe</h2>
      <p>Olá ${safeName},</p>
      <p>Recebemos um pedido para redefinir a sua palavra-passe. Utilize o código abaixo na aplicação:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#f1f5f9;padding:14px;text-align:center;border-radius:12px">${code}</p>
      <p>O código é válido durante ${CODE_TTL_MINUTES} minutos e só pode ser utilizado uma vez.</p>
      <p style="color:#64748b;font-size:12px">Se não pediu esta alteração, ignore este email. A sua palavra-passe mantém-se inalterada.</p>
    </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Código de recuperação de palavra-passe: ${code}`,
      html,
      text: `Olá ${name || ''},\n\nO seu código de recuperação de palavra-passe é: ${code}\nVálido durante ${CODE_TTL_MINUTES} minutos.\n\nSe não pediu esta alteração, ignore este email.`
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Erro Resend:', response.status, detail);
    return { ok: false, error: 'Não foi possível enviar o email. Tente novamente dentro de alguns minutos.' };
  }
  return { ok: true };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Método não permitido.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const action = body.action;
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Indique um endereço de email válido.' });
  }

  const db = getAdminClient();
  if (!db) {
    return res.status(500).json({ success: false, message: 'Servidor sem ligação à base de dados (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });
  }

  if (action === 'request') {
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('id, name, email')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    // Um erro de consulta (chave/URL errados, tabela inexistente) não pode passar por "conta não encontrada"
    if (profileError) {
      console.error('Erro ao consultar profiles:', profileError.code, profileError.message);
      return res.status(500).json({
        success: false,
        message: `Erro ao consultar a base de dados (${profileError.code || 'sem código'}: ${profileError.message}). Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Vercel.`
      });
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Não foi encontrada nenhuma conta associada a este endereço de correio eletrónico.' });
    }

    const { data: existing } = await db.from(TOKENS_TABLE).select('created_at').eq('email', email).maybeSingle();
    if (existing?.created_at && Date.now() - new Date(existing.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
      return res.status(429).json({ success: false, message: `Aguarde ${RESEND_COOLDOWN_SECONDS} segundos antes de pedir um novo código.` });
    }

    const code = randomInt(100000, 1000000).toString();
    const { error: saveError } = await db.from(TOKENS_TABLE).upsert({
      email,
      code_hash: hashCode(email, code),
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
      attempts: 0,
      created_at: new Date().toISOString()
    });
    if (saveError) {
      console.error('Erro ao guardar código:', saveError.message);
      return res.status(500).json({ success: false, message: 'Erro ao gerar o código de recuperação.' });
    }

    const sent = await sendResetEmail(email, profile.name, code);
    if (!sent.ok) {
      await db.from(TOKENS_TABLE).delete().eq('email', email);
      return res.status(502).json({ success: false, message: sent.error });
    }

    return res.status(200).json({ success: true, message: `Enviámos um código de segurança para ${email}.`, expiresInMinutes: CODE_TTL_MINUTES });
  }

  if (action === 'verify') {
    const code = String(body.code || '').trim();
    const { data: token } = await db.from(TOKENS_TABLE).select('*').eq('email', email).maybeSingle();

    if (!token) {
      return res.status(400).json({ success: false, message: 'Nenhum pedido de recuperação ativo para este email. Solicite um novo código.' });
    }
    if (Date.now() > new Date(token.expires_at).getTime()) {
      await db.from(TOKENS_TABLE).delete().eq('email', email);
      return res.status(400).json({ success: false, message: `O código expirou (validade de ${CODE_TTL_MINUTES} minutos). Solicite um novo código.` });
    }
    if ((token.attempts || 0) >= MAX_ATTEMPTS) {
      await db.from(TOKENS_TABLE).delete().eq('email', email);
      return res.status(400).json({ success: false, message: 'Demasiadas tentativas falhadas. Solicite um novo código.' });
    }
    if (token.code_hash !== hashCode(email, code)) {
      await db.from(TOKENS_TABLE).update({ attempts: (token.attempts || 0) + 1 }).eq('email', email);
      return res.status(400).json({ success: false, message: 'Código de segurança incorreto. Verifique o código de 6 dígitos recebido por email.' });
    }

    await db.from(TOKENS_TABLE).delete().eq('email', email);
    return res.status(200).json({ success: true, message: 'Código validado.' });
  }

  return res.status(400).json({ success: false, message: 'Ação inválida.' });
}
