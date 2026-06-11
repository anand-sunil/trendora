import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react';
import { adminAPI, productsAPI } from '../api/axios';
import { InlineLoading } from '../components/Loading';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getSales().catch(() => ({ data: { data: {} } })),
      productsAPI.list({ limit: 1 }).catch(() => ({ data: { data: { total: 0 } } })),
      adminAPI.getUsers({ limit: 1 }).catch(() => ({ data: { data: { total: 0 } } })),
    ]).then(([salesRes, prodRes, userRes]) => {
      setStats(salesRes.data.data);
      setProductCount(prodRes.data.data.total || 0);
      setUserCount(userRes.data.data.total || 0);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <InlineLoading />;

  const cards = [
    { label: 'Total Products', value: productCount, icon: <ShoppingBag size={20} /> },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: <Package size={20} /> },
    { label: 'Total Users', value: userCount, icon: <Users size={20} /> },
    { label: 'Revenue', value: `₹${(stats?.total_revenue || 0).toLocaleString('en-IN')}`, icon: <DollarSign size={20} /> },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">Overview</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-[#E5E5E5] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#999999]">{card.icon}</span>
              <TrendingUp size={14} className="text-green-500" />
            </div>
            <p className="text-2xl font-light tracking-tight">{card.value}</p>
            <p className="text-xs text-[#666666] mt-1 tracking-wide">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Order Status Breakdown */}
      {stats?.orders_by_status && Object.keys(stats.orders_by_status).length > 0 && (
        <div className="border border-[#E5E5E5] p-6 mb-8">
          <h3 className="text-xs tracking-[0.2em] uppercase font-medium mb-6">Orders by Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.orders_by_status).map(([status, count]) => (
              <div key={status} className="text-center py-4 bg-[#F8F8F8]">
                <p className="text-xl font-light">{count}</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#666666] mt-1">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Order */}
      {stats?.avg_order_value > 0 && (
        <div className="border border-[#E5E5E5] p-6">
          <h3 className="text-xs tracking-[0.2em] uppercase font-medium mb-2">Average Order Value</h3>
          <p className="text-3xl font-light">₹{stats.avg_order_value.toLocaleString('en-IN')}</p>
        </div>
      )}
    </div>
  );
}
