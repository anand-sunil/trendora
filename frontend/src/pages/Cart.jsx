import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { fetchCart, removeFromCart } from '../store/cartSlice';
import { InlineLoading } from '../components/Loading';
import toast from 'react-hot-toast';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalItems, totalAmount, loading } = useSelector((state) => state.cart);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleRemove = (productId, name) => {
    dispatch(removeFromCart(productId));
    toast.success(`Removed ${name}`);
  };

  if (loading && items.length === 0) return <InlineLoading />;

  return (
    <div className="page-container px-6 md:px-12 py-8 min-h-[60vh]">
      <div className="mb-8">
        <p className="section-title">Your Selection</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight">Shopping Bag</h1>
      </div>

      {items.length === 0 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ShoppingBag size={40} className="mx-auto text-[#E5E5E5] mb-4" />
          <p className="text-[#666666] mb-6">Your bag is empty</p>
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          {/* Items */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.product_id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-4 md:gap-6 py-6 border-b border-[#E5E5E5]"
                >
                  {/* Image */}
                  <Link to={`/products/${item.product_id}`} className="w-24 md:w-32 flex-shrink-0">
                    <div className="aspect-[3/4] bg-[#F8F8F8] overflow-hidden">
                      <img
                        src={item.image || `https://placehold.co/120x160/F8F8F8/666666?text=Product`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link to={`/products/${item.product_id}`} className="text-sm font-normal hover:underline underline-offset-2">
                        {item.name}
                      </Link>
                      <p className="text-sm font-medium mt-1">₹{item.price?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-[#666666] mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-medium">₹{item.subtotal?.toLocaleString('en-IN')}</p>
                      <button
                        onClick={() => handleRemove(item.product_id, item.name)}
                        className="text-[#999999] hover:text-black transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="border border-[#E5E5E5] p-6 sticky top-24">
              <h3 className="text-xs tracking-[0.2em] uppercase font-medium mb-6">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Items ({totalItems})</span>
                  <span>₹{totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-medium pt-4 border-t border-[#E5E5E5] mb-6">
                <span>Total</span>
                <span>₹{totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Checkout <ArrowRight size={14} />
              </button>
              <Link
                to="/products"
                className="block text-center text-xs tracking-[0.15em] uppercase text-[#666666] hover:text-black transition-colors mt-4"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
