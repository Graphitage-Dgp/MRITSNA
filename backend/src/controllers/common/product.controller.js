import Product from '../../models/product.model.js'; 
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

export const getNewArrivals = async (req, res, next) => {
  try {
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const newArrivals = await Product.find({ 
      status: 'active', 
      isPremium: false
    })
      .select('title slug isPremium variants._id variants.pricing variants.images variants.colorName variants.inventory')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(); 

    const formattedProducts = newArrivals.map((product) => {
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      const localizedPricing = calculateRegionalPricing(
        pricing.price, 
        pricing.discountPercentage, 
        product.isPremium || false, 
        regionData
      );

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        isPremium: product.isPremium || false,
        variantId: firstVariant._id || null,
        colorName: firstVariant.colorName || null,
        inStock: (firstVariant.inventory?.quantity || 0) > 0 || (firstVariant.inventory?.allowBackorder || false),
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        img: firstImage.baseUrl || null, 
        altText: firstImage.altText || product.title,
        totalReviews: product.totalReviews || 0,
        averageRating: product.averageRating || 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
      currencySymbol: regionData.symbol,      
      currencyCode: regionData.currencyCode 
    });

  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    next(error);
  }
};


export const getHomepagePicks = async (req, res, next) => {
  try {
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const products = await Product.aggregate([
      { $match: { status: 'active', category: { $nin: [null, ''] } } },
      { $addFields: { firstVariant: { $arrayElemAt: ["$variants", 0] } } },
      {
        $addFields: {
          rawPrice: { $ifNull: ["$firstVariant.pricing.price", 0] },
          discount: { $ifNull: ["$firstVariant.pricing.discountPercentage", 0] }
        }
      },
      {
        $addFields: {
          sortPrice: {
            $subtract: [
              "$rawPrice",
              { $multiply: ["$rawPrice", { $divide: ["$discount", 100] }] }
            ]
          }
        }
      },
      { $match: { sortPrice: { $gt: 0 } } },
      { $sort: { sortPrice: 1, createdAt: -1 } },
      { $group: { _id: "$category", product: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$product" } },
      { $sort: { sortPrice: 1, createdAt: -1 } },
      { $limit: 12 },
      { $project: { title: 1, slug: 1, category: 1, isPremium: 1, 'variants._id': 1, 'variants.pricing': 1, 'variants.images': 1, 'variants.colorName': 1, 'variants.inventory': 1 } }
    ]);

    const formattedProducts = products.map((product) => {
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      const localizedPricing = calculateRegionalPricing(
        pricing.price,
        pricing.discountPercentage,
        product.isPremium || false,
        regionData
      );

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        category: product.category,
        isPremium: product.isPremium || false,
        variantId: firstVariant._id || null,
        colorName: firstVariant.colorName || null,
        inStock: (firstVariant.inventory?.quantity || 0) > 0 || (firstVariant.inventory?.allowBackorder || false),
        originalPrice: localizedPricing.originalPrice,
        finalPrice: localizedPricing.sellingPrice,
        discount: localizedPricing.discountPercentage,
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title,
        totalReviews: product.totalReviews || 0,
        averageRating: product.averageRating || 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
      currencySymbol: regionData.symbol,
      currencyCode: regionData.currencyCode
    });

  } catch (error) {
    console.error("Error fetching homepage picks:", error);
    next(error);
  }
};


export const getPaginatedProducts = async (req, res, next) => {
  try {
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const search = req.query.search || '';
    const category = req.query.category || '';
    const material = req.query.material || '';
    const isPremium = req.query.isPremium;
    const sortParams = req.query.sort || 'none';

    const filter = { status: 'active' };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = { $in: category.split(',').map(c => c.trim()) };
    }
    if (material) {
      filter['variants.attributes.material'] = { $in: material.split(',').map(m => m.trim()) };
    }
    if (isPremium === 'true') filter.isPremium = true;
    if (isPremium === 'false') filter.isPremium = false;

    // --- TRUE GLOBAL SORTING STRATEGY ---
    let sortStrategy = {}; 
    
    switch (sortParams) {
      case 'price_asc': 
        sortStrategy = { sortPrice: 1, createdAt: -1 }; 
        break;
      case 'price_desc': 
        sortStrategy = { sortPrice: -1, createdAt: -1 }; 
        break;
      case 'name_asc': 
        sortStrategy = { title: 1, createdAt: -1 }; 
        break;
      case 'newest': 
        sortStrategy = { createdAt: -1 }; 
        break;
      case 'none':
      default: 
        // Only group by category if 'None' is explicitly selected by the user
        sortStrategy = { category: 1, createdAt: -1 }; 
        break;
    }

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      Product.aggregate([
        { $match: filter },
        { 
          $addFields: {
            firstVariant: { $arrayElemAt: ["$variants", 0] }
          }
        },
        {
          $addFields: {
            rawPrice: { $ifNull: ["$firstVariant.pricing.price", 0] },
            discount: { $ifNull: ["$firstVariant.pricing.discountPercentage", 0] }
          }
        },
        {
          $addFields: {
            sortPrice: {
              $subtract: [
                "$rawPrice",
                { $multiply: ["$rawPrice", { $divide: ["$discount", 100] }] }
              ]
            }
          }
        },
        { $sort: sortStrategy },
        { $skip: skip },
        { $limit: limit },
        { $project: { title: 1, slug: 1, category: 1, isPremium: 1, 'variants._id': 1, 'variants.pricing': 1, 'variants.images': 1, 'variants.colorName': 1, 'variants.inventory': 1, createdAt: 1 } }
      ]),
      Product.countDocuments(filter)
    ]);

    const formattedProducts = products.map((product) => {
      const variants = product.variants || [];
      const firstVariant = variants[0] || {};
      const images = firstVariant.images || [];
      const firstImage = images[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      const localizedPricing = calculateRegionalPricing(
        pricing.price, 
        pricing.discountPercentage, 
        product.isPremium || false, 
        regionData
      );

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        category: product.category,
        isPremium: product.isPremium || false,
        variantId: firstVariant._id || null,
        colorName: firstVariant.colorName || null,
        inStock: (firstVariant.inventory?.quantity || 0) > 0 || (firstVariant.inventory?.allowBackorder || false),
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        discount: localizedPricing.discountPercentage,
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title,
        totalReviews: product.totalReviews || 0,
        averageRating: product.averageRating || 0,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      currencySymbol: regionData.symbol,      
      currencyCode: regionData.currencyCode,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: page,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching paginated products:", error);
    next(error);
  }
};


export const getSingleProduct = async (req, res, next) => {
  try {
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const { slug } = req.params;
    const product = await Product.findOne({ slug, status: 'active' })
      .select('-pricing.hsnCode -pricing.taxClass -shipping.weightGrams -variants.sku')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is no longer available.'
      });
    }

    let formattedDimensions = "Dimensions unavailable";
    if (product.shipping && product.shipping.dimensions) {
      const { lengthCm, widthCm, heightCm } = product.shipping.dimensions;
      formattedDimensions = `L ${lengthCm}cm x W ${widthCm}cm x H ${heightCm}cm`;
    }

    const formattedVariants = product.variants.map(variant => {
      const basePriceINR = variant.pricing?.price || 0;
      const discount = variant.pricing?.discountPercentage || 0;
      
      const localizedPricing = calculateRegionalPricing(
        basePriceINR, 
        discount, 
        product.isPremium || false, 
        regionData
      );

      const stockQuantity = variant.inventory?.quantity || 0;
      const threshold = variant.inventory?.lowStockThreshold || 3;

      return {
        variantId: variant._id,
        isMulticolor: variant.isMulticolor,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        discountPercentage: localizedPricing.discountPercentage,
        material: variant.attributes?.material,
        finish: variant.attributes?.finish,
        careInstructions: variant.careInstructions,
        stockQuantity: stockQuantity, 
        
        inStock: stockQuantity > 0 || (variant.inventory?.allowBackorder || false),
        lowStockWarning: stockQuantity > 0 && stockQuantity <= threshold,
        images: variant.images.map(img => ({
          url: img.baseUrl,
          alt: img.altText,
          isPrimary: img.isPrimary
        }))
      };
    });

    const publicProductData = {
      id: product._id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      category: product.category,
      isPremium: product.isPremium,
      care: {
        isTransitSafe: true,
        isFoodSafe: product.care?.isFoodSafe ?? false,
        isMicrowaveDishwasherSafe: product.care?.isMicrowaveDishwasherSafe ?? false,
      },
      dimensions: formattedDimensions,
      variants: formattedVariants,
      currencySymbol: regionData.symbol,
      currencyCode: regionData.currencyCode,
      totalReviews: product.totalReviews,
      averageRating: product.averageRating,
    };

    return res.status(200).json({
      success: true,
      data: publicProductData
    });

  } catch (error) {
    console.error("Error fetching single product:", error);
    next(error);
  }
};


