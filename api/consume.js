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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim()
           || req.socket?.remoteAddress || "unknown";

  if (!checkRateLimit(ip)) return res.status(429).json({ error: "Trop de requêtes" });

  const { sessionId, userId } = req.body;

  if (!sessionId && !userId) {
    return res.status(400).json({ error: "Identifiant requis" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // CAS 1 : connectée (UUID)
    if (userId && UUID_RE.test(userId)) {
      const { data } = await supabase
        .from("usage_credits")
        .select("id, credits")
        .eq("user_id", userId)
        .maybeSingle();

      if (!data || data.credits <= 0) {
        return res.status(403).json({ error: "Crédits insuffisants" });
      }

      await supabase.from("usage_credits")
        .update({ credits: data.credits - 1, updated_at: new Date().toISOString() })
        .eq("id", data.id);

      console.log(`[consume] user=${userId} ${data.credits}→${data.credits - 1}`);
      return res.status(200).json({ credits: data.credits - 1 });
    }

    // CAS 2 : anonyme (fp_XXXXX)
    if (sessionId && FP_RE.test(sessionId)) {
      const { data } = await supabase
        .from("usage_credits")
        .select("id, credits")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (!data || data.credits <= 0) {
        return res.status(403).json({ error: "Crédits insuffisants" });
      }

      await supabase.from("usage_credits")
        .update({ credits: data.credits - 1, updated_at: new Date().toISOString() })
        .eq("id", data.id);

      console.log(`[consume] session=${sessionId} ${data.credits}→${data.credits - 1}`);
      return res.status(200).json({ credits: data.credits - 1 });
    }

    return res.status(400).json({ error: "Format invalide" });

  } catch (e) {
    console.error("[consume-credit]", e.message);
    return res.status(500).json({ error: "Erreur interne" });
  }
}
