// ─── Configuration prix (modifier ici uniquement) ────────────────
export const PRICING = {
  currency:     'FCFA',
  perTest:      200,   // 1 test = 2 styles
  packs: [
    { id: 'starter', label: '3 tests',          tests: 3,  price: 500,  popular: false },
    { id: 'plus',    label: '10 tests',          tests: 10, price: 1500, popular: true  },
    { id: 'pro',     label: 'Abonnement mensuel',tests: 99, price: 2500, popular: false, monthly: true },
  ],
  referral: {
    giver:    1,   // tests offerts au parrain
    receiver: 1,   // tests offerts à la filleule
    cashback: 0.1, // 10% en crédits si filleule achète
  },
  freeTests:    2,   // tests gratuits à l'inscription
  reviewBonus:  1,   // test offert après avis
}

// ─── Clés localStorage ───────────────────────────────────────────
const KEY_CREDITS    = 'afrotresse_credits'
const KEY_USED       = 'afrotresse_used_tests'
const KEY_REVIEW     = 'afrotresse_review_done'
const KEY_REF_CODE   = 'afrotresse_ref_code'
const KEY_REF_BY     = 'afrotresse_ref_by'
const KEY_REFERRALS  = 'afrotresse_referrals'

// ─── Lecture / écriture ──────────────────────────────────────────
export function getCredits() {
  const raw = localStorage.getItem(KEY_CREDITS)
  if (raw !== null) return parseInt(raw, 10)
  // Première visite : créditer les tests gratuits
  setCredits(PRICING.freeTests)
  return PRICING.freeTests
}

export function setCredits(n) {
  localStorage.setItem(KEY_CREDITS, String(Math.max(0, n)))
}

export function addCredits(n) {
  setCredits(getCredits() + n)
}

export function useOneTest() {
  const current = getCredits()
  if (current <= 0) return false
  setCredits(current - 1)
  const used = parseInt(localStorage.getItem(KEY_USED) || '0', 10)
  localStorage.setItem(KEY_USED, String(used + 1))
  return true
}

export function hasCredits() {
  return getCredits() > 0
}

export function getTotalUsed() {
  return parseInt(localStorage.getItem(KEY_USED) || '0', 10)
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
  return { success: true, message: `+${PRICING.referral.receiver} test offert grâce au parrainage !` }
}

export function getReferralCount() {
  return parseInt(localStorage.getItem(KEY_REFERRALS) || '0', 10)
}
