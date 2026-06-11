import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, User, Menu, X, Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { logout } from '../store/authSlice';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  const wishlistCount = useSelector((state) => state.wishlist.items.length);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setMobileOpen(false);
  };

  const navLinks = [
    { to: '/products', label: 'Shop' },
    { to: '/ai-stylist', label: 'AI Stylist', icon: <Sparkles size={14} /> },
  ];

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5]"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="page-container flex items-center justify-between h-16 px-6 md:px-12">
          {/* Left nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-[#666666] hover:text-black transition-colors duration-300"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-lg md:text-xl tracking-[0.3em] uppercase font-semibold">
              Trendora
            </h1>
          </Link>

          {/* Right icons */}
          <div className="hidden md:flex items-center gap-5">
            {user && user.role === 'admin' && (
              <Link to="/admin" className="text-[#666666] hover:text-black transition-colors" title="Admin">
                <LayoutDashboard size={18} />
              </Link>
            )}
            <Link to="/wishlist" className="relative text-[#666666] hover:text-black transition-colors" title="Wishlist">
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative text-[#666666] hover:text-black transition-colors" title="Cart">
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/orders" className="text-xs tracking-[0.1em] uppercase text-[#666666] hover:text-black transition-colors">
                  Orders
                </Link>
                <button onClick={handleLogout} className="text-[#666666] hover:text-black transition-colors" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-[#666666] hover:text-black transition-colors" title="Login">
                <User size={18} />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-black z-60"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-white flex flex-col pt-20 px-6"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-2xl font-light tracking-wide"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="text-2xl font-light tracking-wide">
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-2xl font-light tracking-wide">
                Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
              {user ? (
                <>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-2xl font-light tracking-wide">
                    Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-2xl font-light tracking-wide">
                      Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-2xl font-light tracking-wide text-left text-[#666666]">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-2xl font-light tracking-wide">
                  Login
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
