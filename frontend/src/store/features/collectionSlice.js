import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

const initialState = {
  collections: [], // Holds the fully populated master array
  currencyCode: 'INR',
  currencySymbol: '₹',
  isLoading: false,
  isError: false,
  message: '',
};

// ==========================================
// ASYNC THUNKS (API CALLS)
// ==========================================

// Fetch All Active Collections (The Master Payload)
export const fetchCollections = createAsyncThunk(
  'collections/fetchAll',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/collections');
      return response.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to load collections';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch a Single Collection by Slug (Optional Backup)
export const fetchCollectionBySlug = createAsyncThunk(
  'collections/fetchBySlug',
  async (slug, thunkAPI) => {
    try {
      const response = await userAxios.get(`/collections/${slug}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to load collection details';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ==========================================
// REDUX SLICE 
// ==========================================

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    // Utility to clear errors when a user navigates away or retries
    clearCollectionErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  
  extraReducers: (builder) => {
    builder
      // --- Fetch All Active Collections ---
      .addCase(fetchCollections.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collections = action.payload.data;
        state.currencyCode = action.payload.currencyCode || 'INR';
        state.currencySymbol = action.payload.currencySymbol || '₹';
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Single Collection by Slug (Backup) ---
      .addCase(fetchCollectionBySlug.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchCollectionBySlug.fulfilled, (state, action) => {
        state.isLoading = false;

        state.currencyCode = action.payload.currencyCode || state.currencyCode;
        state.currencySymbol = action.payload.currencySymbol || state.currencySymbol;

        const fetchedCollection = action.payload.data;
        const exists = state.collections.find(c => c._id === fetchedCollection._id);
        
        if (!exists) {
          state.collections.push(fetchedCollection);
        }
      })
      .addCase(fetchCollectionBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearCollectionErrors } = collectionSlice.actions;

export default collectionSlice.reducer;