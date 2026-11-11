import mongoose from 'mongoose';

// Sub-Schema: Images (Dual-URL system) ---
const imageSchema = new mongoose.Schema({
  imagekitFileId: { 
    type: String, 
    required: [true, 'ImageKit File ID is required for storage management'] 
  },
  baseUrl: { 
    type: String, 
    required: [true, 'High-resolution base URL is required'] 
  },
  altText: { 
    type: String,
    required: [true, 'Alt text is required for SEO and accessibility']
  },
  isPrimary: { 
    type: Boolean, 
    default: false 
  },
  displayOrder: {
    type: Number,
    default: 0 
  }
});

// Custom validator to enforce the 5-image maximum
function imageLimit(val) {
  return val.length <= 5;
}

const careSchema = new mongoose.Schema({
  isTransitSafe: {
    type: Boolean,
    default: true
  },
  isFoodSafe: {
    type: Boolean,
    default: false
  },
  isMicrowaveDishwasherSafe: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Sub-Schema: Color Variants ---
const variantSchema = new mongoose.Schema({
  // Boolean toggle for multicolor variants
  isMulticolor: {
    type: Boolean,
    default: false
  },
  colorName: { 
    type: String, 
    // Kept required so it displays textually (e.g., "Assorted", "Rainbow", or "Multicolor")
    required: [true, 'Color name is required (e.g., Obsidian or Multicolor)'] 
  },
  colorHex: { 
    type: String, 
    // Conditionally required based on the isMulticolor flag
    required: [
      function() { 
        // 'this' refers to the current variant subdocument
        return !this.isMulticolor; 
      }, 
      'Hex code is required for UI color swatches unless Multicolor is selected'
    ] 
  },
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  
  // Variant-specific pricing
  pricing: {
    price: {
      type: Number,
      required: [true, 'Price is required for this variant'],
      min: [0, 'Price cannot be negative']
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Variant-specific attributes (Material & Finish)
  attributes: {
    material: { 
      type: String, 
      required: [true, 'Material is required for this variant'] 
    },
    finish: { 
      type: String 
    }
  },

  // Care Instructions
  careInstructions: {
    type: String,
    required: [true, 'Care instruction is required for this variant']
  },

  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 3
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  images: {
    type: [imageSchema],
    validate: [imageLimit, 'A color variant cannot exceed 5 images.']
  }
}, {
  // Required so the finalPrice virtual shows up in JSON responses
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual calculation for frontend discounts moved to the variant level
variantSchema.virtual('finalPrice').get(function() {
  if (this.pricing && this.pricing.discountPercentage > 0) {
    return this.pricing.price - (this.pricing.price * (this.pricing.discountPercentage / 100));
  }
  return this.pricing?.price || 0;
});

// Main Product Schema ---
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxLength: [150, 'Title cannot exceed 150 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true 
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    enum: ['Vase','Dinnerset', 'Decor', 'Bowl', 'Cup', 'Mug', 'Platter/Tray', 'Tea', 'Tealight Candle', 'Teapot', 'Tumbler', "Serveware", "Puja", "Aromatic Candle"], 
    required: true,
    index: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  
  care: {
    type: careSchema,
    default: () => ({})
  },
  
  // Shared Logistics & Tax (Applies to all variants)
  pricing: {
    baseCurrency: {
      type: String,
      default: 'INR',
      required: true
    },
    taxClass: {
      type: String,
      default: 'standard', 
      required: true
    },
    hsnCode: {
      type: String,
      required: true, 
    }
  },

  // Logistics
  shipping: {
    weightGrams: {
      type: Number,
      required: true 
    },
    dimensions: {
      lengthCm: { type: Number, required: true },
      widthCm: { type: Number, required: true },
      heightCm: { type: Number, required: true }
    },
    isFragile: {
      type: Boolean,
      default: true 
    }
  },

  // --- THE VARIANTS ARRAY ---
  variants: {
    type: [variantSchema],
    required: [true, 'A product must have at least one variant.']
  },

  // --- REVIEWS & RATINGS CACHE ---
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be below 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },

  // SEO & State
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Product = mongoose.model('Product', productSchema);

export default Product;