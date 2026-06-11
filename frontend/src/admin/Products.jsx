import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { productsAPI, adminAPI } from '../api/axios';
import { useForm } from 'react-hook-form';
import { InlineLoading } from '../components/Loading';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const load = () => {
    setLoading(true);
    productsAPI.list({ page, limit: 10 })
      .then((res) => {
        setProducts(res.data.data.products);
        setTotal(res.data.data.total);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', price: '', category: '', subcategory: '', brand: '', stock: '', colors: '', sizes: '', images: '' });
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    reset({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      stock: product.stock,
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
      images: product.images?.join('\n') || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      price: Number(data.price),
      stock: Number(data.stock) || 0,
      colors: data.colors ? data.colors.split(',').map((s) => s.trim()).filter(Boolean) : [],
      sizes: data.sizes ? data.sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
      images: data.images ? data.images.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    };

    try {
      if (editing) {
        await adminAPI.updateProduct(editing.id, payload);
        toast.success('Product updated');
      } else {
        await adminAPI.createProduct(payload);
        toast.success('Product created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-title">Manage</p>
          <h1 className="text-3xl font-light tracking-tight">Products</h1>
          <p className="text-sm text-[#666666] mt-1">{total} total</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4"
          onClick={() => setShowForm(false)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Name *</label>
                <input {...register('name', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Description</label>
                <textarea {...register('description')} className="input-field h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Price *</label>
                  <input type="number" {...register('price', { required: true })} className="input-field" />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Stock</label>
                  <input type="number" {...register('stock')} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Category *</label>
                  <input {...register('category', { required: true })} className="input-field" />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Subcategory</label>
                  <input {...register('subcategory')} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Brand</label>
                <input {...register('brand')} className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Colors (comma separated)</label>
                <input {...register('colors')} className="input-field" placeholder="Black, White, Blue" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Sizes (comma separated)</label>
                <input {...register('sizes')} className="input-field" placeholder="S, M, L, XL" />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-1">Images (one URL per line, optionally add |color)</label>
                <textarea {...register('images')} className="input-field h-24 resize-y font-mono text-xs" placeholder="https://example.com/black.jpg | Black&#10;https://example.com/white.jpg | White" />
              </div>
              <button type="submit" className="btn-primary w-full">
                {editing ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Table */}
      {loading ? <InlineLoading /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                {['Name', 'Category', 'Price', 'Stock', 'Brand', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 text-[11px] tracking-[0.15em] uppercase text-[#666666] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[#E5E5E5] hover:bg-[#F8F8F8] transition-colors">
                  <td className="py-3 pr-4 max-w-[200px] truncate">{p.name}</td>
                  <td className="py-3 pr-4 text-[#666666]">{p.category}</td>
                  <td className="py-3 pr-4">₹{p.price?.toLocaleString('en-IN')}</td>
                  <td className="py-3 pr-4">{p.stock}</td>
                  <td className="py-3 pr-4 text-[#666666]">{p.brand || '—'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-[#E5E5E5] transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
