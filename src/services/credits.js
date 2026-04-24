import { supabase } from "./supabase.js";
import { getCurrentUser, getSupabaseCredits } from "./useSupabaseCredits.js";

export const PRICING = {
  referral: { sender: 2, receiver: 2 }
};

// ── CRÉDITS ──

export const getCredits = () => {
  return parseInt(localStorage.getItem("afrotresse_credits") || "0", 10);
};

export const hasCredits = () => {
  return getCredits() > 0;
};

export const consumeCredits = async () => {
  return await useCredit();
};

export const setCredits = async (amount) => {
  try {
    const user = await getCurrentUser();
    const newTotal = parseInt(amount, 10);
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newTotal })
        .eq('id', user.id);
      if (error) throw error;
    }
    localStorage.setItem("afrotresse_credits", newTotal.toString());
    return newTotal;
  } catch (err) {
    console.error("Erreur setCredits:", err);
    localStorage.setItem("afrotresse_credits", amount.toString());
    return amount;
  }
};

export const syncCreditsFromServer = async () => {
  try {
    const user = await getCurrentUser();
    if (user) {
      const dbCredits = await getSupabaseCredits(user.id);
      localStorage.setItem("afrotresse_credits", dbCredits.toString());
      return dbCredits;
    }
    return getCredits();
  } catch (err) {
    console.error("Erreur syncCredits:", err);
    return getCredits();
  }
};

export const useCredit = async () => {
  try {
    const user = await getCurrentUser();
    const currentCredits = getCredits();
    if (currentCredits <= 0) return false;
    const newTotal = currentCredits - 1;
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newTotal })
        .eq('id', user.id);
      if (error) throw error;
    }
    localStorage.setItem("afrotresse_credits", newTotal.toString());
    return true;
  } catch (err) {
    console.error("Erreur useCredit:", err);
    return false;
  }
};

export const addCredits = async (amount) => {
  try {
    const user = await getCurrentUser();
    const currentCredits = getCredits();
    const newTotal = currentCredits + amount;
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newTotal })
        .eq('id', user.id);
      if (error) throw error;
    }
    localStorage.setItem("afrotresse_credits", newTotal.toString());
    return newTotal;
  } catch (err) {
    console.error("Erreur addCredits:", err);
    return getCredits();
  }
};

// ── FAVORIS (Requis par Library.jsx) ──

export const getSavedStyles = () => {
  try {
    return JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]");
  } catch (e) {
    return [];
  }
};

export const unsaveStyle = (styleId) => {
  try {
    const styles = getSavedStyles();
    const filtered = styles.filter(s => s.id !== styleId);
    localStorage.setItem("afrotresse_saved_styles", JSON.stringify(filtered));
    return true;
  } catch (e) {
    return false;
  }
};
