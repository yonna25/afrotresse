// Braid catalogue with metadata
export const BRAIDS_DB = [
  {
    id: 'box-braids',
    name: 'Box Braids',
    description: 'Les box braids sont intemporelles et polyvalentes, parfaites pour tous types de visages. Protectrices et élégantes.',
    tags: ['Protectrice', 'Classique', 'Polyvalente'],
    faceShapes: ['oval', 'round', 'square', 'heart', 'diamond'],
    duration: '4–6h',
    difficulty: 'Intermédiaire',
    image: 'https://images.unsplash.com/photo-1611604548018-d56bbd85d681?w=400&q=80',
    matchScore: 98,
  },
  {
    id: 'cornrows',
    name: 'Cornrows',
    description: 'Les cornrows sculptent le crâne et mettent en valeur les traits. Idéales pour les visages ovales et longs.',
    tags: ['Traditionnelle', 'Sport', 'Légère'],
    faceShapes: ['oval', 'long', 'square'],
    duration: '2–4h',
    difficulty: 'Avancée',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
    matchScore: 95,
  },
  {
    id: 'senegalese-twist',
    name: 'Senegalese Twist',
    description: 'Les twists sénégalais apportent volume et texture. Leur effet spiral crée une silhouette majestueuse.',
    tags: ['Volume', 'Élégante', 'Longue durée'],
    faceShapes: ['round', 'square', 'heart'],
    duration: '5–7h',
    difficulty: 'Intermédiaire',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
    matchScore: 92,
  },
  {
    id: 'fulani-braids',
    name: 'Fulani Braids',
    description: 'Inspirées de la culture peule, ces tresses centrales avec perles dorées sont d\'une beauté royale.',
    tags: ['Culturelle', 'Perles', 'Unique'],
    faceShapes: ['oval', 'heart', 'diamond'],
    duration: '3–5h',
    difficulty: 'Avancée',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    matchScore: 88,
  },
  {
    id: 'knotless-braids',
    name: 'Knotless Braids',
    description: 'Sans nœuds à la racine, elles sont plus douces pour le cuir chevelu tout en restant magnifiques.',
    tags: ['Sans douleur', 'Moderne', 'Naturelle'],
    faceShapes: ['oval', 'round', 'long', 'square', 'heart', 'diamond'],
    duration: '6–8h',
    difficulty: 'Intermédiaire',
    image: 'https://images.unsplash.com/photo-1617722800977-2bc4ce0e6ac2?w=400&q=80',
    matchScore: 96,
  },
  {
    id: 'lemonade-braids',
    name: 'Lemonade Braids',
    description: 'Ces tresses latérales inspirées de Beyoncé allongent le visage et dégagent les traits.',
    tags: ['Tendance', 'Latérale', 'Glamour'],
    faceShapes: ['round', 'square', 'heart'],
    duration: '4–6h',
    difficulty: 'Avancée',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&q=80',
    matchScore: 85,
  },
  {
    id: 'ghana-braids',
    name: 'Ghana Braids',
    description: 'Aussi appelées banana cornrows, elles sont larges, structurées et terriblement chics.',
    tags: ['Africaine', 'Structurée', 'Bold'],
    faceShapes: ['oval', 'long', 'diamond'],
    duration: '3–4h',
    difficulty: 'Intermédiaire',
    image: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&q=80',
    matchScore: 90,
  },
  {
    id: 'micro-braids',
    name: 'Micro Braids',
    description: 'Fines comme des fils d\'or, les micro braids offrent une grande légèreté et une liberté de coiffage infinie.',
    tags: ['Délicate', 'Légère', 'Versatile'],
    faceShapes: ['oval', 'long', 'heart'],
    duration: '8–12h',
    difficulty: 'Expert',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80',
    matchScore: 82,
  },
]

const FACE_SHAPE_NAMES = {
  oval:    'Ovale',
  round:   'Ronde',
  square:  'Carrée',
  heart:   'Cœur',
  long:    'Longue',
  diamond: 'Diamant',
}

const FACE_SHAPE_DESCRIPTIONS = {
  oval:    'Visage équilibré — la plupart des styles te conviennent à merveille.',
  round:   'Visage doux et rond — les styles allongés te mettront en valeur.',
  square:  'Visage anguleux et fort — les styles avec du volume adoucissent tes traits.',
  heart:   'Visage pointu en bas — les styles avec du volume en bas équilibrent ta silhouette.',
  long:    'Visage allongé — les styles avec du volume sur les côtés créent l\'harmonie.',
  diamond: 'Pommettes larges — les styles qui encadrent le visage sont parfaits pour toi.',
}

/**
 * Calls /api/analyze with the photo blob.
 * Returns { faceShape, recommendations[] }
 */
export async function analyzeFace(photoBlob) {
  try {
    const formData = new FormData()
    formData.append('photo', photoBlob, 'selfie.jpg')

    const res = await fetch('/api/analyze', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return buildRecommendations(data.faceShape)
  } catch {
    // Fallback: simulate analysis
    await new Promise(r => setTimeout(r, 2800))
    const shapes = ['oval', 'round', 'square', 'heart', 'long', 'diamond']
    const faceShape = shapes[Math.floor(Math.random() * shapes.length)]
    return buildRecommendations(faceShape)
  }
}

function buildRecommendations(faceShape) {
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
    .map((b, i) => ({ ...b, matchScore: Math.max(75, b.matchScore - i * 3) }))

  return {
    faceShape,
    faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[faceShape] || '',
    recommendations: matching,
  }
}

export { FACE_SHAPE_NAMES }
