export const config = { api: { bodyParser: true } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secretKey = process.env.FEDAPAY_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'FEDAPAY_SECRET_KEY manquante' })

  try {
    const { pack, email, phone } = req.body

    const PACKS = {
      starter:  { amount: 500,  credits: 3,  description: 'AfroTresse - Pack Starter 3 essais' },
      standard: { amount: 750,  credits: 5,  description: 'AfroTresse - Pack Standard 5 essais' },
      premium:  { amount: 1200, credits: 10, description: 'AfroTresse - Pack Premium 10 essais' },
    }

    const selectedPack = PACKS[pack]
    if (!selectedPack) return res.status(400).json({ error: 'Pack invalide' })

    // Creer la transaction FedaPay
    const fedaRes = await fetch('https://sandbox-api.fedapay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        description:   selectedPack.description,
        amount:        selectedPack.amount,
        currency:      { iso: 'XOF' },
        callback_url:  `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://afrotresse-hfwf.vercel.app'}/credits?payment=success&pack=${pack}&credits=${selectedPack.credits}`,
        customer: {
          email: email || 'client@afrotresse.com',
          ...(phone && { phone_number: { number: phone, country: 'BJ' } })
        }
      }),
    })

    if (!fedaRes.ok) {
      const err = await fedaRes.text()
      console.error('FedaPay error status:', fedaRes.status)
      console.error('FedaPay error body:', err)
      console.error('FedaPay secret key prefix:', secretKey?.substring(0, 10))
      return res.status(500).json({ error: 'Erreur FedaPay', details: err })
    }

    const data = await fedaRes.json()
    console.log('FedaPay response:', JSON.stringify(data))
    const transactionId = data?.v1?.transaction?.id
      || data?.transaction?.id
      || data?.data?.id
      || data?.id

    // Generer le lien de paiement
    const tokenRes = await fetch(`https://sandbox-api.fedapay.com/v1/transactions/${transactionId}/token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })

    const tokenData = await tokenRes.json()
    const paymentUrl = tokenData.url || `https://sandbox-checkout.fedapay.com/?id=${transactionId}`

    return res.status(200).json({ paymentUrl, transactionId, credits: selectedPack.credits })

  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: 'Erreur de paiement. Reessaie.' })
  }
}
