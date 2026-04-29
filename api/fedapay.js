export const config = { api: { bodyParser: true } };

const PACKS = {
  decouverte: { amount: 300,  credits: 3,  description: 'AfroTresse - Pack Découverte' },
  allie:      { amount: 900,  credits: 10, description: 'AfroTresse - Pack Allié' },
  vip:        { amount: 2500, credits: 50, description: 'AfroTresse - Pack VIP' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { pack, email, sessionId } = req.body;
  const selectedPack = PACKS[pack];

  if (!selectedPack) return res.status(400).json({ error: "Pack invalide" });

  try {
    const fedaRes = await fetch(`${process.env.FEDAPAY_API_URL}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: selectedPack.description,
        amount: selectedPack.amount,
        currency: { iso: 'XOF' },
        callback_url: `https://afrotresse.com/credits?payment=success`,
        customer: { email: email || 'client@afrotresse.com' },
        metadata: { session_id: sessionId, pack: pack }
      }),
    });

    const data = await fedaRes.json();
    const transaction = data['v1/transaction'] || data?.transaction;
    
    if (!transaction?.payment_url) {
      return res.status(500).json({ error: "Configuration FedaPay incorrecte (Clé API ?)" });
    }

    return res.status(200).json({ paymentUrl: transaction.payment_url });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
