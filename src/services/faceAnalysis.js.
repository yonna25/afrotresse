import { analyzeFaceWithAI } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

// --- CONSTANTES EXPORTÉES ---
export const FACE_SHAPE_NAMES = {
  oval: "Ovale",
  round: "Ronde",
  square: "Carrée",
  heart: "Coeur",
  long: "Longue",
  diamond: "Diamant"
};

export const FACE_SHAPE_DESCRIPTIONS = {
  oval: "Visage équilibré — la plupart des styles te conviennent à merveille.",
  round: "Visage doux et rond — les styles avec du volume en haut allongeront tes traits.",
  square: "Visage anguleux — les styles souples adoucissent ta mâchoire.",
  heart: "Visage en cœur — les styles qui encadrent le visage équilibrent ton menton.",
  long: "Visage allongé — les styles sans trop de hauteur créent l'harmonie parfaite.",
  diamond: "Pommettes larges — les styles structurés te subliment."
};

export const BRAIDS_DB = [
  {
    id: "pompom",
    name: "Pompom Braids",
    description: "Un style ludique qui ajoute de la hauteur pour affiner et allonger visuellement le visage.",
    tags: ["Volume", "Jeune", "Tendance"],
    faceShapes: ["round", "square", "oval"],
    duration: "2-3h",
    difficulty: "Facile",
    views: {
      face: "/styles/Pompom-face.jpg",
      back: "/styles/Pompom-back.jpg",
      top:  "/styles/Pompom-top.jpg"
    },
    matchScore: 98
  },
  {
    id: "tresseplaquees",
    name: "Tresses Plaquées",
    description: "Un classique indémodable, net et précis pour un look soigné qui ne surcharge pas le visage.",
    tags: ["Minimaliste", "Sport", "Nette"],
    faceShapes: ["oval", "long", "diamond"],
    duration: "2-4h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/tresseplaquees-face.jpg",
      back: "/styles/tresseplaquees-back.jpg",
      top:  "/styles/tresseplaquees-top.jpg"
    },
    matchScore: 95
  },
  {
    id: "ghanabraids",
    name: "Ghana Braids",
    description: "Des tresses sculpturales qui commencent fines et s'épaississent pour adoucir les traits.",
    tags: ["Sculptural", "Élégant", "Durable"],
    faceShapes: ["square", "heart", "oval", "diamond"],
    duration: "3-5h",
    difficulty: "Avancée",
    views: {
      face: "/styles/ghanabraids-face.jpg",
      back: "/styles/ghanabraids-back.jpg",
      top:  "/styles/ghanabraids-top.jpg"
    },
    matchScore: 96
  },
  {
    id: "tressecollees",
    name: "Tresses Collées",
    description: "Idéal pour protéger vos cheveux tout en gardant un style sophistiqué proche du cuir chevelu.",
    tags: ["Protectrice", "Quotidien", "Chic"],
    faceShapes: ["oval", "long", "diamond", "heart"],
    duration: "2-4h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/tressecollees-face.jpg",
      back: "/styles/tressecollees-back.jpg",
      top:  "/styles/tressecollees-top.jpg"
    },
    matchScore: 92
  },
  {
    id: "cornrowspuffs",
    name: "Cornrows & Puffs",
    description: "Le mélange parfait entre tresses nettes et volume naturel pour attirer le regard vers le haut.",
    tags: ["Mixte", "Volume", "Moderne"],
    faceShapes: ["round", "heart", "oval"],
    duration: "3-4h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/cornowspuffs-face.jpg",
      back: "/styles/cornowspuffs-back.jpg",
      top:  "/styles/cornowspuffs-top.jpg"
    },
    matchScore: 94
  }
];

// --- LOGIQUE D'ANALYSE ---
export async function analyzeFace(photoBlob) {
  try {
    const result = await analyzeFaceWithAI(photoBlob, 8000)
    const faceShape = detectFaceShape(result.landmarks)
    const confidence = calculateConfidence(result.landmarks)
    return buildRecommendations(faceShape, "", confidence)
  } catch (err) {
    console.error("Face analysis error:", err)
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
