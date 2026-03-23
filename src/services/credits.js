// ─── Configuration prix (modifier ici uniquement) ────────────────
export const PRICING = {
  currency:     'FCFA',
  packs: [
    { id: 'starter', label: '3 essais',         credits: 6,  price: 500,  popular: false },
    { id: 'plus',    label: '10 essais',        credits: 20, price: 1500, popular: true  },
    { id: 'pro',     label: 'Abonnement mensuel',credits: 99, price: 2500, popular: false, monthly: true },
  ],
  referral: {
    giver:    2,   // crédits offerts au parrain
    receiver: 2,   // crédits offerts à la filleule
    cashback: 0.1, // 10% en crédits si filleule achète
  },
  freeCredits:    2,    // crédits gratuits à l'inscription
  reviewBonus:    2,    // crédits offerts après avis
  discoverCost:   1,    // 1 crédit = Anthropic (analyse + recommandations)
  transformCost:  2,    // 2 crédits = Fal.ai (voir coiffure sur moi)
}

// ─── Clés localStorage ───────────────────────────────────────────
const KEY_CREDITS       = 'afrotresse_credits'
const KEY_USED          = 'afrotresse_used_tests'
const KEY_REVIEW        = 'afrotresse_review_done'
const KEY_REF_CODE      = 'afrotresse_ref_code'
const KEY_REF_BY        = 'afrotresse_ref_by'
const KEY_REFERRALS     = 'afrotresse_referrals'
const KEY_SEEN_STYLES   = 'afrotresse_seen_styles'

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

export function hasCredits() {
  return getCredits() > 0
}

export function canDiscover() {
  return getCredits() >= PRICING.discoverCost
}

export function canTransform() {
  return getCredits() >= PRICING.transformCost
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
