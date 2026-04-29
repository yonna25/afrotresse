export const config = { api: { bodyParser: true } };

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

const PACKS = {
  decouverte: { amount: 300,  credits: 3,  description: 'AfroTresse - Pack Découverte' },
  allie:      { amount: 900,  credits: 10, description: 'AfroTresse - Pack Allié'      },
  vip:        { amount: 2500, credits: 50, description: 'AfroTresse - Pack VIP'        },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Trop de requêtes' });

  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  const fedaBase = process.env.FEDAPAY_API_URL || 'https://api.fedapay.com';

  try {
    const { pack, email, phone, sessionId } = req.body;
    const selectedPack = PACKS[pack];

    if (!selectedPack || !sessionId) {
      return res.status(400).json({ error: 'Données invalides (pack ou session manquante)' });
    }

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
        callback_url: `https://afrotresse.com/credits?payment=success&pack=${pack}`,
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
    const transaction = data['v1/transaction'] || data?.transaction || data?.entity;
    const paymentUrl  = transaction?.payment_url;

    if (!paymentUrl) return res.status(500).json({ error: 'Lien FedaPay introuvable' });

    return res.status(200).json({ paymentUrl, transactionId: transaction?.id });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur interne' });
  }
}
