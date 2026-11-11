import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required for internal tracking'],
      trim: true,
    },
    // Handles Flat amount, Percentage, or Free Shipping
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'free_shipping'],
      required: [true, 'Discount type is required'],
    },
    // Stored in Base INR. Converted dynamically for international users if applicable.
    discountValue: {
      type: Number,
      required: [
        function () {
          return this.discountType !== 'free_shipping';
        },
        'Discount value is required unless it is free shipping',
      ],
      min: [0, 'Discount value cannot be negative'],
    },
    // Max money off (Stored in Base INR). E.g., "10% off, up to a maximum of ₹1000"
    maxDiscountAmount: {
      type: Number,
      min: [0, 'Maximum discount amount cannot be negative'],
      default: null, 
    },
    // Min cart total required to apply coupon (Stored in Base INR).
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order value cannot be negative'],
    },

    // ==========================================
    // TARGETING & RESTRICTIONS (THE UPGRADES)
    // ==========================================
    
    // ['GLOBAL'] means everywhere. ['IN'] restricts to domestic. ['US', 'GB'] restricts to specific exports.
    applicableRegions: [{
      type: String,
      uppercase: true,
      default: 'GLOBAL'
    }],
    // If populated, coupon ONLY works for these specific products
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    // If populated, these products are ignored when calculating the discount
    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    // If populated, ONLY these specific users can claim the code (VIPs, Support Apologies)
    targetUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    // ==========================================
    // USAGE LIMITS & DATES
    // ==========================================

    // GLOBAL LIMIT: Total times this coupon can be used by anyone (Null = unlimited)
    usageLimit: {
      type: Number,
      default: null,
    },
    // Tracks current global usage for concurrency checks
    usedCount: {
      type: Number,
      default: 0,
    },
    // PER-USER LIMIT: Max times a single identity can use it (Null = unlimited)
    usagePerUserLimit: {
      type: Number,
      default: 1, 
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true, // Speeds up checks to see if coupon is valid
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isAutoApply: {
      type: Boolean,
      default: false,
      index: true, // Crucial for fast querying during checkout math
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Auto-disable if the expiry date has passed
couponSchema.pre('save', function () {
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.isActive = false;
  }
});

export default mongoose.model('Coupon', couponSchema);