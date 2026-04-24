/**
 * useFaceAnalysis.js — AfroTresse
 * Version Sécurisée (Anti-consommation vide)
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

// ── État global ───────────────────────────────
let isAnalyzing = false;
const STORAGE_KEY  = "afrotresse_last_analysis_done";
const CACHE_PREFIX = "afrotresse_cache_";

// ── Export principal ────────────
export async function analyzeFaceWithAI(photoData, timeoutMs = 15000) {
  
  // SÉCURITÉ : Si photoData est vide ou absent, on stop tout ici.
  // Cela évite de consommer un crédit pour rien.
  if (!photoData) {
    console.warn("Aucune photo détectée. Appel API annulé.");
    return null;
  }

  if (isAnalyzing) {
    throw new Error("Analyse déjà en cours");
  }

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
    } catch {}

    // Analyse locale MediaPipe
    let faceShape = "oval";
    try {
      const detected = await detectFaceShapeLocal(file);
      if (detected) faceShape = detected;
    } catch {
      console.warn("MediaPipe indisponible, fallback oval");
    }

    // Fingerprint navigateur
    let fingerprintId = null;
    try {
      const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
      const fp = await FingerprintJS.load();
      const fpResult = await fp.get();
      fingerprintId = fpResult.visitorId;
    } catch {}

    // Identification session (Invité)
    let sessionId = localStorage.getItem('afrotresse_session_id');
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem('afrotresse_session_id', sessionId);
    }

    // Récupérer userId si connecté
    let userId = null;
    try {
      const { getCurrentUser } = await import('../services/useSupabaseCredits.js');
      const user = await getCurrentUser();
      if (user?.id) userId = user.id;
    } catch {}

    // Appel API Vercel
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const requestId = generateUUID();

    let response;
    try {
      response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          faceShape, 
          requestId, 
          fingerprintId, 
          userId, 
          sessionId 
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === "AbortError") throw new Error("Le serveur met trop de temps à répondre.");
      throw fetchErr;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur lors de l'analyse");
    }

    const data = await response.json();

    const result = {
      faceShape:        data.faceShape || faceShape,
      faceShapeName:    data.faceShapeName,
      confidence:       data.confidence || 0.85,
      creditsRemaining: data.remaining,
    };

    // Mise en cache
    if (imageHash) {
      try {
        sessionStorage.setItem(`${CACHE_PREFIX}${imageHash}`, JSON.stringify(result));
      } catch {}
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
    
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
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
        reject(new Error("Erreur image"));
      };
      img.src = objectUrl;
    });
  } catch (err) {
    throw err;
  }
}

// ── Calcul forme visage ───────────────────────────────────────
function calculateFaceShape(landmarks) {
  if (!landmarks || landmarks.length < 10) return "oval";

  const faceHeight = Math.abs(landmarks[152].y - landmarks[10].y);
  const faceWidth  = Math.abs(landmarks[454].x - landmarks[234].x);
  const jawWidth   = Math.abs(landmarks[425].x - landmarks[205].x);
  const ratio      = faceHeight / faceWidth;

  if (ratio > 1.4) return "long";
  if (ratio < 0.85) return "round";
  if (Math.abs(jawWidth - faceWidth) < 0.05) return "square";
  
  const foreheadWidth = Math.abs(landmarks[54].x - landmarks[284].x);
  if (foreheadWidth > jawWidth * 1.2) return "heart";
  if (ratio > 1.1) return "diamond";

  return "oval";
}
