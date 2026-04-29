// ============================================================
// /api/fedapay.js — AfroTresse (Version Live Mise à jour)
// ============================================================

export const config = { api: { bodyParser: true } };

// Limitation du nombre de requêtes pour éviter les abus
const RATE_LIMIT = 5;
const WINDOW_MS  = 60 * 60 * 1000; // 1 heure
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

// Source de vérité pour les tarifs
const PACKS = {
  starter: { amount: 500,  credits: 3,  description: 'AfroTresse - Pack Starter 3 tests'  },
  plus:    { amount: 1500, credits: 10, description: 'AfroTresse - Pack Plus 10 tests'     },
  pro:     { amount: 2500, credits: 99, description: 'AfroTresse - Pack Pro (Illimité)'   },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  // Sécurité : Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });
  }

  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  
  // CORRECTION : L'URL pointe maintenant vers la production par défaut
  const fedaBase = process.env.FEDAPAY_API_URL || 'https://api.fedapay.com';

  try {
    const { pack, email, phone, sessionId } = req.body;
    const selectedPack = PACKS[pack];

    if (!selectedPack || !sessionId) {
      return res.status(400).json({ error: 'Données invalides (pack ou session manquante)' });
    }

    // Appel à l'API FedaPay pour créer la transaction
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
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits?payment=success&pack=${pack}`,
        customer: {
          email: email || 'client@afrotresse.com',
          ...(phone && { phone_number: { number: phone, country: 'BJ' } }),
        },
        metadata: {
          session_id:      sessionId,
          pack:            pack,
          expected_amount: selectedPack.amount,
          credits:         selectedPack.credits,
        },
      }),
    });

    const data = await fedaRes.json();
    
    // Extraction de l'objet transaction selon la réponse de l'API
    const transaction = data['v1/transaction'] || data?.transaction || data?.entity;
    const paymentUrl  = transaction?.payment_url;

    if (!paymentUrl) {
      console.error('[FedaPay Error]', data);
      return res.status(500).json({ error: 'Lien de paiement introuvable dans la réponse' });
    }

    // On renvoie l'URL de paiement au frontend
    return res.status(200).json({ paymentUrl, transactionId: transaction?.id });

  } catch (error) {
    console.error('[API EXCEPTION]', error);
    return res.status(500).json({ error: 'Erreur interne lors de la création du paiement' });
  }
}
