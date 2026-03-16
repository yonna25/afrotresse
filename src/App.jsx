import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home    from './pages/Home.jsx'
import Camera  from './pages/Camera.jsx'
import Analyze from './pages/Analyze.jsx'
import Results from './pages/Results.jsx'
import Library from './pages/Library.jsx'
import Profile from './pages/Profile.jsx'
import BottomNav from './components/BottomNav.jsx'

function AnimatedRoutes() {
  const location = useLocation()
  const hideNav = ['/camera', '/analyze'].includes(location.pathname)

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"        element={<Home    />} />
          <Route path="/camera"  element={<Camera  />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/results" element={<Results />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
