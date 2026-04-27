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

// ── Catalogue de styles par forme de visage ──────────────────────────────────
// ids correspondent exactement aux fichiers dans public/styles/
const STYLES_BY_SHAPE = {
  oval: [
    {
      id: "boxbraids",
      name: "Box Braids",
      description: "Le classique indémodable. Les box braids s'adaptent parfaitement à ton visage ovale et te donnent un look élégant et polyvalent.",
      tags: ["Tendance", "Polyvalent", "Protecteur"],
      duration: "4-6h"
    },
    {
      id: "cornrows",
      name: "Cornrows",
      description: "Des tresses plaquées propres et précises qui mettent en valeur tes traits équilibrés. Parfait pour un look net et affirmé.",
      tags: ["Élégant", "Net", "Durable"],
      duration: "2-4h"
    },
    {
      id: "fulani",
      name: "Fulani Braids",
      description: "Un mélange de cornrows et de tresses libres avec des perles dorées. Ce style d'inspiration west-africaine sublime les visages ovales.",
      tags: ["Ethnique", "Bohème", "Perles"],
      duration: "3-5h"
    },
    {
      id: "ghanabraids",
      name: "Ghana Braids",
      description: "Des tresses sculpturales qui mettent en valeur ton visage ovale avec élégance et caractère.",
      tags: ["Sculptural", "Élégant", "Durable"],
      duration: "3-5h"
    },
    {
      id: "tresseplaquees",
      name: "Tresses Plaquées",
      description: "Un look net qui met en valeur la structure osseuse sans surcharge. Idéal pour les visages ovales.",
      tags: ["Minimaliste", "Sport", "Nette"],
      duration: "2-4h"
    },
    {
      id: "stitchbraids",
      name: "Stitch Braids",
      description: "Une technique ultra-précise avec des lignes graphiques qui subliment ton visage ovale.",
      tags: ["Graphique", "Précision", "Moderne"],
      duration: "3-5h"
    },
    {
      id: "pompom",
      name: "Pom Pom Braids",
      description: "Un style ludique et volumineux avec des pompons qui apportent du caractère à ton visage ovale.",
      tags: ["Créatif", "Volume", "Original"],
      duration: "3-5h"
    },
    {
      id: "crochetbraids",
      name: "Crochet Braids",
      description: "Des tresses au crochet naturelles et légères qui encadrent parfaitement un visage ovale.",
      tags: ["Naturel", "Léger", "Tendance"],
      duration: "2-4h"
    },
    {
      id: "fanbraids",
      name: "Fan Braids",
      description: "Des tresses en éventail élaborées qui mettent en valeur la symétrie naturelle du visage ovale.",
      tags: ["Élaboré", "Artistique", "Unique"],
      duration: "4-6h"
    },
    {
      id: "cornowspuffs",
      name: "Cornrows & Puffs",
      description: "Un mix tendance entre cornrows plaqués et puffs volumineux, parfait pour les visages ovales.",
      tags: ["Mixte", "Volume", "Moderne"],
      duration: "2-3h"
    },
    { id: "atida", name: "Atida Braids", views: { face: "/styles/atida_face.webp", back: "/styles/atida_back.webp", top: "/styles/atida_top.webp" }, description: "Un style élaboré aux tresses fines et structurées qui subliment le visage ovale avec une élégance africaine authentique.", tags: ["Elégant", "Structuré", "Africain"], duration: "4-6h" },
    { id: "bantuknots", name: "Bantu Knots", views: { face: "/styles/bantuknots_face.webp", back: "/styles/bantuknots_back.webp", top: "/styles/bantuknots_top.webp" }, description: "Des petits chignons torsadés et symétriques qui mettent en valeur l'équilibre naturel du visage ovale.", tags: ["Tendance", "Compact", "Naturel"], duration: "2-3h" },
    { id: "box_braids", name: "Box Braids Classiques", views: { face: "/styles/box_braids_face.webp", back: "/styles/box_braids_back.webp", top: "/styles/box_braids_top.webp" }, description: "Les box braids en version longue et soignée, idéales pour le visage ovale qui s'adapte à tous les volumes.", tags: ["Classique", "Polyvalent", "Long"], duration: "5-7h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", views: { face: "/styles/cornrowsstylisees_face.webp", back: "/styles/cornrowsstylisees_back.webp", top: "/styles/cornrowsstylisees_top.webp" }, description: "Des cornrows avec des motifs graphiques élaborés qui subliment la symétrie d'un visage ovale.", tags: ["Graphique", "Artistique", "Précis"], duration: "3-5h" },
  ],

  round: [
    {
      id: "boxbraids",
      name: "Box Braids hautes",
      description: "Portées en chignon haut ou en queue de cheval, les box braids allongent visuellement ton visage rond.",
      tags: ["Allongeant", "Élégant", "Tendance"],
      duration: "4-6h"
    },
    {
      id: "cornrows",
      name: "Cornrows en éventail",
      description: "Des cornrows qui partent vers le haut créent de la hauteur et équilibrent la rondeur de ton visage.",
      tags: ["Structuré", "Net", "Hauteur"],
      duration: "2-4h"
    },
    {
      id: "tresseplaquees",
      name: "Tresses Plaquées",
      description: "Les tresses plaquées vers le haut créent un effet allongeant parfait pour les visages ronds.",
      tags: ["Allongeant", "Structuré", "Net"],
      duration: "2-4h"
    },
    {
      id: "fulani",
      name: "Fulani Braids",
      description: "Les Fulani braids avec leur bandeau central créent une ligne qui allonge visuellement ton visage rond.",
      tags: ["Ethnique", "Allongeant", "Perles"],
      duration: "3-5h"
    },
    {
      id: "ghanabraids",
      name: "Ghana Braids",
      description: "Portées vers le haut, ces tresses sculpturales donnent de la hauteur et affinent les contours de ton visage.",
      tags: ["Hauteur", "Élégant", "Durable"],
      duration: "3-5h"
    },
    {
      id: "stitchbraids",
      name: "Stitch Braids",
      description: "Les lignes graphiques des stitch braids créent un effet visuel allongeant parfait pour ton visage rond.",
      tags: ["Graphique", "Allongeant", "Moderne"],
      duration: "3-5h"
    },
    {
      id: "fanbraids",
      name: "Fan Braids",
      description: "Les fan braids créent de la hauteur et de la structure, parfait pour allonger un visage rond.",
      tags: ["Élaboré", "Hauteur", "Artistique"],
      duration: "4-6h"
    },
    {
      id: "crochetbraids",
      name: "Crochet Braids",
      description: "Des tresses légères et volumineuses en hauteur qui allongent et allègent un visage rond.",
      tags: ["Léger", "Volume", "Allongeant"],
      duration: "2-4h"
    },
    {
      id: "cornowspuffs",
      name: "Cornrows & Puffs",
      description: "Des puffs en hauteur combinés à des cornrows créent l'illusion d'un visage plus long.",
      tags: ["Hauteur", "Moderne", "Volume"],
      duration: "2-3h"
    },
    {
      id: "pompom",
      name: "Pom Pom Braids",
      description: "Portés en hauteur, les pompons allongent visuellement et donnent du caractère à un visage rond.",
      tags: ["Créatif", "Hauteur", "Original"],
      duration: "3-5h"
    },
    { id: "atida", name: "Atida Braids", views: { face: "/styles/atida_face.webp", back: "/styles/atida_back.webp", top: "/styles/atida_top.webp" }, description: "Les tresses Atida portées en hauteur créent un effet allongeant qui équilibre la rondeur du visage.", tags: ["Allongeant", "Structuré", "Hauteur"], duration: "4-6h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", views: { face: "/styles/cornrowsstylisees_face.webp", back: "/styles/cornrowsstylisees_back.webp", top: "/styles/cornrowsstylisees_top.webp" }, description: "Des cornrows montantes avec des motifs précis qui créent de la verticalité et allongent un visage rond.", tags: ["Vertical", "Allongeant", "Graphique"], duration: "3-5h" },
    { id: "box_braids", name: "Box Braids Classiques", views: { face: "/styles/box_braids_face.webp", back: "/styles/box_braids_back.webp", top: "/styles/box_braids_top.webp" }, description: "Portées en hauteur en queue ou chignon, elles allongent visuellement le visage rond.", tags: ["Allongeant", "Classique", "Polyvalent"], duration: "5-7h" },
  ],

  square: [
    {
      id: "cocotwists",
      name: "Coco Twists",
      description: "Des vanilles volumineuses qui adoucissent les angles de ton visage carré pour un look naturel et doux.",
      tags: ["Doux", "Volume", "Naturel"],
      duration: "5-7h"
    },
    {
      id: "fulani",
      name: "Fulani Braids",
      description: "Les Fulani braids encadrent joliment ton visage en adoucissant la mâchoire avec leurs ornements.",
      tags: ["Ethnique", "Adoucissant", "Bohème"],
      duration: "3-5h"
    },
    {
      id: "tressecollees",
      name: "Tresses Collées",
      description: "Style versatile qui suit les courbes naturelles et adoucit les angles de ton visage carré.",
      tags: ["Protectrice", "Chic", "Classique"],
      duration: "2-4h"
    },
    {
      id: "ghanabraids",
      name: "Ghana Braids",
      description: "Le volume des ghana braids équilibre la largeur de ton visage carré pour un rendu harmonieux.",
      tags: ["Glamour", "Équilibré", "Volume"],
      duration: "3-5h"
    },
    {
      id: "boxbraids",
      name: "Box Braids",
      description: "En version side-swept, les box braids adoucissent les angles forts de ton visage carré.",
      tags: ["Tendance", "Polyvalent", "Stylé"],
      duration: "4-6h"
    },
    {
      id: "cornrows",
      name: "Cornrows courbés",
      description: "Des cornrows en courbes adoucissent les contours anguleux de ton visage.",
      tags: ["Structuré", "Créatif", "Adoucissant"],
      duration: "2-4h"
    },
    {
      id: "crochetbraids",
      name: "Crochet Braids",
      description: "Des tresses au crochet souples et naturelles qui adoucissent les angles d'un visage carré.",
      tags: ["Doux", "Naturel", "Adoucissant"],
      duration: "2-4h"
    },
    {
      id: "pompom",
      name: "Pom Pom Braids",
      description: "Des pompons arrondis qui contrebalancent les angles de ton visage carré avec légèreté.",
      tags: ["Arrondi", "Doux", "Original"],
      duration: "3-5h"
    },
    {
      id: "fanbraids",
      name: "Fan Braids",
      description: "Des fan braids courbées qui adoucissent les contours anguleux tout en restant élégantes.",
      tags: ["Courbé", "Élégant", "Adoucissant"],
      duration: "4-6h"
    },
    {
      id: "cornowspuffs",
      name: "Cornrows & Puffs",
      description: "La combinaison de cornrows et puffs ronds atténue la carrure et crée un look équilibré.",
      tags: ["Équilibré", "Arrondi", "Moderne"],
      duration: "2-3h"
    },
    { id: "bantuknots", name: "Bantu Knots", views: { face: "/styles/bantuknots_face.webp", back: "/styles/bantuknots_back.webp", top: "/styles/bantuknots_top.webp" }, description: "Leurs formes rondes et douces contrebalancent les angles forts d'un visage carré pour un effet adoucissant.", tags: ["Arrondi", "Doux", "Adoucissant"], duration: "2-3h" },
    { id: "atida", name: "Atida Braids", views: { face: "/styles/atida_face.webp", back: "/styles/atida_back.webp", top: "/styles/atida_top.webp" }, description: "Les tresses fines et fluides de l'Atida adoucissent les contours anguleux d'un visage carré.", tags: ["Doux", "Fluide", "Adoucissant"], duration: "4-6h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", views: { face: "/styles/cornrowsstylisees_face.webp", back: "/styles/cornrowsstylisees_back.webp", top: "/styles/cornrowsstylisees_top.webp" }, description: "Des cornrows en courbes stylisées qui adoucissent les angles et apportent une touche artistique.", tags: ["Courbé", "Artistique", "Adoucissant"], duration: "3-5h" },
  ],

  heart: [
    {
      id: "ghanabraids",
      name: "Ghana Braids",
      description: "Le volume en bas des ghana braids équilibre parfaitement ton menton fin et met en valeur ton visage en cœur.",
      tags: ["Équilibrant", "Glamour", "Volume"],
      duration: "3-5h"
    },
    {
      id: "cocotwists",
      name: "Coco Twists",
      description: "Des torsades volumineuses qui équilibrent ton visage en cœur en créant de l'harmonie vers le bas.",
      tags: ["Équilibrant", "Naturel", "Harmonieux"],
      duration: "5-7h"
    },
    {
      id: "tressecollees",
      name: "Tresses Collées",
      description: "Les tresses collées légères s'adaptent bien aux visages en cœur sans surcharger le haut.",
      tags: ["Naturel", "Léger", "Équilibré"],
      duration: "2-4h"
    },
    {
      id: "fulani",
      name: "Fulani Braids",
      description: "Avec leurs tresses libres sur les côtés, les Fulani braids encadrent et équilibrent ton visage en cœur.",
      tags: ["Ethnique", "Encadrant", "Perles"],
      duration: "3-5h"
    },
    {
      id: "boxbraids",
      name: "Box Braids mi-longues",
      description: "À mi-longueur, les box braids créent du volume là où il faut pour équilibrer ton menton.",
      tags: ["Équilibrant", "Tendance", "Polyvalent"],
      duration: "4-6h"
    },
    {
      id: "cornrows",
      name: "Cornrows",
      description: "Des cornrows plaqués en haut avec des tresses libres en bas équilibrent les proportions de ton visage.",
      tags: ["Structuré", "Net", "Équilibré"],
      duration: "2-4h"
    },
    {
      id: "pompom",
      name: "Pom Pom Braids",
      description: "Des pompons en bas du visage élargissent visuellement le menton et équilibrent un visage en cœur.",
      tags: ["Équilibrant", "Volume", "Original"],
      duration: "3-5h"
    },
    {
      id: "crochetbraids",
      name: "Crochet Braids",
      description: "Des tresses légères qui créent du volume en bas pour équilibrer un front large.",
      tags: ["Léger", "Équilibrant", "Naturel"],
      duration: "2-4h"
    },
    {
      id: "fanbraids",
      name: "Fan Braids",
      description: "Des fan braids qui s'élargissent vers le bas pour équilibrer harmonieusement un visage en cœur.",
      tags: ["Élargissant", "Artistique", "Harmonieux"],
      duration: "4-6h"
    },
    {
      id: "cornowspuffs",
      name: "Cornrows & Puffs",
      description: "Des puffs placés bas créent le volume nécessaire pour équilibrer un visage en cœur.",
      tags: ["Équilibrant", "Volume", "Moderne"],
      duration: "2-3h"
    },
    { id: "bantuknots", name: "Bantu Knots", views: { face: "/styles/bantuknots_face.webp", back: "/styles/bantuknots_back.webp", top: "/styles/bantuknots_top.webp" }, description: "Placés en bas du visage, les bantu knots créent du volume qui équilibre le menton fin d'un visage en cœur.", tags: ["Équilibrant", "Volume", "Compact"], duration: "2-3h" },
    { id: "box_braids", name: "Box Braids Classiques", views: { face: "/styles/box_braids_face.webp", back: "/styles/box_braids_back.webp", top: "/styles/box_braids_top.webp" }, description: "En version volumineuse vers le bas, les box braids élargissent visuellement le menton d'un visage en cœur.", tags: ["Équilibrant", "Volume", "Classique"], duration: "5-7h" },
    { id: "atida", name: "Atida Braids", views: { face: "/styles/atida_face.webp", back: "/styles/atida_back.webp", top: "/styles/atida_top.webp" }, description: "Un style encadrant qui apporte le volume nécessaire en bas pour harmoniser un visage en cœur.", tags: ["Encadrant", "Harmonieux", "Africain"], duration: "4-6h" },
  ],

  long: [
    {
      id: "fulani",
      name: "Fulani Braids",
      description: "Les Fulani braids avec leur bandeau central créent de la largeur visuelle idéale pour ton visage allongé.",
      tags: ["Élargissant", "Ethnique", "Perles"],
      duration: "3-5h"
    },
    {
      id: "cornrows",
      name: "Cornrows latéraux",
      description: "Des cornrows sur les côtés créent l'illusion de largeur et équilibrent ton visage allongé.",
      tags: ["Élargissant", "Structuré", "Net"],
      duration: "2-4h"
    },
    {
      id: "ghanabraids",
      name: "Ghana Braids larges",
      description: "Des ghana braids épaisses créent de la largeur et de la présence pour ton visage allongé.",
      tags: ["Volume", "Glamour", "Élargissant"],
      duration: "3-5h"
    },
    {
      id: "boxbraids",
      name: "Box Braids courtes",
      description: "En version courte, les box braids évitent d'allonger encore plus ton visage tout en restant stylées.",
      tags: ["Équilibrant", "Tendance", "Polyvalent"],
      duration: "3-5h"
    },
    {
      id: "tressecollees",
      name: "Tresses Collées",
      description: "Des tresses collées volumineuses qui créent de la largeur pour les visages allongés.",
      tags: ["Équilibrant", "Volume", "Naturel"],
      duration: "2-4h"
    },
    {
      id: "tresseplaquees",
      name: "Tresses Plaquées",
      description: "En version latérale, les tresses plaquées apportent du volume qui équilibre ton visage allongé.",
      tags: ["Léger", "Volume", "Naturel"],
      duration: "2-4h"
    },
    {
      id: "pompom",
      name: "Pom Pom Braids",
      description: "Des pompons sur les côtés créent de la largeur et cassent l'effet longueur d'un visage allongé.",
      tags: ["Élargissant", "Original", "Volume"],
      duration: "3-5h"
    },
    {
      id: "crochetbraids",
      name: "Crochet Braids",
      description: "Des tresses au crochet volumineuses sur les côtés qui élargissent harmonieusement un visage long.",
      tags: ["Volume", "Élargissant", "Naturel"],
      duration: "2-4h"
    },
    {
      id: "cornowspuffs",
      name: "Cornrows & Puffs",
      description: "Des puffs latéraux combinés à des cornrows créent de la largeur pour équilibrer un visage long.",
      tags: ["Élargissant", "Moderne", "Volume"],
      duration: "2-3h"
    },
    {
      id: "fanbraids",
      name: "Fan Braids",
      description: "Des fan braids horizontales qui créent de la largeur et équilibrent un visage trop allongé.",
      tags: ["Horizontal", "Élargissant", "Artistique"],
      duration: "4-6h"
    },
    { id: "bantuknots", name: "Bantu Knots", views: { face: "/styles/bantuknots_face.webp", back: "/styles/bantuknots_back.webp", top: "/styles/bantuknots_top.webp" }, description: "Des knots placés sur les côtés créent de la largeur et cassent l'effet longueur d'un visage allongé.", tags: ["Élargissant", "Compact", "Équilibrant"], duration: "2-3h" },
    { id: "box_braids", name: "Box Braids Classiques", views: { face: "/styles/box_braids_face.webp", back: "/styles/box_braids_back.webp", top: "/styles/box_braids_top.webp" }, description: "En version courte et volumineuse sur les côtés, parfaites pour équilibrer un visage allongé.", tags: ["Élargissant", "Classique", "Équilibrant"], duration: "4-5h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", views: { face: "/styles/cornrowsstylisees_face.webp", back: "/styles/cornrowsstylisees_back.webp", top: "/styles/cornrowsstylisees_top.webp" }, description: "Des motifs latéraux stylisés qui créent de la largeur visuelle et équilibrent un visage long.", tags: ["Horizontal", "Élargissant", "Graphique"], duration: "3-5h" },
  ],

  diamond: [
    {
      id: "cornrows",
      name: "Cornrows structurés",
      description: "Des cornrows précis qui encadrent ton visage diamant et mettent en valeur tes pommettes.",
      tags: ["Structuré", "Net", "Encadrant"],
      duration: "2-4h"
    },
    {
      id: "boxbraids",
      name: "Box Braids",
      description: "Les box braids encadrent et subliment les pommettes larges de ton visage diamant.",
      tags: ["Encadrant", "Tendance", "Élégant"],
      duration: "4-6h"
    },
    {
      id: "fulani",
      name: "Fulani Braids",
      description: "Avec leurs ornements, les Fulani braids mettent parfaitement en valeur les pommettes d'un visage diamant.",
      tags: ["Ethnique", "Sublimant", "Perles"],
      duration: "3-5h"
    },
    {
      id: "tressecollees",
      name: "Tresses Collées",
      description: "Les tresses collées encadrent subtilement ton visage diamant pour un résultat naturel et équilibré.",
      tags: ["Naturel", "Léger", "Équilibré"],
      duration: "2-4h"
    },
    {
      id: "ghanabraids",
      name: "Ghana Braids",
      description: "Des tresses majestueuses qui encadrent et subliment les pommettes de ton visage diamant.",
      tags: ["Glamour", "Majestueux", "Sublimant"],
      duration: "3-5h"
    },
    {
      id: "stitchbraids",
      name: "Stitch Braids",
      description: "Des torsades naturelles qui encadrent ton visage diamant en douceur et mettent en valeur tes traits.",
      tags: ["Naturel", "Doux", "Chic"],
      duration: "2-4h"
    },
    {
      id: "pompom",
      name: "Pom Pom Braids",
      description: "Des pompons qui encadrent et subliment les pommettes prononcées d'un visage diamant.",
      tags: ["Sublimant", "Original", "Volume"],
      duration: "3-5h"
    },
    {
      id: "fanbraids",
      name: "Fan Braids",
      description: "Des fan braids structurées qui encadrent parfaitement les pommettes larges d'un visage diamant.",
      tags: ["Structuré", "Encadrant", "Artistique"],
      duration: "4-6h"
    },
    {
      id: "crochetbraids",
      name: "Crochet Braids",
      description: "Des tresses légères qui encadrent en douceur les traits prononcés d'un visage diamant.",
      tags: ["Doux", "Léger", "Encadrant"],
      duration: "2-4h"
    },
    {
      id: "cornowspuffs",
      name: "Cornrows & Puffs",
      description: "Un mix moderne qui encadre et met en valeur la structure unique d'un visage diamant.",
      tags: ["Moderne", "Encadrant", "Mixte"],
      duration: "2-3h"
    },
    { id: "atida", name: "Atida Braids", views: { face: "/styles/atida_face.webp", back: "/styles/atida_back.webp", top: "/styles/atida_top.webp" }, description: "Un style structuré qui encadre et met en valeur les pommettes prononcées d'un visage diamant.", tags: ["Encadrant", "Structuré", "Sublimant"], duration: "4-6h" },
    { id: "bantuknots", name: "Bantu Knots", views: { face: "/styles/bantuknots_face.webp", back: "/styles/bantuknots_back.webp", top: "/styles/bantuknots_top.webp" }, description: "Des knots bien placés qui encadrent délicatement les pommettes d'un visage diamant.", tags: ["Encadrant", "Compact", "Délicat"], duration: "2-3h" },
    { id: "cornrowsstylisees", name: "Cornrows Stylisées", views: { face: "/styles/cornrowsstylisees_face.webp", back: "/styles/cornrowsstylisees_back.webp", top: "/styles/cornrowsstylisees_top.webp" }, description: "Des cornrows graphiques qui mettent en valeur la structure unique des pommettes d'un visage diamant.", tags: ["Graphique", "Sublimant", "Précis"], duration: "3-5h" },
  ],
};

