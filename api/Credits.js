import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: true } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FP_RE   = /^fp_[a-f0-9]{16,64}$/i;

// Plafond sécurité pour les bonus
const MAX_BONUS_PER_CALL = 10;

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ── POST /api/credits — ajouter des crédits bonus (parrainage, offerts) ──
async function handlePost(req, res) {
  const { userId, sessionId, amount } = req.body;

  if (!amount || typeof amount !== "number" || amount <= 0 || amount > MAX_BONUS_PER_CALL) {
    return res.status(400).json({ error: "Montant invalide" });
  }

  const hasUser    = userId    && UUID_RE.test(userId);
  const hasSession = sessionId && FP_RE.test(sessionId);

  if (!hasUser && !hasSession) {
    return res.status(400).json({ error: "Identifiant invalide" });
  }

  const supabase = getSupabase();

  try {
    const field = hasUser ? "user_id" : "session_id";
    const value = hasUser ? userId : sessionId;

    const { data } = await supabase
      .from("usage_credits")
      .select("id, credits")
      .eq(field, value)
      .maybeSingle();

    if (data) {
      const next = data.credits + amount;
      await supabase.from("usage_credits")
        .update({ credits: next, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      console.log(`[credits POST] ${field}=${value} +${amount} → ${next}`);
      return res.status(200).json({ credits: next });
    } else {
      const insert = hasUser
        ? { user_id: userId, credits: amount }
        : { session_id: sessionId, credits: amount };
      await supabase.from("usage_credits").insert([insert]);
      console.log(`[credits POST] ${field}=${value} nouveau +${amount}`);
      return res.status(200).json({ credits: amount });
    }
  } catch (e) {
    console.error("[credits POST]", e.message);
    return res.status(500).json({ error: "Erreur interne" });
  }
}

// ── GET /api/credits — lecture du solde (rétrocompatibilité) ─────────────
async function handleGet(req, res) {
  const userId    = req.headers["x-user-id"]    || null;
  const sessionId = req.headers["x-session-id"] || null;

  const hasUser    = userId    && UUID_RE.test(userId);
  const hasSession = sessionId && FP_RE.test(sessionId);

  if (!hasUser && !hasSession) {
    return res.status(200).json({ credits: 0, blocked: true, reason: "missing_identifier" });
  }

  const supabase = getSupabase();

  try {
    const field = hasUser ? "user_id" : "session_id";
    const value = hasUser ? userId : sessionId;

    const { data } = await supabase
      .from("usage_credits")
      .select("credits")
      .eq(field, value)
      .maybeSingle();

    return res.status(200).json({ credits: data?.credits ?? 0, blocked: false });
  } catch (e) {
    console.error("[credits GET]", e.message);
    return res.status(500).json({ error: "Erreur interne" });
  }
}

export default async function handler(req, res) {
  if (req.method === "POST") return handlePost(req, res);
  if (req.method === "GET")  return handleGet(req, res);
  return res.status(405).end();
}
