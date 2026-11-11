import mongoose from 'mongoose';

// Define the individual item structure inside the wishlist
const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  _id: false
});

// Define the main wishlist document linked to either an authenticated User or a Visitor deviceId
const wishlistSchema = new mongoose.Schema({
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
  lastKnownRegion: {
    countryCode: { type: String, default: 'IN' },
    currencyCode: { type: String, default: 'INR' },
    symbol: { type: String, default: '₹' },
    rate: { type: Number, default: 1 }
  },
  items: [wishlistItemSchema]
}, {
  timestamps: true
});

// Partial Unique Indexes:
// 1. Strict 1:1 relationship for logged-in Users
wishlistSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

// 2. Strict 1:1 relationship for anonymous Visitor devices
wishlistSchema.index(
  { deviceId: 1 },
  { unique: true, partialFilterExpression: { deviceId: { $type: 'string' }, user: null } }
);

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
