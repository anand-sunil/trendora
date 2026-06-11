import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { fetchProducts } from '../store/productSlice';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Filters from '../components/Filters';
import { InlineLoading } from '../components/Loading';

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-rating', label: 'Top Rated' },
  { value: 'name', label: 'Name: A-Z' },
];

export default function Products() {
  const dispatch = useDispatch();
  const { items, loading, total, page, totalPages } = useSelector((state) => state.products);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || undefined,
    brand: undefined,
    color: undefined,
    size: undefined,
    min_price: undefined,
    max_price: undefined,
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('created_at');
  const [currentPage, setCurrentPage] = useState(1);

  const loadProducts = useCallback(() => {
    const params = { page: currentPage, limit: 12, sort };
    if (search) params.search = search;
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params[k] = v;
    });
    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, sort, search, filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters };
      // Remove undefined/null
      Object.keys(merged).forEach((k) => {
        if (merged[k] === undefined || merged[k] === null || merged[k] === '') delete merged[k];
      });
      return merged;
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
    setCurrentPage(1);
  };

  const handleSearch = (query) => {
    setSearch(query);
    setCurrentPage(1);
  };

  const handleSort = (value) => {
    setSort(value);
    setSortOpen(false);
    setCurrentPage(1);
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Sort';

  return (
    <div className="page-container px-6 md:px-12 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="section-title">Collection</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight">All Products</h1>
        {total > 0 && (
          <p className="text-sm text-[#666666] mt-2">{total} product{total !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} value={search} />
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 border border-[#E5E5E5] px-4 py-3 text-xs tracking-[0.1em] uppercase hover:border-black transition-colors"
            >
              {sortLabel} <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-1 bg-white border border-[#E5E5E5] z-20 w-48 shadow-sm"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSort(opt.value)}
                      className={`block w-full text-left px-4 py-2.5 text-xs tracking-wide hover:bg-[#F8F8F8] transition-colors ${
                        sort === opt.value ? 'font-medium bg-[#F8F8F8]' : ''
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 border border-[#E5E5E5] px-4 py-3 text-xs tracking-[0.1em] uppercase hover:border-black transition-colors"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Filters filters={filters} onFilterChange={handleFilterChange} onClear={handleClearFilters} />
        </div>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="fixed inset-0 z-40 bg-white lg:hidden overflow-y-auto p-6 pt-20"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Filters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
                onClose={() => setShowFilters(false)}
              />
              <button
                onClick={() => setShowFilters(false)}
                className="btn-primary w-full mt-8"
              >
                Apply Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <InlineLoading />
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#666666] text-sm mb-4">No products found</p>
              <button onClick={handleClearFilters} className="btn-outline">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {items.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 flex items-center justify-center text-xs transition-colors ${
                        p === currentPage
                          ? 'bg-black text-white'
                          : 'border border-[#E5E5E5] hover:border-black'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
