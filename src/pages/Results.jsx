// === REMPLACEMENT LIGNES 160-175 (Correction structure views.top) ===

  const handleTryStyle = async (style, index, type = "transform") => {
    if (type === "analyze"   && !canAnalyze())  { navigate("/credits"); return; }
    if (type === "transform" && !canTransform()) { navigate("/credits"); return; }

    setErrorMsg(""); 
    setResultImage(null);
    setResultStyleId(null);
    setIsFallback(false); 
    setLoadingIdx(index); 
    setResultMsg("");

    let idx = 0;
    waitingIntervalRef.current = setInterval(() => { idx = (idx + 1) % 3; }, 3000);

    try {
      const selfieBase64  = selfieUrl?.split(",")[1] || null;
      const selfieType    = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";
      
      // 🔍 DEBUG: Verification de la nouvelle structure
      console.log('Style ID:', style.id);

      // ========== CONSTRUCTION STYLEIMAGEURL (VUE TOP) ==========
      let styleImageUrl = "";

      if (style.views && style.views.top) {
        // Utilise la vue de dessus definie dans faceAnalysis.js
        styleImageUrl = style.views.top.startsWith('http') 
          ? style.views.top 
          : `${window.location.origin}${style.views.top}`;
      } else {
        // Fallback de securite si views.top est manquant
        console.error('❌ ERREUR: views.top introuvable pour ce style!');
        setErrorMsg('Erreur: Image de r\u00e9f\u00e9rence introuvable. Recharge la page.');
        clearInterval(waitingIntervalRef.current);
        setLoadingIdx(null);
        return;
      }
      
      // ========== VALIDATION FINALE ==========
      if (!styleImageUrl || styleImageUrl.includes('undefined')) {
        setErrorMsg('Erreur: URL de coiffure invalide.');
        clearInterval(waitingIntervalRef.current);
        setLoadingIdx(null);
        return;
      }

      // ========== APPEL API ==========
      const res = await fetch("/api/falGenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ 
          selfieBase64, 
          selfieType, 
          styleImageUrl, // Envoie la vue TOP a Fal.ai
          faceShape, 
          styleId: style.id, 
          type 
        }),
      });

      const data = await res.json();
      if (res.status === 429) { 
        setErrorMsg(data.error); 
        clearInterval(waitingIntervalRef.current);
        setLoadingIdx(null);
        return; 
      }

      clearInterval(waitingIntervalRef.current);
      if (type === "analyze")   consumeAnalysis();
      if (type === "transform") consumeTransform();
      
      addSeenStyleId(style.id);
      setCredits(getCredits());
      
      // ... Mise a jour du resultat avec l'image generee
      if (data.imageUrl) {
        setResultImage(data.imageUrl);
        setResultStyleId(style.id);
      }

    } catch (error) {
      console.error('❌ Erreur dans handleTryStyle:', error);
      clearInterval(waitingIntervalRef.current);
      setLoadingIdx(null);
      setErrorMsg('Une erreur est survenue lors de la g\u00e9n\u00e9ration.');
    }
  }
