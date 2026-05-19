function FedaPayModal({ url, onClose, onSuccess }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Détection automatique du succès via l'évolution des crédits en base
  useEffect(() => {
    let attempts = 0;
    let timer;
    const creditsBefore = parseInt(localStorage.getItem('afrotresse_credits') || '0', 10);

    const poll = async () => {
      attempts++;
      try {
        const { syncCreditsFromServer } = await import('../services/credits.js');
        const synced = await syncCreditsFromServer();
        if (synced !== null && synced > creditsBefore) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 2500); // Laisse le temps de voir le message de succès avant redirection
          return;
        }
      } catch {}
      if (attempts < 45) timer = setTimeout(poll, 2000); // Poll pendant 1min30 max
    };

    poll();
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', background: '#1E1008' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0, borderBottom: '1px solid rgba(194,144,54,0.1)' }}>
        <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 auto' }}>🔒 Connexion sécurisée FedaPay</p>
        <button onClick={onClose} style={{ position: 'absolute', right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {isSuccess ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
          <span style={{ fontSize: 40 }}>🥳</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#C29036', margin: 0 }}>Paiement Validé !</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 280, margin: 0 }}>
            Tes crédits ont été ajoutés. Redirection vers ton profil en cours...
          </p>
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: 120 }} 
            transition={{ duration: 2.2, ease: "linear" }} 
            style={{ height: 3, backgroundColor: '#C29036', borderRadius: 2 }} 
          />
        </div>
      ) : (
        <>
          {!iframeLoaded && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(194,144,54,0.2)', borderTopColor: '#C29036' }} />
            </div>
          )}
          <iframe src={url} title="Paiement FedaPay" style={{ flex: 1, width: '100%', border: 'none', display: iframeLoaded ? 'block' : 'none' }} onLoad={() => setIframeLoaded(true)} allow="payment" />
        </>
      )}
    </motion.div>,
    document.body
  );
}
