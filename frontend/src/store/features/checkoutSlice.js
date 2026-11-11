import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userAxios } from "../../configs/axiosInstance";

// --- THE API BRIDGE (Async Thunks) ---

/**
 * Live calculation of cart totals, taxes, and auto-applied coupons.
 */
export const calculateCheckoutTotals = createAsyncThunk(
  "checkout/calculateTotals",
  async (payload, { rejectWithValue }) => {
    try {
      // payload expects: { items, country, state, couponCode, paymentOption, skipAutoApply, guestEmail, deviceId }
      // Note: Assuming your backend routes are mounted at /api/v1/checkout in app.js
      const response = await userAxios.post("/checkout/calculate", payload);
      return response.data.data;
    } catch (error) {
      // Safely catch our Zod Validation errors or standard server errors
      const errorMessage = error.response?.data?.message || "Failed to calculate totals";
      const validationErrors = error.response?.data?.errors || [];
      return rejectWithValue({ message: errorMessage, errors: validationErrors });
    }
  }
);

/**
 * Initializes the Razorpay order and saves a pending order in the database.
 */
export const createRazorpayOrder = createAsyncThunk(
  "checkout/createOrder",
  async (payload, { rejectWithValue }) => {
    try {
      // payload expects: { items, shippingAddress, billingAddress, couponCode, paymentOption, skipAutoApply, guestEmail, deviceId }
      const response = await userAxios.post("/checkout/create-order", payload);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create order";
      const validationErrors = error.response?.data?.errors || [];
      return rejectWithValue({ message: errorMessage, errors: validationErrors });
    }
  }
);

/**
 * Verifies the cryptographic signature from Razorpay to finalize the purchase.
 */
export const verifyRazorpayPayment = createAsyncThunk(
  "checkout/verifyPayment",
  async (payload, { rejectWithValue }) => {
    try {
      // payload expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id }
      const response = await userAxios.post("/checkout/verify-payment", payload);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Payment verification failed";
      return rejectWithValue({ message: errorMessage });
    }
  }
);


// --- THE STATE MANAGER (Initial State) ---

const initialState = {
  // Financial Breakdown (Updated continuously by calculateCheckoutTotals)
  financials: {
    subTotal: 0,
    discountAmount: 0,
    taxableAmount: 0,       // <-- NEW: Catches the pre-tax reverse-calculated amount
    totalTaxAmount: 0,
    taxDetails: [],
    grandTotal: 0,
    paymentAmount: 0,       // Upfront amount for Razorpay
    advancePaid: 0,         // Equals paymentAmount upon success
    balanceDueOnDelivery: 0,// For Partial COD
    currency: "INR",
    symbol: "₹",
  },
  
  // Coupon State
  appliedCouponCode: null,
  skipAutoApply: false,
  
  // Payment Choice State
  paymentOption: "FULL_ONLINE", // or "PARTIAL_COD"
  
  // Logistics State (Cached as the user fills out the form)
  shippingAddress: null,
  billingAddress: null,
  
  // Guest Tracking
  guestEmail: "",
  deviceId: "", 
  
  // Gateway State (Populated when user clicks "Proceed to Payment")
  razorpayDetails: {
    orderId: null,
    dbOrderId: null,
    keyId: null,
    amount: 0,
    currency: "INR",
  },

  // UI Status tracking
  calculationStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  orderCreationStatus: "idle",
  verificationStatus: "idle",
  
  // Error handling
  error: null,
  validationErrors: [], // Clean array mapped directly from Zod middleware
};


// --- THE REDUCERS (UI Toggles) ---

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    // Allows UI to toggle between paying in full or cash on delivery advance
    setPaymentOption: (state, action) => {
      state.paymentOption = action.payload; // expects 'FULL_ONLINE' or 'PARTIAL_COD'
    },
    
    // Allows user to manually type and apply a code
    setManualCoupon: (state, action) => {
      state.appliedCouponCode = action.payload;
      state.skipAutoApply = false; 
    },
    
    // Fired when user clicks the "X" on an auto-applied (or manual) coupon
    removeCoupon: (state) => {
      state.appliedCouponCode = null;
      state.skipAutoApply = true; // Tells backend: "Do NOT auto-apply anything anymore"
    },
    
    // Address Form Updates
    setShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      // You might optionally auto-fill billing address here if a "same as shipping" checkbox is clicked
    },
    setBillingAddress: (state, action) => {
      state.billingAddress = action.payload;
    },
    
    // For unregistered users
    setGuestDetails: (state, action) => {
      state.guestEmail = action.payload.email;
      state.deviceId = action.payload.deviceId; 
    },

    // Reset everything after a successful purchase or when unmounting the checkout page
    resetCheckoutState: () => initialState,
  },

  // --- ASYNC LOGIC HANDLING ---
  extraReducers: (builder) => {
    builder
      // Calculate Totals
      .addCase(calculateCheckoutTotals.pending, (state) => {
        state.calculationStatus = "loading";
        state.error = null;
        state.validationErrors = [];
      })
      .addCase(calculateCheckoutTotals.fulfilled, (state, action) => {
        state.calculationStatus = "succeeded";
        const data = action.payload;
        
        // Update all financial metrics
        state.financials = {
          subTotal: data.subTotal,
          discountAmount: data.discountAmount,
          taxableAmount: data.taxableAmount, // <-- NEW: Mapped from backend response
          totalTaxAmount: data.totalTaxAmount,
          taxDetails: data.taxDetails,
          grandTotal: data.grandTotal,
          paymentAmount: data.paymentAmount,
          advancePaid: data.advancePaid,
          balanceDueOnDelivery: data.balanceDueOnDelivery,
          currency: data.currency,
          symbol: data.symbol,
        };
        
        // If the backend auto-applied a code, silently register it in the state so the UI can show it
        if (data.appliedCouponCode) {
          state.appliedCouponCode = data.appliedCouponCode;
        }
      })
      .addCase(calculateCheckoutTotals.rejected, (state, action) => {
        state.calculationStatus = "failed";
        state.error = action.payload?.message || "Calculation failed";
        state.validationErrors = action.payload?.errors || [];
      })

      // Create Razorpay Order
      .addCase(createRazorpayOrder.pending, (state) => {
        state.orderCreationStatus = "loading";
        state.error = null;
        state.validationErrors = [];
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.orderCreationStatus = "succeeded";
        const data = action.payload;
        
        // Save the critical gateway variables needed to open the Razorpay popup
        state.razorpayDetails = {
          orderId: data.razorpayOrderId,
          dbOrderId: data.orderId,
          keyId: data.keyId,
          amount: data.amount,
          currency: data.currency,
        };
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.orderCreationStatus = "failed";
        state.error = action.payload?.message || "Order creation failed";
        state.validationErrors = action.payload?.errors || [];
      })

      // Verify Payment
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.verificationStatus = "loading";
        state.error = null;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state) => {
        state.verificationStatus = "succeeded";
        // Do NOT reset state here immediately, let the UI read "succeeded" to show a Thank You modal
        // Then fire `resetCheckoutState` when they click "Continue Shopping"
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.verificationStatus = "failed";
        state.error = action.payload?.message || "Verification failed";
      });
  },
});

export const {
  setPaymentOption,
  setManualCoupon,
  removeCoupon,
  setShippingAddress,
  setBillingAddress,
  setGuestDetails,
  resetCheckoutState,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;