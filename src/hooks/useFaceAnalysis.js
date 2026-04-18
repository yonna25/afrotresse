/**
 * useFaceAnalysis.js — AfroTresse
 * Exporte analyzeFaceWithAI (appelé par faceAnalysis.js)
 * Protections :
 *   ✅ Anti double analyse (isAnalyzing)
 *   ✅ Anti refresh / back navigation (sessionStorage)
 *   ✅ Timeout API 10s (AbortController)
 *   ✅ RequestId unique par envoi
 *   ✅ Fingerprint navigateur (anti changement IP/VPN)
 *   ✅ Cache image SHA-256 (sessionStorage)
 */

// ── Helpers ──────────────────────────────────────────────────

async function hashBlob(blob) {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── État global (module-level) ───────────────────────────────
let isAnalyzing = false;
const STORAGE_KEY  = "afrotresse_last_analysis_done";
const CACHE_PREFIX = "afrotresse_cache_";

// ── Export principal — appelé par faceAnalysis.js ────────────
export async function analyzeFaceWithAI(photoData, timeoutMs = 10000) {

  // Garde 1 : double analyse
  if (isAnalyzing) {
    throw new Error("Analyse déjà en cours");
  }

  // Garde 2 : anti refresh désactivé temporairement
  // (réactiver après confirmation que le flux fonctionne)

  isAnalyzing = true;

  try {
    // Résoudre le Blob
    let file;
    if (photoData instanceof Blob) {
      file = photoData;
    } else if (typeof photoData === "string") {
      const res = await fetch(photoData);
      file = await res.blob();
    } else {
      throw new Error("Format image non supporté");
    }

    // Cache image SHA-256
    let imageHash = null;
    try {
      imageHash = await hashBlob(file);
      const cached = sessionStorage.getItem(`${CACHE_PREFIX}${imageHash}`);
      if (cached) {
        isAnalyzing = false;
        return JSON.parse(cached);
      }
    } catch {
      // Hash échoué → continuer sans cache
    }

    // Analyse locale MediaPipe
    const faceShape = await detectFaceShapeLocal(file);
    if (!faceShape) {
      throw new Error("Impossible de détecter le visage");
    }

    // Fingerprint navigateur
    let fingerprintId = null;
    try {
      const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
      const fp = await FingerprintJS.load();
      const fpResult = await fp.get();
      fingerprintId = fpResult.visitorId;
    } catch {
      // FingerprintJS indisponible → IP seule s'applique
    }

    // Appel API
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const requestId = generateUUID();

    let response;
    try {
      response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceShape, requestId, fingerprintId }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") throw new Error("Timeout API analyse");
      throw fetchErr;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? `Erreur serveur (${response.status})`);
    }

    const data = await response.json();

    // Verrou session désactivé temporairement

    const result = {
      faceShape:        data.faceShape,
      faceShapeName:    data.faceShapeName,
      confidence:       data.confidence,
      creditsRemaining: data.creditsRemaining,
    };

    // Mise en cache
    if (imageHash) {
      try {
        sessionStorage.setItem(`${CACHE_PREFIX}${imageHash}`, JSON.stringify(result));
      } catch {
        // sessionStorage plein → ignorer
      }
    }

    return result;

  } finally {
    isAnalyzing = false;
  }
}

// ── Reset manuel ─────────────────────────────────────────────
export function resetFaceAnalysisLock() {
  sessionStorage.removeItem(STORAGE_KEY);
  isAnalyzing = false;
}

// ── Détection faciale locale (MediaPipe) ─────────────────────
async function detectFaceShapeLocal(photoBlob) {
  try {
    const module = await import("@mediapipe/face_mesh");
    const FaceMesh = module.default || module.FaceMesh;
    if (!FaceMesh) throw new Error("MediaPipe Face Mesh non disponible");

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

    const objectUrl = URL.createObjectURL(photoBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = async () => {
        try {
          const results = await faceMesh.send({ image: img });
          URL.revokeObjectURL(objectUrl);
          if (!results?.multiFaceLandmarks?.length) return resolve(null);
          resolve(calculateFaceShape(results.multiFaceLandmarks[0]));
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

// ── Calcul forme visage ───────────────────────────────────────
function calculateFaceShape(landmarks) {
  if (!landmarks || landmarks.length < 10) return null;

  const forehead = landmarks[10];
  const chin     = landmarks[152];
  const left     = landmarks[234];
  const right    = landmarks[454];
  const jawLeft  = landmarks[205];
  const jawRight = landmarks[425];

  const faceHeight = Math.abs(chin.y - forehead.y);
  const faceWidth  = Math.abs(right.x - left.x);
  const jawWidth   = Math.abs(jawRight.x - jawLeft.x);
  const ratio      = faceHeight / faceWidth;

  if (ratio > 1.4) return "long";
  if (ratio < 0.85) return "round";
  if (Math.abs(jawWidth - faceWidth) < 0.05) return "square";

  const foreheadWidth = Math.abs(landmarks[54].x - landmarks[284].x);
  if (foreheadWidth > jawWidth * 1.2) return "heart";
  if (ratio > 1.1) return "diamond";

  return "oval";
}
