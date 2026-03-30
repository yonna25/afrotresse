import { analyzeFaceWithAI } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

// --- 1. LES NOMS ET DESCRIPTIONS ---
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
  round: "Visage doux et rond — les styles allongés te mettront en valeur.",
  square: "Visage anguleux — les styles avec du volume adoucissent tes traits.",
  heart: "Visage pointu en bas — les styles avec du volume équilibrent ta silhouette.",
  long: "Visage allongé — les styles avec du volume sur les côtés créent l'harmonie.",
  diamond: "Pommettes larges — les styles qui encadrent le visage sont parfaits."
};

// --- 2. LA BASE DE DONNÉES (Chemins simplifiés pour /public/styles/) ---
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
      face: "boxbraids-face.jpg",
      back: "boxbraids-back.jpg",
      top: "boxbraids-top.jpg"
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
      face: "cocotwists-face.jpg",
      back: "cocotwists-back.jpg",
      top: "cocotwists-top.jpg"
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
      face: "cornrows-face.jpg",
      back: "cornrows-back.jpg",
      top: "cornrows-top.jpg"
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
      face: "crochetbraids-face.jpg",
      back: "crochetbraids-back.jpg",
      top: "crochetbraids-top.jpg"
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
      face: "fanbraids-face.jpg",
      back: "fanbraids-back.jpg",
      top: "fanbraids-top.jpg"
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
      face: "fulani-face.jpg",
      back: "fulani-back.jpg",
      top: "fulani-top.jpg"
    },
    matchScore: 88
  },
  {
    id: "stitch-braids",
    name: "Stitch Braids",
    description: "Des nattes avec une technique point de couture qui crée des lignes nettes.",
    tags: ["Précise", "Géométrique", "Nette"],
    faceShapes: ["oval", "long", "square", "diamond"],
    duration: "3-5h",
    difficulty: "Avancée",
    views: {
      face: "stitchbraids-face.jpg",
      back: "stitchbraids-back.jpg",
      top: "stitchbraids-top.jpg"
    },
    matchScore: 86
  }
];

// --- 3. LOGIQUE D'ANALYSE ---
export async function analyzeFace(photoBlob) {
  try {
    const result = await analyzeFaceWithAI(photoBlob, 8000);
    const faceShape = detectFaceShape(result.landmarks);
    const confidence = calculateConfidence(result.landmarks);

    return buildRecommendations(faceShape, "", confidence);
  } catch (err) {
    console.error("Face analysis error:", err);
    await new Promise(r => setTimeout(r, 1500));
    return buildRecommendations("oval", "Analyse par défaut (fallback)", 0.75);
  }
}

function buildRecommendations(faceShape, reason = "", confidence = 0.85) {
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((b, i) => ({
      ...b,
      matchScore: Math.max(75, b.matchScore - i * 2)
    }));

  return {
    faceShape,
    faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[faceShape] || "",
    aiReason: reason,
    confidence: Math.round((confidence || 0.85) * 100),
    recommendations: matching
  };
}
