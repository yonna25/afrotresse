import { analyzeFaceWithAI } from '../hooks/useFaceAnalysis.js'
import { detectFaceShape, calculateConfidence } from '../utils/faceShapeDetector.js'

// --- CONSTANTES ---
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

/**
 * Logique d'analyse corrigée (Hybride : Analyse locale + Synchro serveur silencieuse)
 */
export async function analyzeFace(photoBlob) {
  try {
    // 1. ANALYSE LOCALE (Priorité à la vitesse d'affichage)
    const result = await analyzeFaceWithAI(photoBlob);
    
    const faceShape = 
      result?.faceShape || 
      detectFaceShape(result?.landmarks);
      
    const confidence = 
      result?.confidence || 
      calculateConfidence(result?.landmarks);

    // 2. PRÉPARATION DES IDENTIFIANTS (Pour le suivi en base)
    const requestId = crypto.randomUUID();
    let sessionId = localStorage.getItem('afrotresse_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('afrotresse_session_id', sessionId);
    }

    // 3. SYNCHRONISATION SERVEUR (NON-BLOQUANTE)
    // On ne met pas "await" ici pour que la redirection vers les résultats soit instantanée
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faceShape,
        requestId,
        sessionId
      })
    })
    .then(response => {
      if (response.ok) {
        console.log("[Serveur] Crédit déduit et analyse enregistrée.");
      } else {
        response.json().then(data => console.warn("[Serveur] Problème :", data.error));
      }
    })
    .catch(err => console.error("[Serveur] Erreur réseau (silencieuse) :", err));

    // 4. RETOUR IMMÉDIAT (Débloque la page de résultats)
    return buildRecommendations(faceShape, "Analyse réussie", confidence);

  } catch (err) {
    console.error("Face analysis error:", err);
    // En cas d'erreur critique, on renvoie un résultat par défaut pour ne pas bloquer l'utilisateur
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
