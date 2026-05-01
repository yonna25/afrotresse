// src/pages/AdminReviews.jsx — AfroTresse
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase.js'
import AdminNav from '../components/AdminNav.jsx'

function Stars({ rating }) {
  return <span>{"⭐".repeat(rating)}{"☆".repeat(5 - rating)}</span>
}

export default function AdminReviews() {
  const [reviews,  setReviews]  = useState([])
  const [filter,   setFilter]   = useState("pending")
  const [loading,  setLoading]  = useState(true)
  const [msg,      setMsg]      = useState("")
  const [secret,   setSecret]   = useState("")
  const [isAdmin,  setIsAdmin]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return }
      setIsAdmin(true)
      // Récupérer le secret admin depuis les métadonnées ou env
      const s = import.meta.env.VITE_ADMIN_SECRET || ""
      setSecret(s)
    })
  }, [])

  useEffect(() => {
    if (isAdmin) fetchReviews()
  }, [filter, isAdmin])

  async function fetchReviews() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews-admin?status=${filter}`, {
        headers: { "x-admin-secret": secret },
      })
      if (res.status === 401) { setMsg("❌ Secret invalide"); setLoading(false); return }
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch {
      setMsg("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  async function doAction(id, action) {
    const res = await fetch("/api/reviews-admin", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body:    JSON.stringify({ id, action }),
    })
    if (res.ok) {
      setMsg(`✅ ${action} effectué`)
      fetchReviews()
      setTimeout(() => setMsg(""), 2000)
    } else {
      setMsg("Erreur action")
    }
  }

  if (!isAdmin) return <div className="min-h-screen bg-black" />

  return (
    <div className="min-h-screen bg-[#0D0500] text-[#FAF4EC] pb-20">
      <AdminNav />

      <div className="mt-24 px-4">
        {/* Filtres */}
        <div className="flex gap-2 mb-4">
          {["pending", "approved", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={filter === f
                ? { background: "#C9963A", color: "#1A0A00" }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }
              }>
              {f === "pending" ? "En attente" : f === "approved" ? "Approuvés" : "Tous"}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-white/30 text-[10px] uppercase tracking-widest">
            {reviews.length} résultat{reviews.length > 1 ? "s" : ""}
          </p>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-white/5 text-center text-sm">{msg}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16 text-white/30">Chargement...</div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-white/30">
            <span className="text-4xl">📭</span>
            <p className="text-sm">Aucun avis dans cette catégorie</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map(r => (
              <div key={r.id} className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background: r.is_approved ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${r.is_approved ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{r.name}</p>
                      {r.is_verified && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(201,150,58,0.2)", color: "#C9963A" }}>✓ Vérifié</span>
                      )}
                      {r.is_approved && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}>✅ Publié</span>
                      )}
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  {r.photo_url && (
                    <img src={r.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  )}
                </div>
                {r.comment && (
                  <p className="text-white/60 text-xs leading-relaxed">"{r.comment}"</p>
                )}
                <p className="text-white/20 text-[10px]">
                  {new Date(r.created_at).toLocaleString("fr-FR")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {!r.is_approved && (
                    <button onClick={() => doAction(r.id, "approve")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                      ✅ Approuver
                    </button>
                  )}
                  {r.is_approved && (
                    <button onClick={() => doAction(r.id, "reject")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                      🚫 Retirer
                    </button>
                  )}
                  {!r.is_verified && (
                    <button onClick={() => doAction(r.id, "verify")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(201,150,58,0.15)", color: "#C9963A" }}>
                      ✓ Vérifier
                    </button>
                  )}
                  <button onClick={() => doAction(r.id, "delete")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold ml-auto"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
