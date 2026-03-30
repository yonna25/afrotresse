import React, { useState, useEffect } from 'react'

function App() {
  // Une fonction basique pour tester l'état
  const [status, setStatus] = useState("Opérationnel");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-blue-600">AfroTresse</h1>
      <p>Statut du site : {status}</p>
      <button 
        onClick={() => setStatus("Chargement...")}
        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
      >
        Tester le bouton
      </button>
    </div>
  );
}

export default App;
