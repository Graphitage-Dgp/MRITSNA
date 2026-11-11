import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../configs/axiosInstance';

const initialState = {
  collections: [],       // For the Admin Dashboard Table
  collectionDetails: null, // For the Edit Form
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// --- ASYNC THUNKS ---

// Fetch All Collections (Table Data)
export const fetchAdminCollections = createAsyncThunk(
  'collections/fetchAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/collections/');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch collections';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Single Collection (For Edit Form)
export const fetchCollectionById = createAsyncThunk(
  'collections/fetchById',
  async (id, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/collections/${id}`);
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch collection details';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create New Collection
export const createNewCollection = createAsyncThunk(
  'collections/create',
  async (collectionData, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/collections', collectionData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.errors 
        ? error.response.data.errors
        : error.response?.data?.message || error.message || 'Failed to create collection';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update Existing Collection
export const updateExistingCollection = createAsyncThunk(
  'collections/update',
  async ({ id, updateData }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/collections/${id}`, updateData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.errors 
        ? error.response.data.errors 
        : error.response?.data?.message || error.message || 'Failed to update collection';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Change Collection Status (Active, Draft, Archived)
export const changeCollectionStatus = createAsyncThunk(
  'collections/changeStatus',
  async ({ id, status }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/collections/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to change status';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete Entire Collection
export const deleteCollection = createAsyncThunk(
  'collections/delete',
  async (id, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(`/collections/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete collection';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete Orphaned Image from ImageKit (Pre-Save UI Deletion)
export const deleteCollectionImage = createAsyncThunk(
  'collections/deleteImage',
  async (fileId, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(`/collections/image/${fileId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete image from cloud storage';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- SLICE CONFIGURATION ---

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    // Utility to reset success/error states after form submission
    resetCollectionState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    // Clear the edit form data when leaving the page
    clearCollectionDetails: (state) => {
      state.collectionDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All ---
      .addCase(fetchAdminCollections.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminCollections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collections = action.payload; // Populates table safely
      })
      .addCase(fetchAdminCollections.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Single ---
      .addCase(fetchCollectionById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCollectionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collectionDetails = action.payload;
      })
      .addCase(fetchCollectionById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Create ---
      .addCase(createNewCollection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.collections.unshift(action.payload.data); 
      })
      .addCase(createNewCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Update ---
      .addCase(updateExistingCollection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateExistingCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.collectionDetails = action.payload.data;
      })
      .addCase(updateExistingCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Change Status ---
      .addCase(changeCollectionStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changeCollectionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.collections.findIndex(c => c._id === action.payload.id);
        if (index !== -1) {
          state.collections[index].status = action.payload.status;
        }
      })
      .addCase(changeCollectionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Delete Collection ---
      .addCase(deleteCollection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        // Optimistically remove it from the table view
        state.collections = state.collections.filter(c => c._id !== action.payload.id);
      })
      .addCase(deleteCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- ImageKit Delete (Background tracking) ---
      .addCase(deleteCollectionImage.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetCollectionState, clearCollectionDetails } = collectionSlice.actions;
export default collectionSlice.reducer;