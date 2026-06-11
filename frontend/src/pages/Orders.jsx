import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CreditCard } from 'lucide-react';
import { ordersAPI } from '../api/axios';
import { InlineLoading } from '../components/Loading';

const STATUS_STYLES = {
  processing: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.myOrders()
      .then((res) => setOrders(res.data.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <InlineLoading />;

  return (
    <div className="page-container px-6 md:px-12 py-8 min-h-[60vh]">
      <div className="mb-8">
        <p className="section-title">Account</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Package size={40} className="mx-auto text-[#E5E5E5] mb-4" />
          <p className="text-[#666666]">No orders yet</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-[#E5E5E5] p-5 md:p-6"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E5E5E5]">
                <div>
                  <p className="text-xs text-[#999999]">Order #{order.id?.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-[#666666] mt-1 flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase ${STATUS_STYLES[order.order_status] || 'bg-gray-50 text-gray-700'}`}>
                    {order.order_status}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase flex items-center gap-1 ${STATUS_STYLES[order.payment_status] || 'bg-gray-50 text-gray-700'}`}>
                    <CreditCard size={10} />
                    {order.payment_status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {order.products?.map((item, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-12 h-14 bg-[#F8F8F8] flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image || `https://placehold.co/48x56/F8F8F8/666666?text=•`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.name}</p>
                      <p className="text-xs text-[#666666]">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-end pt-3 border-t border-[#E5E5E5]">
                <p className="text-sm">
                  <span className="text-[#666666]">Total: </span>
                  <span className="font-medium">₹{order.total_amount?.toLocaleString('en-IN')}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
