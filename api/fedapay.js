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
  decouverte: { amount: 300,  credits: 3,  description: 'AfroTresse - Pack Decouverte' },
  allie:      { amount: 900,  credits: 10, description: 'AfroTresse - Pack Allie'      },
  vip:        { amount: 2500, credits: 50, description: 'AfroTresse - Pack VIP'        },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non autorisee' });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Trop de requetes' });

  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  const fedaBase  = process.env.FEDAPAY_API_URL || 'https://api.fedapay.com';

  if (!secretKey) {
    console.error('[fedapay] FEDAPAY_SECRET_KEY manquante');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  try {
    const { pack, email, phone, sessionId, fromPath } = req.body;
    const selectedPack = PACKS[pack];

    if (!selectedPack || !sessionId) {
      return res.status(400).json({ error: 'Donnees invalides (pack ou session manquante)' });
    }

    const host     = req.headers['x-forwarded-host'] || req.headers.host || 'afrotresse.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // Construction propre et dynamique de l'URL d'origine cible
    const cleanPath = fromPath && fromPath.startsWith('/') ? fromPath : '/profile';
    const callbackUrl = `${protocol}://${host}${cleanPath}`;

    const fedaRes = await fetch(`${fedaBase}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        description:     selectedPack.description,
        amount:          selectedPack.amount,
        currency:        { iso: 'XOF' },
        callback_url:    callbackUrl,
        customer: {
          email: email || 'client@afrotresse.com',
          ...(phone && { phone_number: { number: phone, country: 'BJ' } }),
        },
        custom_metadata: {
          session_id: sessionId,
          pack:       pack,
          credits:    selectedPack.credits,
        },
      }),
    });

    const data = await fedaRes.json();
    console.log('[fedapay] response:', JSON.stringify(data));

    const transaction = data['v1/transaction'] || data?.transaction || data?.entity;
    const paymentUrl  = transaction?.payment_url;

    if (!paymentUrl) {
      const errMsg = data?.message || data?.error || 'Lien FedaPay introuvable';
      console.error('[fedapay] pas de paymentUrl:', errMsg);
      return res.status(500).json({ error: errMsg });
    }

    return res.status(200).json({ paymentUrl, transactionId: transaction?.id });

  } catch (error) {
    console.error('[fedapay] exception:', error.message);
    return res.status(500).json({ error: error.message || 'Erreur interne' });
  }
}
