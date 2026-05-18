import { supabase } from "./supabase.js";

const KEY = "afrotresse_credits";

export const getCredits = () => parseInt(localStorage.getItem(KEY) || "0", 10);
export const setCredits = (n) => localStorage.setItem(KEY, String(parseInt(n, 10)));
export const hasCredits = () => getCredits() > 0;

// ── Identifiant courant — TOUJOURS via supabase.auth.getSession() ──────────
// Ne jamais lire la clé localStorage de Supabase directement :
// le project ref peut changer et la clé devient fausse.
async function getCurrentIdentifier() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return { userId: session.user.id, sessionId: null };
    }
  } catch {}

  // Utiliser getSessionIdWithFp() — async, jamais null, jamais guest_user
  try {
    const { getSessionIdWithFp } = await import('./fingerprint.js');
    const sessionId = await getSessionIdWithFp();
    return { userId: null, sessionId };
  } catch {}

  return { userId: null, sessionId: null };
}

// ── Consommer 1 crédit ────────────────────────────────────────────────────
export const useCredit = async () => {
  const current = getCredits();
  if (current <= 0) return false;

  const { userId, sessionId } = await getCurrentIdentifier();

  try {
    const res = await fetch("/api/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });

    if (!res.ok) {
      console.error("[useCredit] serveur refusé:", res.status);
      return false;
    }

    const json = await res.json();
    if (json.credits != null) {
      setCredits(json.credits);
    } else {
      setCredits(current - 1);
    }
    return true;

  } catch (e) {
    console.error("[useCredit]", e);
    setCredits(current - 1); // fallback local
    return true;
  }
};

// ── Synchroniser depuis Supabase (source de vérité) ──────────────────────
// À appeler après paiement ou au chargement du profil.
// NE PAS appeler addCredits() côté frontend après un paiement —
// le webhook est la seule source qui ajoute des crédits dans Supabase.
export const syncCreditsFromServer = async () => {
  try {
    const { userId, sessionId } = await getCurrentIdentifier();

    const res = await fetch("/api/get-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });

    const json = await res.json();
    if (json.credits != null) {
      setCredits(json.credits);
      console.log("[syncCredits]", userId || sessionId, "→", json.credits);
      return json.credits;
    }
  } catch (e) {
    console.error("[syncCredits]", e);
  }
  return null;
};

// ── addCredits — usage interne uniquement (bonus, parrainage) ─────────────
// NE PAS appeler cette fonction après un paiement FedaPay.
// Le webhook fedapay-webhook.js est la seule source qui crédite après paiement.
// Cette fonction ne sert qu'aux crédits offerts (parrainage, bonus).
export const addCredits = async (amount) => {
  try {
    const { userId, sessionId } = await getCurrentIdentifier();

    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId, amount }),
    });

    const json = await res.json();
    if (json.credits != null) {
      setCredits(json.credits);
      return json.credits;
    }
  } catch (e) {
    console.error("[addCredits]", e);
  }
  return null;
};

export const consumeCredits = async () => useCredit();

export const getSavedStyles = () => {
  try { return JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]"); }
  catch { return []; }
};

export const unsaveStyle = (styleId) => {
  try {
    const filtered = getSavedStyles().filter(s => s.id !== styleId);
    localStorage.setItem("afrotresse_saved_styles", JSON.stringify(filtered));
    return true;
  } catch { return false; }
};

export const PRICING = { referral: { sender: 2, receiver: 2 } };
