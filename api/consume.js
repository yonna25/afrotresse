import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: true } };

const RATE_LIMIT = 30;
const WINDOW_MS  = 60 * 1000;
const rateMap    = new Map();

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FP_RE   = /^fp_[a-f0-9]{16,64}$/i;

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim()
           || req.socket?.remoteAddress || "unknown";

  if (!checkRateLimit(ip)) return res.status(429).json({ error: "Trop de requetes" });

  const { sessionId, userId } = req.body;

  const hasUser    = userId    && UUID_RE.test(userId);
  const hasSession = sessionId && FP_RE.test(sessionId);

  if (!hasUser && !hasSession) {
    return res.status(400).json({ error: "Identifiant invalide" });
  }

  const supabase = getSupabase();
  const field    = hasUser ? "user_id"    : "session_id";
  const value    = hasUser ? userId       : sessionId;

  try {
    const { data } = await supabase
      .from("usage_credits")
      .select("id, credits")
      .eq(field, value)
      .maybeSingle();

    if (!data || data.credits <= 0) {
      return res.status(403).json({ error: "Credits insuffisants" });
    }

    const next = data.credits - 1;

    await supabase.from("usage_credits")
      .update({ credits: next, updated_at: new Date().toISOString() })
      .eq("id", data.id);

    // Audit
    await supabase.from("credit_movements").insert([{
      user_id:       hasUser ? userId : null,
      fingerprint:   hasUser ? null   : sessionId,
      amount:        -1,
      type:          "consume",
      description:   "Analyse faciale",
      credits_given: -1,
    }]);

    console.log(`[consume] ${field}=${value} ${data.credits}→${next}`);
    return res.status(200).json({ credits: next });

  } catch (e) {
    console.error("[consume]", e.message);
    return res.status(500).json({ error: "Erreur interne" });
  }
}
