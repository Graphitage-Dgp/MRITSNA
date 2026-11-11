import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../configs/axiosInstance";

// ==========================================
// ASYNC THUNKS (API Calls)
// ==========================================

export const validateAdminSession = createAsyncThunk(
  "auth/validateAdminSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/profile");
      if (response.data.success) {
        return response.data.admin;
      }
      return rejectWithValue("Invalid session data");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Session validation failed"
      );
    }
  }
);

export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/signin", credentials);
      // We return the email so we can display it on the OTP verification screen
      return { email: credentials.email, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid credentials or unauthorized access."
      );
    }
  }
);

export const resendAdminOtp = createAsyncThunk(
  "auth/resendAdminOtp",
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/resend-otp", emailData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to resend verification code."
      );
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/verify", verificationData);
      return response.data.admin;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid or expired OTP."
      );
    }
  }
);

export const logoutAdmin = createAsyncThunk(
  "auth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/logout");
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Logout failed."
      );
    }
  }
);

// ==========================================
// SLICE DEFINITION
// ==========================================

const initialState = {
  admin: null,
  isAuthenticated: false, // Passed Step 1 (Password)
  isVerified: false,      // Passed Step 2 (OTP) / Fully Logged In
  isInitializing: true,   // For the initial App load check
  isLoading: false,       // For button spinners during API requests
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Manual overrides (optional, but good to keep for edge cases)
    setCredentials: (state, action) => {
      state.admin = action.payload.admin;
      state.isAuthenticated = true;
      state.isVerified = false;
    },
    setVerified: (state) => {
      state.isVerified = true;
    },
    logout: (state) => {
      state.admin = null;
      state.isAuthenticated = false;
      state.isVerified = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Validate Session ---
      .addCase(validateAdminSession.pending, (state) => {
        state.isInitializing = true;
        state.error = null;
      })
      .addCase(validateAdminSession.fulfilled, (state, action) => {
        state.admin = action.payload;
        state.isAuthenticated = true;
        state.isVerified = true; 
        state.isInitializing = false;
      })
      .addCase(validateAdminSession.rejected, (state, action) => {
        state.admin = null;
        state.isAuthenticated = false;
        state.isVerified = false;
        state.isInitializing = false;
        // We don't usually set an error state here because it's normal for a guest to fail this on first load
      })

      // --- Login Admin (Step 1) ---
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.isVerified = false;
        // Store just the email temporarily so the Verification screen knows who to verify
        state.admin = { email: action.payload.email }; 
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- Verify OTP (Step 2) ---
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isVerified = true;
        state.admin = action.payload;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- Logout Admin ---
      .addCase(logoutAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.isLoading = false;
        state.admin = null;
        state.isAuthenticated = false;
        state.isVerified = false;
        state.error = null;
      })
      .addCase(logoutAdmin.rejected, (state) => {
        state.isLoading = false;
        state.admin = null;
        state.isAuthenticated = false;
        state.isVerified = false;
        state.error = null;
      });
  },
});

export const { setCredentials, setVerified, logout, clearError } = authSlice.actions;
export default authSlice.reducer;