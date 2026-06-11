import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../api/axios';

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await cartAPI.get();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ product_id, quantity = 1 }, { rejectWithValue }) => {
    try {
      const res = await cartAPI.add({ product_id, quantity });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to add to cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await cartAPI.remove(productId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to remove from cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalItems: 0,
    totalAmount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchCart.pending, (state) => { state.loading = true; });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.totalItems = action.payload.total_items;
      state.totalAmount = action.payload.total_amount;
    });
    builder.addCase(fetchCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add
    builder.addCase(addToCart.pending, (state) => { state.loading = true; });
    builder.addCase(addToCart.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.totalItems = action.payload.total_items;
      state.totalAmount = action.payload.total_amount;
    });
    builder.addCase(addToCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Remove
    builder.addCase(removeFromCart.pending, (state) => { state.loading = true; });
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.totalItems = action.payload.total_items;
      state.totalAmount = action.payload.total_amount;
    });
    builder.addCase(removeFromCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
