import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase.js'

const TABS = [
  { path: '/admin-partners', label: 'Partenaires', emoji: '🤝' },
  { path: '/admin-reviews',  label: 'Avis',        emoji: '⭐' },
  { path: '/debug',          label: 'Debug',        emoji: '🔧' },
]

export default function AdminNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="fixed top-0 left-0 w-full z-[1000] shadow-2xl"
      style={{ background: '#6B0000' }}>

      {/* Ligne supérieure */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
          Admin · AfroTresse
        </span>
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          Déconnexion
        </button>
      </div>

      {/* Onglets */}
      <div className="flex">
        {TABS.map(tab => {
          const isActive = pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all"
              style={{
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderBottom: isActive ? '2px solid #C9963A' : '2px solid transparent',
              }}
            >
              <span className="text-base">{tab.emoji}</span>
              <span
                className="text-[9px] font-black uppercase tracking-wider"
                style={{ color: isActive ? '#C9963A' : 'rgba(255,255,255,0.45)' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
