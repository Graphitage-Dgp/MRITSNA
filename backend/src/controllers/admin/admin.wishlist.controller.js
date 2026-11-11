import Wishlist from '../../models/wishlist.model.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// ==========================================
// CALCULATE WISHLIST METRICS (TRUE REVENUE ENGINE)
// ==========================================
const calculateLiveWishlistMetrics = (wishlist, regionData = null) => {
  let totalItems = 0;
  const detailedItems = [];

  const isForeign = regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA';

  if (wishlist.items && wishlist.items.length > 0) {
    wishlist.items.forEach(wishlistItem => {
      if (!wishlistItem.productId) return; 

      const product = wishlistItem.productId;
      const variant = product.variants?.find(
        v => v._id.toString() === wishlistItem.variantId.toString()
      );

      if (variant) {
        const basePrice = variant.pricing?.price || 0;
        const discount = variant.pricing?.discountPercentage || 0;
        
        let baseSellingPriceINR = discount > 0 
          ? Math.round(basePrice - (basePrice * (discount / 100))) 
          : basePrice;

        if (isForeign) {
          const exportMarkupINR = product.isPremium ? 10000 : 5000;
          baseSellingPriceINR += exportMarkupINR;
        }

        totalItems += 1;

        let localizedData = null;
        if (isForeign) {
          const regionalPricing = calculateRegionalPricing(
            basePrice, 
            discount,
            product.isPremium || false,
            regionData
          );
          
          localizedData = {
            unitPrice: regionalPricing.sellingPrice,
            currencyCode: regionalPricing.currencyCode,
            symbol: regionalPricing.symbol
          };
        }

        detailedItems.push({
          wishlistItemKey: `${product._id}-${wishlistItem.variantId}`, 
          productId: product._id,
          title: product.title,
          slug: product.slug,
          isPremium: product.isPremium,
          variantId: variant._id,
          color: variant.colorName,
          sku: variant.sku,
          baseUnitPriceINR: baseSellingPriceINR, 
          localizedData, 
          stockAvailable: variant.inventory?.quantity || 0,
          isStockBottleneck: 1 > (variant.inventory?.quantity || 0),
          image: variant.images?.find(img => img.isPrimary)?.baseUrl || variant.images?.[0]?.baseUrl,
          addedAt: wishlistItem.addedAt
        });
      }
    });
  }

  return { totalItems, detailedItems };
};

// ==========================================
// HELPER: FORMAT UNIFIED USER / VISITOR IDENTITY
// ==========================================
const formatUnifiedWishlistCustomer = (wishlist) => {
  const effectiveRegion = wishlist.user?.lastKnownRegion || wishlist.lastKnownRegion || {
    countryCode: 'IN',
    currencyCode: 'INR',
    symbol: '₹',
    rate: 1
  };

  if (wishlist.user) {
    return {
      id: wishlist.user._id,
      name: `${wishlist.user.firstName || ''} ${wishlist.user.lastName || ''}`.trim() || 'Registered User',
      email: wishlist.user.email,
      phone: wishlist.user.phoneNumber ? `${wishlist.user.phoneCode || ''} ${wishlist.user.phoneNumber}`.trim() : 'Not Provided',
      registeredAt: wishlist.user.createdAt,
      countryCode: effectiveRegion.countryCode || 'IN',
      isGuest: false,
      userType: 'user',
      deviceId: wishlist.deviceId || null
    };
  }

  const shortDevice = wishlist.deviceId ? wishlist.deviceId.slice(0, 6).toUpperCase() : 'ANON';
  return {
    id: wishlist.deviceId || `guest-${wishlist._id}`,
    name: wishlist.guestName || `Visitor #${shortDevice}`,
    email: wishlist.guestEmail || `Anonymous Session (${shortDevice})`,
    phone: 'Not Provided (Guest)',
    registeredAt: wishlist.createdAt,
    countryCode: effectiveRegion.countryCode || 'IN',
    isGuest: true,
    userType: 'visitor',
    deviceId: wishlist.deviceId || null
  };
};

// ==========================================
// 1. GET DASHBOARD METRICS (DEMAND FORECASTING)
// ==========================================
export const getWishlistDashboardStats = async (req, res, next) => {
  try {
    const activeWishlists = await Wishlist.find({ 'items.0': { $exists: true } })
      .populate({ path: 'items.productId', select: 'title variants isPremium' })
      .lean();

    let totalActiveWishlists = activeWishlists.length;
    let userWishlistsCount = 0;
    let visitorWishlistsCount = 0;
    let totalItemsAccrossPlatform = 0;
    
    const productPopularity = {}; 

    activeWishlists.forEach(wishlist => {
      if (wishlist.user) {
        userWishlistsCount++;
      } else {
        visitorWishlistsCount++;
      }

      const metrics = calculateLiveWishlistMetrics(wishlist, null);
      totalItemsAccrossPlatform += metrics.totalItems;

      metrics.detailedItems.forEach(item => {
        if (!productPopularity[item.productId]) {
          productPopularity[item.productId] = { 
            title: item.title, 
            sku: item.sku, 
            image: item.image, 
            count: 0 
          };
        }
        productPopularity[item.productId].count += 1;
      });
    });

    const topWishlistedProducts = Object.values(productPopularity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalActiveWishlists,
        userWishlistsCount,
        visitorWishlistsCount,
        averageItemsPerWishlist: totalActiveWishlists > 0 ? Math.round((totalItemsAccrossPlatform / totalActiveWishlists) * 10) / 10 : 0,
        topWishlistedProducts
      }
    });

  } catch (error) {
    console.error("[Admin Wishlist Stats Error]", error);
    next(error);
  }
};

