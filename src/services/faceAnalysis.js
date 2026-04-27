import { analyzeFaceWithAI } from '../hooks/useFaceAnalysis.js'

// CONSTANTES
export const FACE_SHAPE_NAMES = {
  oval:    "Ovale",
  round:   "Ronde",
  square:  "Carrée",
  heart:   "Cœur",
  long:    "Allongée",
  diamond: "Diamant"
};

export const FACE_SHAPE_DESCRIPTIONS = {
  oval:    "Visage équilibré — la plupart des styles te conviennent à merveille.",
  round:   "Visage doux et rond — les styles avec du volume en haut allongeront tes traits.",
  square:  "Visage anguleux — les styles souples adoucissent ta mâchoire.",
  heart:   "Visage en cœur — les styles qui encadrent le visage équilibrent ton menton.",
  long:    "Visage allongé — les styles sans trop de hauteur créent l'harmonie parfaite.",
  diamond: "Pommettes larges — les styles structurés te subliment."
};

// ── Catalogue de styles Fusionné (Premium + Classique) ──
const STYLES_BY_SHAPE = {
  oval: [
    { id: "atida", name: "Atida", description: "Un style ancestral revisité avec une précision géométrique incroyable.", tags: ["Luxe", "Géométrique"], duration: "4-6h" },
    { id: "bantuknots", name: "Bantu Knots", description: "Des nœuds sculpturaux qui dégagent le visage et affirment ton caractère.", tags: ["Iconique", "Style"], duration: "2-3h" },
    { id: "boxbraids", name: "Box Braids Premium", description: "Tresses protectrices classiques avec une finition impeccable.", tags: ["Classique", "Premium"], duration: "5-8h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", description: "Lignes fluides et motifs complexes pour un look sophistiqué.", tags: ["Moderne", "Graphique"], duration: "3-5h" },
    { id: "cornrows", name: "Cornrows", description: "Des tresses plaquées propres et précises qui mettent en valeur tes traits équilibrés.", tags: ["Élégant", "Net", "Durable"], duration: "2-4h" },
    { id: "fulani", name: "Fulani Braids", description: "Un mélange de cornrows et de tresses libres avec des perles dorées.", tags: ["Ethnique", "Bohème"], duration: "3-5h" },
    { id: "ghanabraids", name: "Ghana Braids", description: "Des tresses sculpturales qui mettent en valeur ton visage ovale avec élégance.", tags: ["Sculptural", "Durable"], duration: "3-5h" },
    { id: "tresseplaquees", name: "Tresses Plaquées", description: "Un look net qui met en valeur la structure osseuse sans surcharge.", tags: ["Minimaliste", "Sport"], duration: "2-4h" },
    { id: "stitchbraids", name: "Stitch Braids", description: "Une technique ultra-précise avec des lignes graphiques qui subliment ton visage.", tags: ["Graphique", "Précision"], duration: "3-5h" },
    { id: "pompom", name: "Pom Pom Braids", description: "Un style ludique et volumineux avec des pompons plein de caractère.", tags: ["Créatif", "Volume"], duration: "3-5h" }
  ],
  round: [
    { id: "atida", name: "Atida", description: "Structure verticale qui aide à allonger visuellement le visage.", tags: ["Allongeant", "Luxe"], duration: "4-6h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", description: "Lignes fluides qui affinent les contours de ton visage.", tags: ["Moderne", "Affinement"], duration: "3-5h" },
    { id: "bantuknots", name: "Bantu Knots", description: "Placés en hauteur, ils créent un effet allongeant parfait.", tags: ["Hauteur", "Tendance"], duration: "2-3h" },
    { id: "boxbraids", name: "Box Braids hautes", description: "Portées en chignon haut, elles allongent visuellement ton visage rond.", tags: ["Allongeant", "Tendance"], duration: "4-6h" },
    { id: "cornrows", name: "Cornrows en éventail", description: "Des cornrows qui partent vers le haut créent de la hauteur.", tags: ["Structuré", "Hauteur"], duration: "2-4h" },
    { id: "tresseplaquees", name: "Tresses Plaquées", description: "Les tresses plaquées vers le haut créent un effet allongeant.", tags: ["Allongeant", "Net"], duration: "2-4h" },
    { id: "ghanabraids", name: "Ghana Braids", description: "Portées vers le haut, ces tresses affinent les contours de ton visage.", tags: ["Hauteur", "Élégant"], duration: "3-5h" },
    { id: "stitchbraids", name: "Stitch Braids", description: "Les lignes graphiques créent un effet visuel allongeant.", tags: ["Graphique", "Moderne"], duration: "3-5h" }
  ],
  square: [
    { id: "boxbraids", name: "Box Braids Premium", description: "La souplesse des tresses adoucit les angles de ta mâchoire.", tags: ["Adoucissant", "Premium"], duration: "5-8h" },
    { id: "atida", name: "Atida", description: "Motifs circulaires pour apporter de la douceur aux traits anguleux.", tags: ["Art", "Équilibre"], duration: "4-6h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", description: "Courbes douces pour casser la structure carrée du visage.", tags: ["Doux", "Moderne"], duration: "3-5h" },
    { id: "cocotwists", name: "Coco Twists", description: "Des vanilles volumineuses qui adoucissent les angles de ton visage carré.", tags: ["Doux", "Volume"], duration: "5-7h" },
    { id: "fulani", name: "Fulani Braids", description: "Les Fulani braids encadrent joliment ton visage en adoucissant la mâchoire.", tags: ["Ethnique", "Adoucissant"], duration: "3-5h" },
    { id: "tressecollees", name: "Tresses Collées", description: "Style versatile qui suit les courbes naturelles de ton visage.", tags: ["Chic", "Classique"], duration: "2-4h" },
    { id: "ghanabraids", name: "Ghana Braids", description: "Le volume des ghana braids équilibre la largeur de ton visage carré.", tags: ["Glamour", "Volume"], duration: "3-5h" }
  ],
  heart: [
    { id: "atida", name: "Atida Royal", description: "Volume équilibré qui sublime ton visage en cœur.", tags: ["Majestueux", "Équilibre"], duration: "4-6h" },
    { id: "boxbraids", name: "Box Braids Premium", description: "Volume vers le bas pour harmoniser ton menton fin.", tags: ["Harmonie", "Premium"], duration: "5-8h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", description: "Design qui s'élargit vers le bas pour un équilibre parfait.", tags: ["Équilibre", "Design"], duration: "3-5h" },
    { id: "ghanabraids", name: "Ghana Braids", description: "Le volume en bas équilibre parfaitement ton menton fin.", tags: ["Équilibrant", "Volume"], duration: "3-5h" },
    { id: "cocotwists", name: "Coco Twists", description: "Des torsades volumineuses qui créent de l'harmonie vers le bas.", tags: ["Harmonieux", "Naturel"], duration: "5-7h" },
    { id: "fulani", name: "Fulani Braids", description: "Avec leurs tresses libres sur les côtés, elles encadrent ton visage.", tags: ["Encadrant", "Perles"], duration: "3-5h" }
  ],
  long: [
    { id: "atida", name: "Atida", description: "Style majestueux occupant l'espace latéral pour équilibrer la longueur.", tags: ["Largeur", "Luxe"], duration: "4-6h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", description: "Lignes latérales qui créent une harmonie parfaite.", tags: ["Graphique", "Largeur"], duration: "3-5h" },
    { id: "boxbraids", name: "Box Braids Premium", description: "Version mi-longue pour casser l'effet de longueur.", tags: ["Équilibrant", "Premium"], duration: "4-6h" },
    { id: "fulani", name: "Fulani Braids", description: "Leur bandeau central crée de la largeur visuelle idéale.", tags: ["Élargissant", "Ethnique"], duration: "3-5h" },
    { id: "cornrows", name: "Cornrows latéraux", description: "Des cornrows sur les côtés créent l'illusion de largeur.", tags: ["Élargissant", "Net"], duration: "2-4h" },
    { id: "ghanabraids", name: "Ghana Braids larges", description: "Des ghana braids épaisses créent de la présence visuelle.", tags: ["Volume", "Élargissant"], duration: "3-5h" }
  ],
  diamond: [
    { id: "atida", name: "Atida", description: "Cadre parfait pour souligner tes pommettes sans les surcharger.", tags: ["Pommettes", "Luxe"], duration: "4-6h" },
    { id: "bantuknots", name: "Bantu Knots", description: "Dégage le visage pour mettre en valeur ta structure unique.", tags: ["Structure", "Chic"], duration: "2-3h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", description: "Motifs géométriques qui épousent la forme de tes pommettes.", tags: ["Géométrique", "Sublime"], duration: "3-5h" },
    { id: "cornrows", name: "Cornrows structurés", description: "Des cornrows précis qui mettent en valeur tes traits.", tags: ["Structuré", "Net"], duration: "2-4h" },
    { id: "boxbraids", name: "Box Braids", description: "Elles encadrent et subliment les pommettes larges.", tags: ["Encadrant", "Tendance"], duration: "4-6h" },
    { id: "fulani", name: "Fulani Braids", description: "Les ornements mettent parfaitement en valeur ton visage.", tags: ["Sublimant", "Perles"], duration: "3-5h" }
  ]
};

