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
  const [storageData, setStorageData] = useState({})

  useEffect(() => {
    refreshAllData()
  }, [])

  const refreshAllData = async () => {
    setLocalCredits(getCredits())
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    
    // Récupération des données brutes du LocalStorage pour le diagnostic
    setStorageData({
      credits: localStorage.getItem('afrotresse_credits'),
      fingerprint: localStorage.getItem('afrotresse_fingerprint'),
      history: localStorage.getItem('admin_credits_history')
    })
  }

  const handleFullSync = async () => {
    setLoading(true)
    const fp = getOrCreateFingerprint()
    const email = session?.user?.email || null
    const newBalance = await syncCreditsWithServer(email, fp)
    setLocalCredits(newBalance)
    setCredits(newBalance)
    await refreshAllData()
    setLoading(false)
  }

  const clearLocalData = () => {
    if(window.confirm("Attention: Cela va supprimer tes crédits locaux et ton fingerprint. Continuer ?")) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0500] text-white pb-32">
      <AdminNav />

      <div className="mt-24 px-6 max-w-md mx-auto space-y-6">
        
        {/* EN-TÊTE & NAVIGATION */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Diagnostic Expert</h1>
            <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1">État profond du système</p>
          </div>
          <button 
            onClick={() => navigate('/admin-credits')}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#C9963A]"
          >
            Retour Admin
          </button>
        </div>

        {/* 1. SESSION & AUTH (DÉTAILLÉ) */}
        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10">
          <p className="text-[9px] font-black text-[#C9963A] uppercase tracking-widest mb-4">Auth & Identity</p>
          <div className="space-y-3 font-mono text-[10px]">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Email:</span>
              <span className="text-white">{session?.user?.email || 'ANONYME'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Auth Role:</span>
              <span className="text-green-500 font-bold">{session?.user?.role || 'none'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/40">Supabase UID:</span>
              <span className="text-white/20 break-all">{session?.user?.id || 'null'}</span>
            </div>
          </div>
        </div>

        {/* 2. SYSTÈME DE CRÉDITS & FINGERPRINT */}
        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10">
          <p className="text-[9px] font-black text-[#C9963A] uppercase tracking-widest mb-4">Moteur de Crédits</p>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-4xl font-black text-white">{localCredits}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-widest">Balance Active</p>
            </div>
            <button 
              onClick={handleFullSync}
              disabled={loading}
              className={`p-4 rounded-2xl bg-[#C9963A] text-[#1A0A00] shadow-[0_0_20px_rgba(201,150,58,0.3)] ${loading ? 'animate-spin' : ''}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="pt-4 border-t border-white/5">
            <p className="text-[8px] text-white/30 uppercase mb-2">Fingerprint Actuel :</p>
            <p className="text-[9px] font-mono text-white/60 bg-black/40 p-2 rounded-lg break-all italic">
              {storageData.fingerprint || 'Génération en cours...'}
            </p>
          </div>
        </div>

        {/* 3. INSPECTION DU STORAGE (LOGS) */}
        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Inspection Cache</p>
          <div className="space-y-2 text-[9px] font-mono">
            <div className="flex justify-between">
              <span className="text-white/40">Storage Credits:</span>
              <span>{storageData.credits || 'null'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Admin Logs:</span>
              <span className={storageData.history ? 'text-green-500' : 'text-red-500'}>
                {storageData.history ? 'Contient des logs' : 'Vide'}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIONS CRITIQUES */}
        <div className="space-y-3 pt-4">
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40"
          >
            Sortie de Secours (Home)
          </button>
          
          <button 
            onClick={clearLocalData}
            className="w-full py-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest text-orange-500"
          >
            Hard Reset Cache (LocalStorage)
          </button>

          <button 
            onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
            className="w-full py-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-red-500"
          >
            Forcer la Déconnexion
          </button>
        </div>

      </div>
    </div>
  )
}
