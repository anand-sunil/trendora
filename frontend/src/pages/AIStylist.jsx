import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatbotAPI } from '../api/axios';

const SUGGESTIONS = [
  'I need a black shirt under ₹1000',
  'Wedding outfit for men under ₹5000',
  'Show me oversized white t-shirts',
  'Red dress for a party',
  'Blue jeans under ₹2000',
  'Casual kurta for daily wear',
];

export default function AIStylist() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await chatbotAPI.recommend({ message: msg, limit: 8 });
      const data = res.data.data;
      const recs = data.recommendations || [];
      const filters = data.filters || {};
      const filterStr = Object.entries(filters)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');

      if (recs.length > 0) {
        setMessages((m) => [
          ...m,
          {
            role: 'bot',
            text: data.stylist_response || `Found ${recs.length} item${recs.length > 1 ? 's' : ''} for you${filterStr ? ` — ${filterStr}` : ''}.`,
          },
          { role: 'bot', products: recs },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: 'bot',
            text: 'I couldn\'t find anything matching your request. Try something like "blue jeans under ₹2000" or "casual shirts for men".',
          },
        ]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="page-container flex flex-col min-h-[calc(100vh-64px)]">
      {/* Chat area */}
      <div className="flex-1 px-6 md:px-12 py-8 overflow-y-auto">
        {isEmpty ? (
          /* ── Empty state / hero ───────────────────────────────── */
          <motion.div
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center mb-8">
              <Sparkles size={24} />
            </div>
            <p className="text-xs tracking-[0.4em] uppercase text-[#666666] mb-4">Personal Styling</p>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-4">
              TRENDORA<br />STYLIST
            </h1>
            <p className="text-[#666666] text-base md:text-lg font-light max-w-md mb-12">
              What are you looking for today?
            </p>

            {/* Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 border border-[#E5E5E5] text-xs text-[#666666] hover:border-black hover:text-black transition-all duration-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── Messages ─────────────────────────────────────────── */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.products ? (
                  /* Product grid */
                  <div className="ml-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {msg.products.map((p) => (
                        <Link
                          to={`/products/${p.id}`}
                          key={p.id}
                          className="group border border-[#E5E5E5] hover:border-black transition-colors"
                        >
                          <div className="aspect-[3/4] bg-[#F8F8F8] overflow-hidden">
                            <img
                              src={p.images?.[0] || `https://placehold.co/300x400/F8F8F8/666666?text=${encodeURIComponent(p.name)}`}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-2.5">
                            {p.brand && (
                              <p className="text-[9px] tracking-[0.1em] uppercase text-[#999999]">{p.brand}</p>
                            )}
                            <p className="text-xs truncate mt-0.5">{p.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs font-medium">₹{p.price?.toLocaleString('en-IN')}</p>
                              {p.relevance_score > 0 && (
                                <span className="text-[9px] text-[#999999]">{p.relevance_score}% match</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Text message */
                  <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 flex-shrink-0 border border-[#E5E5E5] flex items-center justify-center mt-0.5">
                        <Sparkles size={13} />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-black text-white'
                          : 'bg-[#F8F8F8] text-[#111111]'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 flex-shrink-0 bg-black text-white flex items-center justify-center mt-0.5">
                        <User size={13} />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 flex-shrink-0 border border-[#E5E5E5] flex items-center justify-center">
                  <Sparkles size={13} />
                </div>
                <div className="bg-[#F8F8F8] px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-[#999999] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#999999] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#999999] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={chatEnd} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-[#E5E5E5] px-6 md:px-12">
        <div className="max-w-3xl mx-auto py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center border border-[#E5E5E5] focus-within:border-black transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe what you're looking for..."
                className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none placeholder:text-[#999999]"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="px-4 py-3 text-black hover:bg-[#F8F8F8] transition-colors disabled:opacity-30"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#999999] text-center mt-2">
            Try: "black formal shirt under ₹1500" or "casual summer dress"
          </p>
        </div>
      </div>
    </div>
  );
}
