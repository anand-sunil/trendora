import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CreditCard, Truck, ArrowRight, ArrowLeft } from 'lucide-react';
import { ordersAPI } from '../api/axios';
import { clearCart, fetchCart } from '../store/cartSlice';
import toast from 'react-hot-toast';

const STEPS = ['Shipping', 'Payment', 'Confirmation'];

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, totalAmount, totalItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // Stepper state
  const [activeStep, setActiveStep] = useState(0); // 0: Shipping, 1: Payment, 2: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Form states
  const [shippingData, setShippingData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
  });

  const [saveAddress, setSaveAddress] = useState(false);

  useEffect(() => {
    const savedAddress = localStorage.getItem('trendora_shipping_address');
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setShippingData((prev) => ({ ...prev, ...parsed }));
        setSaveAddress(true);
      } catch (err) {
        console.error('Failed to parse saved shipping address:', err);
      }
    }
  }, []);



  useEffect(() => {
    // If cart is empty and we're not on the confirmation step, redirect back to cart
    if (activeStep < 2 && items.length === 0) {
      dispatch(fetchCart()).then((action) => {
        if (!action.payload || action.payload.items.length === 0) {
          navigate('/cart');
        }
      });
    }
  }, [items, navigate, activeStep, dispatch]);

  const handleShippingChange = (e) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  };



  const validateShipping = () => {
    const { full_name, phone, address_line1, city, state, postal_code } = shippingData;
    if (!full_name.trim()) return 'Please enter your full name.';
    if (!phone.trim()) return 'Please enter your phone number.';
    if (!address_line1.trim()) return 'Please enter your shipping address.';
    if (!city.trim()) return 'Please enter your city.';
    if (!state.trim()) return 'Please enter your state.';
    if (!postal_code.trim()) return 'Please enter your postal code.';
    return null;
  };



  const handleNextStep = () => {
    if (activeStep === 0) {
      const error = validateShipping();
      if (error) {
        toast.error(error);
        return;
      }
      if (saveAddress) {
        localStorage.setItem('trendora_shipping_address', JSON.stringify(shippingData));
      } else {
        localStorage.removeItem('trendora_shipping_address');
      }
      setActiveStep(1);
    }
  };

  const handleBackStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handlePayNow = async () => {
    if (!window.Razorpay) {
      toast.error('Razorpay payment gateway script failed to load. Please reload the page.');
      return;
    }

    setIsProcessing(true);
    toast.loading('Initiating payment session...', { id: 'checkout' });

    try {
      const response = await ordersAPI.createPaymentSession();
      const sessionData = response.data.data;
      
      const options = {
        key: sessionData.key_id,
        amount: sessionData.amount,
        currency: sessionData.currency,
        name: 'Trendora',
        description: 'Secure Fashion Checkout',
        image: '/favicon.svg',
        order_id: sessionData.razorpay_order_id,
        handler: async function (paymentResponse) {
          setIsProcessing(true);
          toast.loading('Verifying transaction...', { id: 'checkout' });
          try {
            const verifyResponse = await ordersAPI.verifyPayment({
              payment_details: {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              shipping_address: shippingData,
            });

            const order = verifyResponse.data.data;
            setCreatedOrder(order);
            dispatch(clearCart());
            toast.success('Payment verified & order placed!', { id: 'checkout' });
            setActiveStep(2);
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error(
              err.response?.data?.detail || 'Verification failed. Please check with your bank.',
              { id: 'checkout' }
            );
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: shippingData.full_name,
          contact: shippingData.phone,
          email: user?.email || '',
        },
        notes: {
          address: `${shippingData.address_line1}, ${shippingData.address_line2 || ''}, ${shippingData.city}, ${shippingData.state} - ${shippingData.postal_code}`,
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.dismiss('checkout');
            toast.error('Payment cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      toast.dismiss('checkout');
      rzp.open();
    } catch (err) {
      console.error('Create payment session error:', err);
      toast.error(
        err.response?.data?.detail || 'Failed to initiate payment session. Please try again.',
        { id: 'checkout' }
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container px-6 md:px-12 py-8 min-h-[80vh] flex flex-col">
      {/* Title */}
      <div className="mb-12 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-[#666666] mb-3">Secure Checkout</p>
        <h1 className="text-3xl font-light tracking-tight">Checkout</h1>
      </div>

      {/* Stepper */}
      <div className="max-w-xl mx-auto w-full mb-16">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-[#E5E5E5] z-0" />
          {STEPS.map((step, idx) => {
            const isCompleted = activeStep > idx;
            const isActive = activeStep === idx;
            return (
              <div key={step} className="flex flex-col items-center z-10 bg-white px-4">
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-colors ${
                    isCompleted
                      ? 'bg-black border-black text-white'
                      : isActive
                      ? 'border-black text-black font-medium'
                      : 'border-[#E5E5E5] text-[#999999]'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : `0${idx + 1}`}
                </div>
                <span
                  className={`text-[10px] tracking-[0.2em] uppercase mt-2 transition-colors ${
                    isActive ? 'text-black font-medium' : 'text-[#999999]'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex justify-center items-start">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Main Form Area */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                /* ── Shipping Details Form ───────────────────────────── */
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-sm tracking-[0.2em] uppercase font-medium border-b border-[#E5E5E5] pb-3 mb-6">
                    Shipping Address
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={shippingData.full_name}
                        onChange={handleShippingChange}
                        placeholder="e.g. Anand Sunil"
                        className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#999999]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingData.phone}
                        onChange={handleShippingChange}
                        placeholder="e.g. +91 9876543210"
                        className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#999999]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">Address Line 1 *</label>
                    <input
                      type="text"
                      name="address_line1"
                      value={shippingData.address_line1}
                      onChange={handleShippingChange}
                      placeholder="Street address, P.O. Box"
                      className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#999999]"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      name="address_line2"
                      value={shippingData.address_line2}
                      onChange={handleShippingChange}
                      placeholder="Apartment, suite, unit, building"
                      className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#999999]"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex flex-col col-span-1">
                      <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingData.city}
                        onChange={handleShippingChange}
                        placeholder="e.g. Bangalore"
                        className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#999999]"
                      />
                    </div>
                    <div className="flex flex-col col-span-1">
                      <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={shippingData.state}
                        onChange={handleShippingChange}
                        placeholder="e.g. Karnataka"
                        className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#999999]"
                      />
                    </div>
                    <div className="flex flex-col col-span-2 md:col-span-1">
                      <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">Postal Code *</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={shippingData.postal_code}
                        onChange={handleShippingChange}
                        placeholder="e.g. 560001"
                        className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[#999999]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5">Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={shippingData.country}
                      onChange={handleShippingChange}
                      className="border border-[#E5E5E5] focus:border-black px-4 py-2.5 text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4 select-none">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                    <label htmlFor="saveAddress" className="text-xs text-[#666666] cursor-pointer">
                      Save shipping details for future purchases
                    </label>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleNextStep}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                    >
                      Continue to Payment <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStep === 1 && (
                /* ── Razorpay Payment Summary ────────────────────────── */
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-sm tracking-[0.2em] uppercase font-medium border-b border-[#E5E5E5] pb-3 mb-6">
                    Review & Pay
                  </h3>

                  <div className="border border-[#E5E5E5] p-5 space-y-4">
                    <div className="border-b border-[#E5E5E5] pb-3">
                      <p className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5 font-semibold">Shipping Destination</p>
                      <p className="text-sm font-medium text-black">{shippingData.full_name}</p>
                      <p className="text-xs text-[#666666] leading-relaxed mt-1">
                        {shippingData.address_line1}
                        {shippingData.address_line2 && `, ${shippingData.address_line2}`}
                        <br />
                        {shippingData.city}, {shippingData.state} - {shippingData.postal_code}
                        <br />
                        {shippingData.country}
                      </p>
                      <p className="text-xs text-[#666666] mt-2">Phone: {shippingData.phone}</p>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-wider uppercase text-[#666666] mb-1.5 font-semibold">Payment Method</p>
                      <div className="flex items-center gap-3 bg-[#F8F8F8] p-3 border border-[#E5E5E5]">
                        <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center text-black flex-shrink-0">
                          <Check size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-black">Razorpay Secure Checkout</p>
                          <p className="text-[10px] text-[#666666]">Cards, UPI, Netbanking, Wallets</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={handleBackStep}
                      disabled={isProcessing}
                      className="border border-black px-6 hover:bg-[#F8F8F8] transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={handlePayNow}
                      disabled={isProcessing}
                      className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? 'Connecting...' : `Pay ₹${totalAmount?.toLocaleString('en-IN')}`}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && createdOrder && (
                /* ── Confirmation / Success Screen ──────────────────── */
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="w-16 h-16 border border-black rounded-full flex items-center justify-center mx-auto mb-8">
                    <Check size={28} />
                  </div>
                  
                  <p className="text-xs tracking-[0.3em] uppercase text-[#666666]">Success</p>
                  <h2 className="text-3xl font-light tracking-tight">Thank you for your order.</h2>
                  
                  <div className="bg-[#F8F8F8] p-6 max-w-md mx-auto border border-[#E5E5E5] text-left space-y-3 mt-8">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#666666] uppercase tracking-wider">Order ID</span>
                      <span className="font-mono text-black font-semibold">{createdOrder.id}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#666666] uppercase tracking-wider">Total Paid</span>
                      <span className="font-medium text-black">₹{createdOrder.total_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#666666] uppercase tracking-wider">Shipping status</span>
                      <span className="text-black uppercase tracking-wider font-semibold text-[10px]">Processing</span>
                    </div>
                    <div className="pt-3 border-t border-[#E5E5E5] text-xs">
                      <p className="font-semibold text-[#666666] uppercase tracking-wider mb-1">Shipping To:</p>
                      <p className="text-[#111111]">{shippingData.full_name}</p>
                      <p className="text-[#666666]">{shippingData.address_line1}, {shippingData.city}, {shippingData.postal_code}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4 pt-12">
                    <Link to="/orders" className="border border-black px-6 py-3 text-xs uppercase tracking-widest text-center hover:bg-[#F8F8F8] transition-colors">
                      View Order History
                    </Link>
                    <Link to="/products" className="btn-primary px-8 py-3 text-xs uppercase tracking-widest text-center">
                      Continue Shopping
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Summary Sidebar (only shown for Steps 1 & 2) */}
          {activeStep < 2 && (
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-[#E5E5E5] p-6">
                <h3 className="text-xs tracking-[0.2em] uppercase font-medium mb-6">Your order</h3>
                
                {/* List items */}
                <div className="divide-y divide-[#E5E5E5] max-h-[300px] overflow-y-auto pr-2 mb-6">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="w-12 h-16 bg-[#F8F8F8] overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate font-normal">{item.name}</p>
                        <p className="text-[10px] text-[#666666] mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-xs font-semibold mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals */}
                <div className="space-y-3 pt-6 border-t border-[#E5E5E5] mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666666]">Subtotal</span>
                    <span>₹{totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666666]">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-semibold pt-4 border-t border-[#E5E5E5]">
                  <span>Total</span>
                  <span>₹{totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Secure note */}
              <div className="flex gap-3 px-4 text-[#999999] text-[10px] items-start">
                <Truck size={14} className="flex-shrink-0 mt-0.5 text-black" />
                <p>Free express shipping in India. Standard delivery times are 2-4 business days.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
