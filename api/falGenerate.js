import { fal } from "@fal-ai/client";

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const falKey = process.env.FAL_API_KEY
  if (!falKey) return res.status(500).json({ error: 'FAL_API_KEY manquante' })

  fal.config({ credentials: falKey })

  try {
    const { selfieBase64, selfieType, styleImageUrl } = req.body

    if (!selfieBase64 || !styleImageUrl) {
      return res.status(400).json({ error: 'selfieBase64 et styleImageUrl requis' })
    }

    // Convertir base64 en Blob puis upload vers Fal storage
    const buffer   = Buffer.from(selfieBase64, 'base64')
    const blob     = new Blob([buffer], { type: selfieType || 'image/jpeg' })
    const selfieUrl = await fal.storage.upload(blob)

    // Générer le style
    const result = await fal.subscribe("fal-ai/image-apps-v2/hair-change", {
      input: {
        image_url: selfieUrl,
        reference_image_url: styleImageUrl,
      },
    })

    return res.status(200).json({ imageUrl: result.data.image.url })

  } catch (error) {
    console.error('Fal.ai error:', error)
    return res.status(500).json({ error: 'Generation echouee. Reessaie.' })
  }
}
