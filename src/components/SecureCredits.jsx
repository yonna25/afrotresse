import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendMagicLink, getCurrentUser, getSupabaseCredits } from '../services/useSupabaseCredits.js'
import { setCredits, getCredits } from '../services/credits.js'

export default function SecureCredits({ variant = 'button' }) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'sent', 'restored', 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const handleSendMagicLink = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setErrorMsg('Entre ton email s.t.p')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setStatus(null)

    try {
      await sendMagicLink(email)
      setStatus('sent')
      setEmail('')
      setShowForm(false)
      
      // Montre le message pendant 5s puis ferme
      setTimeout(() => setStatus(null), 5000)
    } catch (err) {
      setErrorMsg('Erreur — réessaie')
      setStatus('error')
      console.error('Magic link error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Vérifier si l'utilisateur est connecté et restaurer les crédits
  const handleRestoreCredits = async () => {
    setLoading(true)
    setErrorMsg('')
    setStatus(null)

    try {
      const user = await getCurrentUser()
      if (!user) {
        setErrorMsg('Pas connecté — envoie-toi le Magic Link')
        setStatus('error')
        setLoading(false)
        return
      }

      // Récupérer les crédits de Supabase
      const supabaseBalance = await getSupabaseCredits(user.id)
      const localBalance = getCredits()

      if (supabaseBalance > localBalance) {
        // Restaurer les crédits payés
        setCredits(supabaseBalance)
        setStatus('restored')
        setTimeout(() => setStatus(null), 4000)
      } else {
        setErrorMsg('Aucun crédit à restaurer')
        setStatus('error')
      }
    } catch (err) {
      setErrorMsg('Erreur de synchronisation')
      setStatus('error')
      console.error('Restore credits error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── VARIANT 1: BUTTON (pour Profile)
  if (variant === 'button') {
    return (
      <>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(!showForm)}
          className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-between px-5 bg-white/5 border border-white/10"
        >
          <span>🔐 Sécuriser mes crédits</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>

        {/* Form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.75)' }}
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 40 }}
                className="w-full max-w-sm rounded-3xl p-6 bg-[#2b1810] border border-[#C9963A]/30"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="font-black text-xl text-[#C9963A] mb-2">Sécuriser mes crédits</h2>
                <p className="text-xs text-white/60 mb-4">
                  Reçois un lien Magic par email. Clique-le pour restaurer tes crédits payés. 🔐
                </p>

                <form onSubmit={handleSendMagicLink} className="space-y-3">
                  <input
                    type="email"
                    placeholder="reine@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#C9963A]"
                  />

                  {errorMsg && (
                    <p className="text-xs text-red-300 text-center">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-black text-sm text-[#2b1810] bg-[#C9963A] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Envoi...
                      </>
                    ) : (
                      '✉️ Envoie-moi le lien'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full py-3 rounded-xl font-black text-sm text-white bg-white/5 border border-white/10"
                  >
                    Fermer
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status message */}
        <AnimatePresence>
          {status === 'sent' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 rounded-2xl bg-[#C9963A] text-[#2b1810] text-sm font-black text-center"
            >
              ✉️ Vérifie ton email !
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── VARIANT 2: CARD (pour Credits)
  if (variant === 'card') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-6 p-5 rounded-3xl border border-[#C9963A]/40 bg-[#C9963A]/10"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl mt-1">🔐</div>
            <div className="flex-1">
              <h3 className="font-black text-sm text-white mb-1">Crédits payés ?</h3>
              <p className="text-xs text-white/70 mb-3">
                Si tu ne vois pas tes crédits après paiement, connecte-toi par Magic Link pour les restaurer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex-1 py-2.5 rounded-xl bg-[#C9963A] text-[#2b1810] font-black text-xs text-center hover:bg-[#E8B96A] transition-all"
                >
                  Restaurer
                </button>
                {status === 'restored' && (
                  <span className="px-3 py-2.5 rounded-xl bg-green-500/20 text-green-300 font-black text-xs flex items-center">
                    ✅ Restaurés
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.75)' }}
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 40 }}
                className="w-full max-w-sm rounded-3xl p-6 bg-[#1A0A00] border border-[#C9963A]/30"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="font-black text-lg text-[#C9963A] mb-2">Sécuriser mes crédits</h2>
                <p className="text-xs text-white/60 mb-4">
                  Envoie-toi un Magic Link par email pour restaurer tes crédits payés. 🔐
                </p>

                <form onSubmit={handleSendMagicLink} className="space-y-3">
                  <input
                    type="email"
                    placeholder="reine@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#C9963A]"
                  />

                  {errorMsg && (
                    <p className="text-xs text-red-300 text-center">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-black text-sm text-[#1A0A00] bg-[#C9963A] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Envoi...
                      </>
                    ) : (
                      '✉️ Envoie-moi le lien'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full py-3 rounded-xl font-black text-sm text-[#FAF4EC] bg-white/10 border border-white/20"
                  >
                    Fermer
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status messages */}
        <AnimatePresence>
          {status === 'sent' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 rounded-2xl bg-[#C9963A] text-[#1A0A00] text-sm font-black text-center"
            >
              ✉️ Vérifie ton email !
            </motion.div>
          )}
          {status === 'restored' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 rounded-2xl bg-green-500 text-white text-sm font-black text-center"
            >
              ✅ Crédits restaurés !
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return null
}
