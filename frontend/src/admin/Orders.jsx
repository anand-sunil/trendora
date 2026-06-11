import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CreditCard } from 'lucide-react';
import { adminAPI } from '../api/axios';
import { InlineLoading } from '../components/Loading';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    adminAPI.getOrders({ page, limit: 15 })
      .then((res) => {
        setOrders(res.data.data.orders);
        setTotal(res.data.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <InlineLoading />;

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">Manage</p>
        <h1 className="text-3xl font-light tracking-tight">Orders</h1>
        <p className="text-sm text-[#666666] mt-1">{total} total</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E5]">
              {['Order ID', 'Date', 'Items', 'Total', 'Payment', 'Status'].map((h) => (
                <th key={h} className="text-left py-3 text-[11px] tracking-[0.15em] uppercase text-[#666666] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-[#E5E5E5] hover:bg-[#F8F8F8] transition-colors">
                <td className="py-3 pr-4 text-xs font-mono">{order.id?.slice(-8).toUpperCase()}</td>
                <td className="py-3 pr-4 text-[#666666]">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="py-3 pr-4">{order.products?.length || 0}</td>
                <td className="py-3 pr-4 font-medium">₹{order.total_amount?.toLocaleString('en-IN')}</td>
                <td className="py-3 pr-4">
                  <span className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 ${
                    order.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 ${
                    order.order_status === 'delivered' ? 'bg-green-50 text-green-700'
                    : order.order_status === 'cancelled' ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
                  }`}>
                    {order.order_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <p className="text-center text-[#666666] py-12">No orders found</p>
      )}
    </div>
  );
}
