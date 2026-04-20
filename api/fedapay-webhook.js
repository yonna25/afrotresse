// ============================================================
// /api/fedapay-webhook.js — AfroTresse
// Reçoit le webhook FedaPay après paiement confirmé
// Crédite la session en Supabase (jamais le client)
// ============================================================

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const config = { api: { bodyParser: false } }; // raw body requis pour HMAC

// ── Lecture du raw body ───────────────────────────────────────────────────────
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end",  () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ── Packs — source de vérité (doit correspondre à fedapay.js) ────────────────
const PACKS = {
  starter: { credits: 3,  amount: 500  },
  plus:    { credits: 10, amount: 1500 },
  pro:     { credits: 99, amount: 2500 },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // ── 1. Lecture du raw body ────────────────────────────────────────────────
  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch {
    return res.status(400).json({ error: "Impossible de lire le body" });
  }

  // ── 2. Vérification HMAC (prioritaire sur le simple token) ───────────────
  const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] FEDAPAY_WEBHOOK_SECRET manquant");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  const signature = req.headers["x-fedapay-signature"] || req.headers["x-fedapay-token"];

  // Si FedaPay envoie une signature HMAC (header x-fedapay-signature)
  if (req.headers["x-fedapay-signature"]) {
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const trustedSig = `sha256=${expectedSig}`;

    // Comparaison timing-safe pour éviter les timing attacks
    try {
      const sigBuffer      = Buffer.from(signature);
      const trustedBuffer  = Buffer.from(trustedSig);
      const isValid =
        sigBuffer.length === trustedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, trustedBuffer);

      if (!isValid) {
        console.warn("[webhook] Signature HMAC invalide");
        return res.status(401).json({ error: "Signature invalide" });
      }
    } catch {
      console.warn("[webhook] Erreur vérification HMAC");
      return res.status(401).json({ error: "Signature invalide" });
    }
  } else {
    // Fallback : vérification simple du token secret
    if (!signature || signature !== webhookSecret) {
      console.warn("[webhook] Token invalide :", signature);
      return res.status(401).json({ error: "Non autorisé" });
    }
  }

  // ── 3. Parse du body ─────────────────────────────────────────────────────
  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Body JSON invalide" });
  }

  // ── 4. Filtre sur le type d'événement ────────────────────────────────────
  if (!event || event.name !== "transaction.approved") {
    return res.status(200).json({ ignored: true });
  }

  // ── 5. Extraction et validation des métadonnées ───────────────────────────
  const transaction = event.entity;
  const metadata    = transaction?.metadata ?? {};
  const sessionId   = metadata.session_id;
  const pack        = metadata.pack;
  const transId     = String(transaction?.id ?? "");
  const paidAmount  = transaction?.amount;

  if (!sessionId || !pack || !PACKS[pack]) {
    console.error("[webhook] Metadata manquante ou pack invalide :", metadata);
    return res.status(400).json({ error: "Données transaction incomplètes" });
  }

  // ── 6. Vérification du montant payé vs montant attendu ───────────────────
  // Empêche qu'un pack "pro" soit crédité avec un paiement de 500 FCFA
  const expectedAmount = metadata.expected_amount ?? PACKS[pack].amount;
  if (paidAmount !== undefined && Number(paidAmount) < expectedAmount) {
    console.error(
      `[webhook] Montant insuffisant : reçu ${paidAmount}, attendu ${expectedAmount} pour pack ${pack}`
    );
    return res.status(400).json({ error: "Montant insuffisant" });
  }

  const creditsToAdd = PACKS[pack].credits;

  // ── 7. Connexion Supabase (service role — serveur uniquement) ─────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── 8. Idempotence — vérifier si déjà crédité ────────────────────────────
  const { data: already, error: checkErr } = await supabase
    .from("paid_transactions")
    .select("id")
    .eq("transaction_id", transId)
    .maybeSingle();

  if (checkErr) {
    console.error("[webhook] Erreur vérification idempotence :", checkErr);
    return res.status(500).json({ error: "Erreur base de données" });
  }

  if (already) {
    console.log(`[webhook] Transaction ${transId} déjà traitée — ignorée`);
    return res.status(200).json({ duplicate: true });
  }

  // ── 9. Enregistrement de la transaction (preuve comptable) ───────────────
  const { error: insertErr } = await supabase
    .from("paid_transactions")
    .insert([{
      transaction_id: transId,
      session_id:     sessionId,
      pack,
      credits:        creditsToAdd,
      amount:         paidAmount ?? expectedAmount,
      created_at:     new Date().toISOString(),
    }]);

  if (insertErr) {
    console.error("[webhook] Erreur INSERT paid_transactions :", insertErr);
    return res.status(500).json({ error: "Erreur enregistrement" });
  }

  // ── 10. Crédit des crédits dans anonymous_usage ───────────────────────────
  const { data: existing, error: fetchErr } = await supabase
    .from("anonymous_usage")
    .select("credits")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[webhook] Erreur SELECT anonymous_usage :", fetchErr);
    // La transaction est déjà enregistrée — on log mais on ne plante pas
    // Un job de réconciliation peut retraiter les crédits manquants
    return res.status(500).json({ error: "Erreur lecture session" });
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from("anonymous_usage")
      .update({
        credits:    existing.credits + creditsToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId);

    if (updateErr) {
      console.error("[webhook] Erreur UPDATE anonymous_usage :", updateErr);
      return res.status(500).json({ error: "Erreur mise à jour crédits" });
    }
  } else {
    const { error: insertUsageErr } = await supabase
      .from("anonymous_usage")
      .insert([{
        session_id: sessionId,
        credits:    creditsToAdd,
        created_at: new Date().toISOString(),
      }]);

    if (insertUsageErr) {
      console.error("[webhook] Erreur INSERT anonymous_usage :", insertUsageErr);
      return res.status(500).json({ error: "Erreur création session" });
    }
  }

  console.log(`[webhook] ✅ +${creditsToAdd} crédits → session ${sessionId} (transaction ${transId})`);
  return res.status(200).json({ success: true, credits: creditsToAdd });
}
