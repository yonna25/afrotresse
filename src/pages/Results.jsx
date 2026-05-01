      {/* NOTIFICATION STATUT COMPTE */}
      {saveDone ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.25)" }}>
          <span className="text-lg">✅</span>
          <p className="text-[12px] text-green-300 font-semibold">
            Compte enregistré{displayName ? <> — <span className="font-black">{displayName}</span></> : ""}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => setSaveOpen(true)}
          className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3 cursor-pointer"
          style={{ background: "rgba(201,150,58,0.08)", border: "1px solid rgba(201,150,58,0.25)" }}>
          <span className="text-lg">💎</span>
          <p className="text-[12px] text-[#E8B96A] font-semibold flex-1">
            Sauvegarde tes résultats pour ne pas les perdre
          </p>
          <span className="text-[#C9963A]">➔</span>
        </motion.div>
      )}

      {/* LISTE DES STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, idx) => (
          <motion.div 
            key={style.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            {/* Contenu de ta carte style ici */}
            <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10">
               {/* ... reste de ton UI pour chaque style ... */}
            </div>
          </motion.div>
        ))}
      </div>

      {/* FOOTER / PAGINATION */}
      <div className="mt-12 text-center">
        {!allStylesSeen && (
           <button 
             onClick={handleGenerateMore}
             className="px-8 py-4 bg-[#C9963A] rounded-2xl font-black text-[#1A0A00]"
           >
             Voir plus de styles (1 crédit)
           </button>
        )}
      </div>

    </div> // Fermeture du div principal de Results
  );
} // Fermeture de la fonction Results
