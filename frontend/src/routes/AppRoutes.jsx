import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loading from '../components/Loading';
import ProtectedRoute from '../components/ProtectedRoute';

// ── Lazy-loaded pages ───────────────────────────────────────
const Home = lazy(() => import('../pages/Home'));
const Products = lazy(() => import('../pages/Products'));
const ProductDetails = lazy(() => import('../pages/ProductDetails'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Cart = lazy(() => import('../pages/Cart'));
const Wishlist = lazy(() => import('../pages/Wishlist'));
const Orders = lazy(() => import('../pages/Orders'));
const AIStylist = lazy(() => import('../pages/AIStylist'));
const Checkout = lazy(() => import('../pages/Checkout'));

// Admin
const AdminLayout = lazy(() => import('../admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../admin/Dashboard'));
const AdminProducts = lazy(() => import('../admin/Products'));
const AdminOrders = lazy(() => import('../admin/Orders'));
const AdminUsers = lazy(() => import('../admin/Users'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ai-stylist" element={<AIStylist />} />

        {/* Protected */}
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <h1 className="text-6xl font-light mb-4">404</h1>
            <p className="text-[#666666] text-sm">Page not found</p>
          </div>
        } />
      </Routes>
    </Suspense>
  );
}
