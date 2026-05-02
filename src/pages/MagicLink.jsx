import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  sendMagicLink,
  getCurrentUser,
  ensureUserExists,
  getOrCreateFingerprint,
} from '../services/useSupabaseCredits.js'
import { supabase } from '../services/supabase.js'

// Restaurer les données de session sauvegardées avant le redirect Magic Link
function restoreSessionBackup() {
  try {
    const raw = localStorage.getItem('afrotresse_session_backup')
    if (!raw) return
    const backup = JSON.parse(raw)
    Object.entries(backup).forEach(([key, val]) => sessionStorage.setItem(key, val))
    localStorage.removeItem('afrotresse_session_backup')
  } catch {}
}

export default function MagicLink() {
  const navigate  = useNavigate()
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    // Créer le fingerprint dès l'ouverture
    getOrCreateFingerprint()

    // ── Vérification initiale (retour direct via magic link) ──
    getCurrentUser().then(async user => {
      if (user) {
        await ensureUserExists(user.id, user.email)
        restoreSessionBackup()
        navigate('/profile', { replace: true })
      }
    })

    // ── Écoute temps réel — capte le SIGNED_IN après clic sur le lien ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          await ensureUserExists(session.user.id, session.user.email)
          restoreSessionBackup()
          navigate('/profile', { replace: true })
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [navigate])

  const handleSend = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      getOrCreateFingerprint()
      await sendMagicLink(email.trim())
      setSent(true)
    } catch {
      setError("Erreur lors de l'envoi. Vérifie ton email et réessaie.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-end justify-center pb-0"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ y: 300 }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="w-full max-w-sm rounded-t-3xl p-6 pb-10"
        style={{ background: '#2C1A0E', border: '1px solid rgba(201,150,58,0.3)' }}
      >
        <div className="flex justify-center mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'rgba(201,150,58,0.15)', border: '1px solid rgba(201,150,58,0.4)' }}
          >
            🔐
          </div>
        </div>

        {!sent ? (
          <>
            <h2 className="font-display text-center text-lg mb-1" style={{ color: '#FAF4EC' }}>
              Connexion à ton compte
            </h2>
            <p className="font-body text-center text-sm mb-6" style={{ color: 'rgba(250,244,236,0.6)' }}>
              Entre ton email pour te connecter et retrouver tes crédits, favoris et résultats.
            </p>

            <input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="w-full px-4 py-3 rounded-2xl font-body text-sm outline-none mb-3"
              style={{
                background: 'rgba(92,51,23,0.5)',
                border: '1px solid rgba(201,150,58,0.35)',
                color: '#FAF4EC',
              }}
              autoFocus
            />

            {error && (
              <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
            )}

            <button
              onClick={handleSend}
              disabled={loading || !email.trim()}
              className="w-full py-3 rounded-2xl font-display font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
            >
              {loading ? 'Envoi en cours...' : 'Recevoir mon lien de connexion'}
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full py-2 mt-2 font-body text-xs text-center"
              style={{ color: 'rgba(250,244,236,0.4)' }}
            >
              Pas maintenant
            </button>
          </>
        ) : (
          <>
            <h2 className="font-display text-center text-lg mb-2" style={{ color: '#FAF4EC' }}>
              Vérifie ta boîte mail 📬
            </h2>
            <p className="font-body text-center text-sm mb-4" style={{ color: 'rgba(250,244,236,0.6)' }}>
              Un lien de connexion a été envoyé à{' '}
              <span style={{ color: '#C9963A' }}>{email}</span>.
              Clique dessus pour accéder à ton compte.
            </p>

            {/* Indicateur d'attente de connexion */}
            <div
              className="flex items-center justify-center gap-2 py-3 rounded-2xl mb-4"
              style={{ background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.2)' }}
            >
              <svg className="animate-spin w-3 h-3 text-[#C9963A]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(201,150,58,0.7)' }}>
                En attente de connexion...
              </span>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="w-full py-3 rounded-2xl font-display font-semibold text-sm"
              style={{
                background: 'rgba(201,150,58,0.15)',
                border: '1px solid rgba(201,150,58,0.3)',
                color: '#C9963A',
              }}
            >
              Retour
            </button>
          </>
        )}

        <p className="font-body text-xs text-center mt-4" style={{ color: 'rgba(250,244,236,0.3)' }}>
          ✨ Ton email ne sera jamais partagé
        </p>
      </motion.div>
    </div>
  )
}
