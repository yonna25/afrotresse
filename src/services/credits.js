import { supabase } from "./supabase.js";

const KEY = "afrotresse_credits";

export const getCredits = () => parseInt(localStorage.getItem(KEY) || "0", 10);

export const setCredits = (amount) => {
  localStorage.setItem(KEY, String(parseInt(amount, 10)));
};

export const hasCredits = () => getCredits() > 0;

export const useCredit = async () => {
  const current = getCredits();
  if (current <= 0) return false;
  const next = current - 1;
  localStorage.setItem(KEY, String(next));
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("usage_credits")
        .update({ credits: next, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
  } catch (e) { console.error("useCredit:", e); }
  return true;
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
    // CAS 1 : utilisatrice connectée
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const res = await fetch("/api/get-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (json.credits != null) {
        localStorage.setItem(KEY, String(json.credits));
        return json.credits;
      }
      return null;
    }

    // CAS 2 : anonyme
    const fp = localStorage.getItem("afrotresse_fingerprint");
    if (!fp) return null;

    const sessionId = fp.startsWith("fp_") ? fp : `fp_${fp}`;
    console.log("[syncCredits] anonyme sessionId:", sessionId);

    const res = await fetch("/api/get-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const json = await res.json();
    if (json.credits != null) {
      localStorage.setItem(KEY, String(json.credits));
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
