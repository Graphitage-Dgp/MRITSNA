import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../configs/axiosInstance";

// --- Async Thunks ---

// 1. Fetch All Orders (Paginated & Filtered)
export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetchAll",
  async ({ page = 1, limit = 10, search, currency, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/orders", {
        params: { page, limit, search, currency, startDate, endDate },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders."
      );
    }
  }
);

// 2. Fetch Single Order by ID
export const fetchAdminOrderById = createAsyncThunk(
  "adminOrders/fetchById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order details."
      );
    }
  }
);

// 3. Export Filtered Data
export const exportAdminOrders = createAsyncThunk(
  "adminOrders/export",
  async ({ exportType, search, currency, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/orders/export", {
        params: { exportType, search, currency, startDate, endDate },
      });
      return response.data; // Returns { success, count, data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export orders."
      );
    }
  }
);

// 4. Update Order Status Manually
export const updateAdminOrderStatus = createAsyncThunk(
  "adminOrders/updateStatus",
  async ({ orderId, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/status`, {
        orderStatus,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update order status."
      );
    }
  }
);

// 5. Fulfill Order via Delhivery
export const fulfillAdminOrder = createAsyncThunk(
  "adminOrders/fulfill",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/orders/${orderId}/fulfill`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fulfill order."
      );
    }
  }
);

// --- Slice Configuration ---

const adminOrderSlice = createSlice({
  name: "adminOrders",
  initialState: {
    orders: [],
    currentOrder: null, // Holds the data for the OrderDetails page
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalOrders: 0,
      successfulOrders: 0,
    },
    loading: false,
    currentOrderLoading: false, // Separate loader for the details page
    actionLoading: false,
    exportLoading: false, 
    error: null,
    actionError: null,
  },
  reducers: {
    clearOrderErrors: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All Orders ---
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Single Order By ID ---
      .addCase(fetchAdminOrderById.pending, (state) => {
        state.currentOrderLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrderById.fulfilled, (state, action) => {
        state.currentOrderLoading = false;
        state.currentOrder = action.payload.data;
      })
      .addCase(fetchAdminOrderById.rejected, (state, action) => {
        state.currentOrderLoading = false;
        state.error = action.payload;
      })

      // --- Export Orders ---
      .addCase(exportAdminOrders.pending, (state) => {
        state.exportLoading = true;
        state.actionError = null;
      })
      .addCase(exportAdminOrders.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportAdminOrders.rejected, (state, action) => {
        state.exportLoading = false;
        state.actionError = action.payload;
      })

      // --- Update Order Status ---
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        
        // 1. Update in the main table list if it exists there
        const updatedOrderIndex = state.orders.findIndex(
          (order) => order._id === action.payload.data._id
        );
        if (updatedOrderIndex !== -1) {
          state.orders[updatedOrderIndex] = action.payload.data;
        }

        // 2. Update the single order view if we are currently looking at it
        if (state.currentOrder && state.currentOrder._id === action.payload.data._id) {
          state.currentOrder = action.payload.data;
        }
      })
      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // --- Fulfill Order ---
      .addCase(fulfillAdminOrder.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(fulfillAdminOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { orderNumber, trackingNumber, shippingLabelUrl, orderStatus } = action.payload.data;
        
        // 1. Update in the main table list
        const updatedOrderIndex = state.orders.findIndex(
          (order) => order.orderNumber === orderNumber
        );
        if (updatedOrderIndex !== -1) {
          state.orders[updatedOrderIndex].trackingNumber = trackingNumber;
          state.orders[updatedOrderIndex].shippingLabelUrl = shippingLabelUrl;
          state.orders[updatedOrderIndex].orderStatus = orderStatus;
        }

        // 2. Update the single order view if we are currently looking at it
        if (state.currentOrder && state.currentOrder.orderNumber === orderNumber) {
          state.currentOrder.trackingNumber = trackingNumber;
          state.currentOrder.shippingLabelUrl = shippingLabelUrl;
          state.currentOrder.orderStatus = orderStatus;
        }
      })
      .addCase(fulfillAdminOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearOrderErrors, clearCurrentOrder } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;