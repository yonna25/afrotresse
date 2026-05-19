import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function FedaPayModal({ url, onSuccess }) {
  useEffect(() => {
    const handleMessage = (event) => {
      // Écoute le clic du bouton "Voir mon solde"
      if (event.data && event.data.type === "PAYMENT_SUCCESS") {
        onSuccess(); // Déclenche le passage automatique vers /profile
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  return createPortal(
    <div className="fixed inset-0 z-[250] bg-[#2C1A0E] flex flex-col justify-end">
      <div className="w-full bg-[#2C1A0E] border-b border-white/5 p-4 flex justify-between items-center rounded-t-[2rem]">
        <div className="flex items-center gap-2 mx-auto">
          <span className="text-xs font-black text-white/40 uppercase tracking-widest">🔒 Connexion FedaPay</span>
        </div>
      </div>
      
      <iframe 
        src={url} 
        className="w-full h-[85vh] bg-[#2C1A0E] border-none"
        title="FedaPay"
      />
    </div>,
    document.body
  );
}
