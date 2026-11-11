import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

// ==========================================
// LOCAL STORAGE HELPERS (DUMB GUEST WISHLIST + LEGACY MIGRATION)
// ==========================================
const loadGuestWishlistIds = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('guest_wishlist_ids') || localStorage.getItem('guest_wishlist');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error("Failed to parse guest wishlist IDs:", error);
    return [];
  }
};

const saveGuestWishlistIds = (items) => {
  if (typeof window !== 'undefined') {
    const dumbList = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId
    }));
    localStorage.setItem('guest_wishlist_ids', JSON.stringify(dumbList));
  }
};

// ==========================================
// ASYNC THUNKS (API CALLS)
// ==========================================

export const fetchUserWishlist = createAsyncThunk(
  'wishlist/fetchUserWishlist',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/wishlist');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// Hydrate & Persist Guest Wishlist to MongoDB
// Always calls /wishlist/hydrate (even when localItems is empty) so removing the last item updates MongoDB
export const hydrateGuestWishlistAPI = createAsyncThunk(
  'wishlist/hydrateGuestWishlistAPI',
  async (_, thunkAPI) => {
    try {
      const localItems = loadGuestWishlistIds();
      const response = await userAxios.post('/wishlist/hydrate', { localItems });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to hydrate guest wishlist');
    }
  }
);

export const toggleWishlistDB = createAsyncThunk(
  'wishlist/toggleWishlistDB',
  async ({ productId, variantId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await userAxios.post('/wishlist/toggle', { productId, variantId });
      dispatch(fetchUserWishlist()); 
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update wishlist');
    }
  }
);

export const syncGuestWishlistToDB = createAsyncThunk(
  'wishlist/syncGuestWishlistToDB',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const localItems = loadGuestWishlistIds();
      
      // Always hit /wishlist/sync on login/verify so any shadow guest wishlist in DB for this device_id is cleaned up
      await userAxios.post('/wishlist/sync', { localItems });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guest_wishlist_ids');
        localStorage.removeItem('guest_wishlist');
      }
      dispatch({ type: 'wishlist/clearLocalWishlist' });
      
      dispatch(fetchUserWishlist());
      return true;
    } catch (error) {
      console.error("WISHLIST SYNC FAILED:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to sync wishlist');
    }
  }
);

// ==========================================
// REDUX SLICE
// ==========================================

const initialState = {
  items: [],
  isLoading: false,
  isError: false,
  message: '',
  currencySymbol: '₹',
  currencyCode: 'INR',
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleLocalItem: (state, action) => {
      const newItem = action.payload; 
      
      const existingIndex = state.items.findIndex(
        item => item.productId === newItem.productId && item.variantId === newItem.variantId
      );

      if (existingIndex > -1) {
        state.items.splice(existingIndex, 1);
      } else {
        state.items.unshift(newItem);
      }

      saveGuestWishlistIds(state.items);
    },

    clearLocalWishlist: (state) => {
      state.items = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guest_wishlist_ids');
        localStorage.removeItem('guest_wishlist');
      }
    },

    clearWishlistErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  
  extraReducers: (builder) => {
    const handleWishlistFulfilled = (state, action) => {
      state.isLoading = false;
      const payloadData = action.payload?.data || action.payload || {};
      
      state.items = payloadData.items || [];
      
      if (action.payload?.currencySymbol || payloadData.currencySymbol) {
        state.currencySymbol = action.payload?.currencySymbol || payloadData.currencySymbol;
      }
      if (action.payload?.currencyCode || payloadData.currencyCode) {
        state.currencyCode = action.payload?.currencyCode || payloadData.currencyCode;
      }
    };

    builder
      .addCase(fetchUserWishlist.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchUserWishlist.fulfilled, handleWishlistFulfilled)
      .addCase(fetchUserWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(hydrateGuestWishlistAPI.pending, (state) => { state.isLoading = true; })
      .addCase(hydrateGuestWishlistAPI.fulfilled, handleWishlistFulfilled)
      .addCase(hydrateGuestWishlistAPI.rejected, (state, action) => {
        state.isLoading = false;
        console.error("Wishlist hydration failed:", action.payload); 
      })

      .addCase(toggleWishlistDB.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(toggleWishlistDB.fulfilled, (state) => { state.isLoading = false; })
      .addCase(toggleWishlistDB.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      .addCase(syncGuestWishlistToDB.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { 
  toggleLocalItem, 
  clearLocalWishlist, 
  clearWishlistErrors 
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
