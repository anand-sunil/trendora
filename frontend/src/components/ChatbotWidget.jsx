import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { chatbotAPI } from '../api/axios';
import { Link } from 'react-router-dom';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m your AI stylist. Tell me what you\'re looking for — like "black shirt under ₹1000" or "wedding outfit for men".' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await chatbotAPI.recommend({ message: userMsg, limit: 4 });
      const data = res.data.data;
      const recs = data.recommendations || [];
      const filtersStr = Object.entries(data.filters || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      if (recs.length > 0) {
        setMessages((m) => [
          ...m,
          { role: 'bot', text: data.stylist_response || (filtersStr ? `I found ${recs.length} items matching: ${filtersStr}` : `Here are ${recs.length} recommendations:`) },
          { role: 'bot', products: recs },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: 'bot', text: 'I couldn\'t find anything matching that. Try being more specific — like "blue jeans under ₹2000".' },
        ]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white border border-[#E5E5E5] flex flex-col shadow-xl"
            style={{ height: '500px' }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center gap-2">
              <Sparkles size={16} />
              <span className="text-xs tracking-[0.2em] uppercase font-medium">AI Stylist</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.products ? (
                    <div className="grid grid-cols-2 gap-2">
                      {msg.products.map((p) => (
                        <Link
                          to={`/products/${p.id}`}
                          key={p.id}
                          onClick={() => setOpen(false)}
                          className="border border-[#E5E5E5] p-2 hover:border-black transition-colors"
                        >
                          <div className="aspect-square bg-[#F8F8F8] mb-1.5 overflow-hidden">
                            <img
                              src={p.images?.[0] || `https://placehold.co/150x150/F8F8F8/666666?text=${encodeURIComponent(p.name)}`}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-[10px] truncate">{p.name}</p>
                          <p className="text-[10px] font-medium">₹{p.price?.toLocaleString('en-IN')}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-black text-white'
                            : 'bg-[#F8F8F8] text-[#111111]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#F8F8F8] px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#999999] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#999999] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#999999] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>

            {/* Input */}
            <div className="border-t border-[#E5E5E5] px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your stylist..."
                className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-[#999999]"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 text-black hover:bg-[#F8F8F8] transition-colors disabled:opacity-30"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
