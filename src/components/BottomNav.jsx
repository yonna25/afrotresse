import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const items = [
  { to: '/',        label: 'Accueil',   icon: HomeIcon   },
  { to: '/camera',  label: 'Selfie',    icon: CameraIcon },
  { to: '/library', label: 'Styles',    icon: GridIcon   },
  { to: '/profile', label: 'Profil',    icon: UserIcon   },
]

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 21h14" strokeLinecap="round"/>
    </svg>
  )
}
function CameraIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function GridIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function UserIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
    </svg>
  )
}

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center gap-1 py-1"
                whileTap={{ scale: 0.9 }}
              >
                <div className={`relative transition-colors duration-200 ${isActive ? 'text-gold' : 'text-warm'}`}>
                  {isActive && (
                    <motion.div
                      layoutId="nav-bubble"
                      className="absolute -inset-2 bg-gold/10 rounded-xl"
                    />
                  )}
                  <Icon active={isActive} />
                </div>
                <span className={`text-[10px] font-body font-semibold transition-colors ${isActive ? 'text-gold' : 'text-warm'}`}>
                  {label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
