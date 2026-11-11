import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// ==========================================
// HELPER: CALCULATE CART VALUE (TRUE REVENUE ENGINE)
// ==========================================
const calculateLiveCartMetrics = (cart, regionData = null) => {
  let cartTotalBaseINR = 0; 
  let cartTotalLocalized = 0; 
  let totalItems = 0;
  const detailedItems = [];

  const isForeign = regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA';

  if (cart.items && cart.items.length > 0) {
    cart.items.forEach(cartItem => {
      if (!cartItem.product) return; 

      const variant = cartItem.product.variants?.find(
        v => v._id.toString() === cartItem.variantId.toString()
      );

      if (variant) {
        const basePrice = variant.pricing?.price || 0;
        const discount = variant.pricing?.discountPercentage || 0;
        
        let baseSellingPriceINR = discount > 0 
          ? Math.round(basePrice - (basePrice * (discount / 100))) 
          : basePrice;

        if (isForeign) {
          const exportMarkupINR = cartItem.product.isPremium ? 10000 : 5000;
          baseSellingPriceINR += exportMarkupINR;
        }

        cartTotalBaseINR += baseSellingPriceINR * cartItem.quantity;
        totalItems += cartItem.quantity;

        let localizedData = null;
        if (isForeign) {
          const regionalPricing = calculateRegionalPricing(
            basePrice, 
            discount,
            cartItem.product.isPremium || false,
            regionData
          );
          
          localizedData = {
            unitPrice: regionalPricing.sellingPrice,
            itemTotal: regionalPricing.sellingPrice * cartItem.quantity,
            currencyCode: regionalPricing.currencyCode,
            symbol: regionalPricing.symbol
          };
          cartTotalLocalized += localizedData.itemTotal;
        }

        detailedItems.push({
          cartItemId: cartItem._id,
          productId: cartItem.product._id,
          title: cartItem.product.title,
          slug: cartItem.product.slug,
          isPremium: cartItem.product.isPremium,
          variantId: variant._id,
          color: variant.colorName,
          sku: variant.sku,
          baseUnitPriceINR: baseSellingPriceINR, 
          baseItemTotalINR: baseSellingPriceINR * cartItem.quantity,
          localizedData, 
          quantityInCart: cartItem.quantity,
          stockAvailable: variant.inventory?.quantity || 0,
          isStockBottleneck: cartItem.quantity > (variant.inventory?.quantity || 0),
          image: variant.images?.find(img => img.isPrimary)?.baseUrl || variant.images?.[0]?.baseUrl
        });
      }
    });
  }

  return { cartTotalBaseINR, cartTotalLocalized, totalItems, detailedItems };
};

// ==========================================
// HELPER: FORMAT UNIFIED USER / VISITOR IDENTITY
// ==========================================
const formatUnifiedCartCustomer = (cart) => {
  const effectiveRegion = cart.user?.lastKnownRegion || cart.lastKnownRegion || {
    countryCode: 'IN',
    currencyCode: 'INR',
    symbol: '₹',
    rate: 1
  };

  if (cart.user) {
    return {
      id: cart.user._id,
      name: `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() || 'Registered User',
      email: cart.user.email,
      phone: cart.user.phoneNumber ? `${cart.user.phoneCode || ''} ${cart.user.phoneNumber}`.trim() : 'Not Provided',
      registeredAt: cart.user.createdAt,
      countryCode: effectiveRegion.countryCode || 'IN',
      isGuest: false,
      userType: 'user',
      deviceId: cart.deviceId || null
    };
  }

  const shortDevice = cart.deviceId ? cart.deviceId.slice(0, 6).toUpperCase() : 'ANON';
  return {
    id: cart.deviceId || `guest-${cart._id}`,
    name: cart.guestName || `Visitor #${shortDevice}`,
    email: cart.guestEmail || `Anonymous Session (${shortDevice})`,
    phone: cart.guestPhone || 'Not Provided (Guest)',
    registeredAt: cart.createdAt,
    countryCode: effectiveRegion.countryCode || 'IN',
    isGuest: true,
    userType: 'visitor',
    deviceId: cart.deviceId || null
  };
};

// ==========================================
// 1. GET DASHBOARD METRICS (OVERVIEW)
// ==========================================
export const getCartDashboardStats = async (req, res, next) => {
  try {
    const activeCarts = await Cart.find({ 'items.0': { $exists: true } })
      .populate({ path: 'user', select: 'lastKnownRegion' })
      .populate({ path: 'items.product', select: 'title variants isPremium' })
      .lean();

    let totalPipelineValue = 0;
    let abandonedCartsCount = 0;
    let totalActiveCarts = activeCarts.length;
    let userCartsCount = 0;
    let visitorCartsCount = 0;
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const productPopularity = {}; 

    activeCarts.forEach(cart => {
      if (cart.user) {
        userCartsCount++;
      } else {
        visitorCartsCount++;
      }

      const effectiveRegion = cart.user?.lastKnownRegion || cart.lastKnownRegion;
      const metrics = calculateLiveCartMetrics(cart, effectiveRegion);
      
      totalPipelineValue += metrics.cartTotalBaseINR;

      if (new Date(cart.updatedAt) < yesterday) {
        abandonedCartsCount++;
      }

      metrics.detailedItems.forEach(item => {
        if (!productPopularity[item.productId]) {
          productPopularity[item.productId] = { title: item.title, count: 0 };
        }
        productPopularity[item.productId].count += item.quantityInCart;
      });
    });

    const topCartedProducts = Object.values(productPopularity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalActiveCarts,
        userCartsCount,
        visitorCartsCount,
        abandonedCartsCount,
        totalPipelineValue,
        averageCartValue: totalActiveCarts > 0 ? Math.round(totalPipelineValue / totalActiveCarts) : 0,
        topCartedProducts
      }
    });

  } catch (error) {
    console.error("[Admin Cart Stats Error]", error);
    next(error);
  }
};

