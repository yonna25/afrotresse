import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCurrentUser, getSupabaseCredits } from '../services/useSupabaseCredits.js'
import { getCredits, getSessionIdWithFp } from '../services/credits.js'

export default function Debug() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [supabaseBalance, setSupabaseBalance] = useState(null)
  const [localBalance, setLocalBalance] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [copied, setCopied] = useState(false)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('fr-FR')
    setLogs(prev => [...prev, { message, type, timestamp }])
  }

  useEffect(() => {
    checkStatus()
    // Récupérer le sessionId fingerprint
    getSessionIdWithFp().then(id => setSessionId(id)).catch(() => {})
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    addLog('🔍 Vérification du statut...', 'info')

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        addLog(`✅ User connecté: ${currentUser.email}`, 'success')
        addLog(`ID: ${currentUser.id}`, 'info')
        try {
          const balance = await getSupabaseCredits(currentUser.id)
          setSupabaseBalance(balance)
          addLog(`✅ Supabase balance: ${balance} crédits`, 'success')
        } catch (err) {
          addLog(`❌ Erreur Supabase: ${err.message}`, 'error')
          setSupabaseBalance('Erreur')
        }
      } else {
        addLog('❌ Aucun user connecté', 'error')
        setUser(null)
      }

      const local = getCredits()
      setLocalBalance(local)
      addLog(`✅ localStorage balance: ${local} crédits`, 'success')

    } catch (err) {
      addLog(`❌ Erreur: ${err.message}`, 'error')
    }

    setLoading(false)
  }

  const testSync = async () => {
    setLoading(true)
    addLog('🔄 Test de synchro...', 'info')
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) { addLog('❌ User non connecté', 'error'); setLoading(false); return }
      const supaBalance = await getSupabaseCredits(currentUser.id)
      const local = getCredits()
      addLog(`Supabase: ${supaBalance} | localStorage: ${local}`, 'info')
      if (supaBalance > local) addLog('✅ Les crédits Supabase sont supérieurs', 'success')
      else if (supaBalance < local) addLog('⚠️ localStorage a plus de crédits', 'warning')
      else addLog('✅ Les soldes sont synchronisés', 'success')
    } catch (err) {
      addLog(`❌ Erreur: ${err.message}`, 'error')
    }
    setLoading(false)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addLog('📋 Copié !', 'success')
    }).catch(() => {
      addLog('❌ Copie échouée', 'error')
    })
  }

  return (
    <div className="min-h-screen bg-[#1A0A00] text-white pb-32 pt-4">
      <div className="max-w-md mx-auto px-4">
        
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate('/profile')} className="text-xs text-[#C9963A] font-bold mb-3 hover:opacity-70">
            ← Retour
          </button>
          <h1 className="text-2xl font-black text-[#C9963A]">🔧 Debug</h1>
          <p className="text-xs text-white/50 mt-1">Vérification complète du statut</p>
        </div>

        {/* ── SESSION FINGERPRINT ── */}
        <motion.div
          className="p-4 rounded-2xl border border-[#C9963A]/60 bg-[#2b1810] mb-4"
        >
          <p className="text-xs opacity-60 uppercase tracking-widest mb-2">Session Fingerprint (fp_xxx)</p>
          {sessionId ? (
            <div>
              <p className="text-[11px] font-mono text-[#E8B96A] break-all leading-relaxed">
                {sessionId}
              </p>
              <button
                onClick={() => copyToClipboard(sessionId)}
                className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-black text-[#1A0A00]"
                style={{ background: copied ? '#4CAF50' : '#C9963A' }}
              >
                {copied ? '✅ Copié !' : '📋 Copier pour Supabase'}
              </button>
              <p className="text-[9px] text-white/30 mt-1">
                Cherchez cette valeur dans Supabase → sessions → session_id
              </p>
            </div>
          ) : (
            <p className="text-xs text-white/50">Chargement...</p>
          )}
        </motion.div>

        {/* Status Cards */}
        <div className="space-y-3 mb-6">
          <motion.div className="p-4 rounded-2xl border"
            style={{ background: user ? '#2b1810' : '#8b0000', borderColor: user ? '#C9963A' : '#ff4444' }}>
            <p className="text-xs opacity-60 uppercase tracking-widest mb-1">User connecté</p>
            {user ? (
              <div>
                <p className="font-black text-lg">✅ Connecté</p>
                <p className="text-xs text-white/70 mt-1 font-mono break-all">{user.email}</p>
                <p className="text-[10px] text-white/50 mt-1">ID: {user.id.substring(0, 12)}...</p>
              </div>
            ) : (
              <p className="font-black text-lg">❌ Non connecté</p>
            )}
          </motion.div>

          <motion.div className="p-4 rounded-2xl border border-[#C9963A]/40 bg-[#2b1810]">
            <p className="text-xs opacity-60 uppercase tracking-widest mb-1">Supabase</p>
            {supabaseBalance !== null ? (
              <p className="font-black text-2xl text-[#C9963A]">{supabaseBalance}</p>
            ) : (
              <p className="text-xs text-white/50">Vérification...</p>
            )}
            <p className="text-[10px] text-white/50 mt-1">Crédits payés stockés</p>
          </motion.div>

          <motion.div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-xs opacity-60 uppercase tracking-widest mb-1">localStorage</p>
            <p className="font-black text-2xl text-white">{localBalance}</p>
            <p className="text-[10px] text-white/50 mt-1">Crédits affichés</p>
          </motion.div>

          <motion.div className="p-4 rounded-2xl border"
            style={{
              background: supabaseBalance === localBalance ? '#2b1810' : '#8b4513',
              borderColor: supabaseBalance === localBalance ? '#4CAF50' : '#ff8c00',
            }}>
            <p className="text-xs opacity-60 uppercase tracking-widest mb-1">Synchro</p>
            {supabaseBalance !== null && localBalance !== null ? (
              supabaseBalance === localBalance ? (
                <p className="font-black text-lg">✅ Synchronisé</p>
              ) : (
                <div>
                  <p className="font-black text-lg">⚠️ Différence</p>
                  <p className="text-xs text-white/70 mt-1">Écart: {Math.abs(supabaseBalance - localBalance)} crédits</p>
                </div>
              )
            ) : (
              <p className="text-xs text-white/50">Vérification...</p>
            )}
          </motion.div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mb-6">
          <button onClick={checkStatus} disabled={loading}
            className="flex-1 py-3 rounded-xl font-black text-sm bg-[#C9963A] text-[#1A0A00] disabled:opacity-50">
            🔄 Rafraîchir
          </button>
          <button onClick={testSync} disabled={loading}
            className="flex-1 py-3 rounded-xl font-black text-sm bg-white/10 border border-white/20 disabled:opacity-50">
            ⚙️ Test Sync
          </button>
        </div>

        {/* Logs */}
        <div className="mb-6">
          <h2 className="text-sm font-black text-white mb-2">📋 Logs</h2>
          <div className="bg-black/50 rounded-xl p-3 max-h-64 overflow-y-auto border border-white/10">
            {logs.length === 0 ? (
              <p className="text-xs text-white/50">Aucun log</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`text-[10px] font-mono mb-1 pb-1 border-b border-white/5 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' : 'text-white/70'
                }`}>
                  <span className="opacity-50">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {user && (
          <motion.div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#C9963A] mb-2">Infos User</h3>
            <div className="space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between p-2 bg-black/30 rounded">
                <span className="text-white/60">Email:</span>
                <span className="text-white/90 truncate ml-2">{user.email}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-black/30 rounded">
                <span className="text-white/60">ID:</span>
                <button onClick={() => copyToClipboard(user.id)} className="text-[#C9963A] hover:text-[#E8B96A] truncate ml-2">
                  {user.id.substring(0, 8)}...
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] leading-relaxed text-white/60">
          <p className="font-black text-[#C9963A] mb-2">📖 Comment ça marche :</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Copie ton fp_xxx en haut</li>
            <li>Va dans Supabase → sessions → cherche ce sessionId</li>
            <li>Modifie le champ credits directement</li>
            <li>Reviens ici et clique Rafraîchir</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
