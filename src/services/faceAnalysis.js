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

export const BRAIDS_DB = [ /* inchangé */ ];

// --- LOGIQUE D'ANALYSE ---
export async function analyzeFace(photoBlob) {
  try {
    const result = await analyzeFaceWithAI(photoBlob, 8000)

    // 🔴 FIX MINIMAL (sans casser ton flow)
    const faceShape = result.faceShape || detectFaceShape(result.landmarks)

    const confidence =
      result.confidence || calculateConfidence(result.landmarks)

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
