import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BraidCard from '../components/BraidCard.jsx'
import { useProfile } from '../hooks/useProfile.js'
import { getTotalUsed, getSavedStyles } from '../services/credits.js'

const AVATARS = ['👩🏾','👩🏿','👩🏽','👸🏾','👸🏿','💁🏾‍♀️','💆🏾‍♀️','🧕🏾']

const LUXURY_STYLE = {
  pageBg: 'linear-gradient(160deg, #1A0A00 0%, #2C1A0E 40%, #1A0A00 100%)',
  cardBg: 'linear-gradient(145deg, rgba(60,35,15,0.9), rgba(30,15,5,0.95))',
  goldBorder: '1px solid rgba(201,150,58,0.5)',
  goldGlow: '0 0 20px rgba(201,150,58,0.3), 0 4px 24px rgba(0,0,0,0.5)',
  goldText: '#E8B96A',
  goldDark: '#C9963A',
  cream: '#FAF4EC',
  warm: 'rgba(250,244,236,0.65)',
}

export default function Profile() {
  const navigate = useNavigate()
  const { name, displayName, setName, avatar, setAvatar } = useProfile()
  
  // États pour les données dynamiques
  const [saved, setSaved] = useState([])
  const [nbAnalyses, setNbAnalyses] = useState(0)
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showAvatars, setShowAvatars] = useState(false)

  // RÉCUPÉRATION DE LA PHOTO (Selfie)
  // On cherche d'abord dans sessionStorage (photo de la session actuelle) puis localStorage
  const selfieUrl = sessionStorage.getItem('afrotresse_photo') || localStorage.getItem('afrotresse_selfie')

  useEffect(() => {
    [span_0](start_span)// Mise à jour du compteur de styles sauvés[span_0](end_span)
    const s = getSavedStyles()
    setSaved(Array.isArray(s) ? s : [])
    
    [span_1](start_span)[span_2](start_span)// Mise à jour du compteur d'analyses réelles[span_1](end_span)[span_2](end_span)
    const used = getTotalUsed()
    setNbAnalyses(used || 0)
    
    setNameInput(name)
  }, [name])

  const handleSaveName = () => {
    if (nameInput.trim()) setName(nameInput.trim())
    setEditingName(false)
  }

  const handleCopy = () => {
    const code = localStorage.getItem('afrotresse_ref') || 'AFRO-QUEEN'
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="min-h-screen pb-28 relative" style={{ background: LUXURY_STYLE.pageBg }}>
      
      {/* ── Header avec Image Utilisatrice ── */}
      <div className="relative pt-12 pb-6 px-5">
        <div className="relative flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {selfieUrl ? (
              <img 
                src={selfieUrl} 
                alt="Profil" 
                className="w-20 h-20 rounded-full object-cover" 
                style={{ border: `3px solid ${LUXURY_STYLE.goldDark}`, boxShadow: LUXURY_STYLE.goldGlow }} 
              />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-[#3C2310]"
                style={{ border: `3px solid ${LUXURY_STYLE.goldDark}`, boxShadow: LUXURY_STYLE.goldGlow }}>
                {avatar}
              </div>
            )}
            <button onClick={() => setShowAvatars(!showAvatars)} 
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center bg-[#C9963A] text-[#1A0A00] text-xs shadow-lg">✏️</button>
          </div>

          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                  className="w-full rounded-lg px-2 py-1 text-sm bg-black/20 border border-[#C9963A] text-white" />
                <button onClick={handleSaveName} className="text-[#E8B96A]">OK</button>
              </div>
            ) : (
              <div onClick={() => setEditingName(true)}>
                <h1 className="font-display text-2xl font-bold text-[#FAF4EC]">{displayName} 💎</h1>
                <p className="text-[10px] uppercase tracking-widest text-[#E8B96A]">Membre AfroTresse ✦</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Compteurs Mis à Jour ── */}
        <div className="flex gap-3 mt-8">
          {[
            [saved.length, 'Styles sauvés', '💾'],
            [nbAnalyses, 'Analyses', '🔍'],
            ['0', 'Filleules', '👯‍♀️'],
          ].map(([val, label, icon], i) => (
            <div key={label} className="flex-1 rounded-2xl py-4 text-center"
              style={{ background: LUXURY_STYLE.cardBg, border: LUXURY_STYLE.goldBorder, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <p className="text-xl mb-1">{icon}</p>
              <p className="font-display text-2xl font-bold" style={{ color: LUXURY_STYLE.goldText }}>{val}</p>
              <p className="text-[10px] uppercase tracking-tighter text-[#FAF4EC]/60 font-bold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-3 px-4 mt-2">
        {['Mes styles', 'Parrainage 🎁'].map((label, i) => (
          <button key={label} onClick={() => setTab(i)}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${tab === i ? 'bg-[#C9963A] text-[#1A0A00]' : 'bg-white/5 text-[#C9963A] border border-[#C9963A]/30'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenu Dynamique ── */}
      <div className="px-4 mt-6">
        {tab === 0 ? (
          saved.length === 0 ? (
            <div className="text-center py-16 opacity-60">
              <p className="text-5xl mb-4">💆🏾‍♀️</p>
              <p className="text-[#FAF4EC] font-display text-lg">Aucun style sauvegardé</p>
              <button onClick={() => navigate('/camera')} className="mt-4 px-6 py-2 rounded-full border border-[#C9963A] text-[#E8B96A] text-sm font-bold">Lancer un selfie 📸</button>
            </div>
          ) : (
            <div className="space-y-4">
              {saved.map((b, i) => <BraidCard key={b.id} braid={b} index={i} compact />)}
            </div>
          )
        ) : (
          <div className="bg-[#3D2616] p-6 rounded-3xl border border-[#C9963A]/40 text-center shadow-2xl">
            <p className="text-xs uppercase text-[#E8B96A] mb-2 font-bold tracking-widest">Ton code de parrainage</p>
            <div className="text-2xl font-display font-bold text-[#FAF4EC] tracking-widest mb-6 py-4 rounded-2xl bg-black/30 border border-white/5">
              {localStorage.getItem('afrotresse_ref') || 'AFRO-QUEEN'}
            </div>
            <button onClick={handleCopy} className="w-full py-4 rounded-2xl font-bold shadow-lg"
              style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#1A0A00' }}>
              {copied ? '✓ Copié dans le presse-papier' : 'Copier mon code'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
