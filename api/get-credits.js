import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: true } };

// ── Rate limit : 20 requêtes / 10 minutes par IP ─────────────────────
const RATE_LIMIT  = 20;
const WINDOW_MS   = 10 * 60 * 1000;
const rateMap     = new Map();

function checkRateLimit(ip) {
  const now  = Date.now();
  const data = rateMap.get(ip) || { count: 0, start: now };
  if (now - data.start > WINDOW_MS) {
    rateMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (data.count >= RATE_LIMIT) return false;
  data.count++;
  rateMap.set(ip, data);
  return true;
}

// ── Validation format ─────────────────────────────────────────────────
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FP_RE    = /^fp_[a-f0-9]{16,64}$/i;

function isValidIdentifier(value) {
  if (!value || typeof value !== "string") return false;
  return UUID_RE.test(value) || FP_RE.test(value);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim()
           || req.socket?.remoteAddress
           || "unknown";

  if (!checkRateLimit(ip)) {
    console.warn("[get-credits] rate limit atteint pour", ip);
    return res.status(429).json({ error: "Trop de requêtes" });
  }

  const { sessionId, userId } = req.body;

  // Validation stricte des identifiants
  if (!isValidIdentifier(sessionId) && !isValidIdentifier(userId)) {
    console.warn("[get-credits] identifiant invalide:", { sessionId, userId });
    return res.status(400).json({ error: "Identifiant invalide" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // CAS 1 : utilisatrice connectée (UUID)
    if (userId && UUID_RE.test(userId)) {
      const { data } = await supabase
        .from("usage_credits")
        .select("credits")
        .eq("user_id", userId)
        .maybeSingle();

      console.log(`[get-credits] user ${userId} → ${data?.credits ?? 0} credits`);
      return res.status(200).json({ credits: data?.credits ?? 0 });
    }

    // CAS 2 : anonyme (fp_XXXXX)
    if (sessionId && FP_RE.test(sessionId)) {
      const { data } = await supabase
        .from("usage_credits")
        .select("credits")
        .eq("session_id", sessionId)
        .maybeSingle();

      console.log(`[get-credits] session ${sessionId} → ${data?.credits ?? 0} credits`);
      return res.status(200).json({ credits: data?.credits ?? 0 });
    }

    return res.status(400).json({ error: "Format non reconnu" });

  } catch (e) {
    console.error("[get-credits] erreur:", e.message);
    return res.status(500).json({ error: "Erreur interne" });
  }
      }
