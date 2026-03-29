import { analyzeFaceWithAI } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

export const BRAIDS_DB = [
  {
    id: "box-braids",
    name: "Box Braids",
    description: "Intemporelles et polyvalentes, parfaites pour tous types de visages. Protectrices et élégantes.",
    tags: ["Protectrice", "Classique", "Polyvalente"],
    faceShapes: ["oval", "round", "square", "heart", "diamond"],
    duration: "4-6h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/boxbraids-face.jpg",
      back: "/styles/boxbraids-back.jpg",
      top: "/styles/boxbraids-top.jpg"
    },
    matchScore: 98
  },
  {
    id: "coco-twists",
    name: "Coco Twists",
    description: "Les twists apportent volume et texture. Leur effet spiral crée une silhouette majestueuse.",
    tags: ["Volume", "Élégante", "Longue durée"],
    faceShapes: ["round", "square", "heart"],
    duration: "5-7h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/cocotwists-face.jpg",
      back: "/styles/cocotwists-back.jpg",
      top: "/styles/cocotwists-top.jpg"
    },
    matchScore: 92
  },
  {
    id: "cornrows",
    name: "Cornrows Design",
    description: "Les cornrows sculptent le crâne et mettent en valeur les traits. Idéales pour les visages ovales.",
    tags: ["Traditionnelle", "Sport", "Légère"],
    faceShapes: ["oval", "long", "square"],
    duration: "2-4h",
    difficulty: "Avancée",
    views: {
      face: "/styles/cornrows-face.jpg",
      back: "/styles/cornrows-back.jpg",
      top: "/styles/cornrows-top.jpg"
    },
    matchScore: 95
  },
  {
    id: "crochet-braids",
    name: "Crochet Braids",
    description: "Technique rapide avec un résultat naturel et volumineux. Idéal pour changer de look vite.",
    tags: ["Rapide", "Volume", "Pratique"],
    faceShapes: ["oval", "round", "heart", "square"],
    duration: "2-3h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/crochetbraids-face.jpg",
      back: "/styles/crochetbraids-back.jpg",
      top: "/styles/crochetbraids-top.jpg"
    },
    matchScore: 79
  },
  {
    id: "fan-braids",
    name: "Fan Braids",
    description: "Un style en éventail artistique pour un look unique et structuré.",
    tags: ["Artistique", "Structure", "Unique"],
    faceShapes: ["oval", "heart", "diamond"],
    duration: "3-5h",
    difficulty: "Avancée",
    views: {
      face: "/styles/fanbraids-face.jpg",
      back: "/styles/fanbraids-back.jpg",
      top: "/styles/fanbraids-top.jpg"
    },
    matchScore: 88
  },
  {
    id: "fulani-braids",
    name: "Fulani Style",
    description: "Inspirées de la culture peule, ces tresses avec perles sont royales.",
    tags: ["Culturelle", "Perles", "Unique"],
    faceShapes: ["oval", "heart", "diamond"],
    duration: "3-5h",
    difficulty: "Avancée",
    views: {
      face: "/styles/fulani-face.jpg",
      back: "/styles/fulani-back.jpg",
      top: "/styles/fulani-top.jpg"
    },
    matchScore: 88
  },
  {
    id: "stitch-braids",
    name: "Stitch Braids",
    description: "Des cornrows avec une technique point de couture qui crée des lignes nettes.",
    tags: ["Précise", "Géométrique", "Nette"],
    faceShapes: ["oval", "long", "square", "diamond"],
    duration: "3-5h",
    difficulty: "Avancée",
    views: {
      face: "/styles/stitchbraids-face.jpg",
      back: "/styles/stitchbraids-back.jpg",
      top: "/styles/stitchbraids-top.jpg"
    },
    matchScore: 86
  }
];

const FACE_SHAPE_NAMES = {
  oval: "Ovale",
  round: "Ronde",
  square: "Carrée",
  heart: "Coeur",
  long: "Longue",
  diamond: "Diamant"
};

const FACE_SHAPE_DESCRIPTIONS = {
  oval: "Visage équilibré — la plupart des styles te conviennent à merveille.",
  round: "Visage doux et rond — les styles allongés te mettront en valeur.",
  square: "Visage anguleux — les styles avec du volume adoucissent tes traits.",
  heart: "Visage pointu en bas — les styles avec du volume équilibrent ta silhouette.",
  long: "Visage allongé — les styles avec du volume sur les côtés créent l'harmonie.",
  diamond: "Pommettes larges — les styles qui encadrent le visage sont parfaits."
};

export async function analyzeFace(photoBlob) {
  try {
    // ✅ appel de la fonction corrigée
    const result = await analyzeFaceWithAI(photoBlob, 8000)

    const faceShape = detectFaceShape(result.landmarks)
    const confidence = calculateConfidence(result.landmarks)

    return buildRecommendations(faceShape, "", confidence)
  } catch (err) {
    console.error("Face analysis error:", err)

    // fallback intelligent
    await new Promise(r => setTimeout(r, 1500))

    return buildRecommendations("oval", "Analyse par défaut (fallback)", 0.75)
  }
}

function buildRecommendations(faceShape, reason = "", confidence = 0.85) {
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((b, i) => ({
      ...b,
      matchScore: Math.max(75, b.matchScore - i * 2)
    }))

  return {
    faceShape,
    faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[faceShape] || "",
    aiReason: reason,
    confidence: Math.round((confidence || 0.85) * 100),
    recommendations: matching
  }
}

export { FACE_SHAPE_NAMES }
