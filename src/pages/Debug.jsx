import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase.js'
import { getCredits, setCredits } from '../services/credits.js'
import AdminNav from '../components/AdminNav.jsx'

export default function Debug() {
  const navigate = useNavigate()
  const [localCredits, setLocalCredits] = useState(0)
  const [serverCredits, setServerCredits] = useState('...')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [storageData, setStorageData] = useState({})
  const [syncMsg, setSyncMsg] = useState(null)

  useEffect(() => {
    refreshAllData()
  }, [])

  const refreshAllData = async () => {
    const local = getCredits()
    setLocalCredits(local)

    const { data: { session: currentSession } } = await supabase.auth.getSession()
    setSession(currentSession)

    if (currentSession?.user) {
      const { data } = await supabase
        .from('usage_credits')
        .select('credits')
        .eq('user_id', currentSession.user.id)
        .maybeSingle()
      setServerCredits(data?.credits ?? 0)
    }

    setStorageData({
      credits:     localStorage.getItem('afrotresse_credits'),
      fingerprint: localStorage.getItem('afrotresse_fingerprint'),
      history:     localStorage.getItem('admin_credits_history'),
    })
  }

  const handleFullSync = async () => {
    setLoading(true)
    setSyncMsg(null)

    const { data: { session: currentSession } } = await supabase.auth.getSession()

    if (currentSession?.user) {
      const { data, error } = await supabase
        .from('usage_credits')
        .select('credits')
        .eq('user_id', currentSession.user.id)
        .maybeSingle()

      if (!error && data?.credits >= 0) {
        setCredits(data.credits) // ← écrit dans localStorage
        setSyncMsg({ text: `✅ Synchronisé — ${data.credits} crédits appliqués.`, ok: true })
      } else {
        setSyncMsg({ text: '❌ Erreur lors de la synchronisation.', ok: false })
      }
    } else {
      setSyncMsg({ text: '❌ Aucune session active.', ok: false })
    }

    await refreshAllData()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0F0500] text-white pb-32">
      <AdminNav />

      <div className="mt-24 px-6 max-w-md mx-auto space-y-8">

        {/* EN-TÊTE */}
        <div className="flex items-center justify-between border-b border-[#C9963A]/20 pb-6">
          <div>
            <h1 className="text-[#C9963A] text-3xl font-black uppercase tracking-tighter">Diagnostic</h1>
            <p className="text-white/50 text-xs uppercase tracking-widest mt-1">Supervision Système</p>
          </div>
          <button
            onClick={() => navigate('/admin-credits')}
            className="px-4 py-2 rounded-xl bg-[#C9963A] text-[#1A0A00] text-[10px] font-black uppercase tracking-widest"
          >
            Retour Admin
          </button>
        </div>

        {/* 1. COMPARAISON DES CRÉDITS */}
        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10">
          <p className="text-xs font-black text-[#C9963A] uppercase tracking-widest mb-6 text-center">État des Crédits</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-4xl font-black text-white">{localCredits}</p>
              <p className="text-[10px] text-white/40 uppercase mt-2">Mobile (Local)</p>
            </div>
            <div className="text-center p-4 bg-black/40 rounded-2xl border border-white/5">
              <p className={`text-4xl font-black ${localCredits === serverCredits ? 'text-green-500' : 'text-orange-500'}`}>
                {serverCredits}
              </p>
              <p className="text-[10px] text-white/40 uppercase mt-2">Serveur (Cloud)</p>
            </div>
          </div>

          {syncMsg && (
            <div className="mt-4 px-4 py-3 rounded-xl text-xs font-bold"
              style={{
                background: syncMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${syncMsg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: syncMsg.ok ? '#22c55e' : '#ef4444',
              }}>
              {syncMsg.text}
            </div>
          )}

          <button
            onClick={handleFullSync}
            disabled={loading}
            className="w-full mt-4 py-4 rounded-2xl bg-white/5 border border-[#C9963A]/30 text-[#C9963A] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-40"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Forcer la Synchronisation
          </button>
        </div>

        {/* 2. IDENTITÉ */}
        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10">
          <p className="text-xs font-black text-[#C9963A] uppercase tracking-widest mb-4">Identité Connectée</p>
          <div className="space-y-4 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase mb-1">Email Actif</span>
              <span className="text-white font-bold">{session?.user?.email || 'NON CONNECTÉ'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase mb-1">ID Technique (UID)</span>
              <span className="text-[11px] font-mono text-white/30 break-all bg-black/20 p-2 rounded-lg">
                {session?.user?.id || 'null'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. FINGERPRINT */}
        <div className="rounded-[2rem] p-6 bg-white/5 border border-white/10">
          <p className="text-xs font-black text-[#C9963A] uppercase tracking-widest mb-2">Ancre de l&apos;appareil</p>
          <p className="text-[11px] font-mono text-white/60 bg-black/40 p-4 rounded-xl break-all">
            {storageData.fingerprint || 'Aucune empreinte'}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="space-y-4 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white/70"
          >
            Quitter le Diagnostic
          </button>

          <button
            onClick={() => { if (window.confirm("Vider le cache ?")) { localStorage.clear(); window.location.reload(); } }}
            className="w-full py-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs font-black uppercase tracking-widest text-orange-500"
          >
            Hard Reset LocalStorage
          </button>

          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
            className="w-full py-5 rounded-2xl bg-red-500/20 border border-red-500/40 text-xs font-black uppercase tracking-widest text-red-500"
          >
            Déconnexion Immédiate
          </button>
        </div>

      </div>
    </div>
  )
}
