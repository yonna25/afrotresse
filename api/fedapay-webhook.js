import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: true } };

const PACKS = {
  decouverte: { credits: 3,  amount: 300 },
  allie:      { credits: 10, amount: 900 },
  vip:        { credits: 50, amount: 2500 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const event = req.body;

  if (event.name !== "transaction.approved") return res.status(200).end();

  const { session_id: sessionId, pack } = event.entity.metadata;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const creditsToAdd = PACKS[pack].credits;
  const { data: account } = await supabase.from("usage_credits").select("id, credits").eq("session_id", sessionId).maybeSingle();

  if (account) {
    await supabase.from("usage_credits").update({ credits: account.credits + creditsToAdd }).eq("id", account.id);
  } else {
    await supabase.from("usage_credits").insert([{ session_id: sessionId, credits: creditsToAdd }]);
  }

  return res.status(200).json({ success: true });
}
