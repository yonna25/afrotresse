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
    faceShapes: ["round", "square", "oval", "heart", "diamond"],
    matchScore: 98
  }
];

// 🔥 Appel direct API (sans ai.js)
export async function analyzeFace(photoBlob) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      faceShape: "oval",          // ⚠️ temporaire pour test
      requestId: Date.now().toString(),
      sessionId: "test-session"
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Erreur serveur");
  }

  const result = await response.json();

  return {
    faceShape: result.faceShape,
    confidence: result.confidence || 85,
    recommendations: []
  };
}
