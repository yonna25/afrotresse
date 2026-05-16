import { supabase } from "./supabase.js";

const KEY = "afrotresse_credits";

export const getCredits = () => parseInt(localStorage.getItem(KEY) || "0", 10);

export const setCredits = (amount) => {
  localStorage.setItem(KEY, String(parseInt(amount, 10)));
};

export const hasCredits = () => getCredits() > 0;

// ── Récupère l'identifiant courant (userId ou sessionId) ──────────────
function getCurrentIdentifier() {
  // Utilisatrice connectée
  const supabaseAuth = localStorage.getItem('sb-fowatshrtuzyyqsvvpxu-auth-token');
  if (supabaseAuth) {
    try {
      const userId = JSON.parse(supabaseAuth)?.user?.id;
      if (userId) return { userId, sessionId: null };
    } catch {}
  }
  // Anonyme — clé unifiée afrotresse_fp (fingerprint.js)
  const fp = localStorage.getItem("afrotresse_fp");
  if (fp) return { userId: null, sessionId: `fp_${fp}` };
  return { userId: null, sessionId: null };
}

export const useCredit = async () => {
  const current = getCredits();
  if (current <= 0) return false;

  const { userId, sessionId } = getCurrentIdentifier();

  try {
    const res = await fetch("/api/consume-credit", {
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
      localStorage.setItem(KEY, String(json.credits));
    } else {
      localStorage.setItem(KEY, String(current - 1));
    }
    return true;

  } catch (e) {
    console.error("[useCredit]", e);
    // Fallback local si API indisponible
    localStorage.setItem(KEY, String(current - 1));
    return true;
  }
};

export const addCredits = async (amount) => {
  const next = getCredits() + amount;
  localStorage.setItem(KEY, String(next));
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("usage_credits")
        .select("credits").eq("user_id", user.id).single();
      if (data) {
        await supabase.from("usage_credits")
          .update({ credits: data.credits + amount, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase.from("usage_credits")
          .insert({ user_id: user.id, email: user.email, credits: amount });
      }
    }
  } catch (e) { console.error("addCredits:", e); }
  return next;
};

export const syncCreditsFromServer = async () => {
  try {
    const { userId, sessionId } = getCurrentIdentifier();

    const res = await fetch("/api/get-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });

    const json = await res.json();
    if (json.credits != null) {
      localStorage.setItem(KEY, String(json.credits));
      console.log("[syncCredits] sessionId:", sessionId || userId, "→", json.credits);
      return json.credits;
    }

  } catch (e) { console.error("syncCredits:", e); }
  return null;
};

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

export const consumeCredits = async () => useCredit();

export const PRICING = { referral: { sender: 2, receiver: 2 } };
