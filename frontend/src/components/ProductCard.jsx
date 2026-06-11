import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import toast from 'react-hot-toast';

export default function ProductCard({ product, index = 0 }) {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const { token } = useSelector((state) => state.auth);
  const isWishlisted = wishlistItems.some((i) => i.id === product.id);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      toast('Removed from wishlist', { icon: '♡' });
    } else {
      dispatch(addToWishlist(product));
      toast('Added to wishlist', { icon: '♥' });
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toast.error('Please login to add to cart');
      return;
    }
    dispatch(addToCart({ product_id: product.id }));
    toast.success('Added to cart');
  };

  const imageUrl = product.images?.[0] || `https://placehold.co/400x520/F8F8F8/666666?text=${encodeURIComponent(product.name || 'Product')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/products/${product.id}`} className="group block">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-[#F8F8F8] overflow-hidden mb-3">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white"
          >
            <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick add */}
          <motion.button
            onClick={handleAddToCart}
            className="absolute bottom-3 left-3 right-3 bg-black text-white text-xs tracking-[0.15em] uppercase py-2.5 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-neutral-800"
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingBag size={13} />
            Add to Bag
          </motion.button>

          {/* Stock badge */}
          {product.stock === 0 && (
            <div className="absolute top-3 left-3 bg-white text-black text-[10px] tracking-[0.15em] uppercase px-2.5 py-1">
              Sold Out
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          {product.brand && (
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#999999]">{product.brand}</p>
          )}
          <h3 className="text-sm font-normal text-[#111111] truncate">{product.name}</h3>
          <p className="text-sm font-medium">₹{product.price?.toLocaleString('en-IN')}</p>

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="w-3 h-3 rounded-full border border-[#E5E5E5]"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-[#999999]">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
