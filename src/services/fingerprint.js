// ─────────────────────────────────────────────────────────────────────────────
// fingerprint.js — AfroTresse
// Empreinte appareil via FingerprintJS (déjà installé)
// Utilisé pour lier le quota gratuit à l'appareil, pas au localStorage
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "afrotresse_fp";

/**
 * Retourne l'empreinte de l'appareil.
 * - Mise en cache dans localStorage pour éviter les appels répétés
 * - Fallback silencieux : retourne null si FingerprintJS échoue
 */
export async function getFingerprint() {
  try {
    const cached = localStorage.getItem(KEY);
    if (cached) return cached;

    const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const visitorId = result.visitorId;

    localStorage.setItem(KEY, visitorId);
    return visitorId;
  } catch {
    return null; // Ne bloque jamais l'UX
  }
}

/**
 * Efface le cache empreinte (ex : après un paiement pour forcer un refresh)
 */
export function clearFingerprintCache() {
  try { localStorage.removeItem(KEY); } catch {}
}

/**
 * Retourne un sessionId enrichi avec l'empreinte appareil, préfixé "fp_".
 * Format : fp_<visitorId>
 *
 * Utilisé comme identifiant stable côté API pour la détection anti-abus.
 * Fallback sur un id aléatoire si FingerprintJS échoue.
 *
 * @returns {Promise<string>}
 */
export async function getSessionIdWithFp() {
  const visitorId = await getFingerprint();
  if (visitorId) return `fp_${visitorId}`;

  // Fallback : id aléatoire non préfixé (ne sera pas bloqué, mais non lié à l'appareil)
  return `anon_${Math.random().toString(36).slice(2)}`;
}
