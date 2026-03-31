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
  {
    id: "pompom",
    name: "Pompom Braids",
    description: "Un style ludique qui ajoute de la hauteur pour affiner le visage.",
    tags: ["Volume", "Jeune"],
    faceShapes: ["round", "square", "oval", "heart", "diamond"],
    matchScore: 98,
    views: { face: "/styles/Pompom-face.jpg", back: "/styles/Pompom-back.jpg", top: "/styles/Pompom-top.jpg" }
  },
  {
    id: "tresseplaquees",
    name: "Tresses Plaquées",
    description: "Un look net qui met en valeur la structure osseuse sans surcharge.",
    tags: ["Minimaliste", "Nette"],
    faceShapes: ["oval", "long", "diamond", "square", "heart"],
    matchScore: 95,
    views: { face: "/styles/tresseplaquees-face.jpg", back: "/styles/tresseplaquees-back.jpg", top: "/styles/tresseplaquees-top.jpg" }
  },
  {
    id: "ghanabraids",
    name: "Ghana Braids",
    description: "Des tresses sculpturales qui adoucissent les traits et encadrent le regard.",
    tags: ["Sculptural", "Élégant"],
    faceShapes: ["square", "heart", "oval", "diamond", "round", "long"],
    matchScore: 96,
    views: { face: "/styles/ghanabraids-face.jpg", back: "/styles/ghanabraids-back.jpg", top: "/styles/ghanabraids-top.jpg" }
  },
  {
    id: "tressecollees",
    name: "Tresses Collées",
    description: "Style versatile qui suit les courbes naturelles de ton visage.",
    tags: ["Protectrice", "Chic"],
    faceShapes: ["oval", "long", "diamond", "heart", "round", "square"],
    matchScore: 92,
    views: { face: "/styles/tressecollees-face.jpg", back: "/styles/tressecollees-back.jpg", top: "/styles/tressecollees-top.jpg" }
  },
  {
    id: "cornrowspuffs",
    name: "Cornrows & Puffs",
    description: "Le mélange parfait entre tresses nettes et volume naturel.",
    tags: ["Mixte", "Volume"],
    faceShapes: ["round", "heart", "oval", "square", "diamond"],
    matchScore: 94,
    views: { face: "/styles/cornowspuffs-face.jpg", back: "/styles/cornowspuffs-back.jpg", top: "/styles/cornowspuffs-top.jpg" }
  },
  {
    id: "box-braids",
    name: "Box Braids",
    description: "Intemporelles et protectrices, elles s'adaptent à toutes les occasions.",
    tags: ["Protectrice", "Classique"],
    faceShapes: ["oval", "round", "square", "heart", "long", "diamond"],
    matchScore: 90,
    views: { face: "/styles/boxbraids-face.jpg", back: "/styles/boxbraids-back.jpg", top: "/styles/boxbraids-top.jpg" }
  },
  {
    id: "coco-twists",
    name: "Coco Twists",
    description: "Des vanilles volumineuses pour un look naturel et léger.",
    tags: ["Volume", "Texture"],
    faceShapes: ["round", "square", "heart", "oval", "diamond"],
    matchScore: 88,
    views: { face: "/styles/cocotwists-face.jpg", back: "/styles/cocotwists-back.jpg", top: "/styles/cocotwists-top.jpg" }
  },
  {
    id: "fulani-braids",
    name: "Fulani Style",
    description: "Tresses artistiques inspirées de la culture peule avec perles.",
    tags: ["Culturel", "Perles"],
    faceShapes: ["oval", "heart", "diamond", "long"],
    matchScore: 87,
    views: { face: "/styles/fulani-face.jpg", back: "/styles/fulani-back.jpg", top: "/styles/fulani-top.jpg" }
  },
  {
    id: "stitch-braids",
    name: "Stitch Braids",
    description: "Une technique de tresses plaquées ultra-précise et graphique.",
    tags: ["Graphique", "Précision"],
    faceShapes: ["oval", "long", "square", "diamond", "round"],
    matchScore: 86,
    views: { face: "/styles/stitchbraids-face.jpg", back: "/styles/stitchbraids-back.jpg", top: "/styles/stitchbraids-top.jpg" }
  }
];

// --- LOGIQUE D'ANALYSE ---
export async function analyzeFace(photoBlob) {
  try {
    const result = await analyzeFaceWithAI(photoBlob, 8000);
    const faceShape = detectFaceShape(result.landmarks);
    const confidence = calculateConfidence(result.landmarks);
    return buildRecommendations(faceShape, "", confidence);
  } catch (err) {
    console.error("Face analysis error:", err);
    return buildRecommendations("oval", "Fallback", 0.75);
  }
}

function buildRecommendations(faceShape, reason = "", confidence = 0.85) {
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    faceShape,
    faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[faceShape] || "",
    recommendations: matching
  };
}

// --- FONCTION POUR LES LOTS (BATCHING) ---
export function getNextBatch(faceShape, seenIds = [], batchSize = 3) {
  // On filtre les styles compatibles qui n'ont PAS encore été vus
  const available = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape) && !seenIds.includes(b.id))
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    batch: available.slice(0, batchSize),
    hasMore: available.length > batchSize
  };
}
