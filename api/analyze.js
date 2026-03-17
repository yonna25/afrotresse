import { IncomingForm } from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const BRAIDS_LIBRARY = [
  { id:'box-braids',       name:'Box Braids',       region:'Afrique de l Ouest', duration:'4-6h',  difficulty:'Intermediaire', tags:['Classique','Protectrice'],  faceShapes:['oval','round','square','heart','diamond'],        localImage:'/styles/napi1.jpg' },
  { id:'knotless-braids',  name:'Knotless Braids',  region:'Afrique de l Ouest', duration:'6-8h',  difficulty:'Intermediaire', tags:['Moderne','Naturelle'],      faceShapes:['oval','round','square','heart','diamond','long'],  localImage:'/styles/napi2.jpg' },
  { id:'cornrows',         name:'Cornrows',          region:'Afrique de l Ouest', duration:'2-4h',  difficulty:'Avancee',       tags:['Sport','Legere'],           faceShapes:['oval','long','square','diamond'],                  localImage:'/styles/napi3.jpg' },
  { id:'fulani-braids',    name:'Fulani Braids',     region:'Afrique de l Ouest', duration:'3-5h',  difficulty:'Avancee',       tags:['Perles','Unique'],          faceShapes:['oval','heart','diamond'],                          localImage:'/styles/napi4.jpg' },
  { id:'ghana-braids',     name:'Ghana Braids',      region:'Ghana',              duration:'3-4h',  difficulty:'Intermediaire', tags:['Bold','Structuree'],        faceShapes:['oval','long','diamond'],                           localImage:'/styles/napi5.jpg' },
  { id:'senegalese-twist', name:'Senegalese Twist',  region:'Senegal',            duration:'5-7h',  difficulty:'Intermediaire', tags:['Volume','Elegante'],        faceShapes:['round','square','heart','oval'],                   localImage:'/styles/napi6.jpg' },
  { id:'lemonade-braids',  name:'Lemonade Braids',   region:'Afrique de l Ouest', duration:'4-6h',  difficulty:'Avancee',       tags:['Tendance','Glamour'],       faceShapes:['round','square','heart'],                          localImage:'/styles/napi7.jpg' },
  { id:'micro-braids',     name:'Micro Braids',      region:'Afrique de l Ouest', duration:'8-12h', difficulty:'Expert',        tags:['Delicate','Versatile'],     faceShapes:['oval','long','heart'],                             localImage:'/styles/akoto.jpg' },
  { id:'bantu-knots',      name:'Bantu Knots',       region:'Afrique Centrale',   duration:'2-3h',  difficulty:'Intermediaire', tags:['Naturelle','Culturelle'],   faceShapes:['oval','round','heart'],                            localImage:'/styles/napi1.jpg' },
  { id:'goddess-braids',   name:'Goddess Braids',    region:'Afrique Centrale',   duration:'4-5h',  difficulty:'Avancee',       tags:['Majestueuse','Bold'],       faceShapes:['oval','square','long'],                            localImage:'/styles/napi2.jpg' },
  { id:'dreadlocks',       name:'Dreadlocks',        region:'Afrique de l Est',   duration:'3-4h',  difficulty:'Intermediaire', tags:['Naturelle','Authentique'],  faceShapes:['oval','square','diamond','long'],                  localImage:'/styles/napi3.jpg' },
  { id:'ethiopian-braids', name:'Ethiopian Braids',  region:'Ethiopie',           duration:'3-4h',  difficulty:'Avancee',       tags:['Geometrique','Culturelle'], faceShapes:['oval','long','square'],                            localImage:'/styles/napi4.jpg' },
  { id:'jumbo-braids',     name:'Jumbo Braids',      region:'Pan-Africain',       duration:'3-5h',  difficulty:'Intermediaire', tags:['XXL','Moderne'],            faceShapes:['long','square','diamond'],                         localImage:'/styles/napi5.jpg' },
  { id:'passion-twist',    name:'Passion Twist',     region:'Pan-Africain',       duration:'4-6h',  difficulty:'Intermediaire', tags:['Boheme','Romantique'],      faceShapes:['round','heart','oval'],                            localImage:'/styles/napi6.jpg' },
  { id:'faux-locs',        name:'Faux Locs',         region:'Pan-Africain',       duration:'5-7h',  difficulty:'Intermediaire', tags:['Boheme','Longue duree'],    faceShapes:['oval','square','diamond','long'],                  localImage:'/styles/napi7.jpg' },
  { id:'feed-in-braids',   name:'Feed-in Braids',    region:'Pan-Africain',       duration:'2-4h',  difficulty:'Intermediaire', tags:['Naturelle','Discrete'],     faceShapes:['oval','round','long','heart'],                     localImage:'/styles/akoto.jpg' },
  { id:'tribal-braids',    name:'Tribal Braids',     region:'Pan-Africain',       duration:'5-7h',  difficulty:'Avancee',       tags:['Tribal','Unique'],          faceShapes:['oval','square','diamond'],                         localImage:'/styles/napi1.jpg' },
  { id:'spring-twist',     name:'Spring Twist',      region:'Pan-Africain',       duration:'4-5h',  difficulty:'Intermediaire', tags:['Legere','Rebond'],          faceShapes:['round','heart','oval','square'],                   localImage:'/styles/napi2.jpg' },
  { id:'butterfly-locs',   name:'Butterfly Locs',    region:'Pan-Africain',       duration:'5-7h',  difficulty:'Avancee',       tags:['Boheme','Ondule'],          faceShapes:['oval','heart','round'],                            localImage:'/styles/napi3.jpg' },
  { id:'stitch-braids',    name:'Stitch Braids',     region:'Pan-Africain',       duration:'3-5h',  difficulty:'Avancee',       tags:['Precise','Geometrique'],    faceShapes:['oval','long','square','diamond'],                  localImage:'/styles/napi4.jpg' },
  { id:'boho-braids',      name:'Boho Braids',       region:'Pan-Africain',       duration:'6-8h',  difficulty:'Intermediaire', tags:['Boheme','Naturelle'],       faceShapes:['oval','heart','round','diamond'],                  localImage:'/styles/napi5.jpg' },
  { id:'havana-twist',     name:'Havana Twist',      region:'Pan-Africain',       duration:'4-6h',  difficulty:'Intermediaire', tags:['Volume','Epais'],           faceShapes:['long','square','diamond','oval'],                  localImage:'/styles/napi6.jpg' },
  { id:'crochet-braids',   name:'Crochet Braids',    region:'Afrique Centrale',   duration:'2-3h',  difficulty:'Intermediaire', tags:['Rapide','Volume'],          faceShapes:['oval','round','heart','square'],                   localImage:'/styles/napi7.jpg' },
  { id:'maasai-braids',    name:'Maasai Braids',     region:'Kenya',              duration:'4-6h',  difficulty:'Avancee',       tags:['Perles','Est-Africain'],    faceShapes:['oval','heart','diamond'],                          localImage:'/styles/akoto.jpg' },
  { id:'berber-braids',    name:'Berber Braids',     region:'Maroc / Algerie',    duration:'3-5h',  difficulty:'Avancee',       tags:['Bijoux','Nord-Africain'],   faceShapes:['oval','heart','round'],                            localImage:'/styles/napi1.jpg' },
]

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

function pickTwoStyles(faceShape) {
  const compatible = BRAIDS_LIBRARY.filter(s => s.faceShapes.includes(faceShape))
  const shuffled   = [...compatible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

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
          system: 'Expert morphologie visage. JSON uniquement : {"faceShape":"oval","confidence":0.92,"reason":"front large, machoire douce"}\nFormes : oval, round, square, heart, long, diamond',
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

    const selected = pickTwoStyles(faceShape)

    const recommendations = selected.map((style) => ({
      id:             style.id,
      name:           style.name,
      region:         style.region,
      duration:       style.duration,
      difficulty:     style.difficulty,
      tags:           style.tags,
      localImage:     style.localImage,
      generatedImage: null,
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
    return res.status(500).json({ error: 'Analyse echouee. Reessaie.' })
  }
}
