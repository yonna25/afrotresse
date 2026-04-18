// ============================================================
// useFaceAnalysis.js — AfroTresse Protection System
// Protections actives :
//   ✅ Anti double-clic / double analyse (isAnalyzing)
//   ✅ Bouton bloqué pendant requête (finally)
//   ✅ Anti refresh / back navigation (sessionStorage)
//   ✅ Reset manuel (resetFaceAnalysisLock)
//   ✅ Timeout API via AbortController (10s)
//   ✅ RequestId unique par envoi (uuid)
//   ✅ Session ID persistant (localStorage)
//   ✅ Cache image hash SHA-256 (sessionStorage)
// ============================================================

import { useState, useCallback } from "react";

// ── Helpers ──────────────────────────────────────────────────

/**
 * Hash SHA-256 d'un Blob/File → hex string
 * Permet de détecter une image identique sans re-consommer un crédit
 */
async function hashBlob(blob) {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * UUID v4 natif (sans dépendance)
 * Compatible tous navigateurs modernes + Node 16+
 */
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback manuel
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Récupère (ou crée) un session ID persistant dans localStorage
 * Évite que deux utilisateurs derrière le même NAT partagent les crédits
 */
function getOrCreateSessionId() {
  try {
    let sessionId = localStorage.getItem("afrotresse_session");
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem("afrotresse_session", sessionId);
    }
    return sessionId;
  } catch {
    // localStorage bloqué (mode privé strict) → session éphémère
    return generateUUID();
  }
}

// ── Clés sessionStorage ──────────────────────────────────────
const LOCK_KEY = "afrotresse_analyzing";
const CACHE_PREFIX = "afrotresse_cache_";

// ── Hook principal ───────────────────────────────────────────
export function useFaceAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Lance l'analyse d'un fichier image pour une faceShape donnée.
   *
   * @param {File|Blob} file      — L'image capturée ou uploadée
   * @param {string}    faceShape — Forme du visage détectée
   */
  const analyze = useCallback(async (file, faceShape) => {
    // ── Garde 1 : déjà en cours dans cet onglet ──────────────
    if (isAnalyzing) return;

    // ── Garde 2 : verrou cross-navigation (refresh / back) ───
    if (sessionStorage.getItem(LOCK_KEY) === "true") {
      console.warn("[useFaceAnalysis] Analyse déjà en cours (sessionStorage)");
      return;
    }

    // ── Cache image ──────────────────────────────────────────
    let imageHash = null;
    if (file) {
      try {
        imageHash = await hashBlob(file);
        const cached = sessionStorage.getItem(`${CACHE_PREFIX}${imageHash}`);
        if (cached) {
          console.info("[useFaceAnalysis] Résultat depuis cache (même image)");
          setResult(JSON.parse(cached));
          return;
        }
      } catch (hashErr) {
        // Hash échoué → on continue sans cache
        console.warn("[useFaceAnalysis] Hash image échoué :", hashErr);
      }
    }

    // ── Activation des verrous ───────────────────────────────
    setIsAnalyzing(true);
    sessionStorage.setItem(LOCK_KEY, "true");
    setError(null);

    // ── Identifiants uniques par requête ─────────────────────
    const requestId = generateUUID();
    const sessionId = getOrCreateSessionId();

    // ── AbortController — timeout 10s ────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

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
        throw new Error(body.error ?? `Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      setResult(data);

      // ── Mise en cache du résultat ────────────────────────
      if (imageHash) {
        try {
          sessionStorage.setItem(
            `${CACHE_PREFIX}${imageHash}`,
            JSON.stringify(data)
          );
        } catch {
          // sessionStorage plein → on ignore silencieusement
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        setError("La requête a expiré. Vérifiez votre connexion.");
      } else {
        setError(err.message ?? "Erreur inconnue");
      }
    } finally {
      // ── Libération des verrous (toujours) ───────────────────
      setIsAnalyzing(false);
      sessionStorage.removeItem(LOCK_KEY);
    }
  }, [isAnalyzing]);

  /**
   * Réinitialise manuellement le verrou en cas de blocage inattendu
   * (ex : crash navigateur, erreur non catchée, dev/debug)
   */
  const resetFaceAnalysisLock = useCallback(() => {
    setIsAnalyzing(false);
    sessionStorage.removeItem(LOCK_KEY);
    setError(null);
  }, []);

  /**
   * Vide le cache de toutes les images hashées de la session
   */
  const clearImageCache = useCallback(() => {
    try {
      const keys = Object.keys(sessionStorage).filter((k) =>
        k.startsWith(CACHE_PREFIX)
      );
      keys.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // sessionStorage indisponible → no-op
    }
  }, []);

  return {
    analyze,
    isAnalyzing,
    result,
    error,
    resetFaceAnalysisLock,
    clearImageCache,
  };
                                 }
