import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end",  () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const PACKS = {
  decouverte: { credits: 3,  amount: 300  },
  allie:      { credits: 10, amount: 900  },
  vip:        { credits: 50, amount: 2500 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let rawBody = await getRawBody(req);
  const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhook] FEDAPAY_WEBHOOK_SECRET manquant");
    return res.status(500).end();
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    console.error("[webhook] JSON parse error");
    return res.status(400).end();
  }

  if (event.name !== "transaction.approved" && event.event !== "transaction.approved") {
    return res.status(200).json({ ignored: true });
  }

  const transaction = event.entity || event;

  console.log("[webhook] custom_metadata raw:", JSON.stringify(transaction.custom_metadata));
  console.log("[webhook] callback_url:", transaction.callback_url);

  // Lire custom_metadata — FedaPay peut envoyer un objet ou une string JSON
  let meta = {};
  if (transaction.custom_metadata) {
    if (typeof transaction.custom_metadata === "string") {
      try { meta = JSON.parse(transaction.custom_metadata); } catch {}
    } else {
      meta = transaction.custom_metadata;
    }
  }

  let resolvedSessionId = meta.session_id || null;
  let resolvedPack = meta.pack || null;
  const transId = String(transaction.id);

  // Fallback : extraire depuis callback_url
  if ((!resolvedPack || !resolvedSessionId) && transaction.callback_url) {
    try {
      const url = new URL(transaction.callback_url);
      if (!resolvedPack) resolvedPack = url.searchParams.get("pack");
      if (!resolvedSessionId) resolvedSessionId = url.searchParams.get("sid");
    } catch {}
  }

  console.log("[webhook] metadata:", { sessionId: resolvedSessionId, pack: resolvedPack, transId });

  if (!resolvedSessionId || !resolvedPack || !PACKS[resolvedPack]) {
    console.error("[webhook] metadata manquante:", { resolvedSessionId, resolvedPack });
    return res.status(400).end();
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: already } = await supabase
    .from("paid_transactions")
    .select("id")
    .eq("transaction_id", transId)
    .maybeSingle();

  if (already) return res.status(200).json({ duplicate: true });

  const creditsToAdd = PACKS[resolvedPack].credits;

  await supabase.from("paid_transactions").insert([{
    transaction_id: transId,
    session_id:     resolvedSessionId,
    pack:           resolvedPack,
    credits:        creditsToAdd,
    amount:         transaction.amount,
  }]);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedSessionId);

  if (isUUID) {
    const { data: userAccount } = await supabase
      .from("usage_credits")
      .select("id, credits")
      .eq("user_id", resolvedSessionId)
      .maybeSingle();

    if (userAccount) {
      await supabase.from("usage_credits")
        .update({ credits: userAccount.credits + creditsToAdd, updated_at: new Date().toISOString() })
        .eq("id", userAccount.id);
    } else {
      await supabase.from("usage_credits").insert([{ user_id: resolvedSessionId, credits: creditsToAdd }]);
    }
    console.log(`[webhook] Connectee userId=${resolvedSessionId} +${creditsToAdd} credits`);
    return res.status(200).json({ success: true, type: "user" });
  }

  const { data: sessionAccount } = await supabase
    .from("usage_credits")
    .select("id, credits")
    .eq("session_id", resolvedSessionId)
    .maybeSingle();

  if (sessionAccount) {
    await supabase.from("usage_credits")
      .update({ credits: sessionAccount.credits + creditsToAdd, updated_at: new Date().toISOString() })
      .eq("id", sessionAccount.id);
  } else {
    await supabase.from("usage_credits").insert([{ session_id: resolvedSessionId, credits: creditsToAdd }]);
  }

  console.log(`[webhook] Anonyme sessionId=${resolvedSessionId} +${creditsToAdd} credits`);
  return res.status(200).json({ success: true, type: "session" });
}
