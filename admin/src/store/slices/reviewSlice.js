import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../configs/axiosInstance";

// --- Async Thunks ---

// Fetch the high-level summary of products and their review counts
export const fetchAdminReviewSummary = createAsyncThunk(
  "adminReviews/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/reviews/summary");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch review summary."
      );
    }
  }
);

// Fetch specific reviews for a single product (with sorting and filtering)
export const fetchAdminProductReviews = createAsyncThunk(
  "adminReviews/fetchProductReviews",
  async ({ productId, status = "all", sort = "newest" }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/reviews/product/${productId}`, {
        params: { status, sort },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch product reviews."
      );
    }
  }
);

// Update Review Status (Approve/Reject)
export const updateAdminReviewStatus = createAsyncThunk(
  "adminReviews/updateStatus",
  async ({ reviewId, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/reviews/${reviewId}/status`, {
        status,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update review status."
      );
    }
  }
);

// Admin manual review seeding (bypasses purchase requirements)
export const seedAdminReview = createAsyncThunk(
  "adminReviews/seedReview",
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/reviews/seed", reviewData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to seed review."
      );
    }
  }
);

// --- Slice Configuration ---

const adminReviewSlice = createSlice({
  name: "adminReviews",
  initialState: {
    summaryList: [], // Holds the data for the main table
    productReviews: [], // Holds the data for the specific product review view
    
    // Loading states matched to orderSlice style
    summaryLoading: false,
    reviewsLoading: false,
    actionLoading: false,
    
    // Error states matched to orderSlice style
    error: null,
    actionError: null,
  },
  reducers: {
    clearAdminReviewErrors: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearAdminProductReviews: (state) => {
      state.productReviews = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Review Summary ---
      .addCase(fetchAdminReviewSummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviewSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summaryList = action.payload;
      })
      .addCase(fetchAdminReviewSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload;
      })

      // --- Fetch Specific Product Reviews ---
      .addCase(fetchAdminProductReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminProductReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.productReviews = action.payload;
      })
      .addCase(fetchAdminProductReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.error = action.payload;
      })

      // --- Update Review Status (Approve/Reject) ---
      .addCase(updateAdminReviewStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateAdminReviewStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedReview = action.payload;

        // Update in the single product view if currently looking at it
        const index = state.productReviews.findIndex(
          (r) => r._id === updatedReview._id
        );
        if (index !== -1) {
          state.productReviews[index].status = updatedReview.status;
        }

        // Update the summary list counts without refetching
        const summaryIndex = state.summaryList.findIndex(
          (s) => s.productId === updatedReview.product
        );
        if (summaryIndex !== -1) {
          const summary = state.summaryList[summaryIndex];
          if (updatedReview.status === "approved") {
            summary.totalPending = Math.max(0, summary.totalPending - 1);
            summary.totalApproved += 1;
          } else if (updatedReview.status === "rejected") {
            summary.totalPending = Math.max(0, summary.totalPending - 1);
          }
        }
      })
      .addCase(updateAdminReviewStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // --- Seed Admin Review ---
      .addCase(seedAdminReview.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(seedAdminReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        const newReview = action.payload;

        // 1. Update the single product view if it matches the newly seeded review
        if (
          state.productReviews.length > 0 &&
          state.productReviews[0].product === newReview.product
        ) {
          state.productReviews.unshift({
            ...newReview,
            user: null,
            order: null,
          });
        }

        // Update summary counts instantly
        const summaryIndex = state.summaryList.findIndex(
          (s) => s.productId === newReview.product
        );
        if (summaryIndex !== -1) {
          state.summaryList[summaryIndex].totalReviews += 1;
          state.summaryList[summaryIndex].totalApproved += 1;
        }
      })
      .addCase(seedAdminReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearAdminReviewErrors, clearAdminProductReviews } =
  adminReviewSlice.actions;

export default adminReviewSlice.reducer;