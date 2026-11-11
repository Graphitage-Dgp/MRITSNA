import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

export const fetchNewArrivals = createAsyncThunk(
  'product/fetchNewArrivals',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/products/new-arrivals');
      return response.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch new arrivals';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchStoreProducts = createAsyncThunk(
  'product/fetchStoreProducts',
  async (queryParams = {}, thunkAPI) => {
    try {
      const response = await userAxios.get('/products', {
        params: queryParams
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch products';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchSingleProduct = createAsyncThunk(
  'product/fetchSingleProduct',
  async (slug, thunkAPI) => {
    try {
      const response = await userAxios.get(`/products/${slug}`);
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch product details';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- Fetch Filter Options (Categories & Materials together) ---
export const fetchFilterOptions = createAsyncThunk(
  'product/fetchFilterOptions',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/products/filter-options');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch filter options';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  newArrivals: [],
  products: [],
  singleProduct: null,
  
  categories: [], 
  materials: [], // NEW: State to hold dynamic materials
  
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false
  },
  isLoading: false,
  
  // Renamed to reflect it loads both options
  isFilterOptionsLoading: false, 
  
  isError: false,
  message: '',
  currencySymbol: '₹', 
  currencyCode: 'INR',
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearProductErrors: (state) => {
      state.isError = false;
      state.message = '';
    },
    clearProducts: (state) => {
      state.products = [];
      state.pagination = initialState.pagination;
    },
    clearSingleProduct: (state) => {
      state.singleProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch New Arrivals ---
      .addCase(fetchNewArrivals.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(fetchNewArrivals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.newArrivals = action.payload.data; 
        state.currencySymbol = action.payload.currencySymbol || '₹';
        state.currencyCode = action.payload.currencyCode || 'INR';
      })
      .addCase(fetchNewArrivals.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Paginated Products ---
      .addCase(fetchStoreProducts.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(fetchStoreProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data; 
        state.pagination = action.payload.pagination; 
        state.currencySymbol = action.payload.currencySymbol || '₹';
        state.currencyCode = action.payload.currencyCode || 'INR';
      })
      .addCase(fetchStoreProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Single Product ---
      .addCase(fetchSingleProduct.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
        state.singleProduct = null;
      })
      .addCase(fetchSingleProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleProduct = action.payload; 
        state.currencySymbol = action.payload.currencySymbol || '₹';
        state.currencyCode = action.payload.currencyCode || 'INR';
      })
      .addCase(fetchSingleProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // --- Fetch Filter Options ---
      .addCase(fetchFilterOptions.pending, (state) => {
        state.isFilterOptionsLoading = true;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.isFilterOptionsLoading = false;
        state.categories = action.payload.categories || [];
        state.materials = action.payload.materials || []; 
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.isFilterOptionsLoading = false;
        // Log it instead of throwing a full-page error
        console.error("Filter Options Fetch Error:", action.payload); 
      });
  },
});

export const { clearProductErrors, clearProducts, clearSingleProduct } = productSlice.actions;

export default productSlice.reducer;