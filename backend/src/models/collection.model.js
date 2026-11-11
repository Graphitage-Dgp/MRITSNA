import mongoose from 'mongoose';

// --- Sub-Schema: Reusable Image Object ---
const imageSchema = new mongoose.Schema({
  imagekitFileId: { 
    type: String, 
    required: [true, 'ImageKit File ID is required'] 
  },
  baseUrl: { 
    type: String, 
    required: [true, 'High-resolution base URL is required'] 
  },
  altText: { 
    type: String,
    required: [true, 'Alt text is required for accessibility']
  }
}, { _id: false });

// --- Sub-Schema: Lookbook Hotspots ---
const hotspotSchema = new mongoose.Schema({
  topPercentage: {
    type: Number,
    required: [true, 'Vertical (Y) position is required'],
    min: [0, 'Position cannot be less than 0%'],
    max: [100, 'Position cannot exceed 100%']
  },
  leftPercentage: {
    type: Number,
    required: [true, 'Horizontal (X) position is required'],
    min: [0, 'Position cannot be less than 0%'],
    max: [100, 'Position cannot exceed 100%']
  },
  // Relational link to the actual product database
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'A hotspot must be linked to a specific product']
  }
});

// --- Main Schema: Collection ---
const collectionSchema = new mongoose.Schema({
  // Core Details
  title: {
    type: String,
    required: [true, 'Collection title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true 
  },
  subtitle: {
    type: String,
    required: [true, 'Subtitle is required (e.g., Autumn / Winter 2026)'],
    trim: true,
    maxLength: [100, 'Subtitle cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Collection description is required'],
    trim: true
  },

  // The Immersive Hero
  heroImage: {
    type: imageSchema,
    required: [true, 'A hero image is required for the collection header']
  },

  // The Interactive Lookbook
  lookbook: {
    image: {
      type: imageSchema,
      required: [true, 'A lookbook lifestyle image is required']
    },
    hotspots: [hotspotSchema]
  },

  // The Asymmetric Roster (Grid)
  gridProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  // 5. The Ultimate Upsell (Bundle)
  bundle: {
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    }
  },

  // Visibility & SEO
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
    index: true
  },
  seo: {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true }
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;