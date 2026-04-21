// ─── Configuration prix (modifier ici uniquement) ────────────────
export const PRICING = {
  currency:     'FCFA',
  packs: [
    { id: 'starter', label: '3 essais',          credits: 3,  price: 500,  popular: false },
    { id: 'plus',    label: '10 essais',         credits: 10, price: 1500, popular: true  },
    { id: 'pro',     label: 'Abonnement mensuel', credits: 99, price: 2500, popular: false, monthly: true },
  ],
  referral: {
    giver:    2,
    receiver: 2,
    cashback: 0.1,
  },
  freeCredits:   2,
  reviewBonus:   2,
  analysisCost:  1,
  transformCost: 2,
}

// ─── Clés localStorage ───────────────────────────────────────────
const KEY_CREDITS      = 'afrotresse_credits'
const KEY_USED         = 'afrotresse_used_tests'
const KEY_REVIEW       = 'afrotresse_review_done'
const KEY_REF_CODE     = 'afrotresse_ref_code'
const KEY_REF_BY       = 'afrotresse_ref_by'
const KEY_REFERRALS    = 'afrotresse_referrals'
const KEY_SEEN_STYLES  = 'afrotresse_seen_styles'
const KEY_SAVED_STYLES = 'afrotresse_saved_styles'

// ─── Session ID (identifiant unique par navigateur) ──────────────
export function getSessionId() {
  try {
    let id = localStorage.getItem('afrotresse_session')
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2)
      localStorage.setItem('afrotresse_session', id)
    }
    return id
  } catch {
    return null
  }
}

export async function getSessionIdWithFp() {
  try {
    const cached = localStorage.getItem('afrotresse_session')
    if (cached && cached.startsWith('fp_')) return cached

    const { getFingerprint } = await import('./fingerprint.js')
    const fp = await getFingerprint()
    if (fp) {
      const fpSessionId = `fp_${fp}`
      localStorage.setItem('afrotresse_session', fpSessionId)
      return fpSessionId
    }
  } catch {}
  return getSessionId()
}

// ─── Lecture / écriture crédits (localStorage = cache) ──────────
export function getCredits() {
  const raw = localStorage.getItem(KEY_CREDITS)
  if (raw !== null) return parseInt(raw, 10)
  setCredits(PRICING.freeCredits)
  return PRICING.freeCredits
}

export function setCredits(n) {
  localStorage.setItem(KEY_CREDITS, String(Math.max(0, n)))
}

export function addCredits(n) {
  setCredits(getCredits() + n)
}

export function consumeCredits(amount) {
  const current = getCredits()
  if (current < amount) return false
  setCredits(current - amount)
  return true
}

// ─── Vérifications ───────────────────────────────────────────────
export function canAnalyze()  { return getCredits() >= PRICING.analysisCost  }
export function canTransform(){ return getCredits() >= PRICING.transformCost }
export function hasCredits()  { return getCredits() > 0 }
export function isPaidCredit(){ return getCredits() > PRICING.freeCredits }

// ─── Sync depuis le serveur (source de vérité) ───────────────────
export async function syncCreditsFromServer() {
  try {
    // Connectée → source de vérité = table `credits` (user_id / balance)
    // Ne jamais laisser la table `sessions` écraser ces crédits
    const { getCurrentUser, getSupabaseCredits } = await import('./useSupabaseCredits.js')
    const user = await getCurrentUser()
    if (user) {
      const balance = await getSupabaseCredits(user.id)
      setCredits(balance)
      return balance
    }
  } catch {}

  // Anonyme → table `sessions` via /api/credits
  try {
    const sessionId = await getSessionIdWithFp()
    if (!sessionId) return getCredits()

    const res = await fetch(`/api/credits?sessionId=${encodeURIComponent(sessionId)}`)
    if (!res.ok) return getCredits()

    const { credits } = await res.json()
    localStorage.setItem(KEY_CREDITS, String(Math.max(0, credits)))
    return credits
  } catch {
    return getCredits()
  }
}

// ─── Helper interne : consommer via Supabase (utilisatrice connectée) ────────
async function _consumeSupabase(amount) {
  try {
    const { getCurrentUser, useSupabaseCredit, getSupabaseCredits } = await import('./useSupabaseCredits.js')
    const user = await getCurrentUser()
    if (!user) return null // pas connectée → fallback sessionId

    // useSupabaseCredit ne déduit que 1 crédit — on boucle si amount > 1
    for (let i = 0; i < amount; i++) {
      const ok = await useSupabaseCredit(user.id)
      if (!ok) {
        setCredits(0)
        return false
      }
    }

    // Sync localStorage avec le vrai solde Supabase
    const balance = await getSupabaseCredits(user.id)
    setCredits(balance)
    return true
  } catch {
    return null // erreur → fallback sessionId
  }
}

