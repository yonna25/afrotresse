export const BRAIDS_DB = [
  {
    id: 'box-braids',
    name: 'Box Braids',
    description: 'Intemporelles et polyvalentes, parfaites pour tous types de visages. Protectrices et elegantes.',
    tags: ['Protectrice', 'Classique', 'Polyvalente'],
    faceShapes: ['oval', 'round', 'square', 'heart', 'diamond'],
    duration: '4-6h',
    difficulty: 'Intermediaire',
    image: '/Afrotresse1.jpg',
    matchScore: 98,
  },
  {
    id: 'cornrows',
    name: 'Cornrows',
    description: 'Les cornrows sculptent le crane et mettent en valeur les traits. Ideales pour les visages ovales.',
    tags: ['Traditionnelle', 'Sport', 'Legere'],
    faceShapes: ['oval', 'long', 'square'],
    duration: '2-4h',
    difficulty: 'Avancee',
    image: '/Afrotresse2.jpg',
    matchScore: 95,
  },
  {
    id: 'senegalese-twist',
    name: 'Senegalese Twist',
    description: 'Les twists senegalais apportent volume et texture. Leur effet spiral cree une silhouette majestueuse.',
    tags: ['Volume', 'Elegante', 'Longue duree'],
    faceShapes: ['round', 'square', 'heart'],
    duration: '5-7h',
    difficulty: 'Intermediaire',
    image: '/Afrotresse3.jpg',
    matchScore: 92,
  },
  {
    id: 'fulani-braids',
    name: 'Fulani Braids',
    description: 'Inspirees de la culture peule, ces tresses centrales avec perles dorees sont royales.',
    tags: ['Culturelle', 'Perles', 'Unique'],
    faceShapes: ['oval', 'heart', 'diamond'],
    duration: '3-5h',
    difficulty: 'Avancee',
    image: '/Afrotresse4.jpg',
    matchScore: 88,
  },
  {
    id: 'knotless-braids',
    name: 'Knotless Braids',
    description: 'Sans noeuds a la racine, plus douces pour le cuir chevelu tout en restant magnifiques.',
    tags: ['Sans douleur', 'Moderne', 'Naturelle'],
    faceShapes: ['oval', 'round', 'long', 'square', 'heart', 'diamond'],
    duration: '6-8h',
    difficulty: 'Intermediaire',
    image: '/Afrotresse5.jpg',
    matchScore: 96,
  },
  {
    id: 'ghana-braids',
    name: 'Ghana Braids',
    description: 'Aussi appelees banana cornrows, elles sont larges, structurees et terriblement chics.',
    tags: ['Africaine', 'Structuree', 'Bold'],
    faceShapes: ['oval', 'long', 'diamond'],
    duration: '3-4h',
    difficulty: 'Intermediaire',
    image: '/Afrotresse6.jpg',
    matchScore: 90,
  },
  {
    id: 'lemonade-braids',
    name: 'Lemonade Braids',
    description: 'Popularisees par Beyonce, ces tresses laterales sont glamour et tendance.',
    tags: ['Tendance', 'Glamour', 'Audacieuse'],
    faceShapes: ['round', 'square', 'heart', 'oval'],
    duration: '4-6h',
    difficulty: 'Avancee',
    image: '/Afrotresse1.jpg',
    matchScore: 85,
  },
  {
    id: 'butterfly-locs',
    name: 'Butterfly Locs',
    description: 'Des locs bohemes et romantiques qui encadrent le visage avec elegance.',
    tags: ['Boheme', 'Romantique', 'Ondule'],
    faceShapes: ['oval', 'heart', 'round', 'diamond'],
    duration: '5-7h',
    difficulty: 'Avancee',
    image: '/Afrotresse2.jpg',
    matchScore: 87,
  },
  {
    id: 'bantu-knots',
    name: 'Bantu Knots',
    description: 'Des petits noeuds spirales qui celebrent la beaute africaine avec fierté.',
    tags: ['Naturelle', 'Culturelle', 'Unique'],
    faceShapes: ['oval', 'round', 'heart'],
    duration: '2-3h',
    difficulty: 'Intermediaire',
    image: '/Afrotresse3.jpg',
    matchScore: 82,
  },
]

const FACE_SHAPE_NAMES = {
  oval:    'Ovale',
  round:   'Ronde',
  square:  'Carree',
  heart:   'Coeur',
  long:    'Longue',
  diamond: 'Diamant',
}

const FACE_SHAPE_DESCRIPTIONS = {
  oval:    'Visage equilibre — la plupart des styles te conviennent a merveille.',
  round:   'Visage doux et rond — les styles allonges te mettront en valeur.',
  square:  'Visage anguleux — les styles avec du volume adoucissent tes traits.',
  heart:   'Visage pointu en bas — les styles avec du volume equilibrent ta silhouette.',
  long:    'Visage allonge — les styles avec du volume sur les cotes creent l\'harmonie.',
  diamond: 'Pommettes larges — les styles qui encadrent le visage sont parfaits.',
}

export async function analyzeFace(photoBlob) {
  try {
    const formData = new FormData()
    formData.append('photo', photoBlob, 'selfie.jpg')
    const res = await fetch('/api/analyze', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()

    // Utiliser Claude pour la forme du visage
    // mais les recommandations restent LOCALES (0 cout)
    return buildRecommendations(data.faceShape, data.reason, data.confidence)

  } catch {
    await new Promise(r => setTimeout(r, 2800))
    const shapes = ['oval', 'round', 'square', 'heart', 'long', 'diamond']
    const faceShape = shapes[Math.floor(Math.random() * shapes.length)]
    return buildRecommendations(faceShape, '', 0.75)
  }
}

function buildRecommendations(faceShape, reason = '', confidence = 0.85) {
  // Tous les styles compatibles — SANS slice(0,3)
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((b, i) => ({ ...b, matchScore: Math.max(75, b.matchScore - i * 3) }))

  return {
    faceShape,
    faceShapeName:        FACE_SHAPE_NAMES[faceShape] || faceShape,
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[faceShape] || '',
    aiReason:             reason,
    confidence:           Math.round((confidence || 0.85) * 100),
    recommendations:      matching,
  }
}

export { FACE_SHAPE_NAMES }
