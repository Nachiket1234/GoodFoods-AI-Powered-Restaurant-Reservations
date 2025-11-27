import React, { useState, useRef, useEffect } from 'react';
import { Send, UtensilsCrossed, Loader2, Sparkles, ServerCog } from 'lucide-react';
import { Message, LoadingState, Restaurant } from './types';
import { sendMessageToGemini } from './services/openRouterService';
import RestaurantCard from './components/RestaurantCard';
import ApiKeyModal from './components/ApiKeyModal';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm your GoodFoods Concierge. I can help you find restaurants, check availability, and manage reservations. Where would you like to eat today?"
    }
  ]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingState]);

  const handleSend = async () => {
    if (!input.trim() || loadingState !== LoadingState.IDLE) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoadingState(LoadingState.THINKING);

    try {
      const response = await sendMessageToGemini(userMsg.content);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        relatedData: response.relatedData
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: 'err', role: 'model', content: "Something went wrong. Please try again." }]);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleQuickAction = (text: string) => {
    setInput(text);
  };

  const handleCardClick = (restaurantName: string) => {
    setInput(`Check availability for ${restaurantName} for 2 people tonight at 7 PM`);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      <ApiKeyModal />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GoodFoods Concierge</h1>
            <p className="text-xs text-gray-500 flex items-center">
              <Sparkles size={10} className="mr-1 text-emerald-500" /> 
              Powered by Llama 3.3
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[90%] sm:max-w-[75%] space-y-2`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Related Data Cards (e.g. Search Results) */}
              {msg.role === 'model' && msg.relatedData && Array.isArray(msg.relatedData) && (
                 <div className="flex overflow-x-auto gap-4 pb-2 pt-1 scrollbar-hide snap-x">
                    {msg.relatedData.map((rest: Restaurant) => (
                        <div key={rest.id} className="snap-center shrink-0">
                            <RestaurantCard data={rest} onBookClick={handleCardClick} />
                        </div>
                    ))}
                 </div>
              )}
            </div>
          </div>
        ))}

        {loadingState !== LoadingState.IDLE && (
          <div className="flex justify-start">
             <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2 text-xs text-gray-500">
                <Loader2 size={14} className="animate-spin text-emerald-600" />
                <span>Concierge is working...</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 shrink-0">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          
          {/* Quick Actions */}
          {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => handleQuickAction("Suggest a romantic Italian dinner in Manhattan")}
                className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors border border-gray-200"
              >
                🌹 Romantic Italian
              </button>
              <button 
                onClick={() => handleQuickAction("Book a table for 4 at The Golden Spoon tonight")}
                className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors border border-gray-200"
              >
                📅 Book Tonight
              </button>
               <button 
                onClick={() => handleQuickAction("Find cheap sushi near Downtown")}
                className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors border border-gray-200"
              >
                🍣 Cheap Sushi
              </button>
            </div>
          )}

          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your request..."
              className="w-full bg-gray-100 text-gray-800 border-0 rounded-xl px-5 py-4 pr-12 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
              disabled={loadingState !== LoadingState.IDLE}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loadingState !== LoadingState.IDLE}
              className={`absolute right-2 p-2 rounded-lg transition-colors ${
                input.trim() && loadingState === LoadingState.IDLE
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-transparent text-gray-400 cursor-not-allowed'
              }`}
            >
              {loadingState !== LoadingState.IDLE ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <div className="text-center">
             <p className="text-[10px] text-gray-400">AI can make mistakes. Please check with the restaurant directly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;