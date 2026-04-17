// ============================================================
// /api/fedapay-webhook.js — AfroTresse
// Reçoit le webhook FedaPay après paiement confirmé
// Crédite la session en Supabase (jamais le client)
// ============================================================

import { createClient } from "@supabase/supabase-js";

const PACKS = {
  starter: 3,
  plus:    10,
  pro:     99,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // ── 1. Vérification du token secret FedaPay ──────────────
  const token = req.headers["x-fedapay-token"];
  if (!token || token !== process.env.FEDAPAY_WEBHOOK_SECRET) {
    console.warn("[webhook] Token invalide :", token);
    return res.status(401).json({ error: "Non autorisé" });
  }

  // ── 2. Lecture de l'event ─────────────────────────────────
  const event = req.body;
  if (!event || event.name !== "transaction.approved") {
    // Ignorer les autres events (pending, failed…)
    return res.status(200).json({ ignored: true });
  }

  const transaction = event.entity;
  const metadata    = transaction?.metadata ?? {};
  const sessionId   = metadata.session_id;
  const pack        = metadata.pack;
  const transId     = String(transaction?.id ?? "");

  if (!sessionId || !pack || !PACKS[pack]) {
    console.error("[webhook] Metadata manquante :", metadata);
    return res.status(400).json({ error: "Données transaction incomplètes" });
  }

  const creditsToAdd = PACKS[pack];

  // ── 3. Supabase ───────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Idempotence : vérifier si cette transaction a déjà été créditée
  const { data: already } = await supabase
    .from("paid_transactions")
    .select("id")
    .eq("transaction_id", transId)
    .maybeSingle();

  if (already) {
    return res.status(200).json({ duplicate: true });
  }

  // Enregistrer la transaction AVANT de créditer
  const { error: insertErr } = await supabase
    .from("paid_transactions")
    .insert([{
      transaction_id: transId,
      session_id:     sessionId,
      pack,
      credits:        creditsToAdd,
      created_at:     new Date().toISOString(),
    }]);

  if (insertErr) {
    console.error("[webhook] Erreur INSERT paid_transactions :", insertErr);
    return res.status(500).json({ error: "Erreur enregistrement" });
  }

  // Upsert crédits dans anonymous_usage
  const { data: existing } = await supabase
    .from("anonymous_usage")
    .select("credits")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("anonymous_usage")
      .update({
        credits:    existing.credits + creditsToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId);
  } else {
    await supabase
      .from("anonymous_usage")
      .insert([{
        session_id: sessionId,
        credits:    creditsToAdd,
        created_at: new Date().toISOString(),
      }]);
  }

  console.log(`[webhook] +${creditsToAdd} crédits → session ${sessionId}`);
  return res.status(200).json({ success: true, credits: creditsToAdd });
      }
