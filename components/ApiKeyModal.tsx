import React, { useEffect, useState } from 'react';

const ApiKeyModal: React.FC = () => {
  const [hasKey, setHasKey] = useState(true);

  const checkKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
        // Fallback for non-AI Studio environments, assumes key might be missing
        // In a real deployed app, you'd handle this differently.
        // For this demo context, we assume if process.env.API_KEY is missing, we show the prompt.
        setHasKey(!!process.env.API_KEY);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        checkKey();
        window.location.reload(); // Reload to pick up the key in process.env
    } else {
        alert("AI Studio key selector not available in this environment.");
    }
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">API Key Required</h2>
        <p className="text-gray-600 mb-6">
          To use the GoodFoods AI Agent, please select a valid Google Gemini API key. 
          This is required to power the LLM and tool usage.
        </p>
        <button
          onClick={handleSelectKey}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
        >
          Select API Key
        </button>
        <p className="mt-4 text-xs text-gray-400">
          See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">billing documentation</a> for details.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;