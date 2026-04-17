import { createClient } from "@supabase/supabase-js";

const VALID_SHAPES = [
  "oval",
  "round",
  "square",
  "heart",
  "long",
  "diamond",
  "oblong",
];

const rateLimitMap = new Map();
const RATE_LIMIT_MS = 15_000;

// ✅ FIX IP
function resolveIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "0.0.0.0";
}

export default async function handler(req, res) {
  // ✅ FIX 405 + CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  const ip = resolveIp(req);

  const now = Date.now();
  const lastCall = rateLimitMap.get(ip);
  if (lastCall && now - lastCall < RATE_LIMIT_MS) {
    const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastCall)) / 1000);
    return res.status(429).json({
      error: `Trop de requêtes. Attendez ${remaining}s.`,
    });
  }
  rateLimitMap.set(ip, now);

  // ✅ FIX body parsing safe
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "JSON invalide" });
    }
  }

  const { faceShape, requestId, sessionId } = body || {};

  if (!faceShape || !VALID_SHAPES.includes(faceShape.toLowerCase())) {
    return res.status(400).json({ error: "faceShape invalide" });
  }

  if (!requestId || requestId.length < 10) {
    return res.status(400).json({ error: "requestId invalide" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Idempotence
  const { data: existing } = await supabase
    .from("used_request_ids")
    .select("id")
    .eq("id", requestId)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Requête déjà traitée" });
  }

  await supabase.from("used_request_ids").insert([{ id: requestId, ip }]);

  const { data: usage } = await supabase
    .from("anonymous_usage")
    .select("*")
    .eq("ip", ip)
    .maybeSingle();

  if (!usage) {
    await supabase.from("anonymous_usage").insert([
      { ip, credits: 2, session_id: sessionId ?? null },
    ]);
  }

  const { data: current } = await supabase
    .from("anonymous_usage")
    .select("*")
    .eq("ip", ip)
    .maybeSingle();

  if (!current || current.credits <= 0) {
    return res.status(403).json({ error: "Crédits insuffisants" });
  }

  const newCredits = current.credits - 1;

  await supabase
    .from("anonymous_usage")
    .update({ credits: newCredits })
    .eq("ip", ip);

  return res.status(200).json({
    faceShape: faceShape.toLowerCase(),
    confidence: 0.87,
    creditsRemaining: newCredits,
  });
}
