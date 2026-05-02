// src/services/credits.js
// Synchronisation cr\u00e9dits — \u00e9crit dans usage_credits (plus profiles)

import { supabase } from "../supabaseClient";

const CREDITS_KEY = "afrotresse_credits";

// SYNCHRONE — ne pas awaiter
export function setCredits(amount) {
  localStorage.setItem(CREDITS_KEY, String(amount));
}

export function getCredits() {
  const val = localStorage.getItem(CREDITS_KEY);
  return val !== null ? parseInt(val, 10) : 0;
}

// ASYNC — toujours awaiter
export async function useCredit() {
  const current = getCredits();
  const newVal = Math.max(0, current - 1);
  setCredits(newVal);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return newVal;

    const { data } = await supabase
      .from("usage_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (data) {
      await supabase
        .from("usage_credits")
        .update({ credits: Math.max(0, data.credits - 1), updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
  } catch (e) {
    console.error("useCredit sync error:", e);
  }

  return newVal;
}

// ASYNC — toujours awaiter
export async function addCredits(amount) {
  const current = getCredits();
  const newVal = current + amount;
  setCredits(newVal);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return newVal;

    const { data } = await supabase
      .from("usage_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (data) {
      await supabase
        .from("usage_credits")
        .update({ credits: data.credits + amount, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("usage_credits")
        .insert({ user_id: user.id, email: user.email, credits: amount, updated_at: new Date().toISOString() });
    }
  } catch (e) {
    console.error("addCredits sync error:", e);
  }

  return newVal;
}

// ASYNC — lit depuis usage_credits et \u00e9crit en localStorage
export async function syncCreditsFromServer() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("usage_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (data && typeof data.credits === "number") {
      setCredits(data.credits);
      return data.credits;
    }
  } catch (e) {
    console.error("syncCreditsFromServer error:", e);
  }
  return null;
}
