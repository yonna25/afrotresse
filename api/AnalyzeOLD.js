import { createClient } from "@supabase/supabase-js";

const VALID_SHAPES = ["oval", "round", "square", "heart", "long", "diamond", "oblong"];
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 15_000;

function resolveIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "0.0.0.0";
}

export default async function handler(req, res) {

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // ✅ Variables d'environnement — noms exacts Vercel
  const supabaseUrl    = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Env manquantes:", { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!serviceRoleKey });
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  // IP
  const ip = resolveIp(req);

  // Rate limit
  const now = Date.now();
  const lastCall = rateLimitMap.get(ip);
  if (lastCall && now - lastCall < RATE_LIMIT_MS) {
    const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastCall)) / 1000);
    return res.status(429).json({ error: `Trop de requêtes. Attendez ${remaining}s.` });
  }
  rateLimitMap.set(ip, now);

  // Body parsing
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: "JSON invalide" }); }
  }

  const { faceShape, requestId, fingerprintId } = body || {};

  // Validation faceShape
  if (!faceShape || !VALID_SHAPES.includes(faceShape.toLowerCase())) {
    return res.status(400).json({ error: "faceShape invalide" });
  }

  // Validation requestId
  if (!requestId || requestId.length < 10) {
    return res.status(400).json({ error: "requestId invalide" });
  }

  // Client Supabase
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Idempotence — requestId déjà traité ?
  const { data: existing } = await supabase
    .from("used_request_ids")
    .select("id")
    .eq("id", requestId)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Requête déjà traitée" });
  }

  await supabase
    .from("used_request_ids")
    .insert([{ id: requestId, ip }]);

  // ✅ Recherche par fingerprint en priorité, sinon par ip_address
  let existingData = null;
  let matchColumn  = "ip_address";
  let matchValue   = ip;

  if (fingerprintId) {
    const { data: fpData } = await supabase
      .from("anonymous_usage")
      .select("*")
      .eq("fingerprint_id", fingerprintId)
      .maybeSingle();
    if (fpData) {
      existingData = fpData;
      matchColumn  = "fingerprint_id";
      matchValue   = fingerprintId;
    }
  }

  if (!existingData) {
    const { data: ipData } = await supabase
      .from("anonymous_usage")
      .select("*")
      .eq("ip_address", ip)         // ✅ colonne correcte
      .maybeSingle();
    if (ipData) existingData = ipData;
  }

  // Nouvelle utilisatrice
  if (!existingData) {
    await supabase
      .from("anonymous_usage")
      .insert([{
        ip_address:     ip,           // ✅ colonne correcte
        fingerprint_id: fingerprintId ?? null,
        credits:        2,
      }]);

    const { data: fresh } = await supabase
      .from("anonymous_usage")
      .select("*")
      .eq("ip_address", ip)
      .maybeSingle();

    existingData = fresh;
    matchColumn  = "ip_address";
    matchValue   = ip;
  } else {
    // Enrichir avec fingerprint si manquant
    if (fingerprintId && !existingData.fingerprint_id) {
      await supabase
        .from("anonymous_usage")
        .update({ fingerprint_id: fingerprintId })
        .eq("ip_address", ip);
    }
  }

  // Vérifier crédits
  if (!existingData || existingData.credits <= 0) {
    return res.status(403).json({ error: "Crédits insuffisants" });
  }

  const newCredits = existingData.credits - 1;

  // UPDATE crédits
  const { data: updated, error: updateError } = await supabase
    .from("anonymous_usage")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq(matchColumn, matchValue)
    .select();

  if (updateError || !updated?.length) {
    return res.status(500).json({ error: "Erreur mise à jour crédits" });
  }

  return res.status(200).json({
    faceShape:        faceShape.toLowerCase(),
    faceShapeName:    faceShape.toLowerCase(),
    confidence:       95,
    creditsRemaining: newCredits,
  });
      }
