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

// Écrit le solde en local ET dans usage_credits (source de vérité)
export const setCredits = (amount) => {
  const newTotal = parseInt(amount, 10);
  localStorage.setItem("afrotresse_credits", newTotal.toString());
  return newTotal;
};

// Sync depuis usage_credits → localStorage
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

// Déduit 1 crédit en local ET dans usage_credits
export const useCredit = async () => {
  try {
    const currentCredits = getCredits();
    if (currentCredits <= 0) return false;

    const newTotal = currentCredits - 1;

    // Mise à jour locale immédiate
    localStorage.setItem("afrotresse_credits", newTotal.toString());

    // Mise à jour Supabase usage_credits en arrière-plan
    const user = await getCurrentUser();
    if (user) {
      await supabase
        .from('usage_credits')
        .update({ credits: newTotal })
        .eq('user_id', user.id);
    }

    return true;
  } catch (err) {
    console.error("Erreur useCredit:", err);
    return false;
  }
};

// Ajoute des crédits en local ET dans usage_credits
export const addCredits = async (amount) => {
  try {
    const currentCredits = getCredits();
    const newTotal = currentCredits + amount;

    localStorage.setItem("afrotresse_credits", newTotal.toString());

    const user = await getCurrentUser();
    if (user) {
      await supabase
        .from('usage_credits')
        .update({ credits: newTotal })
        .eq('user_id', user.id);
    }

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
