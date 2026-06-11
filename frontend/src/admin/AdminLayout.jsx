import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Users } from 'lucide-react';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} />, end: true },
  { to: '/admin/products', label: 'Products', icon: <ShoppingBag size={16} /> },
  { to: '/admin/orders', label: 'Orders', icon: <Package size={16} /> },
  { to: '/admin/users', label: 'Users', icon: <Users size={16} /> },
];

export default function AdminLayout() {
  return (
    <div className="page-container px-6 md:px-12 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2.5 text-xs tracking-[0.1em] uppercase transition-colors whitespace-nowrap ${
                    isActive ? 'bg-black text-white' : 'text-[#666666] hover:text-black hover:bg-[#F8F8F8]'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
