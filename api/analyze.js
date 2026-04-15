import { IncomingForm } from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000
const rateMap = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const data = rateMap.get(ip) || { count: 0, start: now }

  if (now - data.start > WINDOW_MS) {
    rateMap.set(ip, { count: 1, start: now })
    return true
  }

  if (data.count >= RATE_LIMIT) return false

  data.count++
  rateMap.set(ip, data)
  return true
}

const BRAIDS_LIBRARY = [/* inchangé */]

const FACE_SHAPE_NAMES = {
  oval:'Ovale', round:'Ronde', square:'Carree',
  heart:'Coeur', long:'Longue', diamond:'Diamant',
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

function pickAllStyles(faceShape) {
  const compatible = BRAIDS_LIBRARY.filter(s => s.faceShapes.includes(faceShape))
  const shuffled   = [...compatible].sort(() => Math.random() - 0.5)
  return shuffled
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessaie plus tard.' })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquante' })

  try {
    const { files } = await parseForm(req)
    const photoFile  = files.photo?.[0] || files.photo
    if (!photoFile)  return res.status(400).json({ error: 'Aucune photo recue.' })

    const selfieBuffer = fs.readFileSync(photoFile.filepath || photoFile.path)
    const base64Image  = selfieBuffer.toString('base64')
    const mimeType     = photoFile.mimetype || photoFile.type || 'image/jpeg'

    let faceShape  = 'oval'
    let confidence = 0.85
    let reason     = ''

    try {
      const cRes = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 150,
          system: 'Expert morphologie visage. JSON uniquement : {"faceShape":"oval","confidence":0.92,"reason":"front large, machoire douce"}',
          messages: [{ role:'user', content:[
            { type:'image', source:{ type:'base64', media_type:mimeType, data:base64Image }},
            { type:'text',  text:'Forme du visage en JSON uniquement.' }
          ]}],
        }),
      })
      if (cRes.ok) {
        const d   = await cRes.json()
        const txt = (d.content?.[0]?.text || '{}').replace(/```json|```/g,'').trim()
        const p   = JSON.parse(txt)
        faceShape  = p.faceShape?.toLowerCase() || 'oval'
        confidence = p.confidence || 0.85
        reason     = p.reason     || ''
        if (!FACE_SHAPE_NAMES[faceShape]) faceShape = 'oval'
      }
    } catch(e) {}

    const selected = pickAllStyles(faceShape)

    const recommendations = selected.map((style) => ({
      id: style.id,
      name: style.name,
      region: style.region,
      duration: style.duration,
      difficulty: style.difficulty,
      tags: style.tags,
      localImage: style.localImage,
      generatedImage: null,
      matchScore: Math.floor(Math.random() * 15) + 83,
    }))

    return res.status(200).json({
      faceShape,
      faceShapeName: FACE_SHAPE_NAMES[faceShape],
      confidence: Math.round(confidence * 100),
      reason,
      analysisId: Date.now().toString(36),
      recommendations,
    })

  } catch (error) {
    return res.status(500).json({ error: 'Analyse echouee. Reessaie.' })
  }
}
