// api/credits.js — AfroTresse
// Lecture du solde depuis Supabase (source de vérité)
// + Anti-abus : détecte les empreintes qui ont déjà consommé les crédits gratuits
// ─────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FREE_CREDITS = 2;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://afrotresse.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "sessionId requis" });

  // Détecter si c'est une empreinte FingerprintJS (préfixe "fp_")
  const isFingerprint = sessionId.startsWith("fp_");

  try {
    // Chercher la session existante
    const { data, error } = await supabase
      .from("sessions")
      .select("credits")
      .eq("session_id", sessionId)
      .single();

    if (error && error.code === "PGRST116") {
      // Session inconnue → vérifier si cette empreinte a déjà eu des crédits gratuits
      let creditsToGive = FREE_CREDITS;

      if (isFingerprint) {
        // Chercher une session précédente avec la même empreinte ayant déjà été utilisée
        const { data: existing } = await supabase
          .from("sessions")
          .select("credits, last_used")
          .eq("session_id", sessionId)
          .not("last_used", "is", null) // a déjà été utilisée
          .maybeSingle();

        if (existing) {
          // Empreinte connue et déjà utilisée → 0 crédit gratuit
          creditsToGive = 0;
        }
      }

      const { data: newRow, error: insertError } = await supabase
        .from("sessions")
        .insert({ session_id: sessionId, credits: creditsToGive })
        .select("credits")
        .single();

      if (insertError) throw insertError;
      return res.status(200).json({
        credits: newRow.credits,
        created: true,
        abusePrevented: creditsToGive === 0,
      });
    }

    if (error) throw error;

    return res.status(200).json({ credits: data.credits });
  } catch (err) {
    console.error("[/api/credits]", err.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}


  try {
    // Chercher la session existante
    const { data, error } = await supabase
      .from("sessions")
      .select("credits")
      .eq("session_id", sessionId)
      .single();

    if (error && error.code === "PGRST116") {
      // Session inconnue → créer avec crédits gratuits
      const { data: newRow, error: insertError } = await supabase
        .from("sessions")
        .insert({ session_id: sessionId, credits: FREE_CREDITS })
        .select("credits")
        .single();

      if (insertError) throw insertError;
      return res.status(200).json({ credits: newRow.credits, created: true });
    }

    if (error) throw error;

    return res.status(200).json({ credits: data.credits });
  } catch (err) {
    console.error("[/api/credits]", err.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
