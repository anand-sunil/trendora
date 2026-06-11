import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Minus, Plus, ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProductById, clearCurrentProduct } from '../store/productSlice';
import { addToCart } from '../store/cartSlice';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { InlineLoading } from '../components/Loading';
import toast from 'react-hot-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProduct: product, loading } = useSelector((state) => state.products);
  const { token } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const isWishlisted = product && wishlistItems.some((i) => i.id === product.id);

  const allImages = product?.images?.length > 0
    ? product.images
    : product ? [`https://placehold.co/600x800/F8F8F8/666666?text=${encodeURIComponent(product.name)}`] : [];

  // Parse images into { url, color } objects
  const parsedImages = allImages.map((img) => {
    if (typeof img === 'string' && img.includes('|')) {
      const [url, color] = img.split('|');
      return { url: url.trim(), color: color.trim().toLowerCase() };
    }
    return { url: img, color: null };
  });

  // Filter images based on selected color
  const filteredImages = parsedImages.filter((img) => {
    if (!selectedColor) return true;
    return !img.color || img.color === selectedColor.toLowerCase();
  });

  const images = filteredImages.length > 0
    ? filteredImages.map((img) => img.url)
    : parsedImages.map((img) => img.url);

  const handlePrevImage = () => {
    if (images.length) {
      setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (images.length) {
      setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  // Reset active image when selected color changes
  useEffect(() => {
    setActiveImage(0);
  }, [selectedColor]);

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => { dispatch(clearCurrentProduct()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (product) {
      if (product.sizes?.length) setSelectedSize(product.sizes[0]);
      if (product.colors?.length) setSelectedColor(product.colors[0]);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!token) { toast.error('Please login first'); navigate('/login'); return; }
    dispatch(addToCart({ product_id: product.id, quantity }));
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    if (!token) { toast.error('Please login first'); navigate('/login'); return; }
    dispatch(addToCart({ product_id: product.id, quantity }));
    navigate('/cart');
  };

  const handleWishlist = () => {
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      toast('Removed from wishlist', { icon: '♡' });
    } else {
      dispatch(addToWishlist(product));
      toast('Added to wishlist', { icon: '♥' });
    }
  };

  if (loading) return <InlineLoading />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-[#666666] mb-4">Product not found</p>
      <button onClick={() => navigate('/products')} className="btn-outline">Back to Shop</button>
    </div>
  );



  return (
    <div className="page-container px-6 md:px-12 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-[#666666] hover:text-black transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative aspect-[3/4] bg-[#F8F8F8] overflow-hidden mb-3 group">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={images[activeImage]}
                alt={product.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover select-none"
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                {/* Arrow Navigation */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white border border-[#E5E5E5] rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white border border-[#E5E5E5] rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-[2px]">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === activeImage ? 'bg-white w-3.5' : 'bg-white/50'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-20 bg-[#F8F8F8] overflow-hidden border transition-colors ${
                    i === activeImage ? 'border-black' : 'border-transparent hover:border-[#E5E5E5]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col"
        >
          {product.brand && (
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#999999] mb-2">{product.brand}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-3">{product.name}</h1>
          <p className="text-xl font-medium mb-6">₹{product.price?.toLocaleString('en-IN')}</p>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-[#666666] leading-relaxed mb-8 font-light">{product.description}</p>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-3">
                Color — <span className="text-black">{selectedColor}</span>
              </p>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      selectedColor === color ? 'border-black' : 'border-transparent hover:border-[#E5E5E5]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-[#E5E5E5]"
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[44px] h-11 px-3 flex items-center justify-center text-xs border transition-all ${
                      selectedSize === size
                        ? 'border-black bg-black text-white'
                        : 'border-[#E5E5E5] hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <p className="text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-3">Quantity</p>
            <div className="flex items-center border border-[#E5E5E5] w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 flex items-center justify-center hover:bg-[#F8F8F8] transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-12 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 flex items-center justify-center hover:bg-[#F8F8F8] transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-8">
            {product.stock > 0 ? (
              <>
                <Check size={14} className="text-green-600" />
                <span className="text-xs text-[#666666]">In Stock ({product.stock} available)</span>
              </>
            ) : (
              <span className="text-xs text-red-500 uppercase tracking-wide">Out of Stock</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <ShoppingBag size={14} />
              Add to Bag
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="btn-outline flex-1 disabled:opacity-30"
            >
              Buy Now
            </button>
            <button
              onClick={handleWishlist}
              className="btn-outline w-12 h-12 sm:w-auto sm:h-auto sm:px-4 flex items-center justify-center"
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Category info */}
          <div className="mt-10 pt-6 border-t border-[#E5E5E5] space-y-2">
            {product.category && (
              <p className="text-xs text-[#666666]">
                <span className="text-[#999999]">Category:</span> {product.category}
              </p>
            )}
            {product.subcategory && (
              <p className="text-xs text-[#666666]">
                <span className="text-[#999999]">Subcategory:</span> {product.subcategory}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
