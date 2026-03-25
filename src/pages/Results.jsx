// === AJOUTS UNIQUEMENT LIGNE 160-175 ===
// Le reste du fichier reste inchangé

  const handleTryStyle = async (style, index, type = "transform") => {
    if (type === "analyze"   && !canAnalyze())  { navigate("/credits"); return; }
    if (type === "transform" && !canTransform()) { navigate("/credits"); return; }

    setErrorMsg(""); setResultImage(null); setResultStyleId(null);
    setIsFallback(false); setLoadingIdx(index); setResultMsg("");

    let idx = 0;
    waitingIntervalRef.current = setInterval(() => { idx = (idx + 1) % 3; }, 3000);

    try {
      const selfieBase64  = selfieUrl?.split(",")[1] || null;
      const selfieType    = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";
      
      // 🔍 DEBUG: Afficher la structure du style
      console.group('🎨 STYLE DEBUG — handleTryStyle');
      console.log('style object complet:', style);
      console.log('  .image:', style.image ?? '❌ UNDEFINED/NULL');
      console.log('  .imageUrl:', style.imageUrl ?? '❌ UNDEFINED/NULL');
      console.log('  .localImage:', style.localImage ?? '❌ UNDEFINED/NULL');
      console.log('  .id:', style.id ?? '❌ UNDEFINED/NULL');
      console.log('  .name:', style.name ?? '❌ UNDEFINED/NULL');
      console.log('Tous les champs du style:', Object.keys(style));
      console.groupEnd();
      
      // ========== CONSTRUCTION STYLEIMAGEURL ==========
      let styleImageUrl;
      
      if (style.image) {
        // Si style.image existe, l'utiliser
        styleImageUrl = style.image.startsWith('http') 
          ? style.image 
          : `${window.location.origin}${style.image}`;
      } else if (style.localImage) {
        // Sinon, chercher localImage
        styleImageUrl = `${window.location.origin}/styles/${style.localImage}`;
      } else if (style.id) {
        // Fallback: construire depuis l'ID (assume format napi{id}.jpg)
        styleImageUrl = `${window.location.origin}/styles/napi${style.id}.jpg`;
      } else if (style.name && style.name.includes('napi')) {
        // Fallback: utiliser directement le name s'il contient le pattern
        styleImageUrl = `${window.location.origin}/styles/${style.name}.jpg`;
      } else {
        // Erreur: pas moyen de construire l'URL
        console.error('❌ ERREUR: Impossible de construire styleImageUrl!');
        console.error('  style.image:', style.image);
        console.error('  style.localImage:', style.localImage);
        console.error('  style.id:', style.id);
        console.error('  style.name:', style.name);
        setErrorMsg('Erreur: Image de coiffure introuvable. Recharge la page.');
        clearInterval(waitingIntervalRef.current);
        return;
      }
      
      // ========== VALIDATION ==========
      if (!styleImageUrl || styleImageUrl.includes('undefined') || styleImageUrl.includes('null')) {
        console.error('❌ styleImageUrl INVALIDE!');
        console.error('  Valeur:', styleImageUrl);
        setErrorMsg('Erreur: Image de coiffure invalide. Recharge la page.');
        clearInterval(waitingIntervalRef.current);
        return;
      }

      console.warn('📤 styleImageUrl VALIDE qui sera envoyé à Fal.ai:');
      console.warn('  URL:', styleImageUrl);
      console.warn('  Longueur:', styleImageUrl.length);
      console.warn('  Contient undefined?:', styleImageUrl.includes('undefined'));

      // ========== APPEL FONCE ==========
      const res  = await fetch("/api/falGenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ selfieBase64, selfieType, styleImageUrl, faceShape, styleId: style.id, type }),
      });
      const data = await res.json();
      if (res.status === 429) { setErrorMsg(data.error); return; }

      clearInterval(waitingIntervalRef.current);
      if (type === "analyze")   consumeAnalysis();
      if (type === "transform") consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      
      // ... REST DU CODE INCHANGÉ ...
    } catch (error) {
      console.error('❌ Erreur dans handleTryStyle:', error);
      // ... HANDLE ERROR ...
    }
  }

// ========== FIN DES MODIFICATIONS ==========
// Tout le reste du fichier reste exactement pareil
export default Results;
