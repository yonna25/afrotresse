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
const KEY_REFERRALS     = 'afrotresse_referrals'
const KEY_SEEN_STYLES   = 'afrotresse_seen_styles'
const KEY_SAVED_STYLES  = 'afrotresse_saved_styles' // localStorage permanent

// ─── Lecture / écriture crédits ──────────────────────────────────
export function getCredits() {
  const raw = localStorage.getItem(KEY_CREDITS)
  if (raw !== null) return parseInt(raw, 10)
  // Première visite : créditer les tests gratuits
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

// ─── Vérifications capacités ────────────────────────────────────
export function canAnalyze() {
  return getCredits() >= PRICING.analysisCost
}

export function canTransform() {
  return getCredits() >= PRICING.transformCost
}

export function hasCredits() {
  return getCredits() > 0
}

// ─── Consommation spécifique ────────────────────────────────────
export function consumeAnalysis() {
  return consumeCredits(PRICING.analysisCost)
}

export function consumeTransform() {
  return consumeCredits(PRICING.transformCost)
}

// ─── Vérifier si c'est un crédit payant ────────────────────────
export function isPaidCredit() {
  return getCredits() > PRICING.freeCredits
}

export function getTotalUsed() {
  return parseInt(localStorage.getItem(KEY_USED) || '0', 10)
}

// ─── Gestion des styles vus (anti-répétition) ────────────────────
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

// ─── Gestion styles sauvegardés (localStorage permanent) ─────────
export function getSavedStyles() {
  const raw = localStorage.getItem(KEY_SAVED_STYLES)
  return raw ? JSON.parse(raw) : []
}

export function saveStyle(style) {
  // Sauvegarder seulement si crédit payant
  if (!isPaidCredit()) return false

  const saved = getSavedStyles()
  const exists = saved.find(s => s.id === style.id)
  
  if (!exists) {
    saved.push({
      ...style,
      savedAt: new Date().toISOString(),
    })
    localStorage.setItem(KEY_SAVED_STYLES, JSON.stringify(saved))
  }
  return true
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
  return { success: true, message: `+${PRICING.referral.receiver} crédits offerts grâce au parrainage !` }
}

export function getReferralCount() {
  return parseInt(localStorage.getItem(KEY_REFERRALS) || '0', 10)
}
// ... (garde ton code actuel et ajoute ceci à la fin)

/**
 * Enregistre une nouvelle analyse et incrémente le compteur
 */
export function incrementAnalyses() {
  const current = getTotalUsed();
  localStorage.setItem('afrotresse_used_tests', (current + 1).toString());
}
