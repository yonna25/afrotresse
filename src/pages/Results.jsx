import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    setSaved(JSON.parse(localStorage.getItem('afrotresse_saved') || '[]'))
    setCredits(getCredits())
  }, [navigate])

  const handleSave = (style) => {
    setSaved(prev => {
      const exists = prev.find(s => s.id === style.id)
      const next   = exists ? prev.filter(s => s.id !== style.id) : [...prev, style]
      localStorage.setItem('afrotresse_saved', JSON.stringify(next))
      return next
    })
  }

  const handleNewTest = () => {
    if (!hasCredits()) { navigate('/credits'); return }
    useOneTest()
    sessionStorage.removeItem('afrotresse_results')
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
          <button onClick={() => navigate('/credits')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:'rgba(201,150,58,0.15)', border:'1px solid rgba(201,150,58,0.3)' }}>
            <span className="font-display text-gold text-sm font-bold">{credits}</span>
            <span className="font-body text-warm text-xs">test{credits > 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>

      {/* Bandeau forme du visage */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        className="mx-4 mt-4 rounded-3xl p-4 flex items-center gap-4"
        style={{ background:'rgba(92,51,23,0.4)', border:'1px solid rgba(201,150,58,0.15)' }}>
        {photoUrl && (
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ border:'1px solid rgba(201,150,58,0.3)' }}>
            <img src={photoUrl} alt="Selfie" className="w-full h-full object-cover"/>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body text-xs text-warm">Visage</span>
            <span className="font-body text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background:'rgba(201,150,58,0.2)', color:'#C9963A', border:'1px solid rgba(201,150,58,0.3)' }}>
              {data.faceShapeName}
            </span>
            {data.confidence && (
              <span className="font-body text-xs px-2 py-0.5 rounded-full"
                style={{ background:'rgba(26,102,64,0.2)', color:'#4CAF50' }}>
                IA {data.confidence}%
              </span>
            )}
          </div>
          {data.reason && (
            <p className="font-body text-xs text-warm mt-0.5 italic">"{data.reason}"</p>
          )}
        </div>
      </motion.div>

      {/* Titre */}
      <div className="px-5 mt-4 mb-2">
        <p className="font-body text-warm text-xs uppercase tracking-widest">
          2 styles sélectionnés pour toi
        </p>
      </div>

      {/* Les 2 cartes — strictement 2 */}
      <div className="px-4 space-y-6">
        {(data.recommendations || []).slice(0, 2).map((style, i) => (
          <ResultCard
            key={style.id}
            style={style}
            index={i}
            isSaved={saved.some(s => s.id === style.id)}
            onSave={handleSave}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 mt-6 space-y-3">
        <button onClick={handleNewTest}
          className="w-full py-4 rounded-full font-display font-semibold"
          style={{
            background: hasCredits() ? 'linear-gradient(135deg,#C9963A,#E8B96A)' : 'rgba(92,51,23,0.4)',
            color:      hasCredits() ? '#2C1A0E' : '#8B5E3C',
            boxShadow:  hasCredits() ? '0 4px 20px rgba(201,150,58,0.4)' : 'none',
            border:     hasCredits() ? 'none' : '1px solid rgba(201,150,58,0.2)',
          }}>
          {hasCredits()
            ? `📸 Nouveau test (${getCredits()} restant${getCredits() > 1 ? 's' : ''})`
            : '💳 Acheter des tests'}
        </button>
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
  const [showGenerated, setShowGenerated] = useState(true)
  const hasGenerated = !!style.generatedImage

  return (
    <motion.div
      initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.15, type:'spring', stiffness:180 }}
      className="rounded-3xl overflow-hidden"
      style={{ border:'1px solid rgba(201,150,58,0.2)', background:'rgba(92,51,23,0.3)' }}>

      {/* Image principale */}
      <div className="relative aspect-[3/4] bg-mid overflow-hidden">

        {/* Photo générée par Fal.ai (son visage avec la tresse) */}
        {hasGenerated && showGenerated ? (
          <img src={style.generatedImage} alt={style.name}
            className="w-full h-full object-cover"
            onError={() => setShowGenerated(false)}/>
        ) : (
          /* Photo de référence de ta bibliothèque */
          <img src={style.localImage} alt={style.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}/>
        )}

        {/* Fallback si aucune image */}
        <div className="w-full h-full items-center justify-center flex-col gap-3 hidden"
          style={{ background:'linear-gradient(135deg,#5C3317,#2C1A0E)' }}>
          <span className="text-5xl">💆🏾‍♀️</span>
          <span className="font-body text-warm text-sm">{style.name}</span>
        </div>

        {/* Toggle : voir photo générée / photo de référence */}
        {hasGenerated && (
          <button
            onClick={() => setShowGenerated(!showGenerated)}
            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
            style={{ background:'rgba(44,26,14,0.85)', color:'#E8B96A', backdropFilter:'blur(8px)', border:'1px solid rgba(201,150,58,0.3)' }}>
            {showGenerated ? '📷 Voir le style' : '🪞 Sur mon visage'}
          </button>
        )}

        {/* Badge match */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full font-body text-xs font-bold"
          style={{ background:'#C9963A', color:'#2C1A0E' }}>
          ✦ {style.matchScore}% match
        </div>

        {/* Sauvegarder */}
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
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full font-body text-xs"
          style={{ background:'rgba(44,26,14,0.8)', color:'rgba(232,185,106,0.8)', backdropFilter:'blur(8px)' }}>
          🌍 {style.region}
        </div>
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="font-display text-cream text-lg">{style.name}</h3>
        <div className="flex gap-3 mt-1.5">
          {style.duration   && <span className="font-body text-xs text-warm">⏱ {style.duration}</span>}
          {style.difficulty && <span className="font-body text-xs text-warm">⭐ {style.difficulty}</span>}
        </div>
        {style.tags?.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {style.tags.slice(0,3).map(tag => (
              <span key={tag} className="font-body text-xs px-2 py-0.5 rounded-full"
                style={{ background:'rgba(201,150,58,0.1)', color:'#C9963A', border:'1px solid rgba(201,150,58,0.2)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