// ── Analyse principale ────────────────────────────────────────────────────────
export async function analyzeFace(photoBlob) {
  let faceShape = "oval";
  let confidence = 75;

  try {
    const result = await analyzeFaceWithAI(photoBlob);
    faceShape  = result?.faceShape  || "oval";
    confidence = result?.confidence || 75;
  } catch (err) {
    const msg = err?.message || "";
    if (
      msg.includes("crédit") || msg.includes("credit") ||
      msg.includes("429") || msg.includes("409") ||
      msg.includes("déjà traitée") || msg.includes("déjà effectuée")
    ) {
      throw err;
    }
    console.warn("Fallback oval:", msg);
  }

  return buildRecommendations(faceShape, "", confidence);
}

function buildRecommendations(faceShape, reason = "", confidence = 0.85) {
  const shape = FACE_SHAPE_NAMES[faceShape] ? faceShape : "oval";
  const recommendations = STYLES_BY_SHAPE[shape] || STYLES_BY_SHAPE["oval"];

  return {
    faceShape: shape,
    faceShapeName: FACE_SHAPE_NAMES[shape],
    faceShapeDescription: FACE_SHAPE_DESCRIPTIONS[shape],
    aiReason: reason,
    confidence: Math.round((confidence || 0.85) * 100),
    recommendations,
  };
    }
