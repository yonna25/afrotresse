import { analyzeFaceWithAI } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

// --- CONSTANTES EXPORTÉES ---
export const FACE_SHAPE_NAMES = {
  oval: "Ovale",
  round: "Ronde",
  square: "Carrée",
  heart: "Cœur",
  long: "Allongée",
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
  // --- TES 5 NOUVEAUX STYLES ---
  {
    id: "pompom",
    name: "Pompom Braids",
    description: "Un style ludique qui ajoute de la hauteur pour affiner le visage.",
    tags: ["Volume", "Jeune", "Tendance"],
    faceShapes: ["round", "square", "oval", "heart", "diamond"],
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
    description: "Un look net qui met en valeur la structure osseuse sans surcharge.",
    tags: ["Minimaliste", "Sport", "Nette"],
    faceShapes: ["oval", "long", "diamond", "square", "heart"],
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
    description: "Des tresses sculpturales qui adoucissent les traits et encadrent le regard.",
    tags: ["Sculptural", "Élégant", "Durable"],
    faceShapes: ["square", "heart", "oval", "diamond", "round", "long"],
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
    description: "Style versatile qui suit les courbes naturelles de ton visage.",
    tags: ["Protectrice", "Chic", "Classique"],
    faceShapes: ["oval", "long", "diamond", "heart", "round", "square"],
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
    description: "Le volume des puffs attire le regard vers le haut, idéal pour harmoniser le visage.",
    tags: ["Mixte", "Volume", "Moderne"],
    faceShapes: ["round", "heart", "oval", "square", "diamond"],
    duration: "3-4h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/cornowspuffs-face.jpg",
      back: "/styles/cornowspuffs-back.jpg",
      top:  "/styles/cornowspuffs-top.jpg"
    },
    matchScore: 94
  },
  
  // --- TES STYLES PRÉCÉDENTS (RE-SYNCHRONISÉS) ---
  {
    id: "box-braids",
    name: "Box Braids",
    description: "Intemporelles et protectrices, elles s'adaptent à toutes les occasions.",
    tags: ["Protectrice", "Classique", "Polyvalente"],
    faceShapes: ["oval", "round", "square", "heart", "long", "diamond"],
    duration: "4-6h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/boxbraids-face.jpg",
      back: "/styles/boxbraids-back.jpg",
      top:  "/styles/boxbraids-top.jpg"
    },
    matchScore: 97
  },
  {
    id: "coco-twists",
    name: "Coco Twists",
    description: "Des vanilles volumineuses pour un look naturel et plein de mouvement.",
    tags: ["Volume", "Légèreté", "Texture"],
    faceShapes: ["round", "square", "heart", "oval", "diamond"],
    duration: "5-7h",
    difficulty: "Intermédiaire",
    views: {
      face: "/styles/cocotwists-face.jpg",
      back: "/styles/cocotwists-back.jpg",
      top:  "/styles/cocotwists-top.jpg"
    },
    matchScore: 91
  },
  {
    id: "fulani-braids",
    name: "Fulani Style",
    description: "Tresses artistiques inspirées de la culture peule, souvent ornées de perles.",
    tags: ["Culturel", "Perles", "Artistique"],
    faceShapes: ["oval", "heart", "diamond", "long"],
    duration: "3-5h",
    difficulty: "Avancée",
    views: {
      face: "/styles/fulani-face.jpg",
      back: "/styles/fulani-back.jpg",
      top:  "/styles/fulani-top.jpg"
    },
    matchScore: 89
  },
  {
    id: "stitch-braids",
    name: "Stitch Braids",
    description: "Une technique de tresses plaquées ultra-précise avec des lignes graphiques.",
    tags: ["Graphique", "Précision", "Moderne"],
    faceShapes: ["oval", "long", "square", "diamond", "round"],
    duration: "3-5h",
    difficulty: "Avancée",
    views: {
      face: "/styles/stitchbraids-face.jpg",
      back: "/styles/stitchbraids-back.jpg",
      top:  "/styles/stitchbraids-top.jpg"
    },
    matchScore: 88
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
