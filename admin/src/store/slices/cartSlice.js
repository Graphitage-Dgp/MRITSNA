import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAxios from '../../configs/axiosInstance'; 

// ==========================================
// ASYNC THUNKS (ADMIN API CALLS)
// ==========================================

// 1. Fetch Dashboard Metrics
export const fetchCartStats = createAsyncThunk(
  'adminCart/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get('/carts/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart statistics');
    }
  }
);

// 2. Fetch Paginated Carts Table (NOW WITH REGION FILTER)
export const fetchActiveCarts = createAsyncThunk(
  'adminCart/fetchActiveCarts',
  async ({ page = 1, limit = 15, filter = 'all', region = 'global' }, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get(`/carts?page=${page}&limit=${limit}&filter=${filter}&region=${region}`);
      return response.data; // Returns { data, pagination }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active carts');
    }
  }
);

// 3. Fetch Specific Cart Deep-Dive
export const fetchCartDetails = createAsyncThunk(
  'adminCart/fetchCartDetails',
  async (cartId, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get(`/carts/${cartId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart details');
    }
  }
);

// 4. Admin Override: Clear Cart
export const adminClearCart = createAsyncThunk(
  'adminCart/adminClearCart',
  async (cartId, { dispatch, rejectWithValue }) => {
    try {
      const response = await adminAxios.delete(`/carts/${cartId}/clear`);
      
      // Refresh the details and the table after clearing
      dispatch(fetchCartDetails(cartId));
      dispatch(fetchActiveCarts({ page: 1, limit: 15, filter: 'all', region: 'global' }));
      dispatch(fetchCartStats());
      
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

// 5. Trigger Abandoned Cart Reminder
export const triggerCartReminder = createAsyncThunk(
  'adminCart/triggerCartReminder',
  async (cartId, { rejectWithValue }) => {
    try {
      const response = await adminAxios.post(`/carts/${cartId}/remind`);
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reminder');
    }
  }
);

// ==========================================
// REDUX SLICE
// ==========================================

const initialState = {
  // Dashboard Stats
  stats: {
    totalActiveCarts: 0,
    abandonedCartsCount: 0,
    totalPipelineValue: 0,
    averageCartValue: 0,
    topCartedProducts: []
  },
  
  // Table Data
  cartsList: [],
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15
  },

  // Deep-Dive Drawer Data
  currentCartDetails: null,

  // UI State
  isLoading: false,
  isDetailsLoading: false,
  isActionLoading: false, 
  isError: false,
  message: '',
};

const adminCartSlice = createSlice({
  name: 'adminCart',
  initialState,
  reducers: {
    // Clear the deep-dive state when the admin closes the drawer/modal
    clearCurrentCartDetails: (state) => {
      state.currentCartDetails = null;
    },
    clearAdminCartErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Stats ---
      .addCase(fetchCartStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCartStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCartStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Active Carts (Table) ---
      .addCase(fetchActiveCarts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveCarts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartsList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActiveCarts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Cart Details (Drawer) ---
      .addCase(fetchCartDetails.pending, (state) => {
        state.isDetailsLoading = true;
      })
      .addCase(fetchCartDetails.fulfilled, (state, action) => {
        state.isDetailsLoading = false;
        state.currentCartDetails = action.payload;
      })
      .addCase(fetchCartDetails.rejected, (state, action) => {
        state.isDetailsLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Admin Clear Cart ---
      .addCase(adminClearCart.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(adminClearCart.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.message = action.payload; 
      })
      .addCase(adminClearCart.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Trigger Reminder ---
      .addCase(triggerCartReminder.pending, (state) => {
        state.isActionLoading = true;
      })
      .addCase(triggerCartReminder.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.message = action.payload; 
      })
      .addCase(triggerCartReminder.rejected, (state, action) => {
        state.isActionLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { clearCurrentCartDetails, clearAdminCartErrors } = adminCartSlice.actions;

export default adminCartSlice.reducer;