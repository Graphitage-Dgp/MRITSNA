import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userAxios } from "../../configs/axiosInstance";

// --- ASYNC THUNKS ---

// 1. Fetch All User Addresses
export const fetchAddresses = createAsyncThunk(
  "addresses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAxios.get("/addresses");
      return response.data; // { success, data: [...] }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch addresses."
      );
    }
  }
);

// 2. Create a New Address
export const createAddress = createAsyncThunk(
  "addresses/create",
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/addresses", addressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create address."
      );
    }
  }
);

// 3. Update an Existing Address
export const updateAddress = createAsyncThunk(
  "addresses/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await userAxios.patch(`/addresses/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update address."
      );
    }
  }
);

// 4. Delete an Address (Soft Delete on Backend)
export const deleteAddress = createAsyncThunk(
  "addresses/delete",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await userAxios.delete(`/addresses/${addressId}`);
      return response.data; // Returns { success, data: addressId }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete address."
      );
    }
  }
);

// 5. Set Address as Default
export const setDefaultAddress = createAsyncThunk(
  "addresses/setDefault",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await userAxios.patch(`/addresses/${addressId}/default`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to set default address."
      );
    }
  }
);

// --- INITIAL STATE ---
const initialState = {
  addresses: [],
  loading: false,        // For the initial fetch
  actionLoading: false,  // For create/update/delete actions
  error: null,
  actionError: null,
};

// --- SLICE CONFIGURATION ---
const addressSlice = createSlice({
  name: "addresses",
  initialState,
  reducers: {
    clearAddressErrors: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Addresses ---
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload.data;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create Address ---
      .addCase(createAddress.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.actionLoading = false;
        const newAddress = action.payload.data;
        
        // If the new address is default, strip default status from others in local state
        if (newAddress.isDefault) {
          state.addresses.forEach(addr => { addr.isDefault = false; });
        }
        
        // Add to the top of the list
        state.addresses.unshift(newAddress);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // --- Update Address ---
      .addCase(updateAddress.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedAddress = action.payload.data;
        
        // If it was updated to be the default, strip default from others
        if (updatedAddress.isDefault) {
          state.addresses.forEach(addr => { addr.isDefault = false; });
        }

        const index = state.addresses.findIndex(addr => addr._id === updatedAddress._id);
        if (index !== -1) {
          state.addresses[index] = updatedAddress;
        }
        
        // Re-sort so the default address stays at the top
        state.addresses.sort((a, b) => (b.isDefault === true) - (a.isDefault === true));
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // --- Delete Address ---
      .addCase(deleteAddress.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.actionLoading = false;
        const deletedId = action.payload.data;
        
        // Remove it from local state
        state.addresses = state.addresses.filter(addr => addr._id !== deletedId);
        
        // If they deleted the default address, the backend automatically promotes the newest one.
        // To keep the UI perfectly synced without a full reload, we just set the first available one to default.
        if (state.addresses.length > 0 && !state.addresses.some(addr => addr.isDefault)) {
          state.addresses[0].isDefault = true;
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // --- Set Default Address ---
      .addCase(setDefaultAddress.pending, (state) => {
        // We do not set actionLoading here so the UI doesn't visually stutter for a tiny background toggle
        state.actionError = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        const newDefaultId = action.payload.data._id;
        
        // Strip default from all, apply to the new one
        state.addresses.forEach(addr => {
          addr.isDefault = addr._id === newDefaultId;
        });

        // Re-sort so the new default snaps to the top of the UI
        state.addresses.sort((a, b) => (b.isDefault === true) - (a.isDefault === true));
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.actionError = action.payload;
      });
  },
});

export const { clearAddressErrors } = addressSlice.actions;
export default addressSlice.reducer;