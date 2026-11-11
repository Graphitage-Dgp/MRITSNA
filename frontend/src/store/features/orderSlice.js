import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userAxios } from "../../configs/axiosInstance";

// --- ASYNC THUNKS ---

// Fetch Order History (For Logged-in Users)
export const fetchUserOrderHistory = createAsyncThunk(
  "userOrders/fetchHistory",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await userAxios.get("/orders/history", {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order history."
      );
    }
  }
);

// Fetch Specific Order Details (For Logged-in Users)
export const fetchUserOrderDetails = createAsyncThunk(
  "userOrders/fetchDetails",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await userAxios.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order details."
      );
    }
  }
);

// Universal Public Tracking (For Guests or Logged-out Users)
export const trackPublicOrder = createAsyncThunk(
  "userOrders/trackPublic",
  async ({ orderNumber, email }, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/orders/track-guest", {
        orderNumber,
        email
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not find an order matching those details."
      );
    }
  }
);

// --- INITIAL STATE ---
const initialState = {
  orderHistory: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  },
  
  // Holds the data for the tracking/details page
  currentTrackedOrder: null, 
  liveTrackingData: null,
  
  // Loading States
  historyLoading: false,
  trackingLoading: false,
  
  // Error States
  error: null,
};

// --- SLICE CONFIGURATION ---
const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearTrackedOrder: (state) => {
      state.currentTrackedOrder = null;
      state.liveTrackingData = null;
      state.error = null;
    },
    clearOrderErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch History ---
      .addCase(fetchUserOrderHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(fetchUserOrderHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.orderHistory = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserOrderHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })

      // --- Fetch User Details ---
      .addCase(fetchUserOrderDetails.pending, (state) => {
        state.trackingLoading = true;
        state.error = null;
      })
      .addCase(fetchUserOrderDetails.fulfilled, (state, action) => {
        state.trackingLoading = false;
        state.currentTrackedOrder = action.payload.data;
        state.liveTrackingData = action.payload.liveTracking;
      })
      .addCase(fetchUserOrderDetails.rejected, (state, action) => {
        state.trackingLoading = false;
        state.error = action.payload;
      })

      // --- Track Public Order ---
      .addCase(trackPublicOrder.pending, (state) => {
        state.trackingLoading = true;
        state.error = null;
      })
      .addCase(trackPublicOrder.fulfilled, (state, action) => {
        state.trackingLoading = false;
        state.currentTrackedOrder = action.payload.data;
        state.liveTrackingData = action.payload.liveTracking;
      })
      .addCase(trackPublicOrder.rejected, (state, action) => {
        state.trackingLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTrackedOrder, clearOrderErrors } = orderSlice.actions;
export default orderSlice.reducer;