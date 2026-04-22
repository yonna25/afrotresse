// src/components/ReviewForm.jsx — AfroTresse
// Popup déclenchée après résultat + formulaire d'avis
// Palette : #1A0A00 (fond) / #C9963A (or) / #FAF4EC (texte)
// ============================================================

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitReview, dismissReviewPopup } from '../services/reviews.js'

// ── Étoiles interactives ─────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="text-3xl transition-transform active:scale-90"
          style={{ filter: (hovered || value) >= n ? 'none' : 'grayscale(1) opacity(0.4)' }}
        >
          ⭐
        </button>
      ))}
    </div>
  )
}

// ── Popup déclencheur ────────────────────────────────────────────────────────
export function ReviewTriggerPopup({ onOpen, onDismiss }) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      exit={{    y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="fixed bottom-24 left-4 right-4 z-50"
    >
      <div
        className="rounded-3xl p-5 flex flex-col gap-3"
        style={{
          background: 'linear-gradient(135deg, #2A1200, #1A0A00)',
          border: '1px solid rgba(201,150,58,0.35)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <p className="text-[#FAF4EC] font-bold text-base text-center leading-snug">
          Ta coiffure te plaît ? 💛
        </p>
        <p className="text-[#FAF4EC]/60 text-xs text-center">
          Aide d'autres femmes à trouver leur style
        </p>
        <div className="flex gap-3 mt-1">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl text-sm text-[#FAF4EC]/50 border border-white/10"
          >
            Plus tard
          </button>
          <button
            onClick={onOpen}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#1A0A00]"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
          >
            Donner mon avis ✨
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Formulaire complet ───────────────────────────────────────────────────────
export function ReviewFormModal({ onClose, onSuccess }) {
  const [name,     setName]     = useState('')
  const [rating,   setRating]   = useState(0)
  const [comment,  setComment]  = useState('')
  const [photo,    setPhoto]    = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const fileRef = useRef()

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo trop lourde (5MB max)'); return }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setError('')
    if (!name.trim())  return setError('Entre ton prénom')
    if (!rating)       return setError('Sélectionne une note')

    setLoading(true)
    try {
      await submitReview({ name, rating, comment, photo })
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Erreur, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        style={{ background: '#1A0A00', border: '1px solid rgba(201,150,58,0.2)' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-2 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[#C9963A] font-black text-xl">Ton avis 💎</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60">
            ✕
          </button>
        </div>

        {/* Étoiles */}
        <div className="flex flex-col gap-2">
          <label className="text-[#FAF4EC]/60 text-xs uppercase tracking-widest">Note</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Prénom */}
        <div className="flex flex-col gap-2">
          <label className="text-[#FAF4EC]/60 text-xs uppercase tracking-widest">Prénom</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex : Aminata"
            maxLength={50}
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#FAF4EC] text-sm placeholder-white/30 outline-none focus:border-[#C9963A]/50"
          />
        </div>

        {/* Commentaire */}
        <div className="flex flex-col gap-2">
          <label className="text-[#FAF4EC]/60 text-xs uppercase tracking-widest">Commentaire <span className="normal-case">(optionnel)</span></label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Décris ton expérience..."
            maxLength={500}
            rows={3}
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#FAF4EC] text-sm placeholder-white/30 outline-none focus:border-[#C9963A]/50 resize-none"
          />
          <p className="text-white/20 text-xs text-right">{comment.length}/500</p>
        </div>

        {/* Photo */}
        <div className="flex flex-col gap-2">
          <label className="text-[#FAF4EC]/60 text-xs uppercase tracking-widest">Photo selfie <span className="normal-case">(optionnel)</span></label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {preview ? (
            <div className="relative w-20 h-20">
              <img src={preview} alt="preview" className="w-20 h-20 rounded-2xl object-cover" />
              <button
                onClick={() => { setPhoto(null); setPreview(null) }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              >✕</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 bg-white/5 border border-dashed border-white/20 rounded-2xl px-4 py-3 text-[#FAF4EC]/50 text-sm"
            >
              <span className="text-xl">📷</span> Ajouter une photo
            </button>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-xl py-2 px-4">{error}</p>
        )}

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-base text-[#1A0A00] disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
        >
          {loading ? '⏳ Envoi...' : 'Envoyer mon avis ✨'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Écran succès ─────────────────────────────────────────────────────────────
export function ReviewSuccess({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        exit={{    scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="rounded-3xl p-8 flex flex-col items-center gap-4 text-center w-full max-w-sm"
        style={{ background: '#1A0A00', border: '1px solid rgba(201,150,58,0.3)' }}
      >
        <div className="text-6xl">💛</div>
        <h2 className="text-[#C9963A] font-black text-2xl">Merci !</h2>
        <p className="text-[#FAF4EC]/70 text-sm leading-relaxed">
          Ton avis a bien été reçu.<br />Il sera visible après validation.
        </p>
        <button
          onClick={onClose}
          className="mt-2 w-full py-4 rounded-2xl font-black text-[#1A0A00]"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
        >
          Continuer 💎
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Composant principal : gère le flow complet ───────────────────────────────
// Usage : <ReviewFlow /> après affichage d'un résultat coiffure
export default function ReviewFlow() {
  const [step, setStep] = useState('trigger') // trigger | form | success | done

  return (
    <AnimatePresence mode="wait">
      {step === 'trigger' && (
        <ReviewTriggerPopup
          key="trigger"
          onOpen={() => setStep('form')}
          onDismiss={() => { dismissReviewPopup(); setStep('done') }}
        />
      )}
      {step === 'form' && (
        <ReviewFormModal
          key="form"
          onClose={() => setStep('done')}
          onSuccess={() => setStep('success')}
        />
      )}
      {step === 'success' && (
        <ReviewSuccess key="success" onClose={() => setStep('done')} />
      )}
    </AnimatePresence>
  )
}
