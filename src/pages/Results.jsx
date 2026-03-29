import { useState } from "react";

export default function Results() {
  const [message, setMessage] = useState("âœ¨ Results Page - useState fonctionne! âœ¨");

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-6">Tes RÃ©sultats</h1>
        <p className="text-xl mb-8 text-[#C9963A]">{message}</p>
        
        <button
          onClick={() => setMessage("useState + onClick fonctionne! ðŸŽ‰")}
          className="px-8 py-4 rounded-full font-bold text-lg text-[#2C1A0E] transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
          Clique-moi
        </button>

        <p className="text-sm text-gray-400 mt-8">
          Si tu vois ce message, le build est OK!
        </p>
      </div>
    </div>
  );
}
