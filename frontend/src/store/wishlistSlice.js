import { createSlice } from '@reduxjs/toolkit';

const saved = localStorage.getItem('trendora_wishlist');

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: saved ? JSON.parse(saved) : [],
  },
  reducers: {
    addToWishlist: (state, action) => {
      const exists = state.items.find((i) => i.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
        localStorage.setItem('trendora_wishlist', JSON.stringify(state.items));
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      localStorage.setItem('trendora_wishlist', JSON.stringify(state.items));
    },
    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('trendora_wishlist');
    },
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
