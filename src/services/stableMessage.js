// ─────────────────────────────────────────────────────────────────────────────
// stableMessage.js — AfroTresse
// Message personnalisé, stable et déterministe par utilisatrice
// ─────────────────────────────────────────────────────────────────────────────

// ── Durée avant rotation du message (7 jours en ms) ─────────────────────────
const ROTATION_MS = 7 * 24 * 60 * 60 * 1000;

// ── Clé de stockage ──────────────────────────────────────────────────────────
const STORAGE_KEY = "afrotresse_stable_msg";

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES PAR FORME DE VISAGE
// Chaque message est associé à un seuil de confiance minimum (0 à 1).
// Les messages à confiance plus haute sont plus affirmatifs / précis.
// ─────────────────────────────────────────────────────────────────────────────
const MESSAGES = {
  oval: [
    {
      minConfidence: 0,
      text: "Ta morphologie est celle que toutes les coiffeuses rêvent de travailler. Chaque style te va, sans exception.",
    },
    {
      minConfidence: 0,
      text: "Rare chance : ton visage s'adapte à tous les styles. Le seul vrai problème ? Choisir.",
    },
    {
      minConfidence: 0.5,
      text: "Une harmonie naturelle que peu de femmes possèdent. Chaque tresse que tu portes, tu la portes royalement.",
    },
    {
      minConfidence: 0.5,
      text: "Ton visage est un terrain de jeu sans limites. Aucune contrainte, toutes les libertés.",
    },
    {
      minConfidence: 0.7,
      text: "La symétrie est ton alliée silencieuse. Tu peux oser n'importe quel style et le transcender.",
    },
    {
      minConfidence: 0.7,
      text: "Des proportions équilibrées sont le secret des plus belles coiffures. Et tu l'as naturellement.",
    },
  ],
  round: [
    {
      minConfidence: 0,
      text: "Ton visage exprime une douceur qui attire naturellement le regard. Les tresses hautes révèlent ton vrai potentiel.",
    },
    {
      minConfidence: 0,
      text: "Cette rondeur est une force. Elle rayonne, et les tresses verticales l'allongent avec une grâce naturelle.",
    },
    {
      minConfidence: 0.5,
      text: "La féminité de tes traits est ton atout numéro 1. Les styles sélectionnés la mettent en scène parfaitement.",
    },
    {
      minConfidence: 0.5,
      text: "Un visage rond, c'est une jeunesse éternelle. Quelques centimètres de hauteur, et tout change.",
    },
    {
      minConfidence: 0.7,
      text: "La douceur de tes traits appelle des tresses avec du volume en hauteur. Ce duo-là ne se rate jamais.",
    },
    {
      minConfidence: 0.7,
      text: "Tes joues sont ta signature. Les tresses bien placées les encadrent pour un résultat qui stoppe les regards.",
    },
  ],
  square: [
    {
      minConfidence: 0,
      text: "Ton visage dégage une présence naturelle et un caractère fort. Les tresses fluides le subliment sans l'effacer.",
    },
    {
      minConfidence: 0,
      text: "Cette mâchoire marquée est un symbole de force. Les bons styles la complètent avec une élégance brute.",
    },
    {
      minConfidence: 0.5,
      text: "Un visage carré, c'est une personnalité. Les styles qui t'attendent ne le cachent pas, ils le révèlent.",
    },
    {
      minConfidence: 0.5,
      text: "Tu dégages une assurance naturelle. Avec les tresses sélectionnées, cette force devient magnétisme pur.",
    },
    {
      minConfidence: 0.7,
      text: "Tes angles sont ton identité. Il suffit du bon style pour transformer ce caractère en élégance sculpturale.",
    },
    {
      minConfidence: 0.7,
      text: "Les traits forts sont ceux qui marquent les esprits. Les tresses douces créent un contraste irrésistible.",
    },
  ],
  heart: [
    {
      minConfidence: 0,
      text: "Ce visage en cœur est l'un des plus délicats et des plus enviés. Il mérite des tresses à sa hauteur.",
    },
    {
      minConfidence: 0,
      text: "Ta beauté naturelle réside dans ce contraste entre tes tempes larges et la finesse de ton menton. Les bons styles l'accentuent.",
    },
    {
      minConfidence: 0.5,
      text: "Un visage en cœur est rare et précieux. Le volume placé en bas équilibre tout, et le résultat est saisissant.",
    },
    {
      minConfidence: 0.5,
      text: "La finesse de ton menton est ta signature. Les tresses volumineuses en bas en font un atout incomparable.",
    },
    {
      minConfidence: 0.7,
      text: "Tu possèdes des traits qui n'ont besoin d'aucun artifice. Juste les bonnes tresses, et tout s'illumine.",
    },
    {
      minConfidence: 0.7,
      text: "Délicatesse et structure : ton visage réunit les deux. Les styles choisis honorent chacun de tes traits.",
    },
  ],
  long: [
    {
      minConfidence: 0,
      text: "Ton visage long est celui des silhouettes qui marquent les esprits. Les tresses latérales créent l'équilibre parfait.",
    },
    {
      minConfidence: 0,
      text: "Cette longueur naturelle est un avantage de structure rare. Les bons styles créent un résultat spectaculaire.",
    },
    {
      minConfidence: 0.5,
      text: "Un visage long s'habille différemment, et quand c'est maîtrisé, le résultat coupe le souffle.",
    },
    {
      minConfidence: 0.5,
      text: "Tes proportions appellent du volume sur les côtés. Un équilibre élégant que peu de coiffeuses savent créer.",
    },
    {
      minConfidence: 0.7,
      text: "La longueur de ton visage est une toile vierge. Les styles sélectionnés en font un chef-d'œuvre d'harmonie.",
    },
    {
      minConfidence: 0.7,
      text: "Les femmes aux visages longs portent les tresses comme personne. Tu es exactement dans cette catégorie.",
    },
  ],
  diamond: [
    {
      minConfidence: 0,
      text: "Un visage diamant est l'un des plus rares et des plus photogéniques. Tu es faite pour les tresses qui encadrent.",
    },
    {
      minConfidence: 0,
      text: "Tes pommettes sont ta force. Peu de femmes possèdent cette structure, les bons styles la révèlent sans compromis.",
    },
    {
      minConfidence: 0.5,
      text: "Ce visage n'est pas commun. Il appelle des styles qui savent l'encadrer et laisser parler ses angles.",
    },
    {
      minConfidence: 0.5,
      text: "Tes pommettes marquées créent une sculpture naturelle. Les tresses qui encadrent le visage les subliment.",
    },
    {
      minConfidence: 0.7,
      text: "Rare, structuré, marquant. Ton visage appelle des styles à sa hauteur, et nous les avons trouvés pour toi.",
    },
    {
      minConfidence: 0.7,
      text: "Cette géométrie faciale est celle des couvertures de magazines. Les bons styles n'ont qu'un rôle : la révéler.",
    },
  ],
};

