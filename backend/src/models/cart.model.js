import mongoose from 'mongoose';

// ==========================================
// Sub-Schema: Cart Item (Identity Only)
// ==========================================
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Variant ID is required to identify the specific color/option']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity cannot be less than 1'],
    max: [5, 'Maximum 5 items allowed per variant per order'],
    default: 1
  }
}, { 
  _id: true 
});

// ==========================================
// Main Schema: Unified User & Visitor Cart
// ==========================================
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  deviceId: {
    type: String,
    default: null,
  },
  guestEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  guestName: {
    type: String,
    trim: true,
    default: null
  },
  guestPhone: {
    type: String,
    trim: true,
    default: null
  },
  lastKnownRegion: {
    countryCode: { type: String, default: 'IN' },
    currencyCode: { type: String, default: 'INR' },
    symbol: { type: String, default: '₹' },
    rate: { type: Number, default: 1 }
  },
  forceClearLocal: {
    type: Boolean,
    default: false
  },
  items: {
    type: [cartItemSchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Partial Unique Indexes:
// 1. One cart per authenticated User
cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

// 2. One cart per anonymous Visitor deviceId (when user is null)
cartSchema.index(
  { deviceId: 1 },
  { unique: true, partialFilterExpression: { deviceId: { $type: 'string' }, user: null } }
);

// Instance Method: Quickly clear the entire cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
