// src/services/stats.js — AfroTresse
// Stats globales via Supabase + fallback localStorage
// ============================================================

const KEY_STYLE_STATS = 'afrotresse_style_stats'
const KEY_LIKED       = 'afrotresse_liked_styles' // set de styleIds likés par cet appareil

// ── Helpers localStorage (fallback) ─────────────────────────────────────────
function getLocalStats(styleId) {
  try {
    const raw = localStorage.getItem(KEY_STYLE_STATS)
    const all = raw ? JSON.parse(raw) : {}
    return all[styleId] || { views: 0, likes: 0, downloads: 0, shares: 0 }
  } catch { return { views: 0, likes: 0, downloads: 0, shares: 0 } }
}

function setLocalStats(styleId, stats) {
  try {
    const raw = localStorage.getItem(KEY_STYLE_STATS)
    const all = raw ? JSON.parse(raw) : {}
    all[styleId] = stats
    localStorage.setItem(KEY_STYLE_STATS, JSON.stringify(all))
  } catch {}
}

// ── Like : 1 seul par appareil par style ────────────────────────────────────
export function hasLiked(styleId) {
  try {
    const raw = localStorage.getItem(KEY_LIKED)
    const liked = raw ? JSON.parse(raw) : []
    return liked.includes(styleId)
  } catch { return false }
}

function markLiked(styleId) {
  try {
    const raw = localStorage.getItem(KEY_LIKED)
    const liked = raw ? JSON.parse(raw) : []
    if (!liked.includes(styleId)) {
      liked.push(styleId)
      localStorage.setItem(KEY_LIKED, JSON.stringify(liked))
    }
  } catch {}
}

// ── Appel API non bloquant ───────────────────────────────────────────────────
async function postStat(styleId, action) {
  try {
    await fetch('/api/stats', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ styleId, action }),
    })
  } catch {} // silencieux — non critique
}

// ── Récupérer les stats (Supabase en priorité) ───────────────────────────────
export async function fetchStyleStats(styleId) {
  try {
    const res = await fetch(`/api/stats?styleId=${encodeURIComponent(styleId)}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    // Mettre à jour le cache local
    setLocalStats(styleId, data)
    return data
  } catch {
    return getLocalStats(styleId)
  }
}

// ── Stats synchrones (depuis cache local) ────────────────────────────────────
export function getStyleStats(styleId) {
  return getLocalStats(styleId)
}

// ── Compter une vue ─────────────────────────────────────────────────────────
export function addView(styleId) {
  // Incrément local immédiat
  const stats = getLocalStats(styleId)
  stats.views += 1
  setLocalStats(styleId, stats)
  // Sync Supabase en arrière-plan
  postStat(styleId, 'views')
}

// ── Liker un style ──────────────────────────────────────────────────────────
export function addLike(styleId) {
  if (hasLiked(styleId)) return false // déjà liké sur cet appareil
  markLiked(styleId)
  const stats = getLocalStats(styleId)
  stats.likes = (stats.likes || 0) + 1
  setLocalStats(styleId, stats)
  postStat(styleId, 'likes')
  return true
}

// ── Compter un partage ──────────────────────────────────────────────────────
export function addShare(styleId) {
  const stats = getLocalStats(styleId)
  stats.shares += 1
  setLocalStats(styleId, stats)
  postStat(styleId, 'shares')
}

// ── Compter un téléchargement ───────────────────────────────────────────────
export function addDownload(styleId) {
  const stats = getLocalStats(styleId)
  stats.downloads += 1
  setLocalStats(styleId, stats)
  postStat(styleId, 'downloads')
}

// ── Télécharger une image ───────────────────────────────────────────────────
export function downloadStyleImage(styleId, styleName, imageUrl) {
  try {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${styleName.replace(/\s+/g, '-')}-${styleId}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addDownload(styleId)
    return true
  } catch { return false }
}

// ── Utilitaires ─────────────────────────────────────────────────────────────
export function getAllStats() {
  try {
    const raw = localStorage.getItem(KEY_STYLE_STATS)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function resetStats() {
  localStorage.removeItem(KEY_STYLE_STATS)
}

export function formatNumber(num) {
  if (!num) return '0'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(num)
}
