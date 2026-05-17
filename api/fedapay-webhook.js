import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const PACKS = {
  decouverte: { credits: 3,  amount: 300  },
  allie:      { credits: 10, amount: 900  },
  vip:        { credits: 50, amount: 2500 },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end",  () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // ── 1. Lire le body brut ─────────────────────────────────────────
  let event;
  try {
    const raw = await getRawBody(req);
    event = JSON.parse(raw.toString());
  } catch {
    console.error("[webhook] JSON invalide");
    return res.status(400).end();
  }

  // ── 2. Ignorer les events non pertinents ─────────────────────────
  const eventName = event.name || event.event || "";
  if (eventName !== "transaction.approved") {
    return res.status(200).json({ ignored: true });
  }

  // ── 3. Extraire la transaction ───────────────────────────────────
  const transaction = event.entity || event;
  const transId     = String(transaction.id);

  // ── 4. Lire les métadonnées ──────────────────────────────────────
  let meta = {};
  if (transaction.custom_metadata) {
    meta = typeof transaction.custom_metadata === "string"
      ? JSON.parse(transaction.custom_metadata)
      : transaction.custom_metadata;
  }

  let sessionId = meta.session_id || null;
  let pack      = meta.pack       || null;

  // Fallback : callback_url
  if ((!sessionId || !pack) && transaction.callback_url) {
    try {
      const url = new URL(transaction.callback_url);
      if (!pack)      pack      = url.searchParams.get("pack");
      if (!sessionId) sessionId = url.searchParams.get("sid");
    } catch {}
  }

  console.log("[webhook]", { transId, sessionId, pack });

  if (!sessionId || !pack || !PACKS[pack]) {
    console.error("[webhook] metadata manquante ou pack inconnu");
    return res.status(400).end();
  }

  const supabase     = getSupabase();
  const creditsToAdd = PACKS[pack].credits;

  // ── 5. Idempotence — rejeter les doublons ────────────────────────
  const { data: existing } = await supabase
    .from("paid_transactions")
    .select("id")
    .eq("transaction_id", transId)
    .maybeSingle();

  if (existing) {
    console.log("[webhook] doublon ignoré:", transId);
    return res.status(200).json({ duplicate: true });
  }

  // ── 6. Enregistrer la transaction ───────────────────────────────
  await supabase.from("paid_transactions").insert([{
    transaction_id: transId,
    session_id:     sessionId,
    pack,
    credits:        creditsToAdd,
    amount:         transaction.amount,
  }]);

  // ── 7. Créditer usage_credits ────────────────────────────────────
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
  const field  = isUUID ? "user_id"    : "session_id";
  const value  = sessionId;

  const { data: account } = await supabase
    .from("usage_credits")
    .select("id, credits")
    .eq(field, value)
    .maybeSingle();

  if (account) {
    await supabase.from("usage_credits")
      .update({
        credits:    account.credits + creditsToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id);
  } else {
    const insert = isUUID
      ? { user_id: sessionId, credits: creditsToAdd }
      : { session_id: sessionId, credits: creditsToAdd };
    await supabase.from("usage_credits").insert([insert]);
  }

  // ── 8. Audit dans credit_movements ──────────────────────────────
  await supabase.from("credit_movements").insert([{
    user_id:       isUUID ? sessionId : null,
    fingerprint:   isUUID ? null : sessionId,
    amount:        creditsToAdd,
    type:          "purchase",
    description:   `Pack ${pack} - transaction ${transId}`,
    credits_given: creditsToAdd,
  }]);

  console.log(`[webhook] +${creditsToAdd} credits → ${field}=${value}`);
  return res.status(200).json({ success: true });
}
