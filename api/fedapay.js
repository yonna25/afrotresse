export const config = { api: { bodyParser: true } }

// ── RATE LIMIT ────────────────────────────────────────────────────────────────
const RATE_LIMIT = 5;
const WINDOW_MS  = 60 * 60 * 1000;
const rateMap    = new Map();

function checkRateLimit(ip) {
  const now  = Date.now();
  const data = rateMap.get(ip) || { count: 0, start: now };

  if (now - data.start > WINDOW_MS) {
    rateMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (data.count >= RATE_LIMIT) return false;
  data.count++;
  rateMap.set(ip, data);
  return true;
}

// ── PACKS (source de vérité côté serveur) ─────────────────────────────────────
const PACKS = {
  starter: { amount: 500,  credits: 3,  description: 'AfroTresse - Pack Starter 3 tests'  },
  plus:    { amount: 1500, credits: 10, description: 'AfroTresse - Pack Plus 10 tests'     },
  pro:     { amount: 2500, credits: 99, description: 'AfroTresse - Abonnement mensuel'     },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Rate limit ───────────────────────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessaie plus tard.' });
  }

  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'FEDAPAY_SECRET_KEY manquante' });

  try {
    const { pack, email, phone, sessionId } = req.body;

    // ── Validation pack ──────────────────────────────────────────────────────
    const selectedPack = PACKS[pack];
    if (!selectedPack) return res.status(400).json({ error: 'Pack invalide' });

    // ── Validation sessionId ─────────────────────────────────────────────────
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 8) {
      return res.status(400).json({ error: 'Session invalide' });
    }

    // ── URL API FedaPay (sandbox ou production via env) ──────────────────────
    const fedaBase = process.env.FEDAPAY_API_URL || 'https://sandbox-api.fedapay.com';

    const fedaRes = await fetch(`${fedaBase}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        description:  selectedPack.description,
        amount:       selectedPack.amount,
        currency:     { iso: 'XOF' },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits?payment=success&pack=${pack}&credits=${selectedPack.credits}`,
        customer: {
          email: email || 'client@afrotresse.com',
          ...(phone && { phone_number: { number: phone, country: 'BJ' } }),
        },
        // ── Metadata sécurisée — lue par le webhook pour créditer ────────────
        // Le montant est inclus pour que le webhook puisse valider la cohérence
        metadata: {
          session_id:      sessionId,
          pack,
          expected_amount: selectedPack.amount,
          credits:         selectedPack.credits,
        },
      }),
    });

    if (!fedaRes.ok) {
      const err = await fedaRes.text();
      return res.status(500).json({ error: 'Erreur FedaPay', details: err });
    }

    const data          = await fedaRes.json();
    const transaction   = data['v1/transaction'] || data?.v1?.transaction || data?.transaction;
    const transactionId = transaction?.id;
    const paymentUrl    = transaction?.payment_url;

    if (!paymentUrl) return res.status(500).json({ error: 'URL de paiement introuvable' });

    return res.status(200).json({ paymentUrl, transactionId, credits: selectedPack.credits });

  } catch (error) {
    console.error('[fedapay] Erreur création transaction :', error);
    return res.status(500).json({ error: 'Erreur de paiement. Réessaie.' });
  }
}
