import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { sendMagicLink, getCurrentUser, ensureUserExists } from '../services/useSupabaseCredits.js'

export default function MagicLink() {
  const navigate  = useNavigate()
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    // Si l'utilisatrice revient via magic link, elle est connectee
    getCurrentUser().then(user => {
      if (user) {
        ensureUserExists(user.id, user.email)
        navigate('/credits')
      }
    })
  }, [navigate])

  const handleSend = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await sendMagicLink(email.trim())
      setSent(true)
    } catch (err) {
      setError('Erreur lors de l\'envoi. Verifie ton email et reessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-end justify-center pb-0"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ y: 300 }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="w-full max-w-sm rounded-t-3xl p-6 pb-10"
        style={{ background: '#2C1A0E', border: '1px solid rgba(201,150,58,0.3)' }}>

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'rgba(201,150,58,0.15)', border: '1px solid rgba(201,150,58,0.4)' }}>
            🔐
          </div>
        </div>

        {!sent ? (
          <>
            <h2 className="font-display text-center text-lg mb-1" style={{ color: '#FAF4EC' }}>
              Securise tes credits
            </h2>
            <p className="font-body text-center text-sm mb-6" style={{ color: 'rgba(250,244,236,0.6)' }}>
              Entre ton email pour recuperer tes credits en cas de perte ou changement de telephone.
            </p>

            <input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="w-full px-4 py-3 rounded-2xl font-body text-sm outline-none mb-3"
              style={{ background: 'rgba(92,51,23,0.5)', border: '1px solid rgba(201,150,58,0.35)', color: '#FAF4EC' }}
              autoFocus
            />

            {error && (
              <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
            )}

            <button onClick={handleSend} disabled={loading || !email.trim()}
              className="w-full py-3 rounded-2xl font-display font-semibold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}>
              {loading ? 'Envoi en cours...' : 'Recevoir mon lien de connexion'}
            </button>

            <button onClick={() => navigate('/credits')}
              className="w-full py-2 mt-2 font-body text-xs text-center"
              style={{ color: 'rgba(250,244,236,0.4)' }}>
              Pas maintenant
            </button>
          </>
        ) : (
          <>
            <h2 className="font-display text-center text-lg mb-2" style={{ color: '#FAF4EC' }}>
              Verifie ta boite mail 📬
            </h2>
            <p className="font-body text-center text-sm mb-6" style={{ color: 'rgba(250,244,236,0.6)' }}>
              Un lien de connexion a ete envoye a <span style={{ color: '#C9963A' }}>{email}</span>.
              Clique dessus pour securiser tes credits.
            </p>
            <button onClick={() => navigate('/credits')}
              className="w-full py-3 rounded-2xl font-display font-semibold text-sm"
              style={{ background: 'rgba(201,150,58,0.15)', border: '1px solid rgba(201,150,58,0.3)', color: '#C9963A' }}>
              Retour
            </button>
          </>
        )}

        <p className="font-body text-xs text-center mt-4" style={{ color: 'rgba(250,244,236,0.3)' }}>
          ✨ Ton email ne sera jamais partage
        </p>
      </motion.div>
    </div>
  )
}
