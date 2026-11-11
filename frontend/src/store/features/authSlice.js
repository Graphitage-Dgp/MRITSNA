import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userAxios } from "../../configs/axiosInstance"; 

// --- 1. ASYNC THUNKS (API CALLS) ---

export const checkAuth = createAsyncThunk(
  "user/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAxios.get("/auth/check-auth");
      return response.data.user; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Authentication check failed.");
    }
  }
);

export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Registration failed.");
    }
  }
);

export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed.");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/logout");
      
      // --- THE FIX: Clear both global states on logout ---
      dispatch({ type: 'cart/clearLocalCart' });
      dispatch({ type: 'wishlist/clearLocalWishlist' });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Logout failed.");
    }
  }
);

export const sendVerificationOtp = createAsyncThunk(
  "user/sendVerificationOtp",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/send-verification");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to send OTP.");
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "user/verifyOtp",
  async (otpCode, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/verify-email", { otp: otpCode });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "OTP verification failed.");
    }
  }
);

export const logoutAllOtherDevices = createAsyncThunk(
  "user/logoutAllOtherDevices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/logout-all");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to sign out of other devices.");
    }
  }
);

export const deactivateAccount = createAsyncThunk(
  "user/deactivateAccount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/deactivate");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to deactivate account.");
    }
  }
);

export const changeEmail = createAsyncThunk(
  "user/changeEmail",
  async (newEmail, { rejectWithValue }) => {
    try {
      const response = await userAxios.post("/auth/change-email", { newEmail });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to change email.");
    }
  }
);

// --- 2. THE SLICE STATE & REDUCERS ---

const initialState = {
  user: null,               
  isAuthenticated: false,   
  isCheckingAuth: true,     
  isLoading: false,         
  error: null,
  otpSent: false,           
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Check Auth ---
      .addCase(checkAuth.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.user = action.payload; 
        state.isAuthenticated = !!action.payload; 
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isCheckingAuth = false;
        state.user = null;
        state.isAuthenticated = false;
      })

      // --- Login ---
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- Register ---
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- Logout & Deactivate ---
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(deactivateAccount.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })

      // --- Send OTP ---
      .addCase(sendVerificationOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendVerificationOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
      })
      .addCase(sendVerificationOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- Verify OTP ---
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user; 
        state.otpSent = false; 
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- Change Email ---
      .addCase(changeEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.otpSent = true;
      })
      .addCase(changeEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetOtpState } = authSlice.actions;
export default authSlice.reducer;