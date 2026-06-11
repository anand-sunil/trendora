import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { registerUser, clearError } from '../store/authSlice';
import toast from 'react-hot-toast';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const { register: reg, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created');
      navigate('/');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-[#666666] mb-3">Join Trendora</p>
          <h1 className="text-3xl font-light tracking-tight">Create Account</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-2">Full Name</label>
            <input
              type="text"
              {...reg('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Minimum 2 characters' },
              })}
              className="input-field"
              placeholder="Your full name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-2">Email</label>
            <input
              type="email"
              {...reg('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
              className="input-field"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-[#666666] mb-2">Password</label>
            <input
              type="password"
              {...reg('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
              className="input-field"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#666666] mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-black underline underline-offset-4 hover:opacity-70 transition-opacity">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
