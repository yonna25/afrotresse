import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  { to: '/',        label: 'Accueil',  Icon: HomeIcon   },
  { to: '/results', label: 'Résultats', Icon: ResultsIcon },
  { to: '/camera',  label: 'Selfie',   Icon: CameraIcon, center: true },
  { to: '/library', label: 'Favoris',  Icon: HeartIcon  },
  { to: '/profile', label: 'Profil',   Icon: UserIcon   },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 z-50"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        background: 'rgba(44,26,14,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(201,150,58,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div className="flex flex-col items-center gap-1 py-1" whileTap={{ scale: 0.9 }}>
                <div style={{ color: isActive ? '#C9963A' : '#8B5E3C' }}>
                  <Icon active={isActive} center={center} />
                </div>
                {!center && (
                  <span className="text-[9px] font-semibold" style={{ color: isActive ? '#C9963A' : '#8B5E3C' }}>
                    {label}
                  </span>
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function HomeIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M3 12L12 3l9 9M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ResultsIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round"/>
      <path d="M8 12h8M8 8h5M8 16h6" strokeLinecap="round"/>
    </svg>
  )
}

function CameraIcon({ active }) {
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center -mt-8 shadow-lg ${active ? 'bg-[#C9963A]' : 'bg-[#5C3317]'}`}
      style={active ? { boxShadow: '0 0 16px rgba(201,150,58,0.5)' } : {}}>
      📸
    </div>
  )
}

function HeartIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function UserIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
    </svg>
  )
}
