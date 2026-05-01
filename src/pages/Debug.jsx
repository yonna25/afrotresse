import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase.js'
import { getCredits, setCredits } from '../services/credits.js'
import { syncCreditsWithServer, getOrCreateFingerprint } from '../services/useSupabaseCredits.js'
import AdminNav from '../components/AdminNav.jsx'

export default function Debug() {
  const navigate = useNavigate()
  const [localCredits, setLocalCredits] = useState(0)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Sync initial
    setLocalCredits(getCredits())
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])

  const handleRefreshSync = async () => {
    setLoading(true)
    const fp = getOrCreateFingerprint()
    const email = session?.user?.email || null
    const newBalance = await syncCreditsWithServer(email, fp)
    setLocalCredits(newBalance)
    setCredits(newBalance)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0F0500] text-white pb-20">
      <AdminNav />

      <div className="mt-24 px-6 max-w-md mx-auto">
        {/* Header avec bouton Retour Intelligent */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Debug Mode</h1>
            <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1">Outils de diagnostic système</p>
          </div>
          <button 
            onClick={() => navigate('/admin-credits')}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#C9963A]"
          >
            Retour Admin
          </button>
        </div>

        {/* État de la Session */}
        <div className="rounded-[2rem] p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,150,58,0.2)" }}>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Statut Session</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Utilisateur :</span>
              <span className="text-xs font-mono text-[#C9963A]">{session?.user?.email || 'Anonyme'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">ID Supabase :</span>
              <span className="text-[10px] font-mono text-white/40 truncate ml-4">{session?.user?.id || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Crédits */}
        <div className="rounded-[2rem] p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Diagnostic Crédits</p>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-3xl font-black text-white">{localCredits}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Solde Local (Cache)</p>
            </div>
            <button 
              onClick={handleRefreshSync}
              disabled={loading}
              className={`p-4 rounded-2xl bg-[#C9963A] text-[#1A0A00] transition-all ${loading ? 'animate-pulse opacity-50' : 'active:scale-95'}`}
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions de Sortie */}
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
          >
            Quitter le mode Debug (Vers Accueil)
          </button>
          
          <button 
            onClick={handleSignOut}
            className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/20 transition-all"
          >
            Déconnexion de la session
          </button>
        </div>

        {/* Info Fingerprint */}
        <div className="mt-8 text-center">
          <p className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Device Fingerprint</p>
          <p className="text-[9px] font-mono text-white/10 mt-1 break-all">{getOrCreateFingerprint()}</p>
        </div>
      </div>
    </div>
  )
}
