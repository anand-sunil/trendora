import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const CATEGORIES = ['Shirt', 'Dress', 'Jeans', 'Pants', 'Jacket', 'Kurta', 'Saree', 'Top', 'Shoes', 'Accessories'];
const BRANDS = ['Zara', 'H&M', 'Raymond', 'Allen Solly', 'Levi\'s', 'Nike', 'Adidas', 'Puma'];
const COLORS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Navy', 'Grey', 'Beige', 'Brown', 'Pink'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Filters({ filters, onFilterChange, onClear, onClose }) {
  const handleSelect = (key, value) => {
    onFilterChange({ [key]: filters[key] === value ? undefined : value });
  };

  const handlePriceChange = (key, value) => {
    onFilterChange({ [key]: value ? Number(value) : undefined });
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs tracking-[0.3em] uppercase font-medium">
          Filters {activeCount > 0 && `(${activeCount})`}
        </h3>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs text-[#666666] hover:text-black transition-colors underline underline-offset-2">
              Clear all
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-[#666666] hover:text-black">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <FilterGroup title="Category">
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleSelect('category', cat.toLowerCase())}
              className={`block w-full text-left text-sm py-1 transition-colors ${
                filters.category === cat.toLowerCase() ? 'text-black font-medium' : 'text-[#666666] hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Brand */}
      <FilterGroup title="Brand">
        <div className="space-y-1.5">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              onClick={() => handleSelect('brand', brand.toLowerCase())}
              className={`block w-full text-left text-sm py-1 transition-colors ${
                filters.brand === brand.toLowerCase() ? 'text-black font-medium' : 'text-[#666666] hover:text-black'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Color */}
      <FilterGroup title="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleSelect('color', color.toLowerCase())}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border transition-all ${
                filters.color === color.toLowerCase()
                  ? 'border-black bg-black text-white'
                  : 'border-[#E5E5E5] hover:border-black'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-[#E5E5E5]"
                style={{ backgroundColor: color.toLowerCase() }}
              />
              {color}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Size */}
      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => handleSelect('size', size.toLowerCase())}
              className={`w-10 h-10 flex items-center justify-center text-xs border transition-all ${
                filters.size === size.toLowerCase()
                  ? 'border-black bg-black text-white'
                  : 'border-[#E5E5E5] hover:border-black'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Price Range */}
      <FilterGroup title="Price Range">
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => handlePriceChange('min_price', e.target.value)}
            className="input-field !py-2 !text-xs"
          />
          <span className="text-[#999999] text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => handlePriceChange('max_price', e.target.value)}
            className="input-field !py-2 !text-xs"
          />
        </div>
      </FilterGroup>
    </motion.div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="pb-6 border-b border-[#E5E5E5] last:border-b-0">
      <h4 className="text-[11px] tracking-[0.2em] uppercase text-[#999999] mb-3">{title}</h4>
      {children}
    </div>
  );
}
