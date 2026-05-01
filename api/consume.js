// api/consume.js — AfroTresse
// Consommation d'un crédit validée côté serveur
// Gère deux cas :
//   - Utilisatrice connectée  → table `credits`  (user_id / balance)
//   - Utilisatrice anonyme    → table `sessions` (session_id / credits)
// ─────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://afrotresse.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId, userId, amount = 1 } = req.body || {};

  if (!sessionId && !userId) {
    return res.status(400).json({ error: "sessionId ou userId requis" });
  }

  try {

    // ── Utilisatrice connectée → table `credits` ─────────────
    if (userId) {
      const { data, error } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (data.balance < amount) {
        return res.status(402).json({ error: "Crédits insuffisants", credits: data.balance });
      }

      const newBalance = data.balance - amount;
      const { error: updateError } = await supabase
        .from("credits")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      return res.status(200).json({ success: true, credits: newBalance });
    }

    // ── Utilisatrice anonyme → table `sessions` ──────────────
    const { data, error } = await supabase
      .from("sessions")
      .select("credits")
      .eq("session_id", sessionId)
      .single();

    if (error) throw error;

    if (data.credits < amount) {
      return res.status(402).json({ error: "Crédits insuffisants", credits: data.credits });
    }

    const newBalance = data.credits - amount;
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ credits: newBalance, last_used: new Date().toISOString() })
      .eq("session_id", sessionId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, credits: newBalance });

  } catch (err) {
    console.error("[/api/consume]", err.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
