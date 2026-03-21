import * as fal from '@fal-ai/client'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

// Bouclier 1 : Anti-spam
let lastCallTime = 0

const PRESET_RESULTS = {
  'oval':    ['/styles/napi1.jpg', '/styles/napi2.jpg'],
  'round':   ['/styles/napi4.jpg', '/styles/napi5.jpg'],
  'square':  ['/styles/napi2.jpg', '/styles/napi5.jpg'],
  'heart':   ['/styles/napi3.jpg', '/styles/napi6.jpg'],
  'long':    ['/styles/napi1.jpg', '/styles/napi4.jpg'],
  'diamond': ['/styles/napi2.jpg', '/styles/napi6.jpg'],
}

function getPreset(faceShape) {
  const presets = PRESET_RESULTS[faceShape] || PRESET_RESULTS['oval']
  return presets[Math.floor(Math.random() * presets.length)]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const falKey = process.env.FAL_API_KEY

  // Bouclier 1 : Anti-spam 5 secondes
  const now = Date.now()
  if (now - lastCallTime < 5000) {
    return res.status(429).json({ error: 'Attends quelques secondes avant de relancer.' })
  }
  lastCallTime = now

  const { selfieBase64, selfieType, styleImageUrl, faceShape, styleId, paid } = req.body || {}

  // Bouclier 4 : Pas de cle -> preset (mode gratuit uniquement)
  if (!falKey) {
    if (paid) return res.status(500).json({ error: 'Service indisponible. Reessaie.' })
    return res.status(200).json({ fallback: true, imageUrl: getPreset(faceShape) })
  }

  try {
    // Configurer le SDK
    fal.config({ credentials: falKey })

    // Convertir base64 en blob
    const buffer = Buffer.from(selfieBase64, 'base64')
    const mime   = selfieType || 'image/jpeg'
    const blob   = new Blob([buffer], { type: mime })

    // Upload via SDK
    const selfieUrl = await fal.storage.upload(blob)

    // Generer via SDK — Bouclier 3 : 1 image
    const result = await fal.subscribe('fal-ai/image-apps-v2/hair-change', {
      input: {
        image_url:           selfieUrl,
        reference_image_url: styleImageUrl,
        num_images:          1,
      },
    })

    const imageUrl = result?.data?.image?.url || result?.data?.images?.[0]?.url
    if (!imageUrl) throw new Error('Aucune image generee')

    return res.status(200).json({ imageUrl, fallback: false })

  } catch (error) {
    console.error('Fal.ai error:', error)
    // Si credit payant -> erreur, pas de fallback
    if (paid) return res.status(500).json({ error: 'Generation echouee. Reessaie dans quelques secondes.' })
    // Bouclier 2 : Fallback si mode gratuit
    return res.status(200).json({ fallback: true, imageUrl: getPreset(faceShape) })
  }
}
