import Collection from '../../models/collection.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// Define the explicitly required fields (Crucial: includes _id and variants._id)
const POPULATE_FIELDS = '_id title slug category isPremium variants._id variants.colorName variants.pricing variants.images variants.inventory variants.sku';

// --- Utility: Inject Regional Pricing into Populated Products ---
const localizeProductPricing = (product, regionData) => {
  if (!product || !product.variants) return product;
  
  product.variants.forEach(variant => {
    if (variant.pricing) {
      const localized = calculateRegionalPricing(
        variant.pricing.price,
        variant.pricing.discountPercentage || 0,
        product.isPremium || false,
        regionData
      );
      // Overwrite raw DB prices with the mathematically converted regional prices
      variant.pricing.price = localized.sellingPrice;
      variant.pricing.originalPrice = localized.originalPrice; 
    }
  });
  return product;
};

// --- Get All Active Collections (Fully Populated & Regionally Converted) ---
export const getActiveCollections = async (req, res, next) => {
  try {
    // 1. Get region context (default to IN if middleware somehow misses)
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    // 2. Fetch active collections and deep-populate
    const collections = await Collection.find({ status: 'active' })
      .populate({ path: 'gridProducts', select: POPULATE_FIELDS })
      .populate({ path: 'lookbook.hotspots.product', select: POPULATE_FIELDS })
      .populate({ path: 'bundle.products', select: POPULATE_FIELDS })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Apply regional pricing engine to all nested products
    collections.forEach(collection => {
      if (collection.gridProducts) {
        collection.gridProducts = collection.gridProducts.map(p => localizeProductPricing(p, regionData));
      }
      if (collection.lookbook && collection.lookbook.hotspots) {
        collection.lookbook.hotspots = collection.lookbook.hotspots.map(hotspot => {
          hotspot.product = localizeProductPricing(hotspot.product, regionData);
          return hotspot;
        });
      }
      if (collection.bundle && collection.bundle.products) {
        collection.bundle.products = collection.bundle.products.map(p => localizeProductPricing(p, regionData));
      }
    });

    return res.status(200).json({
      success: true,
      count: collections.length,
      currencySymbol: regionData.symbol,
      currencyCode: regionData.currencyCode,
      data: collections
    });
  } catch (error) {
    next(error);
  }
};

// --- Get Single Collection by Slug (Optional Backup) ---
export const getCollectionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const collection = await Collection.findOne({ slug, status: 'active' })
      .populate({ path: 'gridProducts', select: POPULATE_FIELDS })
      .populate({ path: 'lookbook.hotspots.product', select: POPULATE_FIELDS })
      .populate({ path: 'bundle.products', select: POPULATE_FIELDS })
      .lean();

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found or inactive' });
    }

    // Apply regional pricing engine
    if (collection.gridProducts) {
        collection.gridProducts = collection.gridProducts.map(p => localizeProductPricing(p, regionData));
    }
    if (collection.lookbook && collection.lookbook.hotspots) {
      collection.lookbook.hotspots = collection.lookbook.hotspots.map(hotspot => {
        hotspot.product = localizeProductPricing(hotspot.product, regionData);
        return hotspot;
      });
    }
    if (collection.bundle && collection.bundle.products) {
      collection.bundle.products = collection.bundle.products.map(p => localizeProductPricing(p, regionData));
    }

    return res.status(200).json({
      success: true,
      currencySymbol: regionData.symbol,
      currencyCode: regionData.currencyCode,
      data: collection
    });
  } catch (error) {
    next(error);
  }
};