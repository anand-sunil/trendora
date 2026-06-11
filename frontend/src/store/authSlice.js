import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api/axios';

// ── Thunks ──────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(data);
      const { access_token, user } = res.data.data;
      localStorage.setItem('trendora_token', access_token);
      localStorage.setItem('trendora_user', JSON.stringify(user));
      return { token: access_token, user };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(data);
      const { access_token, user } = res.data.data;
      localStorage.setItem('trendora_token', access_token);
      localStorage.setItem('trendora_user', JSON.stringify(user));
      return { token: access_token, user };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.me();
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch user');
    }
  }
);

// ── Slice ───────────────────────────────────────────────────

const savedUser = localStorage.getItem('trendora_user');
const savedToken = localStorage.getItem('trendora_token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('trendora_token');
      localStorage.removeItem('trendora_user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch me
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.user = action.payload;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
