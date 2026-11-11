import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true }, // Used for CGST/SGST vs IGST
  country: { type: String, required: true, trim: true }, // Used for Export 0% Tax
  pinCode: { type: String, required: true, trim: true },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  colorName: { type: String, required: true },
  slug: { type: String, required: true },
  img: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtPurchase: { type: Number, required: true },
  itemTotal: { type: Number, required: true }
}, { _id: false });

const taxDetailSchema = new mongoose.Schema({
  taxType: { type: String, enum: ['IGST', 'CGST', 'SGST', 'EXPORT'], required: true },
  rate: { type: Number, required: true }, // e.g., 18 or 9 or 0
  amount: { type: Number, required: true } // Stored as Integer
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    // --- HUMAN READABLE ID ---
    orderNumber: { type: String, unique: true, index: true },

    // --- IDENTITY & ANTI-FRAUD (For Coupon Fingerprinting) ---
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isGuestCheckout: { type: Boolean, default: false },
    guestEmail: { type: String, index: true },
    deviceId: { type: String, required: true, index: true },

    // --- LOGISTICS ---
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, required: true },
    items: { type: [orderItemSchema], required: true },

    // --- MULTI-CURRENCY SNAPSHOT ---
    baseCurrency: { type: String, default: 'INR' },
    paymentCurrency: { type: String, required: true, enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD', 'SGD', 'SAR', 'JPY'] },
    exchangeRateAtPurchase: { type: Number, default: 1 },

    // --- INCLUSIVE FINANCIALS & PAYMENT TERMS ---
    // Example: ₹10,000 is stored as 1000000 paise
    subTotal: { type: Number, required: true }, 
    shippingCost: { type: Number, default: 0 },
    
    // Coupon Details
    couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discountAmount: { type: Number, default: 0 },
    
    // Inclusive Accounting (Reverse Math)
    baseRevenue: { type: Number, required: true }, // What the business keeps
    taxDetails: { type: [taxDetailSchema], default: [] },
    totalTaxAmount: { type: Number, default: 0 }, // What the government gets
    
    // --- PARTIAL COD SUPPORT ---
    paymentOption: { 
      type: String, 
      enum: ['FULL_ONLINE', 'PARTIAL_COD'], 
      required: true,
      default: 'FULL_ONLINE'
    },
    
    // The final upfront amount the payment gateway charges the customer right now
    paymentAmount: { type: Number, required: true }, 
    // The portion of the grand total paid in advance (equals paymentAmount upon success)
    advancePaid: { type: Number, default: 0 },
    // The remaining balance the delivery driver must collect (Cash on Delivery)
    balanceDueOnDelivery: { type: Number, default: 0 },

    // --- STATE TRACKING ---
    paymentMethod: { type: String, enum: ['RAZORPAY', 'STRIPE', 'PAYPAL', 'COD'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Partially Paid'], default: 'Pending', index: true },
    transactionId: { type: String, default: null },
    
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending',
      index: true,
    },
    
    trackingNumber: { type: String, default: null },
    courierPartner: { type: String, default: null },
    trackingUrl: { type: String, default: null },
    shippingLabelUrl: { type: String, default: null },

    // --- TIMELINES ---
    paidAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// --- Pre-Save Hook: Auto-Generate Order Number ---
orderSchema.pre('save', async function () {
  if (this.isNew) {
    const timestampHex = Math.floor(Date.now() / 1000).toString(16).toUpperCase();
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(4, '0');
    this.orderNumber = `ORD-${timestampHex}-${randomHex}`;
  }
});

export default mongoose.model('Order', orderSchema);