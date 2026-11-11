import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../configs/axiosInstance'; // Adjust path to your axiosInstance

const initialState = {
  products: [],          // For the Admin Table
  productDetails: null,  // For the Edit Form
  inventory: [],         // NEW: For the Flattened Inventory Table
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// --- ASYNC THUNKS ---

// Fetch All Products (Table Data)
export const fetchAdminProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/products');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch products';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Single Product (For Edit Form)
export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch product details';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create New Product
export const createNewProduct = createAsyncThunk(
  'products/create',
  async (productData, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.errors 
        ? error.response.data.errors
        : error.response?.data?.message || error.message || 'Failed to create product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update Existing Product
export const updateExistingProduct = createAsyncThunk(
  'products/update',
  async ({ id, updateData }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/products/${id}`, updateData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.errors 
        ? error.response.data.errors 
        : error.response?.data?.message || error.message || 'Failed to update product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Change Product Status (Active, Draft, Archived)
export const changeStatus = createAsyncThunk(
  'products/changeStatus',
  async ({ id, status }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/products/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to change status';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch ImageKit Auth Signature (For direct frontend uploads)
export const fetchImageKitAuth = createAsyncThunk(
  'products/fetchImageKitAuth',
  async (_, thunkAPI) => {
    try {
      // Make sure the route matches where you mounted your product routes in your backend
      const response = await axiosInstance.get('/products/imagekit-auth');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to authenticate with ImageKit';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete Image from ImageKit
export const deleteProductImage = createAsyncThunk(
  'products/deleteImage',
  async (fileId, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(`/products/image/${fileId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete image from cloud storage';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Flattened Inventory List
export const fetchInventoryList = createAsyncThunk(
  'products/fetchInventoryList',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/products/inventory');
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch inventory list';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Quick Update Stock for a Specific Variant
export const updateVariantStock = createAsyncThunk(
  'products/updateVariantStock',
  async ({ productId, variantId, newStock }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch('/products/inventory/stock', { productId, variantId, newStock });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update stock';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- SLICE CONFIGURATION ---

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    // Utility to reset success/error states after a form submission or toast notification
    resetProductState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    // Clear the edit form data when leaving the page
    clearProductDetails: (state) => {
      state.productDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All ---
      .addCase(fetchAdminProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload; // Fixed phantom toast by removing isSuccess = true
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Single ---
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productDetails = action.payload; // Fixed phantom toast
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Create ---
      .addCase(createNewProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.products.unshift(action.payload.data); 
      })
      .addCase(createNewProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Update ---
      .addCase(updateExistingProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateExistingProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.productDetails = action.payload.data;
      })
      .addCase(updateExistingProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Change Status ---
      .addCase(changeStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changeStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Don't set global isSuccess if we are using the .unwrap() toast method locally
        const index = state.products.findIndex(p => p._id === action.payload.id);
        if (index !== -1) {
          state.products[index].status = action.payload.status;
        }
      })
      .addCase(changeStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Inventory List ---
      .addCase(fetchInventoryList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInventoryList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inventory = action.payload; // Just populate the data, no phantom toasts
      })
      .addCase(fetchInventoryList.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Update Variant Stock ---
      // We don't set global isLoading=true here so the UI doesn't flicker/block on fast clicks
      .addCase(updateVariantStock.fulfilled, (state, action) => {
        const { productId, variantId, newStock } = action.payload;
        // Optimistically update the specific row in the inventory array
        const itemIndex = state.inventory.findIndex(
          item => item.productId === productId && item.variantId === variantId
        );
        if (itemIndex !== -1) {
          state.inventory[itemIndex].stock = newStock;
          // Re-evaluate low stock based on threshold (defaulting to 5 if not set)
          const threshold = state.inventory[itemIndex].lowStockThreshold || 5;
          state.inventory[itemIndex].isLowStock = newStock <= threshold;
        }
      })
      .addCase(updateVariantStock.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })

      // --- ImageKit Delete (Optional Tracking) ---
      .addCase(deleteProductImage.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetProductState, clearProductDetails } = productSlice.actions;
export default productSlice.reducer;