import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../configs/axiosInstance'; 

const initialState = {
  kpis: [],
  chart: null,
  topProducts: [],
  recentOrders: [],
  trafficSources: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// --- ASYNC THUNKS ---

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async ({ startDate, endDate }, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/dashboard/stats', {
        params: { startDate, endDate }
      });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch dashboard statistics';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- SLICE CONFIGURATION ---

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    resetDashboardState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    // Wipes all data AND status flags when leaving the dashboard
    clearDashboardData: (state) => {
      state.kpis = [];
      state.chart = null;
      state.topProducts = [];
      state.recentOrders = [];
      state.trafficSources = [];
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true; // <-- Added missing success flag
        state.kpis = action.payload.kpis;
        state.chart = action.payload.chart;
        state.topProducts = action.payload.topProducts;
        state.recentOrders = action.payload.recentOrders;
        state.trafficSources = action.payload.trafficSources;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetDashboardState, clearDashboardData } = dashboardSlice.actions; 
export default dashboardSlice.reducer;