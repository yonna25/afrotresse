import { IncomingForm } from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

// ─── Tes 8 photos dans public/styles/ ────────────────────────────
// napi1.jpg → napi7.jpg + akoto.jpg
// Chaque style pointe vers une de tes photos

const BRAIDS_LIBRARY = [
  { id:'box-braids',       name:'Box Braids',       region:'Afrique de l\'Ouest', duration:'4-6h',  difficulty:'Intermédiaire', tags:['Classique','Protectrice'],  faceShapes:['oval','round','square','heart','diamond'],        localImage:'/styles/napi1.jpg' },
  { id:'knotless-braids',  name:'Knotless Braids',  region:'Afrique de l\'Ouest', duration:'6-8h',  difficulty:'Intermédiaire', tags:['Moderne','Naturelle'],      faceShapes:['oval','round','square','heart','diamond','long'],  localImage:'/styles/napi2.jpg' },
  { id:'cornrows',         name:'Cornrows',          region:'Afrique de l\'Ouest', duration:'2-4h',  difficulty:'Avancée',       tags:['Sport','Légère'],           faceShapes:['oval','long','square','diamond'],                  localImage:'/styles/napi3.jpg' },
  { id:'fulani-braids',    name:'Fulani Braids',     region:'Afrique de l\'Ouest', duration:'3-5h',  difficulty:'Avancée',       tags:['Perles','Unique'],          faceShapes:['oval','heart','diamond'],                          localImage:'/styles/napi4.jpg' },
  { id:'ghana-braids',     name:'Ghana Braids',      region:'Ghana',               duration:'3-4h',  difficulty:'Intermédiaire', tags:['Bold','Structurée'],        faceShapes:['oval','long','diamond'],                           localImage:'/styles/napi5.jpg' },
  { id:'senegalese-twist', name:'Senegalese Twist',  region:'Sénégal',             duration:'5-7h',  difficulty:'Intermédiaire', tags:['Volume','Élégante'],        faceShapes:['round','square','heart','oval'],                   localImage:'/styles/napi6.jpg' },
  { id:'lemonade-braids',  name:'Lemonade Braids',   region:'Afrique de l\'Ouest', duration:'4-6h',  difficulty:'Avancée',       tags:['Tendance','Glamour'],       faceShapes:['round','square','heart'],                          localImage:'/styles/napi7.jpg' },
  { id:'micro-braids',     name:'Micro Braids',      region:'Afrique de l\'Ouest', duration:'8-12h', difficulty:'Expert',        tags:['Délicate','Versatile'],     faceShapes:['oval','long','heart'],                             localImage:'/styles/akoto.jpg' },
  { id:'bantu-knots',      name:'Bantu Knots',       region:'Afrique Centrale',    duration:'2-3h',  difficulty:'Intermédiaire', tags:['Naturelle','Culturelle'],   faceShapes:['oval','round','heart'],                            localImage:'/styles/napi1.jpg' },
  { id:'goddess-braids',   name:'Goddess Braids',    region:'Afrique Centrale',    duration:'4-5h',  difficulty:'Avancée',       tags:['Majestueuse','Bold'],       faceShapes:['oval','square','long'],                            localImage:'/styles/napi2.jpg' },
  { id:'dreadlocks',       name:'Dreadlocks',        region:'Afrique de l\'Est',   duration:'3-4h',  difficulty:'Intermédiaire', tags:['Naturelle','Authentique'],  faceShapes:['oval','square','diamond','long'],                  localImage:'/styles/napi3.jpg' },
  { id:'ethiopian-braids', name:'Ethiopian Braids',  region:'Éthiopie',            duration:'3-4h',  difficulty:'Avancée',       tags:['Géométrique','Culturelle'], faceShapes:['oval','long','square'],                            localImage:'/styles/napi4.jpg' },
  { id:'jumbo-braids',     name:'Jumbo Braids',      region:'Pan-Africain',        duration:'3-5h',  difficulty:'Intermédiaire', tags:['XXL','Moderne'],            faceShapes:['long','square','diamond'],                         localImage:'/styles/napi5.jpg' },
  { id:'passion-twist',    name:'Passion Twist',     region:'Pan-Africain',        duration:'4-6h',  difficulty:'Intermédiaire', tags:['Bohème','Romantique'],      faceShapes:['round','heart','oval'],                            localImage:'/styles/napi6.jpg' },
  { id:'faux-locs',        name:'Faux Locs',         region:'Pan-Africain',        duration:'5-7h',  difficulty:'Intermédiaire', tags:['Bohème','Longue durée'],    faceShapes:['oval','square','diamond','long'],                  localImage:'/styles/napi7.jpg' },
  { id:'feed-in-braids',   name:'Feed-in Braids',    region:'Pan-Africain',        duration:'2-4h',  difficulty:'Intermédiaire', tags:['Naturelle','Discrète'],     faceShapes:['oval','round','long','heart'],                     localImage:'/styles/akoto.jpg' },
  { id:'tribal-braids',    name:'Tribal Braids',     region:'Pan-Africain',        duration:'5-7h',  difficulty:'Avancée',       tags:['Tribal','Unique'],          faceShapes:['oval','square','diamond'],                         localImage:'/styles/napi1.jpg' },
  { id:'spring-twist',     name:'Spring Twist',      region:'Pan-Africain',        duration:'4-5h',  difficulty:'Intermédiaire', tags:['Légère','Rebond'],          faceShapes:['round','heart','oval','square'],                   localImage:'/styles/napi2.jpg' },
  { id:'butterfly-locs',   name:'Butterfly Locs',    region:'Pan-Africain',        duration:'5-7h',  difficulty:'Avancée',       tags:['Bohème','Ondulé'],          faceShapes:['oval','heart','round'],                            localImage:'/styles/napi3.jpg' },
  { id:'stitch-braids',    name:'Stitch Braids',     region:'Pan-Africain',        duration:'3-5h',  difficulty:'Avancée',       tags:['Précise','Géométrique'],    faceShapes:['oval','long','square','diamond'],                  localImage:'/styles/napi4.jpg' },
  { id:'boho-braids',      name:'Boho Braids',       region:'Pan-Africain',        duration:'6-8h',  difficulty:'Intermédiaire', tags:['Bohème','Naturelle'],       faceShapes:['oval','heart','round','diamond'],                  localImage:'/styles/napi5.jpg' },
  { id:'havana-twist',     name:'Havana Twist',      region:'Pan-Africain',        duration:'4-6h',  difficulty:'Intermédiaire', tags:['Volume','Épais'],           faceShapes:['long','square','diamond','oval'],                  localImage:'/styles/napi6.jpg' },
  { id:'crochet-braids',   name:'Crochet Braids',    region:'Afrique Centrale',    duration:'2-3h',  difficulty:'Intermédiaire', tags:['Rapide','Volume'],          faceShapes:['oval','round','heart','square'],                   localImage:'/styles/napi7.jpg' },
  { id:'maasai-braids',    name:'Maasai Braids',     region:'Kenya',               duration:'4-6h',  difficulty:'Avancée',       tags:['Perles','Est-Africain'],    faceShapes:['oval','heart','diamond'],                          localImage:'/styles/akoto.jpg' },
  { id:'berber-braids',    name:'Berber Braids',     region:'Maroc / Algérie',     duration:'3-5h',  difficulty:'Avancée',       tags:['Bijoux','Nord-Africain'],   faceShapes:['oval','heart','round'],                            localImage:'/styles/napi1.jpg' },
]

