// ============================================================
// /api/fedapay-webhook.js — AfroTresse (Version Corrigée)
// ============================================================

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const config = { api: { bodyParser: false } };

// ── Lecture du corps brut (Raw Body) ──────────────────────────────────────────
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end",  () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ── Packs — Source de vérité ────────────────────────────────────────────────
const PACKS = {
  starter: { credits: 3,  amount: 500  },
  plus:    { credits: 10, amount: 1500 },
  pro:     { credits: 99, amount: 2500 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // 1. Lecture du body
  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch {
    return res.status(400).json({ error: "Impossible de lire le body" });
  }

  // 2. Vérification de la sécurité (HMAC / Secret Token)
  const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-fedapay-signature"] || req.headers["x-fedapay-token"];

  if (!webhookSecret || !signature) {
    return res.status(401).json({ error: "Sécurité absente" });
  }

  // Vérification HMAC si disponible
  if (req.headers["x-fedapay-signature"]) {
    const expectedSig = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (`sha256=${expectedSig}` !== signature) {
      return res.status(401).json({ error: "Signature invalide" });
    }
  } else if (signature !== webhookSecret) {
    return res.status(401).json({ error: "Token invalide" });
  }

  // 3. Parse et validation de l'événement
  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "JSON invalide" });
  }

  if (event.name !== "transaction.approved") {
    return res.status(200).json({ ignored: true });
  }

  const transaction = event.entity;
  const metadata    = transaction?.metadata ?? {};
  const sessionId   = metadata.session_id;
  const pack        = metadata.pack;
  const transId     = String(transaction?.id ?? "");
  const paidAmount  = transaction?.amount;

  if (!sessionId || !pack || !PACKS[pack]) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  // 4. Initialisation Supabase avec Service Role Key (SRL)
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 5. Idempotence : Éviter de créditer deux fois
  const { data: already } = await supabase
    .from("paid_transactions")
    .select("id")
    .eq("transaction_id", transId)
    .maybeSingle();

  if (already) return res.status(200).json({ duplicate: true });

  const creditsToAdd = PACKS[pack].credits;

  // 6. Enregistrement de la preuve de paiement
  await supabase.from("paid_transactions").insert([{
    transaction_id: transId,
    session_id: sessionId,
    pack,
    credits: creditsToAdd,
    amount: paidAmount
  }]);

  // 7. MISE À JOUR DES CRÉDITS (Table usage_credits)
  const { data: account } = await supabase
    .from("usage_credits")
    .select("id, credits")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (account) {
    // Mise à jour de l'existant
    await supabase
      .from("usage_credits")
      .update({ 
        credits: account.credits + creditsToAdd,
        updated_at: new Date().toISOString()
      })
      .eq("id", account.id);
  } else {
    // Création si nouveau (cas rare)
    await supabase.from("usage_credits").insert([{
      session_id: sessionId,
      credits: creditsToAdd
    }]);
  }

  console.log(`✅ Crédits ajoutés avec succès pour la session ${sessionId}`);
  return res.status(200).json({ success: true });
}
