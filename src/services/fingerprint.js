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
    // Cache valide 30 jours
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
