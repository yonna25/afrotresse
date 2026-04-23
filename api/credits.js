// api/credits.js
// Compatible Next.js API Routes (pages/api) et Express.
// Adaptez req/res à votre framework si nécessaire.

import { createClient } from '@supabase/supabase-js'; // ou votre ORM

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** Nombre de crédits offerts à un nouvel appareil */
const FREE_CREDITS = parseInt(process.env.FREE_CREDITS_AMOUNT ?? '3', 10);

/**
 * Extrait le fingerprint (visitorId) depuis un sessionId enrichi.
 *
 * sessionId format : fp_<visitorId>_<timestamp>_<random>
 * Retourne null si le format est invalide ou absent.
 *
 * @param {string | null} sessionId
 * @returns {string | null}
 */
function extractFingerprint(sessionId) {
  if (!sessionId || !sessionId.startsWith('fp_')) return null;

  // On garde uniquement la partie "fp_<visitorId>"  (16 chars hex après fp_)
  const match = sessionId.match(/^(fp_[a-f0-9]{16})/i);
  return match ? match[1] : null;
}

/**
 * Vérifie si un fingerprint a déjà consommé les crédits gratuits.
 *
 * @param {string} fingerprint  — ex: "fp_8a3f2c91b7d04e6a"
 * @returns {Promise<boolean>}
 */
async function fingerprintAlreadyUsedFreeCredits(fingerprint) {
  const { data, error } = await supabase
    .from('fingerprint_usage')
    .select('fingerprint')
    .eq('fingerprint', fingerprint)
    .maybeSingle();

  if (error) {
    console.error('[credits] Supabase lookup error:', error.message);
    // En cas d'erreur DB → on bloque par sécurité (fail-closed)
    return true;
  }

  return data !== null;
}

/**
 * Marque un fingerprint comme ayant utilisé ses crédits gratuits.
 *
 * @param {string} fingerprint
 * @param {string} sessionId    — sessionId complet pour audit
 */
async function markFingerprintAsUsed(fingerprint, sessionId) {
  const { error } = await supabase.from('fingerprint_usage').upsert(
    {
      fingerprint,
      session: sessionId,
    },
    { onConflict: 'fingerprint' }
  );

  if (error) {
    console.error('[credits] Failed to mark fingerprint as used:', error.message);
  }
}

/**
 * GET /api/credits
 *
 * Headers requis :
 *   x-session-id : sessionId enrichi (fp_<visitorId>_<ts>_<rand>)
 *
 * Réponse :
 *   { credits: number, fingerprint: string | null, blocked: boolean }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = req.headers['x-session-id'] ?? null;
  const fingerprint = extractFingerprint(sessionId);

  // ── Pas de fingerprint valide → 0 crédit, accès refusé ──────────────
  if (!fingerprint) {
    return res.status(200).json({
      credits: 0,
      fingerprint: null,
      blocked: true,
      reason: 'missing_or_invalid_fingerprint',
    });
  }

  // ── Crédits achetés dans anonymous_usage (prioritaire) ──────────────
  const { data: usage } = await supabase
    .from('anonymous_usage')
    .select('credits')
    .eq('fingerprint_id', fingerprint)
    .maybeSingle();

  if (usage && usage["credits"] > 0) {
    return res.status(200).json({
      credits: usage["credits"],
      fingerprint,
      blocked: false,
    });
  }

  // ── Empreinte connue ayant déjà utilisé les crédits gratuits ─────────
  const alreadyUsed = await fingerprintAlreadyUsedFreeCredits(fingerprint);

  if (alreadyUsed) {
    return res.status(200).json({
      credits: 0,
      fingerprint,
      blocked: true,
      reason: 'free_credits_already_used',
    });
  }

  // ── Nouveau appareil → crédits offerts ───────────────────────────────
  // Marquer le fingerprint comme ayant reçu ses crédits gratuits
  await markFingerprintAsUsed(fingerprint, sessionId);

  // Enregistrer le solde dans anonymous_usage pour les syncs suivants
  await supabase.from('anonymous_usage').upsert(
    { fingerprint_id: fingerprint, credits: FREE_CREDITS },
    { onConflict: 'fingerprint_id' }
  );

  return res.status(200).json({
    credits: FREE_CREDITS,
    fingerprint,
    blocked: false,
  });
}

// ── Export utilitaires pour les autres routes (ex: POST /api/generate) ──
export { extractFingerprint, fingerprintAlreadyUsedFreeCredits, markFingerprintAsUsed };
