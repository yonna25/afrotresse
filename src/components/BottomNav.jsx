import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  { to: '/',        label: 'Accueil', Icon: HomeIcon   },
  { to: '/camera',  label: 'Selfie',  Icon: CameraIcon, center: true },
  { to: '/profile', label: 'Profil',  Icon: UserIcon   },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 z-50"
      style={{
        /* Même largeur et centrage que le app-shell */
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        background: 'rgba(44,26,14,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(201,150,58,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) =>
              center ? (
                <motion.div
                  className="flex flex-col items-center -mt-5"
                  whileTap={{ scale: 0.92 }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #C9963A, #E8B96A)'
                        : 'linear-gradient(135deg, #5C3317, #8B5E3C)',
                      boxShadow: isActive
                        ? '0 4px 20px rgba(201,150,58,0.5)'
                        : '0 4px 12px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(201,150,58,0.3)',
                    }}
                  >
                    <Icon active={isActive} center />
                  </div>
                  <span className="text-[10px] font-body font-semibold"
                    style={{ color: isActive ? '#C9963A' : '#8B5E3C' }}>
                    {label}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col items-center gap-1 py-1"
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute -inset-2 rounded-xl"
                        style={{ background: 'rgba(201,150,58,0.1)' }}
                        transition={{ type:'spring', stiffness:300, damping:30 }}
                      />
                    )}
                    <div style={{ color: isActive ? '#C9963A' : '#8B5E3C' }} className="relative">
                      <Icon active={isActive} />
                    </div>
                  </div>
                  <span className="text-[10px] font-body font-semibold transition-colors"
                    style={{ color: isActive ? '#C9963A' : '#8B5E3C' }}>
                    {label}
                  </span>
                </motion.div>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6"
      fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 21h14" strokeLinecap="round"/>
    </svg>
  )
}

function CameraIcon({ active, center }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"
      stroke={center ? (active ? '#2C1A0E' : '#FAF4EC') : 'currentColor'} strokeWidth="2">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function UserIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6"
      fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
    </svg>
  )
}
