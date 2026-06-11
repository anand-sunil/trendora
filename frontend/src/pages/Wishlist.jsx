import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { removeFromWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.wishlist);
  const { token } = useSelector((state) => state.auth);

  const handleRemove = (id) => {
    dispatch(removeFromWishlist(id));
    toast('Removed from wishlist', { icon: '♡' });
  };

  const handleAddToCart = (product) => {
    if (!token) { toast.error('Please login first'); return; }
    dispatch(addToCart({ product_id: product.id }));
    dispatch(removeFromWishlist(product.id));
    toast.success('Moved to cart');
  };

  return (
    <div className="page-container px-6 md:px-12 py-8 min-h-[60vh]">
      <div className="mb-8">
        <p className="section-title">Saved Items</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight">Wishlist</h1>
        {items.length > 0 && (
          <p className="text-sm text-[#666666] mt-2">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Heart size={40} className="mx-auto text-[#E5E5E5] mb-4" />
          <p className="text-[#666666] mb-6">Your wishlist is empty</p>
          <Link to="/products" className="btn-primary">Explore Collection</Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link to={`/products/${product.id}`} className="group block">
                  <div className="aspect-[3/4] bg-[#F8F8F8] overflow-hidden mb-3 relative">
                    <img
                      src={product.images?.[0] || `https://placehold.co/400x520/F8F8F8/666666?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                        className="flex-1 bg-black text-white text-xs tracking-[0.1em] uppercase py-2.5 flex items-center justify-center gap-1.5 hover:bg-neutral-800"
                      >
                        <ShoppingBag size={12} /> Move to Bag
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleRemove(product.id); }}
                        className="w-10 bg-white text-black flex items-center justify-center hover:bg-[#F8F8F8]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {product.brand && (
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[#999999]">{product.brand}</p>
                    )}
                    <h3 className="text-sm truncate">{product.name}</h3>
                    <p className="text-sm font-medium">₹{product.price?.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
