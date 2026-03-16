import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import BraidCard from '../components/BraidCard.jsx'
import { BRAIDS_DB, FACE_SHAPE_NAMES } from '../services/faceAnalysis.js'

const FILTERS = ['Tout', 'Classique', 'Tendance', 'Protectrice', 'Traditionnelle', 'Élégante']
const SHAPES  = ['Tout', ...Object.values(FACE_SHAPE_NAMES)]

export default function Library() {
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('Tout')
  const [shape,   setShape]   = useState('Tout')
  const [view,    setView]    = useState('grid')

  const filtered = useMemo(() => {
    return BRAIDS_DB.filter(b => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'Tout' || b.tags?.includes(filter)
      const matchShape  = shape  === 'Tout' || Object.entries(FACE_SHAPE_NAMES)
        .find(([k,v]) => v === shape && b.faceShapes.includes(k))
      return matchSearch && matchFilter && matchShape
    })
  }, [search, filter, shape])

  return (
    <div className="min-h-screen bg-brown pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 glass px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl text-cream">Bibliothèque</h1>
          <div className="flex gap-2">
            {['grid','list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                  ${view === v ? 'bg-gold text-brown' : 'glass text-warm'}`}>
                {v === 'grid' ? <GridIcon /> : <ListIcon />}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-warm" />
          <input
            type="text" placeholder="Rechercher un style…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-mid/50 border border-warm/20 rounded-2xl pl-10 pr-4 py-2.5
                       text-cream placeholder-warm/50 text-sm font-body outline-none
                       focus:border-gold/50 transition-colors"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 mt-3">
        <p className="text-warm text-xs font-body mb-2">Par type :</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-body font-semibold transition-all
                ${filter === f ? 'bg-gold text-brown' : 'glass text-warm border border-warm/20'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2">
        <p className="text-warm text-xs font-body mb-2">Par forme de visage :</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {SHAPES.map(s => (
            <button key={s} onClick={() => setShape(s)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-body font-semibold transition-all
                ${shape === s ? 'bg-mid border border-gold text-gold' : 'glass text-warm border border-warm/20'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 mt-3 mb-2">
        <p className="text-warm text-xs font-body">{filtered.length} style{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</p>
      </div>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-warm font-body text-sm">
          <p className="text-3xl mb-3">🔍</p>
          Aucun style ne correspond à ta recherche.
        </div>
      ) : view === 'grid' ? (
        <div className="px-4 grid grid-cols-2 gap-3 mt-2">
          {filtered.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="card overflow-hidden">
                <div className="aspect-square bg-mid overflow-hidden">
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none' }} />
                </div>
                <div className="p-2.5">
                  <p className="font-display text-sm text-cream truncate">{b.name}</p>
                  <p className="text-warm text-xs mt-0.5">{b.duration}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="px-4 mt-2 space-y-3">
          {filtered.map((b, i) => (
            <BraidCard key={b.id} braid={b} index={i} compact />
          ))}
        </div>
      )}
    </div>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  )
}
function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="9" x2="13" y2="9"/><line x1="3" y1="13" x2="13" y2="13"/>
    </svg>
  )
}
function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
