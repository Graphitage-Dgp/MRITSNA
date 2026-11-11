import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAxios from '../../configs/axiosInstance';

// 1. Fetch Dashboard Metrics for Users & Visitors
export const fetchUserStats = createAsyncThunk(
  'adminUser/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get('/users/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user statistics');
    }
  }
);

// 2. Fetch Paginated Directory of Registered Users & Anonymous Visitors
export const fetchUsersList = createAsyncThunk(
  'adminUser/fetchUsersList',
  async ({ page = 1, limit = 15, type = 'all', activity = 'all', region = 'global', search = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        type,
        activity,
        region,
        search
      });
      const response = await adminAxios.get(`/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users directory');
    }
  }
);

// 3. Fetch Full 360-Degree Profile Details (Cart, Wishlist, Orders, Reviews & Rating)
export const fetchUserFullDetails = createAsyncThunk(
  'adminUser/fetchUserFullDetails',
  async (entityId, { rejectWithValue }) => {
    try {
      const response = await adminAxios.get(`/users/${encodeURIComponent(entityId)}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile details');
    }
  }
);

const initialState = {
  stats: {
    totalProfiles: 0,
    registeredUsersCount: 0,
    visitorsCount: 0,
    activeShoppersCount: 0,
    totalReviewsSubmitted: 0
  },
  usersList: [],
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15
  },
  currentUserDetails: null,
  isLoading: false,
  isStatsLoading: false,
  isDetailsLoading: false,
  isError: false,
  message: ''
};

const adminUserSlice = createSlice({
  name: 'adminUser',
  initialState,
  reducers: {
    clearCurrentUserDetails: (state) => {
      state.currentUserDetails = null;
    },
    clearAdminUserErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.isStatsLoading = true;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.isStatsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(fetchUsersList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsersList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.usersList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsersList.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(fetchUserFullDetails.pending, (state) => {
        state.isDetailsLoading = true;
      })
      .addCase(fetchUserFullDetails.fulfilled, (state, action) => {
        state.isDetailsLoading = false;
        state.currentUserDetails = action.payload;
      })
      .addCase(fetchUserFullDetails.rejected, (state, action) => {
        state.isDetailsLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { clearCurrentUserDetails, clearAdminUserErrors } = adminUserSlice.actions;
export default adminUserSlice.reducer;