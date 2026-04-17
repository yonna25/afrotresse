import { analyzeFaceWithAI } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

// --- CONSTANTES ---
export const FACE_SHAPE_NAMES = {
  oval: "Ovale", round: "Ronde", square: "Carrée", 
  heart: "Cœur", long: "Allongée", diamond: "Diamant"
};

export const FACE_SHAPE_DESCRIPTIONS = {
  oval: "Visage équilibré — la plupart des styles te conviennent à merveille.",
  round: "Visage doux et rond — les styles avec du volume en haut allongeront tes traits.",
  square: "Visage anguleux — les styles souples adoucissent ta mâchoire.",
  heart: "Visage en cœur — les styles qui encadrent le visage équilibrent ton menton.",
  long: "Visage allongé — les styles sans trop de hauteur créent l'harmonie parfaite.",
  diamond: "Pommettes larges — les styles structurés te subliment."
};

/**
 * Logique d'analyse avec synchronisation des crédits
 */
export async function analyzeFace(photoBlob) {
  try {
    // 1. Analyse locale MediaPipe
    const result = await analyzeFaceWithAI(photoBlob);
    const faceShape = result?.faceShape || detectFaceShape(result?.landmarks);
    const confidence = result?.confidence || calculateConfidence(result?.landmarks);

    // 2. Préparation des identifiants uniques (pour ton API)
    const requestId = crypto.randomUUID(); // Anti-double consommation
    const sessionId = localStorage.getItem('afrotresse_session_id') || crypto.randomUUID();
    localStorage.setItem('afrotresse_session_id', sessionId);

    // 3. Appel à ton API Vercel (Protection & Crédits)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceShape,
          requestId,
          sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("[API] Problème de crédits ou quota :", errorData.error);
        // On continue quand même l'affichage pour l'UX, mais on log l'erreur
      } else {
        const apiData = await response.json();
        console.log("[API] Analyse enregistrée, crédits restants :", apiData.creditsRemaining);
      }
    } catch (apiErr) {
      console.error("[API] Erreur de connexion au serveur :", apiErr);
    }

    // 4. Retour des résultats pour l'affichage
    return buildRecommendations(faceShape, "Analyse réussie", confidence);

  } catch (err) {
    console.error("Face analysis error:", err);
    return buildRecommendations("oval", "fallback", 0.75);
  }
}

function buildRecommendations(faceShape, reason = "", confidence = 0.85) {
  return {
    faceShape,
    faceShapeName: FACE_SHAPE_NAMES[faceShape] || faceShape,
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[faceShape] || "",
    aiReason: reason,
    confidence: Math.round((confidence || 0.85) * 100)
  };
}
