import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAxios from '../../configs/axiosInstance'; 

// ==========================================
// ASYNC THUNKS (ADMIN API CALLS)
// ==========================================

// Fetch Dashboard Metrics (Demand Forecasting)
export const fetchWishlistStats = createAsyncThunk(
  'adminWishlist/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get('/wishlists/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist statistics');
    }
  }
);

// Fetch Paginated Wishlists Table (With Region Filter)
export const fetchActiveWishlists = createAsyncThunk(
  'adminWishlist/fetchActiveWishlists',
  async ({ page = 1, limit = 15, region = 'global' }, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get(`/wishlists?page=${page}&limit=${limit}&region=${region}`);
      return response.data; // Returns { data, pagination }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active wishlists');
    }
  }
);

// Fetch Specific Wishlist Deep-Dive
export const fetchWishlistDetails = createAsyncThunk(
  'adminWishlist/fetchWishlistDetails',
  async (wishlistId, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get(`/wishlists/${wishlistId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist details');
    }
  }
);

// ==========================================
// REDUX SLICE
// ==========================================

const initialState = {
  // Dashboard Stats
  stats: {
    totalActiveWishlists: 0,
    averageItemsPerWishlist: 0,
    topWishlistedProducts: []
  },
  
  // Table Data
  wishlistsList: [],
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15
  },

  // Deep-Dive Drawer Data
  currentWishlistDetails: null,

  // UI State
  isLoading: false,
  isDetailsLoading: false,
  isError: false,
  message: '',
};

const adminWishlistSlice = createSlice({
  name: 'adminWishlist',
  initialState,
  reducers: {
    // Clear the deep-dive state when the admin closes the drawer/modal
    clearCurrentWishlistDetails: (state) => {
      state.currentWishlistDetails = null;
    },
    clearAdminWishlistErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Stats ---
      .addCase(fetchWishlistStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWishlistStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchWishlistStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Active Wishlists (Table) ---
      .addCase(fetchActiveWishlists.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveWishlists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wishlistsList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActiveWishlists.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Wishlist Details (Drawer) ---
      .addCase(fetchWishlistDetails.pending, (state) => {
        state.isDetailsLoading = true;
      })
      .addCase(fetchWishlistDetails.fulfilled, (state, action) => {
        state.isDetailsLoading = false;
        state.currentWishlistDetails = action.payload;
      })
      .addCase(fetchWishlistDetails.rejected, (state, action) => {
        state.isDetailsLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { clearCurrentWishlistDetails, clearAdminWishlistErrors } = adminWishlistSlice.actions;

export default adminWishlistSlice.reducer;