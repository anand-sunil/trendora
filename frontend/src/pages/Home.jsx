import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Truck, Shield, RefreshCcw } from 'lucide-react';
import { productsAPI } from '../api/axios';
import ProductCard from '../components/ProductCard';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] },
  }),
};

const CATEGORIES = [
  { name: 'Shirts', image: 'https://placehold.co/400x520/F8F8F8/111111?text=Shirts' },
  { name: 'Dresses', image: 'https://placehold.co/400x520/F8F8F8/111111?text=Dresses' },
  { name: 'Jeans', image: 'https://placehold.co/400x520/F8F8F8/111111?text=Jeans' },
  { name: 'Jackets', image: 'https://placehold.co/400x520/F8F8F8/111111?text=Jackets' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    productsAPI.list({ limit: 4, sort: '-rating' })
      .then((res) => setFeatured(res.data.data.products))
      .catch(() => {});
    productsAPI.list({ limit: 4, sort: '-created_at' })
      .then((res) => setTrending(res.data.data.products))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="min-h-[90vh] flex items-center justify-center px-6">
        <div className="text-center max-w-4xl">
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="text-xs tracking-[0.4em] uppercase text-[#666666] mb-8"
          >
            AI-Powered Fashion
          </motion.p>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="heading-editorial mb-8"
          >
            DISCOVER<br />TIMELESS<br />STYLE
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-[#666666] text-base md:text-lg max-w-lg mx-auto mb-12 font-light"
          >
            AI-powered fashion discovery tailored to your unique preferences.
          </motion.p>
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/products" className="btn-primary">
              Explore Collection
            </Link>
            <Link to="/ai-stylist" className="btn-outline flex items-center gap-2">
              <Sparkles size={14} />
              Try AI Stylist
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Featured Products ─────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="section-padding">
          <div className="page-container">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="section-title">Curated Selection</p>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight">Featured</h2>
              </div>
              <Link to="/products" className="btn-ghost flex items-center gap-2">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Categories ─────────────────────────────────────────── */}
      <section className="section-padding bg-[#F8F8F8]">
        <div className="page-container">
          <div className="text-center mb-12">
            <p className="section-title">Browse By</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/products?category=${cat.name.toLowerCase()}`} className="group block">
                  <div className="aspect-[3/4] bg-[#EEEEEE] overflow-hidden mb-3">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-sm tracking-[0.1em] uppercase text-center">{cat.name}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trending ─────────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="section-padding">
          <div className="page-container">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="section-title">New In</p>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight">Trending Now</h2>
              </div>
              <Link to="/products" className="btn-ghost flex items-center gap-2">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {trending.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Why Trendora ──────────────────────────────────────── */}
      <section className="section-padding border-t border-[#E5E5E5]">
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="section-title">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">The Trendora Difference</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            {[
              { icon: <Sparkles size={24} />, title: 'AI Styling', desc: 'Personal AI stylist that understands your taste' },
              { icon: <Truck size={24} />, title: 'Free Shipping', desc: 'Complimentary shipping on all orders' },
              { icon: <Shield size={24} />, title: 'Secure Payment', desc: 'Your transactions are always protected' },
              { icon: <RefreshCcw size={24} />, title: 'Easy Returns', desc: '30-day hassle-free return policy' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">{item.icon}</div>
                <h3 className="text-sm tracking-[0.1em] uppercase font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-[#666666] font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Newsletter ─────────────────────────────────────────── */}
      <section className="section-padding bg-black text-white">
        <div className="page-container text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs tracking-[0.3em] uppercase text-[#999999] mb-6">Stay Updated</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Join the Movement</h2>
            <p className="text-sm text-[#999999] mb-10 font-light">
              Subscribe for early access to new collections and exclusive offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 border border-[#333333] bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#666666] focus:outline-none focus:border-white transition-colors"
              />
              <button className="bg-white text-black px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#E5E5E5] transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
