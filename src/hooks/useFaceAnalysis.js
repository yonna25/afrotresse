// ============================================================
// useFaceAnalysis.js — AfroTresse Protection System
// ============================================================

import { useState, useCallback } from "react";

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

function getOrCreateSessionId() {
  try {
    let sessionId = localStorage.getItem("afrotresse_session");
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem("afrotresse_session", sessionId);
    }
    return sessionId;
  } catch {
    return generateUUID();
  }
}

// ── Constantes ───────────────────────────────────────────────
const LOCK_KEY = "afrotresse_analyzing";
const CACHE_PREFIX = "afrotresse_cache_";

// ── Standalone export (for faceAnalysis.js) ──────────────────
export async function analyzeFaceWithAI(file, faceShape) {
  const requestId  = generateUUID();
  const sessionId  = getOrCreateSessionId();
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ faceShape, requestId, sessionId }),
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Erreur serveur (${response.status})`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") throw new Error("Requête expirée.");
    throw err;
  }
}

// ── Hook ─────────────────────────────────────────────────────
export function useFaceAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (file, faceShape) => {
    if (isAnalyzing) return;

    if (sessionStorage.getItem(LOCK_KEY) === "true") return;

    let imageHash = null;

    if (file) {
      try {
        imageHash = await hashBlob(file);

        const cached = sessionStorage.getItem(`${CACHE_PREFIX}${imageHash}`);
        if (cached) {
          setResult(JSON.parse(cached));
          return JSON.parse(cached);
        }
      } catch (err) {
        console.warn("Hash error:", err);
      }
    }

    setIsAnalyzing(true);
    sessionStorage.setItem(LOCK_KEY, "true");
    setError(null);

    const requestId = generateUUID();
    const sessionId = getOrCreateSessionId();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          faceShape,
          requestId,
          sessionId,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      setResult(data);

      if (imageHash) {
        sessionStorage.setItem(
          `${CACHE_PREFIX}${imageHash}`,
          JSON.stringify(data)
        );
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        setError("Requête expirée.");
      } else {
        setError(err.message || "Erreur inconnue");
      }
    } finally {
      setIsAnalyzing(false);
      sessionStorage.removeItem(LOCK_KEY);
    }
  }, [isAnalyzing]);

  const resetFaceAnalysisLock = useCallback(() => {
    setIsAnalyzing(false);
    sessionStorage.removeItem(LOCK_KEY);
    setError(null);
  }, []);

  const clearImageCache = useCallback(() => {
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }, []);

  // ✅ IMPORTANT : compatibilité avec faceAnalysis.js
  return {
    analyze,
    analyzeFaceWithAI: analyze, // 👈 FIX CRUCIAL
    isAnalyzing,
    result,
    error,
    resetFaceAnalysisLock,
    clearImageCache,
  };
}
