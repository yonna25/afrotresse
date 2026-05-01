import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase.js'
import { 
  getCurrentUser, 
  syncCreditsWithServer, 
  getOrCreateFingerprint 
} from '../services/useSupabaseCredits.js'
import { setCredits } from '../services/credits.js'

export default function MagicLink() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté en arrivant
    getCurrentUser().then(user => {
      if (user) navigate('/profile')
    })
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin + '/profile',
        },
      })

      if (error) throw error
      
      // Synchronisation préventive avec le fingerprint actuel
      const fp = getOrCreateFingerprint()
      await syncCreditsWithServer(email, fp)
      
      setMessage('Lien magique envoyé ! Vérifiez vos e-mails. 📧')
    } catch (error) {
      setMessage('Erreur : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-white">
      <div className="w-full max-w-md space-y-8 p-8 rounded-[2.5rem] bg-[#3D2616] border-2 border-[#C9963A]">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#C9963A]">Connexion Magique</h2>
          <p className="mt-2 text-sm text-white/60">
            Recevez un lien par e-mail pour vous connecter sans mot de passe et retrouver vos crédits.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <input
            type="email"
            required
            className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-[#C9963A]/30 text-white focus:border-[#C9963A] outline-none transition-all"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-[#1A0A00] transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien ✨'}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm font-medium text-[#C9963A] animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
