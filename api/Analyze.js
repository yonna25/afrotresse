// ============================================================
// /api/analyze.js — AfroTresse Protection System
// Protections actives :
//   \u2705 Rate limit IP (15s entre deux appels)
//   \u2705 faceShape whitelist
//   \u2705 RequestId unique (anti double-consommation)
//   \u2705 Session ID (anti-NAT partag\u00e9)
//   \u2705 IP null bloqu\u00e9e
//   \u2705 Supabase service_role + persistSession: false
//   \u2705 Re-fetch apr\u00e8s INSERT + UPDATE confirm\u00e9
// ============================================================

import { createClient } from "@supabase/supabase-js";

// \u2500\u2500 Whitelist des formes valides \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const VALID_SHAPES = [
  "oval",
  "round",
  "square",
  "heart",
  "long",
  "diamond",
  "oblong",
];

// \u2500\u2500 Rate limit en m\u00e9moire (reset \u00e0 chaque cold start Vercel)
// Pour prod s\u00e9rieuse \u2192 remplacer par Upstash Redis
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 15_000; // 15 secondes entre deux appels par IP

// \u2500\u2500 Helper : r\u00e9solution IP \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function resolveIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? null;
}

// \u2500\u2500 Handler principal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export default async function handler(req, res) {
  // 1. M\u00e9thode
  if (req.method !== "POST") {
    return res.status(405).json({ error: "M\u00e9thode non autoris\u00e9e" });
  }

  // 2. Variables d\u2019environnement
  // FIX : noms corrects d\u00e9finis dans Vercel (SUPABASE_URL + SUPABASE_SERVICE_KEY)
  const supabaseUrl    = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[analyze] Variables d\u2019environnement manquantes");
    return res.status(500).json({ error: "Configuration serveur incompl\u00e8te" });
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
      error: `Trop de requ\u00eates. Attendez ${remaining} seconde(s).`,
    });
  }
  rateLimitMap.set(ip, now);

  // 5. Body
  const { faceShape, requestId, sessionId } = req.body ?? {};

  // 6. Validation faceShape \u2014 non-null + whitelist
  if (!faceShape) {
    return res.status(400).json({ error: "faceShape manquant" });
  }
  if (!VALID_SHAPES.includes(faceShape.toLowerCase())) {
    return res.status(400).json({
      error: `faceShape invalide. Valeurs accept\u00e9es : ${VALID_SHAPES.join(", ")}`,
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

  // 9. Idempotence \u2014 v\u00e9rifier si requestId d\u00e9j\u00e0 trait\u00e9
  const { data: existingRequest, error: checkError } = await supabase
    .from("used_request_ids")
    .select("id")
    .eq("id", requestId)
    .maybeSingle();

  if (checkError) {
    console.error("[analyze] Erreur v\u00e9rification requestId :", checkError);
    return res.status(500).json({ error: "Erreur serveur (v\u00e9rification requestId)" });
  }
  if (existingRequest) {
    return res.status(409).json({ error: "Requ\u00eate d\u00e9j\u00e0 trait\u00e9e" });
  }

  // 10. Enregistrer le requestId AVANT de d\u00e9cr\u00e9menter
  const { error: insertRequestError } = await supabase
    .from("used_request_ids")
    .insert([{ id: requestId, ip, created_at: new Date().toISOString() }]);

  if (insertRequestError) {
    console.error("[analyze] Erreur INSERT requestId :", insertRequestError);
    return res.status(500).json({ error: "Erreur serveur (enregistrement requestId)" });
  }

  // 11. Lire les cr\u00e9dits existants (par IP + sessionId si fourni)
  // FIX : utiliser let + r\u00e9assignation pour que .eq() soit bien appliqu\u00e9
  let query = supabase
    .from("anonymous_usage")
    .select("*")
    .eq("ip", ip);

  if (sessionId) query = query.eq("session_id", sessionId);

  const { data: usageData, error: usageError } = await query.maybeSingle();

  if (usageError) {
    console.error("[analyze] Erreur lecture cr\u00e9dits :", usageError);
    return res.status(500).json({ error: "Erreur lecture cr\u00e9dits" });
  }

  // 12. Cr\u00e9er l\u2019entr\u00e9e si elle n\u2019existe pas encore
  if (!usageData) {
    const { error: insertError } = await supabase
      .from("anonymous_usage")
      .insert([
        {
          ip,
          session_id: sessionId ?? null,
          credits: 2,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error("[analyze] Erreur INSERT usage :", insertError);
      return res.status(500).json({ error: "Erreur cr\u00e9ation compte cr\u00e9dits" });
    }

    // Re-fetch pour avoir les donn\u00e9es r\u00e9elles en base
    const { data: freshData } = await supabase
      .from("anonymous_usage")
      .select("*")
      .eq("ip", ip)
      .maybeSingle();

    if (!freshData || freshData.credits <= 0) {
      return res.status(403).json({ error: "Cr\u00e9dits insuffisants" });
    }

    return await processAndDecrement(res, supabase, freshData, faceShape, ip, sessionId);
  }

  // 13. V\u00e9rifier les cr\u00e9dits
  if (usageData.credits <= 0) {
    return res.status(403).json({ error: "Plus de cr\u00e9dits disponibles" });
  }

  return await processAndDecrement(res, supabase, usageData, faceShape, ip, sessionId);
}

// \u2500\u2500 D\u00e9cr\u00e9mentation + r\u00e9ponse \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function processAndDecrement(res, supabase, usageData, faceShape, ip, sessionId) {
  const newCredits = usageData.credits - 1;

  // FIX : utiliser let + r\u00e9assignation pour que .eq() soit bien appliqu\u00e9
  let updateQuery = supabase
    .from("anonymous_usage")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq("ip", ip);

  if (sessionId) updateQuery = updateQuery.eq("session_id", sessionId);

  const { data: updatedRows, error: updateError } = await updateQuery.select();

  if (updateError || !updatedRows?.length) {
    console.error("[analyze] Erreur UPDATE cr\u00e9dits :", updateError);
    return res.status(500).json({ error: "Erreur mise \u00e0 jour cr\u00e9dits" });
  }

  // \u2500\u2500 Logique d\u2019analyse (appel Claude, reco coiffures, etc.)
  const analysisResult = {
    faceShape: faceShape.toLowerCase(),
    recommendations: getRecommendations(faceShape.toLowerCase()),
    creditsRemaining: newCredits,
  };

  return res.status(200).json(analysisResult);
}

// \u2500\u2500 Placeholder recommandations \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function getRecommendations(shape) {
  const map = {
    oval:    ["Box braids", "Cornrows", "Twists"],
    round:   ["High puff", "Updo", "Long box braids"],
    square:  ["Loose twist out", "Afro", "Bantu knots"],
    heart:   ["Low bun", "Side braids", "Wash and go"],
    long:    ["Full afro", "Side swept braids", "Puff ponytail"],
    diamond: ["Side parts", "Full braids", "Crown twists"],
    oblong:  ["Volume styles", "Short TWA", "Fluffy puff"],
  };
  return map[shape] ?? [];
                      }
    