// ==========================================
// 2. GET PAGINATED LIST (UNIFIED USERS & VISITORS + REGION FILTER)
// ==========================================
export const getAllActiveWishlists = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const regionFilter = req.query.region || 'global'; 
    const userTypeFilter = req.query.userType || 'all'; // 'all', 'user', 'visitor'

    const andConditions = [{ 'items.0': { $exists: true } }];

    if (userTypeFilter === 'user') {
      andConditions.push({ user: { $ne: null } });
    } else if (userTypeFilter === 'visitor') {
      andConditions.push({ user: null });
    }

    // --- UNIFIED REGION FILTERING STRATEGY ---
    if (regionFilter !== 'global') {
      let userQuery = {};
      let guestRegionCondition = {};

      if (regionFilter === 'domestic') {
        userQuery = { 
          $or: [
            { 'lastKnownRegion.countryCode': { $in: ['IN', 'INDIA'] } },
            { lastKnownRegion: { $exists: false } }
          ]
        };
        guestRegionCondition = {
          user: null,
          $or: [
            { 'lastKnownRegion.countryCode': { $in: ['IN', 'INDIA'] } },
            { lastKnownRegion: { $exists: false } }
          ]
        };
      } else if (regionFilter === 'international') {
        userQuery = { 
          'lastKnownRegion.countryCode': { $nin: ['IN', 'INDIA', null, ''] },
          lastKnownRegion: { $exists: true }
        };
        guestRegionCondition = {
          user: null,
          'lastKnownRegion.countryCode': { $nin: ['IN', 'INDIA', null, ''] },
          lastKnownRegion: { $exists: true }
        };
      } else {
        const targetCode = regionFilter.toUpperCase();
        userQuery = { 'lastKnownRegion.countryCode': targetCode };
        guestRegionCondition = { user: null, 'lastKnownRegion.countryCode': targetCode };
      }

      const matchingUsers = await User.find(userQuery).select('_id').lean();
      const matchingUserIds = matchingUsers.map(user => user._id);

      andConditions.push({
        $or: [
          ...(matchingUserIds.length > 0 ? [{ user: { $in: matchingUserIds } }] : []),
          guestRegionCondition
        ]
      });
    }

    const query = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
    const skip = (page - 1) * limit;

    const [wishlists, totalCount] = await Promise.all([
      Wishlist.find(query)
        .populate({ path: 'user', select: 'firstName lastName email phoneCode phoneNumber createdAt lastKnownRegion' })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Wishlist.countDocuments(query)
    ]);

    const formattedWishlists = wishlists.map(wishlist => {
      const effectiveRegion = wishlist.user?.lastKnownRegion || wishlist.lastKnownRegion;
      const isForeign = effectiveRegion && effectiveRegion.countryCode !== 'IN' && effectiveRegion.countryCode !== 'INDIA';
      const customerInfo = formatUnifiedWishlistCustomer(wishlist);

      return {
        wishlistId: wishlist._id,
        user: customerInfo,
        isGuest: customerInfo.isGuest,
        userType: customerInfo.userType,
        deviceId: wishlist.deviceId || null,
        itemCount: wishlist.items.length,
        isForeign: Boolean(isForeign),
        lastActive: wishlist.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedWishlists,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("[Admin Get All Wishlists Error]", error);
    next(error);
  }
};

// ==========================================
// 3. GET DEEP-DIVE DETAILS FOR A SPECIFIC WISHLIST
// ==========================================
export const getWishlistDetails = async (req, res, next) => {
  try {
    const { wishlistId } = req.params;

    const wishlist = await Wishlist.findById(wishlistId)
      .populate({ path: 'user', select: 'firstName lastName email phoneCode phoneNumber createdAt lastKnownRegion' })
      .populate({ path: 'items.productId', select: 'title slug isPremium variants' })
      .lean();

    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    const effectiveRegion = wishlist.user?.lastKnownRegion || wishlist.lastKnownRegion;
    const metrics = calculateLiveWishlistMetrics(wishlist, effectiveRegion);
    const formattedUser = formatUnifiedWishlistCustomer(wishlist);
    const isForeign = effectiveRegion && effectiveRegion.countryCode !== 'IN' && effectiveRegion.countryCode !== 'INDIA';

    metrics.detailedItems.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    return res.status(200).json({
      success: true,
      data: {
        wishlistId: wishlist._id,
        user: formattedUser,
        isGuest: formattedUser.isGuest,
        userType: formattedUser.userType,
        deviceId: wishlist.deviceId || null,
        summary: {
          totalItems: metrics.totalItems,
          currencyCode: effectiveRegion?.currencyCode || 'INR',
          symbol: effectiveRegion?.symbol || '₹',
          isForeign: Boolean(isForeign),
          lastActive: wishlist.updatedAt,
        },
        items: metrics.detailedItems
      }
    });

  } catch (error) {
    console.error("[Admin Get Wishlist Details Error]", error);
    next(error);
  }
};