// ─── Consommation SÉCURISÉE (serveur d'abord) ────────────────────
export async function consumeAnalysis() {
  // 1. Utilisatrice connectée → table `credits` (user_id / balance)
  const supabaseResult = await _consumeSupabase(PRICING.analysisCost)
  if (supabaseResult !== null) return supabaseResult

  // 2. Anonyme → table `sessions` (session_id / credits) via /api/consume
  try {
    const sessionId = await getSessionIdWithFp()
    if (!sessionId) return consumeCredits(PRICING.analysisCost)

    const res = await fetch('/api/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, amount: PRICING.analysisCost }),
    })

    if (res.status === 402) { setCredits(0); return false }
    if (!res.ok) return consumeCredits(PRICING.analysisCost)

    const { credits } = await res.json()
    setCredits(credits)
    return true
  } catch {
    return consumeCredits(PRICING.analysisCost)
  }
}

export async function consumeTransform() {
  // 1. Utilisatrice connectée → table `credits`
  const supabaseResult = await _consumeSupabase(PRICING.transformCost)
  if (supabaseResult !== null) return supabaseResult

  // 2. Anonyme → /api/consume
  try {
    const sessionId = await getSessionIdWithFp()
    if (!sessionId) return consumeCredits(PRICING.transformCost)

    const res = await fetch('/api/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, amount: PRICING.transformCost }),
    })

    if (res.status === 402) { setCredits(0); return false }
    if (!res.ok) return consumeCredits(PRICING.transformCost)

    const { credits } = await res.json()
    setCredits(credits)
    return true
  } catch {
    return consumeCredits(PRICING.transformCost)
  }
}

// ─── Compteur analyses ───────────────────────────────────────────
export function getTotalUsed() {
  return parseInt(localStorage.getItem(KEY_USED) || '0', 10)
}

export function incrementAnalyses() {
  const current = getTotalUsed()
  localStorage.setItem(KEY_USED, (current + 1).toString())
}

// ─── Styles vus (anti-répétition) ───────────────────────────────
export function getSeenStyleIds() {
  const raw = localStorage.getItem(KEY_SEEN_STYLES)
  return raw ? JSON.parse(raw) : []
}

export function addSeenStyleId(styleId) {
  const seen = getSeenStyleIds()
  if (!seen.includes(styleId)) {
    seen.push(styleId)
    localStorage.setItem(KEY_SEEN_STYLES, JSON.stringify(seen))
  }
}

export function resetSeenStyles() {
  localStorage.removeItem(KEY_SEEN_STYLES)
}

// ─── Styles sauvegardés ──────────────────────────────────────────
export function getSavedStyles() {
  const raw = localStorage.getItem(KEY_SAVED_STYLES)
  return raw ? JSON.parse(raw) : []
}

export function saveStyle(style) {
  if (!isPaidCredit()) return false
  const saved = getSavedStyles()
  if (!saved.find(s => s.id === style.id)) {
    saved.push({ ...style, savedAt: new Date().toISOString() })
    localStorage.setItem(KEY_SAVED_STYLES, JSON.stringify(saved))
  }
  return true
}

export function unsaveStyle(styleId) {
  const saved = getSavedStyles()
  localStorage.setItem(KEY_SAVED_STYLES, JSON.stringify(saved.filter(s => s.id !== styleId)))
}

export function isStyleSaved(styleId) {
  return getSavedStyles().some(s => s.id === styleId)
}

// ─── Avis ────────────────────────────────────────────────────────
export function hasGivenReview() {
  return localStorage.getItem(KEY_REVIEW) === 'true'
}

export function submitReview() {
  if (hasGivenReview()) return false
  localStorage.setItem(KEY_REVIEW, 'true')
  addCredits(PRICING.reviewBonus)
  return true
}

// ─── Parrainage ──────────────────────────────────────────────────
export function getMyReferralCode() {
  let code = localStorage.getItem(KEY_REF_CODE)
  if (!code) {
    code = 'AFRO-' + Math.random().toString(36).substring(2, 7).toUpperCase()
    localStorage.setItem(KEY_REF_CODE, code)
  }
  return code
}

export function applyReferralCode(code) {
  const myCode = getMyReferralCode()
  if (code === myCode) return { success: false, message: 'Tu ne peux pas utiliser ton propre code !' }
  if (localStorage.getItem(KEY_REF_BY)) return { success: false, message: 'Tu as déjà utilisé un code parrain.' }
  localStorage.setItem(KEY_REF_BY, code)
  addCredits(PRICING.referral.receiver)
  return { success: true, message: `+${PRICING.referral.receiver} crédits offerts grâce au parrainage !` }
}

export function getReferralCount() {
  return parseInt(localStorage.getItem(KEY_REFERRALS) || '0', 10)
}