// ── Labels affichés pour chaque forme ────────────────────────────────────────
const SHAPE_LABELS = {
  oval:    "Ovale",
  round:   "Ronde",
  square:  "Carrée",
  heart:   "Cœur",
  long:    "Longue",
  diamond: "Diamant",
};

// ─────────────────────────────────────────────────────────────────────────────
// HASH DÉTERMINISTE (djb2 modifié)
// Aucun Math.random() — même input → même output, toujours.
// ─────────────────────────────────────────────────────────────────────────────
function deterministicHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // Convertit en entier 32 bits signé
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────────────────────
// SÉLECTION DU MESSAGE
// Filtre par confiance, puis sélectionne via hash.
// ─────────────────────────────────────────────────────────────────────────────
function selectMessage(pool, hashValue) {
  if (!pool || pool.length === 0) return null;
  return pool[hashValue % pool.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// GESTION DE LA ROTATION (7 jours)
// Stocke {faceShape, messageIndex, assignedAt} dans localStorage.
// ─────────────────────────────────────────────────────────────────────────────
function getStoredAssignment() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeAssignment(faceShape, messageIndex) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      faceShape,
      messageIndex,
      assignedAt: Date.now(),
    }));
  } catch {}
}

function isAssignmentValid(stored, faceShape) {
  if (!stored) return false;
  if (stored.faceShape !== faceShape) return false;
  return (Date.now() - stored.assignedAt) < ROTATION_MS;
}

// ─────────────────────────────────────────────────────────────────────────────
// GÉNÉRATION DU SESSION ID (si inexistant)
// ─────────────────────────────────────────────────────────────────────────────
export function getOrCreateSessionId() {
  let id = localStorage.getItem("afrotresse_session_id");
  if (!id) {
    // Génère un identifiant pseudo-unique sans crypto
    id = Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
    localStorage.setItem("afrotresse_session_id", id);
  }
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTION PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateStableMessage({ faceShape, sessionId, name, confidence })
 *
 * @param {string}  faceShape   - oval | round | square | heart | long | diamond
 * @param {string}  sessionId   - identifiant unique de l'utilisatrice
 * @param {string}  name        - prénom (optionnel)
 * @param {number}  confidence  - score 0–1 retourné par l'analyse (optionnel, défaut 0.5)
 *
 * @returns {{ headline: string, subtext: string }}
 */
export function generateStableMessage({
  faceShape = "oval",
  sessionId = "",
  name = "",
  confidence = 0.5,
}) {
  const pool = MESSAGES[faceShape] ?? MESSAGES.oval;
  const shapeLabel = SHAPE_LABELS[faceShape] ?? "Ovale";

  // Filtre les messages selon le niveau de confiance de l'analyse
  const eligible = pool.filter(m => confidence >= m.minConfidence);
  const finalPool = eligible.length > 0 ? eligible : pool;

  // Clé de hash : sessionId + faceShape + prénom (pour renforcer l'unicité inter-utilisatrices)
  const hashKey = `${sessionId}::${faceShape}::${name.toLowerCase().trim()}`;
  const hashValue = deterministicHash(hashKey);

  // Vérifie si un message stable est déjà assigné (rotation 7 jours)
  const stored = getStoredAssignment();

  let messageIndex;
  if (isAssignmentValid(stored, faceShape)) {
    // Utilise l'index déjà stocké — message stable pour cette utilisatrice
    messageIndex = stored.messageIndex % finalPool.length;
  } else {
    // Calcule un nouvel index via hash et le persiste
    messageIndex = hashValue % finalPool.length;
    storeAssignment(faceShape, messageIndex);
  }

  const chosen = finalPool[messageIndex];

  // ── Format de sortie ────────────────────────────────────────────────────
  const headline = name
    ? `Voici tes résultats ${name} ✨`
    : "Voici tes résultats ✨";

  const subtext = `Ton visage est de forme ${shapeLabel}. ${chosen.text}`;

  return { headline, subtext };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRE — Forcer la rotation (ex : nouvelle analyse)
// ─────────────────────────────────────────────────────────────────────────────
export function resetMessageAssignment() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
