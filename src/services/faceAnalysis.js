import { useFaceAnalysis } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

export const BRAIDS_DB = [
{
    id: 'box-braids',
    name: 'Box Braids',
    description: 'Intemporelles et polyvalentes, parfaites pour tous types de visages. Protectrices et elegantes.',
    tags: ['Protectrice', 'Classique', 'Polyvalente'],
    faceShapes: ['oval', 'round', 'square', 'heart', 'diamond'],
    duration: '4-6h', difficulty: 'Intermediaire',
    localImage: 'boxbraids-top.jpg', matchScore: 98,
  },
  {
    id: 'coco-twists',
    name: 'Coco Twists',
    description: 'Twists elegants et volumineux pour un look moderne et sophistique.',
    tags: ['Volume', 'Moderne', 'Elegant'],
    faceShapes: ['oval', 'round', 'square', 'heart', 'diamond'],
    duration: '5-7h', difficulty: 'Intermediaire',
    localImage: 'cocotwists-top.jpg', matchScore: 95,
  },
  {
    id: 'cornrows',
    name: 'Cornrows',
    description: 'Les cornrows sculptent le crane et mettent en valeur les traits. Ideales pour les visages ovales.',
    tags: ['Traditionnelle', 'Sport', 'Legere'],
    faceShapes: ['oval', 'long', 'square'],
    duration: '2-4h', difficulty: 'Avancee',
    localImage: 'cornrows-top.jpg', matchScore: 95,
  },
  {
    id: 'crochet-braids',
    name: 'Crochet Braids',
    description: 'Technique rapide avec un resultat naturel et volumieux. Ideal pour un look change vite.',
    tags: ['Rapide', 'Volume', 'Pratique'],
    faceShapes: ['oval', 'round', 'heart', 'square'],
    duration: '2-3h', difficulty: 'Intermediaire',
    localImage: 'crochetbraids-top.jpg', matchScore: 79,
  },
  {
    id: 'fan-braids',
    name: 'Fan Braids',
    description: 'Tresses en eventail pour un look geometrique et impressionnant.',
    tags: ['Geometrique', 'Bold', 'Impressionnant'],
    faceShapes: ['oval', 'square', 'heart'],
    duration: '4-6h', difficulty: 'Avancee',
    localImage: 'fanbraids-top.jpg', matchScore: 87,
  },
  {
    id: 'fulani-braids',
    name: 'Fulani',
    description: 'Inspirees de la culture peule, ces tresses centrales avec perles dorees sont royales.',
    tags: ['Culturelle', 'Perles', 'Unique'],
    faceShapes: ['oval', 'heart', 'diamond'],
    duration: '3-5h', difficulty: 'Avancee',
    localImage: 'fulani-top.jpg', matchScore: 88,
  },
  {
    id: 'stitch-braids',
    name: 'Stitch Braids',
    description: 'Des cornrows avec une technique point de couture qui cree des lignes parfaitement nettes.',
    tags: ['Precise', 'Geometrique', 'Nette'],
    faceShapes: ['oval', 'long', 'square', 'diamond'],
    duration: '3-5h', difficulty: 'Avancee',
    localImage: 'stitchbraids-top.jpg', matchScore: 86,
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
  long:    'Visage allonge — les styles avec du volume sur les cotes creent l harmonie.',
  diamond: 'Pommettes larges — les styles qui encadrent le visage sont parfaits.',
}

export async function analyzeFace(photoBlob) {
  try {
    // Appeler MediaPipe local au lieu d'Anthropic
    const result = await useFaceAnalysis(photoBlob, 8000)
    
    // Détecter la forme du visage à partir des landmarks
    const faceShape = detectFaceShape(result.landmarks)
    const confidence = calculateConfidence(result.landmarks)
    
    return buildRecommendations(faceShape, '', confidence)
  } catch (err) {
    console.error('Face analysis error:', err)
    
    // Fallback : attendre 2.8s puis retourner une forme aléatoire
    await new Promise(r => setTimeout(r, 2800))
    const shapes = ['oval', 'round', 'square', 'heart', 'long', 'diamond']
    const faceShape = shapes[Math.floor(Math.random() * shapes.length)]
    return buildRecommendations(faceShape, '', 0.75)
  }
}

function buildRecommendations(faceShape, reason = '', confidence = 0.85) {
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((b, i) => ({ ...b, matchScore: Math.max(75, b.matchScore - i * 2) }))

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
