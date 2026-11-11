import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAxios from '../../configs/axiosInstance';

// ==========================================
// ASYNC THUNKS (ADMIN API CALLS)
// ==========================================

// Fetch Dashboard Metrics
export const fetchCouponStats = createAsyncThunk(
  'adminCoupon/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get('/coupons/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupon statistics');
    }
  }
);

// Fetch Paginated Coupons Table (With Filters & Search)
export const fetchCoupons = createAsyncThunk(
  'adminCoupon/fetchCoupons',
  async ({ page = 1, limit = 15, filter = 'all', search = '' }, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get(`/coupons?page=${page}&limit=${limit}&filter=${filter}&search=${search}`);
      return response.data; // Returns { data, pagination }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
    }
  }
);

// Fetch Specific Coupon Deep-Dive Details
export const fetchCouponDetails = createAsyncThunk(
  'adminCoupon/fetchCouponDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get(`/coupons/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupon details');
    }
  }
);

// Create New Coupon
export const createCoupon = createAsyncThunk(
  'adminCoupon/createCoupon',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await adminAxios.post('/coupons', payload);
      
      // Auto-refresh the dashboard data
      dispatch(fetchCoupons({ page: 1, limit: 15, filter: 'all', search: '' }));
      dispatch(fetchCouponStats());
      
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
    }
  }
);

// Update Existing Coupon
export const updateCoupon = createAsyncThunk(
  'adminCoupon/updateCoupon',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const response = await adminAxios.put(`/coupons/${id}`, payload);
      
      // Auto-refresh lists and currently viewed details
      dispatch(fetchCoupons({ page: 1, limit: 15, filter: 'all', search: '' }));
      dispatch(fetchCouponDetails(id));
      
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update coupon');
    }
  }
);

// Toggle Status (Kill Switch)
export const toggleCouponStatus = createAsyncThunk(
  'adminCoupon/toggleStatus',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await adminAxios.patch(`/coupons/${id}/toggle`);
      
      dispatch(fetchCoupons({ page: 1, limit: 15, filter: 'all', search: '' }));
      dispatch(fetchCouponStats());
      
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle coupon status');
    }
  }
);

// Permanent Delete
export const deleteCoupon = createAsyncThunk(
  'adminCoupon/deleteCoupon',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await adminAxios.delete(`/coupons/${id}`);
      
      dispatch(fetchCoupons({ page: 1, limit: 15, filter: 'all', search: '' }));
      dispatch(fetchCouponStats());
      
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
    }
  }
);


// ==========================================
// REDUX SLICE
// ==========================================

const initialState = {
  // Dashboard Stats
  stats: {
    totalActive: 0,
    totalExpired: 0,
    totalGlobalUses: 0,
    topCoupons: []
  },
  
  // Table Data
  couponsList: [],
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15
  },

  // Details Data (For edit form or deep dive)
  currentCouponDetails: null,

  // UI State
  isLoading: false,
  isDetailsLoading: false,
  isActionLoading: false, // For Create, Update, Toggle, Delete
  isError: false,
  message: '',
};

const adminCouponSlice = createSlice({
  name: 'adminCoupon',
  initialState,
  reducers: {
    clearCurrentCouponDetails: (state) => {
      state.currentCouponDetails = null;
    },
    clearAdminCouponErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Stats ---
      .addCase(fetchCouponStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCouponStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCouponStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Coupons (Table) ---
      .addCase(fetchCoupons.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.couponsList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Coupon Details ---
      .addCase(fetchCouponDetails.pending, (state) => {
        state.isDetailsLoading = true;
      })
      .addCase(fetchCouponDetails.fulfilled, (state, action) => {
        state.isDetailsLoading = false;
        state.currentCouponDetails = action.payload;
      })
      .addCase(fetchCouponDetails.rejected, (state, action) => {
        state.isDetailsLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Create Coupon ---
      .addCase(createCoupon.pending, (state) => {
        state.isActionLoading = true;
        state.isError = false;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.message = action.payload;
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Update Coupon ---
      .addCase(updateCoupon.pending, (state) => {
        state.isActionLoading = true;
        state.isError = false;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.message = action.payload;
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Toggle Status ---
      .addCase(toggleCouponStatus.pending, (state) => {
        state.isActionLoading = true;
        state.isError = false;
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.message = action.payload;
      })
      .addCase(toggleCouponStatus.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Delete Coupon ---
      .addCase(deleteCoupon.pending, (state) => {
        state.isActionLoading = true;
        state.isError = false;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.message = action.payload;
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { clearCurrentCouponDetails, clearAdminCouponErrors } = adminCouponSlice.actions;

export default adminCouponSlice.reducer;