// ── Analyse principale ────────────────────────────────────────────────────────
export async function analyzeFace(photoBlob, userId = null) {
  let sessionId = localStorage.getItem('afrotresse_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('afrotresse_session_id', sessionId);
  }

  try {
    const creditResp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sessionId })
    });

    const creditData = await creditResp.json();
    if (!creditResp.ok) throw new Error(creditData.error || "Crédits insuffisants");

    const result = await analyzeFaceWithAI(photoBlob);
    const faceShape = result?.faceShape || "oval";
    const confidence = result?.confidence || 75;

    return buildRecommendations(faceShape, "Succès", confidence, creditData.remaining);

  } catch (err) {
    if (err.message.includes("épuisés") || err.message.includes("Crédit")) throw err;
    console.warn("Fallback local:", err.message);
    return buildRecommendations("oval", "fallback", 0.75, 0);
  }
}

function buildRecommendations(faceShape, reason = "", confidence = 0.85, remainingCredits = 0) {
  const shape = FACE_SHAPE_NAMES[faceShape] ? faceShape : "oval";
  const recommendations = STYLES_BY_SHAPE[shape] || STYLES_BY_SHAPE["oval"];

  return {
    faceShape: shape,
    faceShapeName: FACE_SHAPE_NAMES[shape],
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[shape],
    aiReason: reason,
    confidence: Math.round((confidence || 0.85) * 100),
    recommendations,
    remainingCredits
  };
}
