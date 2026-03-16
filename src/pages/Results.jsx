import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BraidCard from '../components/BraidCard.jsx'

export default function Results() {
  const navigate = useNavigate()
  const [data,   setData]   = useState(null)
  const [saved,  setSaved]  = useState([])
  const [tab,    setTab]    = useState(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results')
    if (raw) setData(JSON.parse(raw))
    else navigate('/camera')

    const s = JSON.parse(localStorage.getItem('afrotresse_saved') || '[]')
    setSaved(s)
  }, [navigate])

  const handleSave = (braid) => {
    setSaved(prev => {
      const exists = prev.find(b => b.id === braid.id)
      const next   = exists ? prev.filter(b => b.id !== braid.id) : [...prev, braid]
      localStorage.setItem('afrotresse_saved', JSON.stringify(next))
      return next
    })
  }

  if (!data) return null

  const photoUrl = sessionStorage.getItem('afrotresse_photo')

  return (
    <div className="min-h-screen bg-brown pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 glass px-6 pt-12 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/camera')} className="w-9 h-9 glass rounded-full flex items-center justify-center text-cream">
            <BackIcon />
          </button>
          <h1 className="font-display text-xl text-cream flex-1">Tes recommandations</h1>
          <span className="text-gold text-sm font-body">{data.recommendations.length} styles</span>
        </div>
      </div>

      {/* Face shape banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 glass rounded-3xl p-4 flex items-center gap-4"
        style={{ boxShadow: '0 4px 24px rgba(201,150,58,0.1)' }}
      >
        {photoUrl && (
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gold/30 flex-shrink-0">
            <img src={photoUrl} alt="" className="w-full h-full object-cover"/>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-warm font-body">Forme du visage</span>
            <span className="text-xs bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded-full font-body font-semibold">
              {data.faceShapeName}
            </span>
          </div>
          <p className="text-cream/80 text-xs mt-1 font-body leading-relaxed">
            {data.faceShapeDescription}
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {['Recommandés', 'Enregistrés'].map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-body font-semibold transition-all
              ${tab === i ? 'bg-gold text-brown' : 'glass text-warm'}`}
          >
            {label}
            {i === 1 && saved.length > 0 && (
              <span className="ml-1.5 bg-brown text-gold text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                {saved.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="px-4 mt-4 space-y-4">
        {tab === 0 ? (
          data.recommendations.map((braid, i) => (
            <BraidCard
              key={braid.id}
              braid={braid}
              index={i}
              onSave={handleSave}
              saved={saved.some(b => b.id === braid.id)}
            />
          ))
        ) : saved.length === 0 ? (
          <EmptyState />
        ) : (
          saved.map((braid, i) => (
            <BraidCard key={braid.id} braid={braid} index={i} onSave={handleSave} saved />
          ))
        )}
      </div>

      {/* Retry CTA */}
      {tab === 0 && (
        <div className="px-4 mt-6">
          <button onClick={() => navigate('/camera')} className="btn-outline w-full">
            Refaire l'analyse
          </button>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="text-center py-16 flex flex-col items-center gap-4"
    >
      <div className="w-16 h-16 glass rounded-full flex items-center justify-center text-2xl">💛</div>
      <p className="font-display text-cream">Aucun style enregistré</p>
      <p className="font-body text-warm text-sm">Appuie sur le ♡ pour sauvegarder tes styles préférés</p>
    </motion.div>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}
