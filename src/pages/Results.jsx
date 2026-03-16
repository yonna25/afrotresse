import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCredits, hasCredits, useOneTest } from '../services/credits.js'

export default function Results() {
  const navigate  = useNavigate()
  const [data,    setData]    = useState(null)
  const [saved,   setSaved]   = useState([])
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results')
    if (raw) setData(JSON.parse(raw))
    else navigate('/camera')
    const s = JSON.parse(localStorage.getItem('afrotresse_saved') || '[]')
    setSaved(s)
    setCredits(getCredits())
  }, [navigate])

  const handleSave = (style) => {
    setSaved(prev => {
      const exists = prev.find(b => b.id === style.id)
      const next   = exists ? prev.filter(b => b.id !== style.id) : [...prev, style]
      localStorage.setItem('afrotresse_saved', JSON.stringify(next))
      return next
    })
  }

  const handleRetry = () => {
    if (!hasCredits()) {
      navigate('/credits')
      return
    }
    useOneTest()
    setCredits(getCredits())
    navigate('/camera')
  }

  if (!data) return null

  const photoUrl = sessionStorage.getItem('afrotresse_photo')

  return (
    <div className="min-h-screen bg-brown pb-28">

      {/* Header */}
      <div className="sticky top-0 z-30 px-5 pt-12 pb-4"
        style={{ background:'rgba(44,26,14,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(201,150,58,0.1)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background:'rgba(92,51,23,0.5)', border:'1px solid rgba(201,150,58,0.2)' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-cream" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="font-display text-xl text-cream flex-1">Tes résultats</h1>
          {/* Solde crédits */}
          <button onClick={() => navigate('/credits')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:'rgba(201,150,58,0.15)', border:'1px solid rgba(201,150,58,0.3)' }}>
            <span className="font-display text-gold text-sm font-bold">{credits}</span>
            <span className="font-body text-warm text-xs">test{credits > 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>

      {/* Bandeau forme du visage */}
      <motion.div
        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        className="mx-4 mt-4 rounded-3xl p-4 flex items-center gap-4"
        style={{ background:'rgba(92,51,23,0.4)', border:'1px solid rgba(201,150,58,0.15)' }}>
        {photoUrl && (
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ border:'1px solid rgba(201,150,58,0.3)' }}>
            <img src={photoUrl} alt="Selfie" className="w-full h-full object-cover"/>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body text-xs text-warm">Forme du visage</span>
            <span className="font-body text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background:'rgba(201,150,58,0.2)', color:'#C9963A', border:'1px solid rgba(201,150,58,0.3)' }}>
              {data.faceShapeName}
            </span>
            {data.confidence && (
              <span className="font-body text-xs px-2 py-0.5 rounded-full"
                style={{ background:'rgba(26,102,64,0.2)', color:'#4CAF50', border:'1px solid rgba(26,102,64,0.3)' }}>
                IA {data.confidence}%
              </span>
            )}
          </div>
          {data.aiReason && (
            <p className="font-body text-xs text-warm mt-1 italic">"{data.aiReason}"</p>
          )}
        </div>
      </motion.div>

      {/* Titre */}
      <div className="px-5 mt-5 mb-3">
        <p className="font-body text-warm text-xs uppercase tracking-widest">
          2 styles générés sur ton visage
        </p>
      </div>

      {/* Cartes résultats */}
      <div className="px-4 space-y-5">
        {data.recommendations?.map((style, i) => (
          <ResultCard
            key={style.id}
            style={style}
            index={i}
            isSaved={saved.some(s => s.id === style.id)}
            onSave={handleSave}
          />
        ))}
      </div>

      {/* Actions bas */}
      <div className="px-4 mt-6 space-y-3">
        {/* Relancer */}
        <button onClick={handleRetry}
          className="w-full py-4 rounded-full font-display font-semibold text-brown"
          style={{
            background: hasCredits()
              ? 'linear-gradient(135deg, #C9963A, #E8B96A)'
              : 'rgba(92,51,23,0.4)',
            color: hasCredits() ? '#2C1A0E' : '#8B5E3C',
            boxShadow: hasCredits() ? '0 4px 20px rgba(201,150,58,0.4)' : 'none',
            border: hasCredits() ? 'none' : '1px solid rgba(201,150,58,0.2)',
          }}>
          {hasCredits()
            ? `📸 Nouveau test (${getCredits()} restant${getCredits() > 1 ? 's' : ''})`
            : '💳 Acheter des tests'}
        </button>

        {/* Bibliothèque */}
        <button onClick={() => navigate('/library')}
          className="w-full py-3 rounded-full font-body text-sm font-semibold"
          style={{ border:'1px solid rgba(201,150,58,0.3)', color:'#C9963A' }}>
          Voir tous les styles →
        </button>
      </div>
    </div>
  )
}

function ResultCard({ style, index, isSaved, onSave }) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      initial={{ opacity:0, y:30 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.15, type:'spring', stiffness:180 }}
      className="rounded-3xl overflow-hidden"
      style={{ border:'1px solid rgba(201,150,58,0.2)', background:'rgba(92,51,23,0.3)' }}>

      {/* Image générée */}
      <div className="relative aspect-[3/4] bg-mid overflow-hidden">
        {style.generatedImage && !imgError ? (
          <img
            src={style.generatedImage}
            alt={style.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background:'linear-gradient(135deg, #5C3317, #2C1A0E)' }}>
            <span className="text-5xl">💆🏾‍♀️</span>
            <span className="font-body text-warm text-sm text-center px-4">{style.name}</span>
          </div>
        )}

        {/* Badge match */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full font-body text-xs font-bold"
          style={{ background:'#C9963A', color:'#2C1A0E' }}>
          ✦ {style.matchScore}% match
        </div>

        {/* Bouton save */}
        <button onClick={() => onSave(style)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background:'rgba(44,26,14,0.7)', backdropFilter:'blur(8px)', border:'1px solid rgba(201,150,58,0.3)' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5"
            fill={isSaved ? '#C9963A' : 'none'}
            stroke={isSaved ? '#C9963A' : '#8B5E3C'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Région */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full font-body text-xs"
          style={{ background:'rgba(44,26,14,0.8)', color:'rgba(232,185,106,0.8)', backdropFilter:'blur(8px)' }}>
          🌍 {style.region}
        </div>
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="font-display text-cream text-lg">{style.name}</h3>
        {style.duration && (
          <div className="flex gap-3 mt-2">
            <span className="font-body text-xs text-warm">⏱ {style.duration}</span>
            {style.difficulty && <span className="font-body text-xs text-warm">⭐ {style.difficulty}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
