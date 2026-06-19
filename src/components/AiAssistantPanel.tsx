import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Compass, ShieldAlert, Cpu } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Aweh, my Leader! 🌟 I am your **SpazaFlow AI township business growth commander**.\n\nI can analyze your live sales ledger, shelf products catalog, low stock counts, and suppliers marketplace to answer specific queries or create marketing flyers. \n\nClick one of the suggested reports below, or type your custom bookkeeping question!"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Quick suggestion prompts matching township business operations
  const suggestions = [
    { label: "🏆 Which products sell the most?", query: "Which products sell the most?" },
    { label: "🚨 What should I restock today?", query: "What should I restock? Predict stock shortages." },
    { label: "📊 Bookkeeping: How much profit did I make?", query: "How much profit did I make this month? Compare revenues & expenses." },
    { label: "📱 Write a WhatsApp promotion status special", query: "Generate promotional material status flyer for WhatsApp specials." }
  ];

  // Auto-scroll on message addition
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleQuerySubmit = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    // Add user message
    const nextMsgs = [...messages, { role: 'user', content: queryText } as Message];
    setMessages(nextMsgs);
    setInputVal('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryText })
      });

      if (!response.ok) {
        throw new Error('API assistant endpoint returned error');
      }

      const data = await response.json();
      setMessages([...nextMsgs, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages([...nextMsgs, { 
        role: 'assistant', 
        content: "Aweh, Chief. I couldn't reach my server cloud link right now. Please check if your network connection or GEMINI_API_KEY is defined in secrets!" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[510px]" id="ai_assistant_module">
      
      {/* Suggestions Menu Side card (col 4) */}
      <div className="lg:col-span-4 bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Suggested AI Prompts</h4>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            Quickly trigger automated financial health analysis or promotional WhatsApp status text drafts rooted in your live spaza records database.
          </p>

          <div className="space-y-2 pt-2">
            {suggestions.map((sug, index) => (
              <button
                key={index}
                onClick={() => handleQuerySubmit(sug.query)}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl border border-white/10 hover:bg-white/5 hover:border-indigo-500/50 transition-all text-xs font-semibold text-gray-300 leading-snug hover:shadow-xs disabled:opacity-50"
              >
                {sug.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Key indicators */}
        <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5 mt-4 text-[11px] text-slate-505 select-none font-mono">
          <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="leading-normal">
            <span className="font-bold text-gray-200">Core Engine Grounded:</span>
            <span className="block text-[10px] text-gray-400">Grounded via live DB sales & products list context</span>
          </div>
        </div>
      </div>

      {/* Main chat window feed (col 8) */}
      <div className="lg:col-span-8 bg-[#141416] border border-white/5 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
        
        {/* Chat header banner */}
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2 select-none">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm">SpazaFlow AI Grounded Copilot</h4>
            <span className="text-[10px] text-gray-500 font-mono">Running @google/genai (model: gemini-3.5-flash)</span>
          </div>
        </div>

        {/* Message Bubble box feed */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-4 max-h-[340px]">
          {messages.map((m, idx) => (
            <div 
              key={idx}
              className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Profile icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white'
              }`}>
                {m.role === 'user' ? 'ME' : 'AI'}
              </div>

              {/* Message content box */}
              <div className={`p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-650 text-white rounded-tr-none font-semibold font-sans'
                  : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none font-medium'
              }`}>
                {/* Visual markdown processing emulation for bullets & bolding */}
                <div className="whitespace-pre-line">
                  {m.content.split('\n').map((line, lIdx) => {
                    // check bold line markers
                    let rendered = line;
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    
                    // Simple replacement of markdown bolding tags visually
                    const parts = [];
                    let lastIdx = 0;
                    let match;
                    while ((match = boldRegex.exec(line)) !== null) {
                      parts.push(line.substring(lastIdx, match.index));
                      parts.push(<strong key={match.index} className={m.role === 'user' ? 'font-black text-white' : 'font-bold text-indigo-400'}>{match[1]}</strong>);
                      lastIdx = boldRegex.lastIndex;
                    }
                    parts.push(line.substring(lastIdx));

                    return (
                      <p key={lIdx} className={line.startsWith('-') || line.startsWith('* ') ? 'pl-2 border-l border-indigo-500' : ''}>
                        {parts.length > 1 ? parts : line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading loader bubble indicator */}
          {loading && (
            <div className="flex gap-3 mr-auto max-w-[80%] items-center select-none">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0B] border border-white/10 text-white flex items-center justify-center font-bold text-xs shrink-0 font-sans">
                AI
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none text-gray-400 text-xs flex items-center gap-1.5 font-mono">
                <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span>Summoning Johannesburg wholesales data ledger...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input prompt query form Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleQuerySubmit(inputVal); }}
          className="p-3 bg-white/5 border-t border-white/5 flex gap-2.5"
        >
          <input
            type="text"
            disabled={loading}
            placeholder={loading ? 'Querying Gemini...' : 'Type and ask: "Which supplier is cheapest for sugar?"'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-[#0A0A0B] px-4 py-2.5 text-xs font-semibold outline-none border border-white/10 focus:border-indigo-500 rounded-xl disabled:opacity-50 text-white placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className={`px-4.5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all ${
              !inputVal.trim() || loading
                ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-650 hover:bg-indigo-600'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Ask Assistant</span>
          </button>
        </form>

      </div>

    </div>
  );
}
