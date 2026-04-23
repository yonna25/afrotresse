// api/analyze.js — AfroTresse
// Reçoit le résultat MediaPipe côté client
// → vérifie les crédits, débite, met à jour last_used

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FACE_SHAPE_NAMES = {
  oval:    "Ovale",
  round:   "Ronde",
  square:  "Carrée",
  heart:   "Cœur",
  long:    "Allongée",
  diamond: "Diamant",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://afrotresse.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { faceShape, requestId, fingerprintId } = req.body;

  if (!faceShape || !requestId) {
    return res.status(400).json({ error: "faceShape et requestId requis" });
  }

  // ── Construire le sessionId stable à partir du fingerprint ──
  const sessionId = fingerprintId ? `fp_${fingerprintId}` : `anon_${requestId}`;

  try {
    const shape = FACE_SHAPE_NAMES[faceShape] ? faceShape : "oval";

    // ── Détecter si utilisatrice connectée (userId dans le body) ──
    const { userId } = req.body;

    if (userId) {
      // ── Utilisatrice connectée → table `credits` ────────────
      const { data: userCredits, error: ucError } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (ucError || !userCredits) {
        return res.status(403).json({ error: "Compte introuvable." });
      }

      if (userCredits.balance <= 0) {
        return res.status(402).json({ error: "Plus de crédits disponibles", creditsRemaining: 0 });
      }

      const { data: updatedUser, error: updateUserError } = await supabase
        .from("credits")
        .update({ balance: userCredits.balance - 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select("balance")
        .single();

      if (updateUserError) throw updateUserError;

      return res.status(200).json({
        faceShape:        shape,
        faceShapeName:    FACE_SHAPE_NAMES[shape],
        confidence:       95,
        creditsRemaining: updatedUser.balance,
      });
    }

    // ── Utilisatrice anonyme → table `sessions` ─────────────
    const { data: session, error } = await supabase
      .from("sessions")
      .select("credits, last_used")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) throw error;

    if (!session) {
      return res.status(403).json({ error: "Session non initialisée. Appelez /api/credits d'abord." });
    }

    if (session.credits <= 0) {
      return res.status(402).json({ error: "Plus de crédits disponibles", creditsRemaining: 0 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("sessions")
      .update({
        credits:   session.credits - 1,
        last_used: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .select("credits")
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      faceShape:        shape,
      faceShapeName:    FACE_SHAPE_NAMES[shape],
      confidence:       95,
      creditsRemaining: updated.credits,
    });

  } catch (err) {
    console.error("[/api/analyze]", err.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
