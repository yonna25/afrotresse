import { useFaceAnalysis } from '../hooks/useFaceAnalysis.js';
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js';

export const BRAIDS_DB = [
  {
    id: "box-braids",
    name: "Box Braids",
    description: "Intemporelles et polyvalentes, parfaites pour tous types de visages. Protectrices et élégantes.",
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
    description: "Les twists apportent volume et texture. Leur effet spiral crée une silhouette majestueuse.",
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

export async function analyzeFace(photoBlob) {
  try {
    const result = await useFaceAnalysis(photoBlob, 5000); 
    const faceShape = detectFaceShape(result.landmarks);
    const confidence = calculateConfidence(result.landmarks);
    
    return {
      faceShape,
      confidence: Math.round((confidence || 0.85) * 100),
      recommendations: BRAIDS_DB.filter(b => b.faceShapes.includes(faceShape))
    };
  } catch (err) {
    console.error("Erreur analyse:", err);
    return { faceShape: "oval", confidence: 75, recommendations: BRAIDS_DB };
  }
}
