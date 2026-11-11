import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance';

export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await userAxios.get(`/reviews/product/${slug}`);
      return response.data.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const checkReviewEligibility = createAsyncThunk(
  'reviews/checkEligibility',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await userAxios.get(`/reviews/eligibility/${productId}`);
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check eligibility');
    }
  }
);

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await userAxios.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit review');
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await userAxios.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review');
    }
  }
);

const initialState = {
  reviews: [],
  eligibilityStatus: 'IDLE',
  eligibilityData: null,
  isFetchingReviews: false,
  isCheckingEligibility: false,
  isSubmittingReview: false,
  fetchError: null,
  eligibilityError: null,
  submitError: null,
  submitSuccess: false,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    resetReviewState: (state) => {
      state.eligibilityStatus = 'IDLE';
      state.eligibilityData = null;
      state.submitError = null;
      state.submitSuccess = false;
    },
    clearReviewErrors: (state) => {
      state.fetchError = null;
      state.eligibilityError = null;
      state.submitError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.isFetchingReviews = true;
        state.fetchError = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.isFetchingReviews = false;
        state.reviews = action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.isFetchingReviews = false;
        state.fetchError = action.payload;
      })

      .addCase(checkReviewEligibility.pending, (state) => {
        state.isCheckingEligibility = true;
        state.eligibilityError = null;
        state.eligibilityStatus = 'LOADING';
      })
      .addCase(checkReviewEligibility.fulfilled, (state, action) => {
        state.isCheckingEligibility = false;
        state.eligibilityStatus = action.payload.eligibility;
        const { success, eligibility, ...restData } = action.payload;
        state.eligibilityData = restData;
      })
      .addCase(checkReviewEligibility.rejected, (state, action) => {
        state.isCheckingEligibility = false;
        state.eligibilityError = action.payload;
        state.eligibilityStatus = 'IDLE';
      })

      .addCase(submitReview.pending, (state) => {
        state.isSubmittingReview = true;
        state.submitError = null;
        state.submitSuccess = false;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.isSubmittingReview = false;
        state.submitSuccess = true;
        state.eligibilityStatus = 'ALREADY_REVIEWED';
        
        if (action.payload.review) {
          const newReview = action.payload.review;
          
          state.eligibilityData = {
            ...state.eligibilityData,
            review: newReview 
          };

          const formattedReview = {
            _id: newReview._id,
            rating: newReview.rating,
            comment: newReview.comment,
            colorName: newReview.colorName,
            images: newReview.images,
            createdAt: newReview.createdAt,
            status: newReview.status,
            
            // --- PREVIOUS LOGIC ---
            // author: state.eligibilityData?.guestName || 'You', 
            // isVerifiedBuyer: true
            
            // --- NEW LOGIC ---
            // Grab the name directly from the newly created review object.
            // If they are logged in, we just say 'You' for immediate UI feedback.
            author: newReview.guestName || 'You', 
            isVerifiedBuyer: newReview.order ? true : false 
          };
          
          state.reviews.unshift(formattedReview);
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isSubmittingReview = false;
        state.submitError = action.payload;
        state.submitSuccess = false;
      })

      // --- Update Review Cases ---
      .addCase(updateReview.pending, (state) => {
        state.isSubmittingReview = true;
        state.submitError = null;
        state.submitSuccess = false;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.isSubmittingReview = false;
        state.submitSuccess = true;
        
        if (action.payload.review) {
          const updatedReview = action.payload.review;
          
          // Update the personal eligibility data so the form shows the new data
          state.eligibilityData = {
            ...state.eligibilityData,
            review: updatedReview 
          };

          // Update the review in the main UI list (if it exists there)
          const index = state.reviews.findIndex(r => r._id === updatedReview._id);
          if (index !== -1) {
            state.reviews[index] = {
              ...state.reviews[index],
              rating: updatedReview.rating,
              comment: updatedReview.comment,
              images: updatedReview.images,
              status: updatedReview.status // Will show 'pending' again
            };
          }
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isSubmittingReview = false;
        state.submitError = action.payload;
        state.submitSuccess = false;
      });
  }
});

export const { resetReviewState, clearReviewErrors } = reviewSlice.actions;
export default reviewSlice.reducer;