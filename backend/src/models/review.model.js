import mongoose from 'mongoose';

// Sub-Schema for Review Images (Max 3)
const reviewImageSchema = new mongoose.Schema({
  imagekitFileId: { 
    type: String, 
    required: [true, 'ImageKit File ID is required for storage management'] 
  },
  baseUrl: { 
    type: String, 
    required: [true, 'High-resolution base URL is required'] 
  }
}, { _id: false });

function imageLimit(val) {
  return val.length <= 3;
}

const reviewSchema = new mongoose.Schema({
  // --- CORE RELATIONS ---
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Review must be associated with a product'],
    index: true
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    // --- PREVIOUS LOGIC: STRICT ORDER REQUIREMENT ---
    // required: [
    //   function() { return !this.isAdminGenerated; }, 
    //   'Review must be linked to a verified order'
    // ]
    // --- NEW LOGIC: OPTIONAL ORDER ---
    required: false
  },
  
  // Helpful to show other customers exactly what version they bought
  colorName: {
    type: String,
    required: true,
    trim: true
  },

  // --- AUTHOR IDENTITY (Hybrid Approach) ---
  // If logged in:
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  // If guest:
  guestName: {
    type: String,
    trim: true,
    required: [
      function() { return !this.user && !this.isAdminGenerated; }, 
      'Guest name is required for unauthenticated reviews'
    ]
  },
  guestEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  deviceId: {
    type: String,
    index: true,
    // The persistent device tracker we just set up!
    required: [
      function() { return !this.user && !this.isAdminGenerated; }, 
      'Device ID is required to track guest reviews securely'
    ]
  },

  // --- THE REVIEW PAYLOAD ---
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating cannot be less than 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxLength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: {
    type: [reviewImageSchema],
    validate: [imageLimit, 'A review cannot exceed 3 images.']
  },

  // --- STATE & MODERATION ---
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  isAdminGenerated: {
    type: Boolean,
    default: false
  }

}, { 
  timestamps: true 
});

// Compound index to prevent duplicate reviews from the same device/user on the same product
// We use partialFilterExpression so it only enforces uniqueness if user/deviceId exist.
reviewSchema.index(
  { product: 1, user: 1 }, 
  { unique: true, partialFilterExpression: { user: { $ne: null } } }
);

reviewSchema.index(
  { product: 1, deviceId: 1 }, 
  { unique: true, partialFilterExpression: { deviceId: { $ne: null }, isAdminGenerated: false } }
);

export default mongoose.model('Review', reviewSchema);