export const searchProducts = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    
    if (!query.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };
    const searchRegex = new RegExp(query, 'i');

    const filter = {
      status: 'active',
      $or: [
        { title: searchRegex },
        { category: searchRegex },
        { 'variants.colorName': searchRegex }
      ]
    };

    const products = await Product.find(filter)
      .select('title slug category isPremium variants.pricing variants.images variants.colorName')
      .limit(6) 
      .lean();

    const formattedProducts = products.map((product) => {
      let matchingVariant = product.variants?.[0] || {};
      
      const colorMatch = product.variants?.find(v => v.colorName.match(searchRegex));
      if (colorMatch) {
        matchingVariant = colorMatch;
      }

      const firstImage = matchingVariant.images?.[0] || {};
      const pricing = matchingVariant.pricing || { price: 0, discountPercentage: 0 };

      const localizedPricing = calculateRegionalPricing(
        pricing.price, 
        pricing.discountPercentage, 
        product.isPremium || false, 
        regionData
      );

      return {
        _id: product._id,
        slug: product.slug,
        title: product.title,
        category: product.category,
        colorName: matchingVariant.colorName,
        isPremium: product.isPremium || false,
        originalPrice: localizedPricing.originalPrice, 
        finalPrice: localizedPricing.sellingPrice,      
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title,
        totalReviews: product.totalReviews,
        averageRating: product.averageRating,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      currencySymbol: regionData.symbol,      
      currencyCode: regionData.currencyCode
    });

  } catch (error) {
    console.error("Error searching products:", error);
    next(error);
  }
};


export const getFilterOptions = async (req, res, next) => {
  try {
    const [categories, materials] = await Promise.all([
      Product.distinct('category', { status: 'active' }),
      Product.distinct('variants.attributes.material', { status: 'active' })
    ]);

    const cleanCategories = categories.filter(Boolean).sort();
    const cleanMaterials = materials.filter(Boolean).sort();

    return res.status(200).json({
      success: true,
      data: {
        categories: cleanCategories,
        materials: cleanMaterials
      }
    });

  } catch (error) {
    console.error("Error fetching filter options:", error);
    next(error);
  }
};