import React, { useState, useEffect } from "react";

export default function Results() {
  const [test, setTest] = useState("ÇA MARCHE!");

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">✨ Results Page ✨</h1>
        <p className="text-xl">{test}</p>
        <button
          onClick={() => setTest("useState fonctionne!")}
          className="mt-6 px-6 py-3 rounded-full font-bold text-sm text-[#2C1A0E]"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
          Test useState
        </button>
      </div>
    </div>
  );
}
