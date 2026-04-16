/**
 * Hook AfroTresse v2 - MediaPipe local + validation serveur
 * 1. Analyse faciale côté frontend (MediaPipe)
 * 2. Envoie faceShape au serveur (validation crédits)
 * 3. Retourne recommendations
 */

let isAnalyzing = false;
const STORAGE_KEY = "afrotresse_last_analysis_done";

// FIX 1 : async function directe au lieu de new Promise(async) — évite les double-reject
export async function analyzeFaceWithAI(photoData, timeoutMs = 10000) {
  // 🔒 ANTI DOUBLE ANALYSE
  if (isAnalyzing) {
    throw new Error("Analyse déjà en cours");
  }

  // 🔒 ANTI REFRESH / BACK NAVIGATION
  const alreadyDone = sessionStorage.getItem(STORAGE_KEY);
  if (alreadyDone) {
    throw new Error("Analyse déjà effectuée dans cette session");
  }

  isAnalyzing = true;

  try {
    let file;

    // Cas 1 : Blob/File
    if (photoData instanceof Blob) {
      file = photoData;
    }
    // Cas 2 : string (base64 ou URL)
    else if (typeof photoData === "string") {
      const res = await fetch(photoData);
      file = await res.blob();
    }
    // Cas invalide
    else {
      throw new Error("Format image non supporté");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1️⃣ ANALYSE LOCALE (MediaPipe)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const faceShape = await detectFaceShapeLocal(file);

    if (!faceShape) {
      throw new Error("Impossible de détecter le visage");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2️⃣ VALIDATION BACKEND (CRÉDITS)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // FIX 2 : AbortController pour timeout propre (évite double-reject)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceShape }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") {
        throw new Error("Timeout API analyse");
      }
      throw fetchErr;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw err;
    }

    const data = await response.json();

    // 🔒 VERROU SESSION (ANTI RE-RUN REFRESH) — uniquement si succès complet
    sessionStorage.setItem(STORAGE_KEY, "true");

    return {
      landmarks: [],
      faceShape: data.faceShape,
      faceShapeName: data.faceShapeName,
      confidence: data.confidence,
      recommendations: data.recommendations,
      creditsRemaining: data.creditsRemaining,
    };

  } finally {
    // FIX 3 : isAnalyzing toujours remis à false, succès ou erreur
    isAnalyzing = false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESET MANUEL (bouton "Refaire analyse")
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function resetFaceAnalysisLock() {
  sessionStorage.removeItem(STORAGE_KEY);
  isAnalyzing = false; // sécurité supplémentaire
}

/**
 * DÉTECTION FACIALE LOCAL (MediaPipe Face Mesh)
 */
async function detectFaceShapeLocal(photoBlob) {
  try {
    const module = await import("@mediapipe/face_mesh");
    const FaceMesh = module.default || module.FaceMesh;

    if (!FaceMesh) {
      throw new Error("MediaPipe Face Mesh non disponible");
    }

    // FIX 4 : Initialisation complète avant send()
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    await faceMesh.initialize();

    // FIX 5 : Créer l'objectURL avant la Promise et révoquer APRÈS que MediaPipe ait fini
    const objectUrl = URL.createObjectURL(photoBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = async () => {
        try {
          const results = await faceMesh.send({ image: img });

          // FIX 5 suite : révoquer seulement après send() terminé
          URL.revokeObjectURL(objectUrl);

          if (
            !results ||
            !results.multiFaceLandmarks ||
            results.multiFaceLandmarks.length === 0
          ) {
            return resolve(null);
          }

          const landmarks = results.multiFaceLandmarks[0];
          const shape = calculateFaceShape(landmarks);

          resolve(shape);
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Erreur chargement image"));
      };

      img.src = objectUrl;
    });

  } catch (err) {
    console.error("MediaPipe error:", err);
    throw err;
  }
}

/**
 * CALCUL FORME VISAGE
 * FIX 6 : Correction des coordonnées normalisées MediaPipe (y croît vers le bas)
 */
function calculateFaceShape(landmarks) {
  if (!landmarks || landmarks.length < 10) return null;

  const forehead  = landmarks[10];   // haut du front
  const chin      = landmarks[152];  // bas du menton
  const left      = landmarks[234];  // joue gauche
  const right     = landmarks[454];  // joue droite
  const jawLeft   = landmarks[205];  // mâchoire gauche
  const jawRight  = landmarks[425];  // mâchoire droite

  const faceHeight = Math.abs(chin.y - forehead.y);   // toujours positif (chin.y > forehead.y)
  const faceWidth  = Math.abs(right.x - left.x);
  const jawWidth   = Math.abs(jawRight.x - jawLeft.x);
  const ratio      = faceHeight / faceWidth;

  console.log("FaceShape metrics:", { faceHeight, faceWidth, jawWidth, ratio });

  if (ratio > 1.4) return "long";
  if (ratio < 0.85) return "round";
  if (Math.abs(jawWidth - faceWidth) < 0.05) return "square";  // seuil affiné

  // FIX 6 : front large = heart (forehead.x vs jawWidth)
  const foreheadWidth = Math.abs(landmarks[54].x - landmarks[284].x);
  if (foreheadWidth > jawWidth * 1.2) return "heart";

  if (ratio > 1.1) return "diamond";

  return "oval";
}
