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
  const signature = req.headers["x-fedapay-signature"] || req.headers["x-fedapay-token"];

  console.log("[webhook] headers:", JSON.stringify(Object.keys(req.headers)));
  console.log("[webhook] webhookSecret present:", !!webhookSecret);
  console.log("[webhook] signature:", signature || "ABSENT");

  if (!webhookSecret) {
    console.error("[webhook] FEDAPAY_WEBHOOK_SECRET manquant");
    return res.status(500).end();
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
    console.log("[webhook] FULL EVENT:", JSON.stringify(event, null, 2));
  } catch {
    console.error("[webhook] JSON parse error");
    return res.status(400).end();
  }

  if (event.name !== "transaction.approved" && event.event !== "transaction.approved") {
    return res.status(200).json({ ignored: true });
  }

  const transaction = event.entity || event;
  const { session_id: sessionId, pack } = transaction.metadata || {};
  const transId = String(transaction.id);

  console.log("[webhook] metadata:", { sessionId, pack, transId });

  if (!sessionId || !pack || !PACKS[pack]) {
    console.error("[webhook] metadata manquante:", { sessionId, pack });
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

  const creditsToAdd = PACKS[pack].credits;

  await supabase.from("paid_transactions").insert([{
    transaction_id: transId,
    session_id:     sessionId,
    pack,
    credits:        creditsToAdd,
    amount:         transaction.amount,
  }]);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

  if (isUUID) {
    const { data: userAccount } = await supabase
      .from("usage_credits")
      .select("id, credits")
      .eq("user_id", sessionId)
      .maybeSingle();

    if (userAccount) {
      await supabase.from("usage_credits")
        .update({ credits: userAccount.credits + creditsToAdd, updated_at: new Date().toISOString() })
        .eq("id", userAccount.id);
    } else {
      await supabase.from("usage_credits").insert([{ user_id: sessionId, credits: creditsToAdd }]);
    }
    console.log(`[webhook] ✅ Connectée userId=${sessionId} +${creditsToAdd} crédits`);
    return res.status(200).json({ success: true, type: "user" });
  }

  const { data: sessionAccount } = await supabase
    .from("usage_credits")
    .select("id, credits")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (sessionAccount) {
    await supabase.from("usage_credits")
      .update({ credits: sessionAccount.credits + creditsToAdd, updated_at: new Date().toISOString() })
      .eq("id", sessionAccount.id);
  } else {
    await supabase.from("usage_credits").insert([{ session_id: sessionId, credits: creditsToAdd }]);
  }

  console.log(`[webhook] ✅ Anonyme sessionId=${sessionId} +${creditsToAdd} crédits`);
  return res.status(200).json({ success: true, type: "session" });
}
