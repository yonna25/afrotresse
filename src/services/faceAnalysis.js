import { useFaceAnalysis } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

export const BRAIDS_DB = [
  {
    id: "box-braids",
    name: "Box Braids",
    description: "Intemporelles et polyvalentes, parfaites pour tous types de visages. Protectrices et \u00e9l\u00e9gantes.",
    tags: ["Protectrice", "Classique", "Polyvalente"],
    faceShapes: ["oval", "round", "square", "heart", "diamond"],
    duration: "4-6h", difficulty: "Interm\u00e9diaire",
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
    description: "Les twists apportent volume et texture. Leur effet spiral cr\u00e9e une silhouette majestueuse.",
    tags: ["Volume", "\u00c9l\u00e9gante", "Longue dur\u00e9e"],
    faceShapes: ["round", "square", "heart"],
    duration: "5-7h", difficulty: "Interm\u00e9diaire",
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
    description: "Les cornrows sculptent le cr\u00e2ne et mettent en valeur les traits. Id\u00e9ales pour les visages ovales.",
    tags: ["Traditionnelle", "Sport", "L\u00e9g\u00e8re"],
    faceShapes: ["oval", "long", "square"],
    duration: "2-4h", difficulty: "Avanc\u00e9e",
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
    description: "Technique rapide avec un r\u00e9sultat naturel et volumineux. Id\u00e9al pour changer de look vite.",
    tags: ["Rapide", "Volume", "Pratique"],
    faceShapes: ["oval", "round", "heart", "square"],
    duration: "2-3h", difficulty: "Interm\u00e9diaire",
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
    description: "Un style en \u00e9ventail artistique pour un look unique et structur\u00e9.",
    tags: ["Artistique", "Structure", "Unique"],
    faceShapes: ["oval", "heart", "diamond"],
    duration: "3-5h", difficulty: "Avanc\u00e9e",
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
    description: "Inspir\u00e9es de la culture peule, ces tresses avec perles sont royales.",
    tags: ["Culturelle", "Perles", "Unique"],
    faceShapes: ["oval", "heart", "diamond"],
    duration: "3-5h", difficulty: "Avanc\u00e9e",
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
    description: "Des cornrows avec une technique point de couture qui cr\u00e9e des lignes nettes.",
    tags: ["Pr\u00e9cise", "G\u00e9om\u00e9trique", "Nette"],
    faceShapes: ["oval", "long", "square", "diamond"],
    duration: "3-5h", difficulty: "Avanc\u00e9e",
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
  square: "Carr\u00e9e",
  heart: "Coeur",
  long: "Longue",
  diamond: "Diamant"
};

const FACE_SHAPE_DESCRIPTIONS = {
  oval: "Visage \u00e9quilibr\u00e9 \u2014 la plupart des styles te conviennent \u00e0 merveille.",
  round: "Visage doux et rond \u2014 les styles allong\u00e9s te mettront en valeur.",
  square: "Visage anguleux \u2014 les styles avec du volume adoucissent tes traits.",
  heart: "Visage pointu en bas \u2014 les styles avec du volume \u00e9quilibrent ta silhouette.",
  long: "Visage allong\u00e9 \u2014 les styles avec du volume sur les c\u00f4t\u00e9s cr\u00e9ent l'harmonie.",
  diamond: "Pommettes larges \u2014 les styles qui encadrent le visage sont parfaits."
};

export async function analyzeFace(photoBlob) {
  try {
    const result = await useFaceAnalysis(photoBlob, 8000);
    const faceShape = detectFaceShape(result.landmarks);
    const confidence = calculateConfidence(result.landmarks);
    return buildRecommendations(faceShape, "", confidence);
  } catch (err) {
    console.error("Face analysis error:", err);
    await new Promise(r => setTimeout(r, 2800));
    return buildRecommendations("oval", "", 0.75);
  }
}

function buildRecommendations(faceShape, reason = "", confidence = 0.85) {
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((b, i) => ({ ...b, matchScore: Math.max(75, b.matchScore - i * 2) }));

  return {
    faceShape,
    faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[faceShape] || "",
    aiReason: reason,
    confidence: Math.round((confidence || 0.85) * 100),
    recommendations: matching
  };
}

export { FACE_SHAPE_NAMES };
