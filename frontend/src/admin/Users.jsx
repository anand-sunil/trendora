import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../api/axios';
import { InlineLoading } from '../components/Loading';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    adminAPI.getUsers({ limit: 50 })
      .then((res) => {
        setUsers(res.data.data.users);
        setTotal(res.data.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <InlineLoading />;

  return (
    <div>
      <div className="mb-8">
        <p className="section-title">Manage</p>
        <h1 className="text-3xl font-light tracking-tight">Users</h1>
        <p className="text-sm text-[#666666] mt-1">{total} total</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E5]">
              {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                <th key={h} className="text-left py-3 text-[11px] tracking-[0.15em] uppercase text-[#666666] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#E5E5E5] hover:bg-[#F8F8F8] transition-colors">
                <td className="py-3 pr-4">{user.name}</td>
                <td className="py-3 pr-4 text-[#666666]">{user.email}</td>
                <td className="py-3 pr-4">
                  <span className={`text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 ${
                    user.role === 'admin' ? 'bg-black text-white' : 'bg-[#F8F8F8] text-[#666666]'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 text-[#666666]">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-center text-[#666666] py-12">No users found</p>
      )}
    </div>
  );
}
