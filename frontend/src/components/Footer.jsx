import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5]">
      <div className="page-container section-padding">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="text-lg tracking-[0.3em] uppercase font-semibold mb-4">Trendora</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              AI-powered fashion discovery. Timeless style meets modern technology.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase font-medium mb-4">Shop</h3>
            <ul className="space-y-2">
              {['New Arrivals', 'Shirts', 'Dresses', 'Accessories'].map((item) => (
                <li key={item}>
                  <Link to="/products" className="text-sm text-[#666666] hover:text-black transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              {['About', 'Careers', 'Press', 'Sustainability'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-[#666666] hover:text-black transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase font-medium mb-4">Help</h3>
            <ul className="space-y-2">
              {['Contact', 'Shipping', 'Returns', 'FAQ'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-[#666666] hover:text-black transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#E5E5E5] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#666666] tracking-wide">
            © {new Date().getFullYear()} Trendora. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <span key={item} className="text-xs text-[#666666] hover:text-black transition-colors cursor-pointer tracking-wide">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
