import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const launchedRef = useRef(false);

  useEffect(() => {
    if (launchedRef.current) return;
    launchedRef.current = true;

    const init = async () => {
      try {
        // attendre que Supabase restaure la session OAuth
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const {
          data: { session },
        } = await supabase.auth.getSession();

        // sécurité : pas de session = retour credits
        if (!session?.user?.id) {
          navigate('/credits', { replace: true });
          return;
        }

        // récupérer le pack sauvegardé avant OAuth
        const rawPending = localStorage.getItem('pendingPayment');

        if (!rawPending) {
          navigate('/credits', { replace: true });
          return;
        }

        const pending = JSON.parse(rawPending);

        // sécurité anti-fraude : TTL 15 min
        const TTL = 15 * 60 * 1000;

        if (!pending.createdAt || Date.now() - pending.createdAt > TTL) {
          localStorage.removeItem('pendingPayment');
          navigate('/credits', { replace: true });
          return;
        }

        // sécurité anti-double ouverture
        localStorage.removeItem('pendingPayment');

        // créer paiement côté backend
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            packId: pending.packId,
          }),
        });

        if (!response.ok) {
          navigate('/credits', { replace: true });
          return;
        }

        const paymentData = await response.json();

        // sécurité : vérifier lien FedaPay
        if (!paymentData?.payment_url) {
          navigate('/credits', { replace: true });
          return;
        }

        // redirection paiement
        window.location.href = paymentData.payment_url;
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/credits', { replace: true });
      }
    };

    init();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Connexion sécurisée en cours...</p>
    </div>
  );
          }
