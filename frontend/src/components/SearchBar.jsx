import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar({ onSearch, value = '' }) {
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`flex items-center border transition-colors duration-300 ${focused ? 'border-black' : 'border-[#E5E5E5]'}`}>
        <Search size={16} className="ml-4 text-[#999999]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search products..."
          className="flex-1 px-3 py-3 text-sm bg-transparent focus:outline-none placeholder:text-[#999999]"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              type="button"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mr-2 p-1 text-[#999999] hover:text-black transition-colors"
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>
        <button
          type="submit"
          className="px-5 py-3 bg-black text-white text-xs tracking-[0.15em] uppercase hover:bg-neutral-800 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
