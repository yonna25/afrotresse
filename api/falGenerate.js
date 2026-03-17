export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const falKey = process.env.FAL_API_KEY
  if (!falKey) return res.status(500).json({ error: 'FAL_API_KEY manquante' })

  try {
    const { selfieBase64, selfieType, styleImageUrl } = req.body
    if (!selfieBase64 || !styleImageUrl) {
      return res.status(400).json({ error: 'selfieBase64 et styleImageUrl requis' })
    }

    // 1. Upload selfie vers Fal.ai storage via REST
    const buffer = Buffer.from(selfieBase64, 'base64')
    const mime   = selfieType || 'image/jpeg'
    const ext    = mime.split('/')[1] || 'jpg'

    const uploadRes = await fetch('https://storage.fal.run', {
      method:  'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type':  mime,
        'X-Filename':    `selfie.${ext}`,
      },
      body: buffer,
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('Upload error:', err)
      return res.status(500).json({ error: 'Upload selfie echoue' })
    }

    const { url: selfieUrl } = await uploadRes.json()

    // 2. Générer le style via REST
    const generateRes = await fetch('https://fal.run/fal-ai/image-apps-v2/hair-change', {
      method:  'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        image_url:             selfieUrl,
        reference_image_url:   styleImageUrl,
      }),
    })

    if (!generateRes.ok) {
      const err = await generateRes.text()
      console.error('Generate error:', err)
      return res.status(500).json({ error: 'Generation echouee' })
    }

    const data = await generateRes.json()
    const imageUrl = data?.image?.url || data?.images?.[0]?.url

    if (!imageUrl) return res.status(500).json({ error: 'Aucune image generee' })

    return res.status(200).json({ imageUrl })

  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: 'Generation echouee. Reessaie.' })
  }
}