const FACE_SHAPE_NAMES = {
  oval:'Ovale', round:'Ronde', square:'Carrée',
  heart:'Cœur', long:'Longue', diamond:'Diamant',
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

function pickTwoStyles(faceShape) {
  const compatible = BRAIDS_LIBRARY.filter(s => s.faceShapes.includes(faceShape))
  const shuffled   = [...compatible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2)
}

// Fal.ai hair-change — sera activé en Phase 2
// Pour l'instant on affiche les photos de la bibliothèque locale
async function applyHairStyle(selfieDataUri, styleImageUrl, falApiKey) {
  // TODO Phase 2 : intégration Fal.ai quand l'API upload sera stable
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquante' })
  const falKey = process.env.FAL_API_KEY // Phase 2

  try {
    // 1. Récupérer le selfie
    const { files } = await parseForm(req)
    const photoFile  = files.photo?.[0] || files.photo
    if (!photoFile)  return res.status(400).json({ error: 'Aucune photo reçue.' })

    const selfieBuffer = fs.readFileSync(photoFile.filepath || photoFile.path)
    const base64Image  = selfieBuffer.toString('base64')
    const mimeType     = photoFile.mimetype || photoFile.type || 'image/jpeg'

    // 2. Claude analyse la forme du visage
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
          system: `Expert morphologie visage. JSON uniquement :
{"faceShape":"oval","confidence":0.92,"reason":"front large, machoire douce"}
Formes : oval, round, square, heart, long, diamond`,
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
    } catch(e) { console.error('Claude error:', e) }

    // 3. Piocher exactement 2 styles
    const selected = pickTwoStyles(faceShape)

    // 4. Construire les 2 recommandations avec photos locales
    const recommendations = selected.map((style) => ({
      id:             style.id,
      name:           style.name,
      region:         style.region,
      duration:       style.duration,
      difficulty:     style.difficulty,
      tags:           style.tags,
      localImage:     style.localImage,
      generatedImage: null, // Phase 2 : Fal.ai
      matchScore:     Math.floor(Math.random() * 15) + 83,
    }))

    return res.status(200).json({
      faceShape,
      faceShapeName:   FACE_SHAPE_NAMES[faceShape],
      confidence:      Math.round(confidence * 100),
      reason,
      analysisId:      Date.now().toString(36),
      recommendations: recommendations.slice(0, 2),
    })

  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({ error: 'Analyse échouée. Réessaie.' })
  }
}
