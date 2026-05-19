import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function FedaPayModal({ url, onSuccess }) {
  useEffect(() => {
    const handleMessage = (event) => {
      // Intercepte le signal envoyé par la page statique success.html
      if (event.data && event.data.type === "PAYMENT_SUCCESS") {
        
        // Déclenche le popup doré de félicitations dans App.jsx
        window.dispatchEvent(new CustomEvent('afrotresse:credit_success', { 
          detail: { userName: "Princesse", credits: 1 } 
        }));

        // Redirige immédiatement vers /profile via l'action du parent
        onSuccess(); 
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  return createPortal(
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex flex-col justify-end">
      <div className="w-full bg-[#2C1A0E] border-b border-white/10 p-4 flex justify-between items-center rounded-t-[2rem]">
        <div className="flex items-center gap-2">
          <span className="text-amber-500">🔒</span>
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Paiement Sécurisé FedaPay</span>
        </div>
      </div>
      
      <iframe 
        src={url} 
        className="w-full h-[85vh] bg-[#2C1A0E] border-none"
        title="FedaPay Checkout"
      />
    </div>,
    document.body
  );
}
