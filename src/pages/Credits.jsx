// ─── Configuration prix (modifier ici uniquement) ────────────────
export const PRICING = {
  currency:     'FCFA',
  packs: [
    { id: 'starter', label: '3 essais',         credits: 3,  price: 500,  popular: false },
    { id: 'plus',    label: '10 essais',        credits: 10, price: 1500, popular: true  },
    { id: 'pro',     label: 'Abonnement mensuel',credits: 99, price: 2500, popular: false, monthly: true },
  ],
  referral: {
    giver:    2,   // crédits offerts au parrain
    receiver: 2,   // crédits offerts à la filleule
    cashback: 0.1, // 10% en crédits si filleule achète
  },
  freeCredits:    2,    // crédits gratuits à l'inscription
  reviewBonus:    2,    // crédits offerts après avis
  analysisCost:   1,    // 1 crédit = Analyse visage + 3 styles
  transformCost:  2,    // 2 crédits = Transformation Fal.ai
}

// ─── Clés localStorage ───────────────────────────────────────────
const KEY_CREDITS       = 'afrotresse_credits'
const KEY_USED          = 'afrotresse_used_tests'
const KEY_REVIEW        = 'afrotresse_review_done'
const KEY_REF_CODE      = 'afrotresse_ref_code'
const KEY_REF_BY        = 'afrotresse_ref_by'
const KEY_SAVED_STYLES  = 'afrotresse_saved_styles'

// ─── Gestion des Crédits ────────────────────────────────────────
export function getCredits() {
  const c = localStorage.getItem(KEY_CREDITS)
  if (c === null) {
    localStorage.setItem(KEY_CREDITS, PRICING.freeCredits.toString())
    return PRICING.freeCredits
  }
  return parseInt(c, 10) || 0
}

export function addCredits(amount) {
  const current = getCredits()
  localStorage.setItem(KEY_CREDITS, (current + amount).toString())
}

export function useCredits(amount) {
  const current = getCredits()
  if (current < amount) return false
  localStorage.setItem(KEY_CREDITS, (current - amount).toString())
  return true
}

// ─── Gestion des Analyses (Le Compteur) ─────────────────────────
export function getTotalUsed() {
  const u = localStorage.getItem(KEY_USED)
  return parseInt(u, 10) || 0
}

/**
 * ACTION : Appeler cette fonction à chaque analyse réussie
 * pour incrémenter le compteur sur le profil.
 */
export function incrementAnalyses() {
  const current = getTotalUsed()
  localStorage.setItem(KEY_USED, (current + 1).toString())
}

// ─── Sauvegarde des Styles ──────────────────────────────────────
export function getSavedStyles() {
  const s = localStorage.getItem(KEY_SAVED_STYLES)
  return s ? JSON.parse(s) : []
}

export function saveStyle(braid) {
  const saved = getSavedStyles()
  if (saved.find(s => s.id === braid.id)) return
  saved.push(braid)
  localStorage.setItem(KEY_SAVED_STYLES, JSON.stringify(saved))
}

export function unsaveStyle(styleId) {
  const saved = getSavedStyles()
  const filtered = saved.filter(s => s.id !== styleId)
  localStorage.setItem(KEY_SAVED_STYLES, JSON.stringify(filtered))
}

export function isStyleSaved(styleId) {
  return getSavedStyles().some(s => s.id === styleId)
}

// ─── Avis / témoignage ───────────────────────────────────────────
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
  return { success: true, message: `Code validé ! +${PRICING.referral.receiver} crédits offerts.` }
}

// ─── Fonctions manquantes utilisées dans Analyze / Results ──────
export function hasCredits() {
  return getCredits() > 0
}

export function canTransform() {
  return getCredits() >= PRICING.transformCost
}

export function consumeAnalysis() {
  incrementAnalyses()
  useCredits(PRICING.analysisCost)
}

export function consumeTransform() {
  useCredits(PRICING.transformCost)
}

const KEY_SEEN_STYLES = 'afrotresse_seen_styles'

export function getSeenStyleIds() {
  const s = localStorage.getItem(KEY_SEEN_STYLES)
  return s ? JSON.parse(s) : []
}

export function addSeenStyleId(styleId) {
  const seen = getSeenStyleIds()
  if (!seen.includes(styleId)) {
    seen.push(styleId)
    localStorage.setItem(KEY_SEEN_STYLES, JSON.stringify(seen))
  }
}