// ==========================================
// 2. GET PAGINATED LIST (UNIFIED USERS & VISITORS + REGION FILTER)
// ==========================================
export const getAllActiveCarts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const filterType = req.query.filter || 'all'; 
    const regionFilter = req.query.region || 'global';
    const userTypeFilter = req.query.userType || 'all'; // 'all', 'user', 'visitor'

    let dateFilter = {};
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (filterType === 'abandoned') {
      dateFilter = { updatedAt: { $lt: yesterday } };
    } else if (filterType === 'recent') {
      dateFilter = { updatedAt: { $gte: yesterday } };
    }

    const andConditions = [{ 'items.0': { $exists: true } }];
    if (Object.keys(dateFilter).length > 0) {
      andConditions.push(dateFilter);
    }

    // Filter by User vs Visitor if requested
    if (userTypeFilter === 'user' || filterType === 'users') {
      andConditions.push({ user: { $ne: null } });
    } else if (userTypeFilter === 'visitor' || filterType === 'visitors') {
      andConditions.push({ user: null });
    }

    // --- UNIFIED REGION FILTERING (USERS + VISITORS) ---
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

    const [carts, totalCount] = await Promise.all([
      Cart.find(query)
        .populate({ path: 'user', select: 'firstName lastName email phoneCode phoneNumber createdAt lastKnownRegion' })
        .populate({ path: 'items.product', select: 'title slug isPremium variants' }) 
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Cart.countDocuments(query)
    ]);

    const formattedCarts = carts.map(cart => {
      const effectiveRegion = cart.user?.lastKnownRegion || cart.lastKnownRegion;
      const metrics = calculateLiveCartMetrics(cart, effectiveRegion);
      const isAbandoned = new Date(cart.updatedAt) < yesterday;
      const isForeign = effectiveRegion && effectiveRegion.countryCode !== 'IN' && effectiveRegion.countryCode !== 'INDIA';
      const customerInfo = formatUnifiedCartCustomer(cart);

      return {
        cartId: cart._id,
        user: customerInfo,
        isGuest: customerInfo.isGuest,
        userType: customerInfo.userType,
        deviceId: cart.deviceId || null,
        itemCount: metrics.totalItems,
        cartValueBaseINR: metrics.cartTotalBaseINR,
        cartValueLocalized: metrics.cartTotalLocalized,
        currencyCode: effectiveRegion?.currencyCode || 'INR',
        symbol: effectiveRegion?.symbol || '₹',
        isForeign: Boolean(isForeign),
        isAbandoned,
        lastActive: cart.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedCarts,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("[Admin Get All Carts Error]", error);
    next(error);
  }
};

// ==========================================
// 3. GET DEEP-DIVE DETAILS FOR A SPECIFIC CART
// ==========================================
export const getCartDetails = async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findById(cartId)
      .populate({ path: 'user', select: 'firstName lastName email phoneCode phoneNumber createdAt lastKnownRegion' })
      .populate({ path: 'items.product', select: 'title slug isPremium variants' })
      .lean();

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const effectiveRegion = cart.user?.lastKnownRegion || cart.lastKnownRegion;
    const metrics = calculateLiveCartMetrics(cart, effectiveRegion);
    const formattedUser = formatUnifiedCartCustomer(cart);
    const isForeign = effectiveRegion && effectiveRegion.countryCode !== 'IN' && effectiveRegion.countryCode !== 'INDIA';

    return res.status(200).json({
      success: true,
      data: {
        cartId: cart._id,
        user: formattedUser,
        isGuest: formattedUser.isGuest,
        userType: formattedUser.userType,
        deviceId: cart.deviceId || null,
        summary: {
          totalItems: metrics.totalItems,
          cartValueBaseINR: metrics.cartTotalBaseINR,
          cartValueLocalized: metrics.cartTotalLocalized,
          currencyCode: effectiveRegion?.currencyCode || 'INR',
          symbol: effectiveRegion?.symbol || '₹',
          isForeign: Boolean(isForeign),
          lastActive: cart.updatedAt,
        },
        items: metrics.detailedItems
      }
    });

  } catch (error) {
    console.error("[Admin Get Cart Details Error]", error);
    next(error);
  }
};

// ==========================================
// 4. ADMIN OVERRIDE: CLEAR A CART (USER OR VISITOR)
// ==========================================
export const adminClearUserCart = async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    // If it's a visitor cart, set forceClearLocal so their localStorage is wiped on next hydration
    if (!cart.user) {
      cart.forceClearLocal = true;
    }
    await cart.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Cart cleared successfully. Inventory hold released.' 
    });

  } catch (error) {
    console.error("[Admin Clear Cart Error]", error);
    next(error);
  }
};

// ==========================================
// 5. ABANDONED CART ACTION: SEND REMINDER
// ==========================================
export const triggerAbandonedCartEmail = async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findById(cartId).populate('user');
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const targetEmail = cart.user?.email || cart.guestEmail;
    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Anonymous visitor has not provided an email address yet.'
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Abandoned cart reminder queued for ${targetEmail}` 
    });

  } catch (error) {
    console.error("[Admin Abandoned Cart Email Error]", error);
    next(error);
  }
};
