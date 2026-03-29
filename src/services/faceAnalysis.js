import { useFaceAnalysis } from '../hooks/useFaceAnalysis.js';
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js';

// AJOUT DE "export" ICI
export const FACE_SHAPE_NAMES = {
  oval: "Ovale",
  round: "Ronde",
  square: "Carrée",
  heart: "Cœur",
  long: "Allongée",
  diamond: "Diamant"
};

export const BRAIDS_DB = [
  {
    id: "box-braids",
    name: "Box Braids",
    description: "Intemporelles et polyvalentes.",
    faceShapes: ["oval", "round", "square", "heart", "diamond"],
    matchScore: 98,
    views: { face: "/styles/boxbraids-face.jpg" }
  },
  {
    id: "ghana-weaving",
    name: "Ghana Weaving",
    description: "Courbes complexes et élégantes.",
    faceShapes: ["oval", "long", "heart"],
    matchScore: 95,
    views: { face: "/styles/ghana-face.jpg" }
  }
];

export async function analyzeFace(photoBlob) {
  try {
    const result = await useFaceAnalysis(photoBlob, 5000);
    const faceShape = detectFaceShape(result.landmarks);
    const confidence = calculateConfidence(result.landmarks);
    
    return {
      faceShape,
      faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
      confidence: Math.round((confidence || 0.85) * 100),
      recommendations: BRAIDS_DB.filter(b => b.faceShapes.includes(faceShape))
    };
  } catch (err) {
    console.error("Erreur analyse:", err);
    return { faceShape: "oval", faceShapeName: "Ovale", confidence: 75, recommendations: BRAIDS_DB };
  }
}
