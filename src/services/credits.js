import { supabase } from "./supabase.js";
import { getCurrentUser } from "./useSupabaseCredits.js";

export const PRICING = {
  referral: { sender: 2, receiver: 2 }
};

// Récupérer les crédits (Lecture autoritaire du localStorage pour l'UI)
export const getCredits = () => {
  return parseInt(localStorage.getItem("afrotresse_credits") || "0", 10);
};

// Soustraire un crédit avec synchronisation base de données
export const useCredit = async () => {
  try {
    const user = await getCurrentUser();
    const currentCredits = getCredits();

    if (currentCredits <= 0) return false;

    const newTotal = currentCredits - 1;

    if (user) {
      // Ajustement technique : Mise à jour de la table profiles
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newTotal })
        .eq('id', user.id);
      
      if (error) throw error;
    }

    // Mise à jour du stockage local pour refléter le changement
    localStorage.setItem("afrotresse_credits", newTotal.toString());
    return true;
  } catch (err) {
    console.error("Erreur useCredit:", err);
    return false;
  }
};

// Ajouter des crédits avec synchronisation base de données
export const addCredits = async (amount) => {
  try {
    const user = await getCurrentUser();
    const currentCredits = getCredits();
    const newTotal = currentCredits + amount;

    if (user) {
      // Ajustement technique : Mise à jour de la table profiles
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
