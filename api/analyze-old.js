// ============================================================
// /api/analyze.js — AfroTresse Protection System
// Protections actives :
//   ✅ Rate limit IP (15s entre deux appels)
//   ✅ faceShape whitelist
//   ✅ RequestId unique (anti double-consommation)
//   ✅ Session ID (anti-NAT partagé)
//   ✅ IP null bloquée
//   ✅ Supabase service_role + persistSession: false
//   ✅ Re-fetch après INSERT + UPDATE confirmé
// ============================================================

import { createClient } from "@supabase/supabase-js";

// ── Whitelist des formes valides ────────────────────────────
const VALID_SHAPES = [
  "oval",
  "round",
  "square",
  "heart",
  "long",
  "diamond",
  "oblong",
];

// ── Rate limit en mémoire (reset à chaque cold start Vercel)
// Pour prod sérieuse → remplacer par Upstash Redis
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 15_000; // 15 secondes entre deux appels par IP

// ── Helper : résolution IP ──────────────────────────────────
function resolveIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? null;
}

// ── Handler principal ───────────────────────────────────────
export default async function handler(req, res) {
  // 1. Méthode
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // 2. Variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[analyze] Variables d'environnement manquantes");
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  // 3. IP
  const ip = resolveIp(req);
  if (!ip) {
    return res.status(400).json({ error: "IP non identifiable" });
  }

  // 4. Rate limit IP
  const now = Date.now();
  const lastCall = rateLimitMap.get(ip);
  if (lastCall && now - lastCall < RATE_LIMIT_MS) {
    const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastCall)) / 1000);
    return res.status(429).json({
      error: `Trop de requêtes. Attendez ${remaining} seconde(s).`,
    });
  }
  rateLimitMap.set(ip, now);

  // 5. Body
  const { faceShape, requestId, sessionId } = req.body ?? {};

  // 6. Validation faceShape — non-null + whitelist
  if (!faceShape) {
    return res.status(400).json({ error: "faceShape manquant" });
  }
  if (!VALID_SHAPES.includes(faceShape.toLowerCase())) {
    return res.status(400).json({
      error: `faceShape invalide. Valeurs acceptées : ${VALID_SHAPES.join(", ")}`,
    });
  }

  // 7. Validation requestId
  if (!requestId || typeof requestId !== "string" || requestId.length < 10) {
    return res.status(400).json({ error: "requestId manquant ou invalide" });
  }

  // 8. Client Supabase service_role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 9. Idempotence — vérifier si requestId déjà traité
  const { data: existingRequest, error: checkError } = await supabase
    .from("used_request_ids")
    .select("id")
    .eq("id", requestId)
    .maybeSingle();

  if (checkError) {
    console.error("[analyze] Erreur vérification requestId :", checkError);
    return res.status(500).json({ error: "Erreur serveur (vérification requestId)" });
  }
  if (existingRequest) {
    return res.status(409).json({ error: "Requête déjà traitée" });
  }

  // 10. Enregistrer le requestId AVANT de décrémenter
  const { error: insertRequestError } = await supabase
    .from("used_request_ids")
    .insert([{ id: requestId, ip, created_at: new Date().toISOString() }]);

  if (insertRequestError) {
    console.error("[analyze] Erreur INSERT requestId :", insertRequestError);
    return res.status(500).json({ error: "Erreur serveur (enregistrement requestId)" });
  }

  // 11. Lire les crédits existants (par IP + sessionId si fourni)
  const query = supabase
    .from("anonymous_usage")
    .select("*")
    .eq("ip", ip);

  if (sessionId) query.eq("session_id", sessionId);

  const { data: usageData, error: usageError } = await query.maybeSingle();

  if (usageError) {
    console.error("[analyze] Erreur lecture crédits :", usageError);
    return res.status(500).json({ error: "Erreur lecture crédits" });
  }

  // 12. Créer l'entrée si elle n'existe pas encore
  if (!usageData) {
    const { error: insertError } = await supabase
      .from("anonymous_usage")
      .insert([
        {
          ip,
          session_id: sessionId ?? null,
          credits: 2, // crédits initiaux (à adapter)
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error("[analyze] Erreur INSERT usage :", insertError);
      return res.status(500).json({ error: "Erreur création compte crédits" });
    }

    // Re-fetch pour avoir les données réelles en base
    const { data: freshData } = await supabase
      .from("anonymous_usage")
      .select("*")
      .eq("ip", ip)
      .maybeSingle();

    if (!freshData || freshData.credits <= 0) {
      return res.status(403).json({ error: "Crédits insuffisants" });
    }

    return await processAndDecrement(res, supabase, freshData, faceShape, ip, sessionId);
  }

  // 13. Vérifier les crédits
  if (usageData.credits <= 0) {
    return res.status(403).json({ error: "Plus de crédits disponibles" });
  }

  return await processAndDecrement(res, supabase, usageData, faceShape, ip, sessionId);
}

// ── Décrémentation + réponse ────────────────────────────────
async function processAndDecrement(res, supabase, usageData, faceShape, ip, sessionId) {
  const newCredits = usageData.credits - 1;

  const updateQuery = supabase
    .from("anonymous_usage")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq("ip", ip);

  if (sessionId) updateQuery.eq("session_id", sessionId);

  const { data: updatedRows, error: updateError } = await updateQuery.select();

  if (updateError || !updatedRows?.length) {
    console.error("[analyze] Erreur UPDATE crédits :", updateError);
    return res.status(500).json({ error: "Erreur mise à jour crédits" });
  }

  // ── Ici : insérer ta logique d'analyse (appel Claude, reco coiffures, etc.)
  const analysisResult = {
    faceShape: faceShape.toLowerCase(),
    recommendations: getRecommendations(faceShape.toLowerCase()),
    creditsRemaining: newCredits,
  };

  return res.status(200).json(analysisResult);
}

// ── Placeholder recommandations ─────────────────────────────
function getRecommendations(shape) {
  const map = {
    oval: ["Box braids", "Cornrows", "Twists"],
    round: ["High puff", "Updo", "Long box braids"],
    square: ["Loose twist out", "Afro", "Bantu knots"],
    heart: ["Low bun", "Side braids", "Wash and go"],
    long: ["Full afro", "Side swept braids", "Puff ponytail"],
    diamond: ["Side parts", "Full braids", "Crown twists"],
    oblong: ["Volume styles", "Short TWA", "Fluffy puff"],
  };
  return map[shape] ?? [];
}
