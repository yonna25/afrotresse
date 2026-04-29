import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

  if (!webhookSecret || !signature) return res.status(401).end();

  const event = JSON.parse(rawBody.toString());
  if (event.name !== "transaction.approved" && event.event !== "transaction.approved") {
    return res.status(200).json({ ignored: true });
  }

  const transaction = event.entity || event;
  const { session_id: sessionId, pack } = transaction.metadata || {};
  const transId = String(transaction.id);

  if (!sessionId || !pack || !PACKS[pack]) return res.status(400).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: already } = await supabase.from("paid_transactions").select("id").eq("transaction_id", transId).maybeSingle();
  if (already) return res.status(200).json({ duplicate: true });

  const creditsToAdd = PACKS[pack].credits;

  await supabase.from("paid_transactions").insert([{
    transaction_id: transId,
    session_id: sessionId,
    pack,
    credits: creditsToAdd,
    amount: transaction.amount
  }]);

  const { data: account } = await supabase.from("usage_credits").select("id, credits").eq("session_id", sessionId).maybeSingle();

  if (account) {
    await supabase.from("usage_credits").update({ 
      credits: account.credits + creditsToAdd,
      updated_at: new Date().toISOString()
    }).eq("id", account.id);
  } else {
    await supabase.from("usage_credits").insert([{ session_id: sessionId, credits: creditsToAdd }]);
  }

  return res.status(200).json({ success: true });
}
