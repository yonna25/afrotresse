import { useFaceAnalysis } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

export const BRAIDS_DB = [
  {
    id: "box-braids",
    name: "Box Braids",
    description: "Intemporelles et polyvalentes, parfaites pour tous types de visages.",
    faceShapes: ["oval", "round", "square", "heart", "diamond"],
    matchScore: 98,
    views: {
      face: "/styles/boxbraids-face.jpg",
      back: "/styles/boxbraids-back.jpg",
      top: "/styles/boxbraids-top.jpg"
    }
  },
  {
    id: "coco-twists",
    name: "Coco Twists",
    description: "Les twists apportent volume et texture pour une silhouette majestueuse.",
    faceShapes: ["round", "square", "heart"],
    matchScore: 92,
    views: {
      face: "/styles/cocotwists-face.jpg",
      back: "/styles/cocotwists-back.jpg",
      top: "/styles/cocotwists-top.jpg"
    }
  },
  {
    id: "cornrows",
    name: "Cornrows Design",
    description: "Les cornrows sculptent le crâne et mettent en valeur les traits.",
    faceShapes: ["oval", "long", "square"],
    matchScore: 95,
    views: {
      face: "/styles/cornrows-face.jpg",
      back: "/styles/cornrows-back.jpg",
      top: "/styles/cornrows-top.jpg"
    }
  }
];

const FACE_SHAPE_NAMES = {
  oval: "Ovale", round: "Ronde", square: "Carrée", heart: "Coeur", long: "Longue", diamond: "Diamant"
};

export async function analyzeFace(photoBlob) {
  try {
    const result = await useFaceAnalysis(photoBlob, 8000);
    const faceShape = detectFaceShape(result.landmarks);
    const confidence = calculateConfidence(result.landmarks);
    return buildRecommendations(faceShape, confidence);
  } catch (err) {
    console.error("Analyse error:", err);
    return buildRecommendations("oval", 0.75);
  }
}

function buildRecommendations(faceShape, confidence = 0.85) {
  const matching = BRAIDS_DB
    .filter(b => b.faceShapes.includes(faceShape))
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    faceShape,
    faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
    confidence: Math.round(confidence * 100),
    recommendations: matching
  };
}
