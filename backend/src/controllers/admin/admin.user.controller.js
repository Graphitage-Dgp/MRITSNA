import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import Cart from '../../models/cart.model.js';
import Wishlist from '../../models/wishlist.model.js';
import Order from '../../models/order.model.js';
import Review from '../../models/review.model.js';
import Visit from '../../models/visit.model.js';
import Session from '../../models/session.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// ==========================================
// HELPER: COMPUTE CART ITEMS & TOTALS FOR DRAWER
// ==========================================
const buildFormattedCart = (cart, regionData) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      cartId: cart?._id || null,
      totalItems: 0,
      cartValueBaseINR: 0,
      cartValueLocalized: 0,
      currencyCode: regionData?.currencyCode || 'INR',
      symbol: regionData?.symbol || '₹',
      isForeign: Boolean(regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA'),
      lastActive: cart?.updatedAt || null,
      items: []
    };
  }

  let cartTotalBaseINR = 0;
  let cartTotalLocalized = 0;
  let totalItems = 0;
  const detailedItems = [];
  const isForeign = Boolean(regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA');

  cart.items.forEach(cartItem => {
    if (!cartItem.product) return;
    const variant = cartItem.product.variants?.find(
      v => v._id.toString() === cartItem.variantId.toString()
    );
    if (!variant) return;

    const basePrice = variant.pricing?.price || 0;
    const discount = variant.pricing?.discountPercentage || 0;
    let baseSellingPriceINR = discount > 0
      ? Math.round(basePrice - (basePrice * (discount / 100)))
      : basePrice;

    if (isForeign) {
      baseSellingPriceINR += cartItem.product.isPremium ? 10000 : 5000;
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
      variantId: variant._id,
      color: variant.colorName,
      sku: variant.sku,
      quantity: cartItem.quantity,
      baseUnitPriceINR: baseSellingPriceINR,
      baseItemTotalINR: baseSellingPriceINR * cartItem.quantity,
      localizedData,
      stockAvailable: variant.inventory?.quantity || 0,
      image: variant.images?.find(img => img.isPrimary)?.baseUrl || variant.images?.[0]?.baseUrl
    });
  });

  return {
    cartId: cart._id,
    totalItems,
    cartValueBaseINR,
    cartValueLocalized,
    currencyCode: regionData?.currencyCode || 'INR',
    symbol: regionData?.symbol || '₹',
    isForeign,
    lastActive: cart.updatedAt,
    items: detailedItems
  };
};

// ==========================================
// HELPER: COMPUTE WISHLIST ITEMS FOR DRAWER
// ==========================================
const buildFormattedWishlist = (wishlist, regionData) => {
  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return {
      wishlistId: wishlist?._id || null,
      totalItems: 0,
      currencyCode: regionData?.currencyCode || 'INR',
      symbol: regionData?.symbol || '₹',
      isForeign: Boolean(regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA'),
      lastActive: wishlist?.updatedAt || null,
      items: []
    };
  }

  const detailedItems = [];
  const isForeign = Boolean(regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA');

  wishlist.items.forEach(wItem => {
    if (!wItem.productId) return;
    const product = wItem.productId;
    const variant = product.variants?.find(
      v => v._id.toString() === wItem.variantId.toString()
    );
    if (!variant) return;

    const basePrice = variant.pricing?.price || 0;
    const discount = variant.pricing?.discountPercentage || 0;
    let baseSellingPriceINR = discount > 0
      ? Math.round(basePrice - (basePrice * (discount / 100)))
      : basePrice;

    if (isForeign) {
      baseSellingPriceINR += product.isPremium ? 10000 : 5000;
    }

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
      wishlistItemKey: `${product._id}-${wItem.variantId}`,
      productId: product._id,
      title: product.title,
      slug: product.slug,
      variantId: variant._id,
      color: variant.colorName,
      sku: variant.sku,
      baseUnitPriceINR: baseSellingPriceINR,
      localizedData,
      stockAvailable: variant.inventory?.quantity || 0,
      addedAt: wItem.addedAt,
      image: variant.images?.find(img => img.isPrimary)?.baseUrl || variant.images?.[0]?.baseUrl
    });
  });

  return {
    wishlistId: wishlist._id,
    totalItems: detailedItems.length,
    currencyCode: regionData?.currencyCode || 'INR',
    symbol: regionData?.symbol || '₹',
    isForeign,
    lastActive: wishlist.updatedAt,
    items: detailedItems
  };
};

// ==========================================
// HELPER: BUILD UNIFIED DIRECTORY OF USERS + VISITORS
// ==========================================
const compileUnifiedUserDirectory = async () => {
  const [
    users,
    carts,
    wishlists,
    orders,
    reviews,
    sessions,
    visits
  ] = await Promise.all([
    User.find({ role: { $ne: 'admin' } }).lean(),
    Cart.find({ 'items.0': { $exists: true } }).lean(),
    Wishlist.find({ 'items.0': { $exists: true } }).lean(),
    Order.find({}).select('user deviceId isGuestCheckout guestEmail shippingAddress paymentStatus orderStatus subTotal discountAmount shippingCost paymentCurrency createdAt orderNumber').lean(),
    Review.find({ isAdminGenerated: { $ne: true } }).select('user deviceId guestName guestEmail rating status createdAt').lean(),
    Session.find({}).select('user device_id updatedAt').lean(),
    Visit.find({}).sort({ updatedAt: -1 }).lean()
  ]);

  // Map known device_ids that belong to registered users so we don't duplicate them as visitors
  const claimedDeviceIds = new Set();
  const userDevicesMap = new Map();

  sessions.forEach(s => {
    if (s.device_id && s.user) {
      claimedDeviceIds.add(s.device_id);
      const uid = s.user.toString();
      if (!userDevicesMap.has(uid)) userDevicesMap.set(uid, new Set());
      userDevicesMap.get(uid).add(s.device_id);
    }
  });

  orders.forEach(o => {
    if (o.user && o.deviceId) {
      claimedDeviceIds.add(o.deviceId);
      const uid = o.user.toString();
      if (!userDevicesMap.has(uid)) userDevicesMap.set(uid, new Set());
      userDevicesMap.get(uid).add(o.deviceId);
    }
  });

  // Index Carts & Wishlists by userId and by deviceId
  const userCartMap = new Map();
  const guestCartMap = new Map();
  carts.forEach(c => {
    const itemCount = (c.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
    if (c.user) {
      userCartMap.set(c.user.toString(), { cart: c, itemCount });
    } else if (c.deviceId) {
      guestCartMap.set(c.deviceId, { cart: c, itemCount });
    }
  });

  const userWishlistMap = new Map();
  const guestWishlistMap = new Map();
  wishlists.forEach(w => {
    const itemCount = (w.items || []).length;
    if (w.user) {
      userWishlistMap.set(w.user.toString(), { wishlist: w, itemCount });
    } else if (w.deviceId) {
      guestWishlistMap.set(w.deviceId, { wishlist: w, itemCount });
    }
  });

  // Index Orders by userId and by deviceId
  const userOrderMap = new Map();
  const guestOrderMap = new Map();
  orders.forEach(o => {
    const isPaid = ['Completed', 'Partially Paid'].includes(o.paymentStatus);
    const orderTotal = (o.subTotal || 0) - (o.discountAmount || 0) + (o.shippingCost || 0);

    if (o.user) {
      const uid = o.user.toString();
      const prev = userOrderMap.get(uid) || { totalOrders: 0, paidOrders: 0, totalSpent: 0, lastOrderAt: null, currency: o.paymentCurrency || 'INR' };
      prev.totalOrders += 1;
      if (isPaid) {
        prev.paidOrders += 1;
        prev.totalSpent += orderTotal;
      }
      if (!prev.lastOrderAt || new Date(o.createdAt) > new Date(prev.lastOrderAt)) {
        prev.lastOrderAt = o.createdAt;
      }
      userOrderMap.set(uid, prev);
    } else if (o.deviceId) {
      const prev = guestOrderMap.get(o.deviceId) || {
        totalOrders: 0,
        paidOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
        currency: o.paymentCurrency || 'INR',
        guestEmail: null,
        guestName: null,
        guestPhone: null,
        country: null
      };
      prev.totalOrders += 1;
      if (isPaid) {
        prev.paidOrders += 1;
        prev.totalSpent += orderTotal;
      }
      if (!prev.lastOrderAt || new Date(o.createdAt) > new Date(prev.lastOrderAt)) {
        prev.lastOrderAt = o.createdAt;
      }
      if (!prev.guestEmail && (o.guestEmail || o.shippingAddress?.email)) {
        prev.guestEmail = o.guestEmail || o.shippingAddress?.email;
      }
      if (!prev.guestName && o.shippingAddress?.firstName) {
        prev.guestName = `${o.shippingAddress.firstName} ${o.shippingAddress.lastName || ''}`.trim();
      }
      if (!prev.guestPhone && o.shippingAddress?.phone) {
        prev.guestPhone = o.shippingAddress.phone;
      }
      if (!prev.country && o.shippingAddress?.country) {
        prev.country = o.shippingAddress.country;
      }
      guestOrderMap.set(o.deviceId, prev);
    }
  });

  // Index Reviews by userId and by deviceId
  const userReviewMap = new Map();
  const guestReviewMap = new Map();
  reviews.forEach(r => {
    if (r.user) {
      const uid = r.user.toString();
      const prev = userReviewMap.get(uid) || { count: 0, ratingSum: 0, lastReviewAt: null };
      prev.count += 1;
      prev.ratingSum += Number(r.rating || 0);
      if (!prev.lastReviewAt || new Date(r.createdAt) > new Date(prev.lastReviewAt)) {
        prev.lastReviewAt = r.createdAt;
      }
      userReviewMap.set(uid, prev);
    } else if (r.deviceId) {
      const prev = guestReviewMap.get(r.deviceId) || { count: 0, ratingSum: 0, lastReviewAt: null, guestName: null, guestEmail: null };
      prev.count += 1;
      prev.ratingSum += Number(r.rating || 0);
      if (!prev.lastReviewAt || new Date(r.createdAt) > new Date(prev.lastReviewAt)) {
        prev.lastReviewAt = r.createdAt;
      }
      if (!prev.guestName && r.guestName) prev.guestName = r.guestName;
      if (!prev.guestEmail && r.guestEmail) prev.guestEmail = r.guestEmail;
      guestReviewMap.set(r.deviceId, prev);
    }
  });

  // Index Visits by deviceId / sessionId
  const guestVisitMap = new Map();
  visits.forEach(v => {
    const key = v.deviceId || v.sessionId;
    if (!key) return;
    if (!guestVisitMap.has(key)) {
      guestVisitMap.set(key, v);
    }
  });

  const directory = [];

  // 1. Add all Registered Users
  users.forEach(u => {
    const uid = u._id.toString();
    const cartEntry = userCartMap.get(uid);
    const wishlistEntry = userWishlistMap.get(uid);
    const orderEntry = userOrderMap.get(uid) || { totalOrders: 0, paidOrders: 0, totalSpent: 0, lastOrderAt: null };
    const reviewEntry = userReviewMap.get(uid) || { count: 0, ratingSum: 0, lastReviewAt: null };

    const timestamps = [
      u.updatedAt,
      u.createdAt,
      cartEntry?.cart?.updatedAt,
      wishlistEntry?.wishlist?.updatedAt,
      orderEntry.lastOrderAt,
      reviewEntry.lastReviewAt
    ].filter(Boolean).map(d => new Date(d).getTime());

    const lastActive = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : u.createdAt;
    const countryCode = u.lastKnownRegion?.countryCode || 'IN';
    const isForeign = countryCode !== 'IN' && countryCode !== 'INDIA';

    directory.push({
      entityId: `user_${uid}`,
      id: uid,
      userType: 'user',
      isGuest: false,
      isVerified: Boolean(u.isVerified),
      isClaimed: Boolean(u.isClaimed),
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Registered User',
      email: u.email,
      phone: u.phoneNumber ? `${u.phoneCode || ''} ${u.phoneNumber}`.trim() : 'Not Provided',
      countryCode,
      currencyCode: u.lastKnownRegion?.currencyCode || 'INR',
      symbol: u.lastKnownRegion?.symbol || '₹',
      isForeign,
      cartItemsCount: cartEntry?.itemCount || 0,
      wishlistItemsCount: wishlistEntry?.itemCount || 0,
      ordersCount: orderEntry.totalOrders,
      paidOrdersCount: orderEntry.paidOrders,
      totalSpent: orderEntry.totalSpent,
      reviewsCount: reviewEntry.count,
      avgRating: reviewEntry.count > 0 ? Number((reviewEntry.ratingSum / reviewEntry.count).toFixed(1)) : 0,
      registeredAt: u.createdAt,
      lastActive
    });
  });

  // 2. Collect all distinct Visitor deviceIds across Carts, Wishlists, Orders, Reviews, and Visits
  const visitorKeys = new Set();
  guestCartMap.forEach((_, devId) => { if (!claimedDeviceIds.has(devId)) visitorKeys.add(devId); });
  guestWishlistMap.forEach((_, devId) => { if (!claimedDeviceIds.has(devId)) visitorKeys.add(devId); });
  guestOrderMap.forEach((_, devId) => { if (!claimedDeviceIds.has(devId)) visitorKeys.add(devId); });
  guestReviewMap.forEach((_, devId) => { if (!claimedDeviceIds.has(devId)) visitorKeys.add(devId); });
  guestVisitMap.forEach((v, key) => {
    if (!v.user && !claimedDeviceIds.has(key)) {
      visitorKeys.add(key);
    }
  });

  visitorKeys.forEach(devKey => {
    const cartEntry = guestCartMap.get(devKey);
    const wishlistEntry = guestWishlistMap.get(devKey);
    const orderEntry = guestOrderMap.get(devKey) || { totalOrders: 0, paidOrders: 0, totalSpent: 0, lastOrderAt: null };
    const reviewEntry = guestReviewMap.get(devKey) || { count: 0, ratingSum: 0, lastReviewAt: null };
    const visitEntry = guestVisitMap.get(devKey);

    const shortCode = devKey.slice(0, 6).toUpperCase();
    const resolvedName =
      cartEntry?.cart?.guestName ||
      wishlistEntry?.wishlist?.guestName ||
      orderEntry.guestName ||
      reviewEntry.guestName ||
      `Visitor #${shortCode}`;

    const resolvedEmail =
      cartEntry?.cart?.guestEmail ||
      wishlistEntry?.wishlist?.guestEmail ||
      orderEntry.guestEmail ||
      reviewEntry.guestEmail ||
      `Anonymous (${shortCode})`;

    const resolvedPhone =
      cartEntry?.cart?.guestPhone ||
      orderEntry.guestPhone ||
      (visitEntry?.deviceType ? `${visitEntry.deviceType} • ${visitEntry.channel || 'Direct'}` : 'Anonymous Session');

    const regionObj =
      cartEntry?.cart?.lastKnownRegion ||
      wishlistEntry?.wishlist?.lastKnownRegion ||
      { countryCode: visitEntry?.country || 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const countryCode = regionObj.countryCode || 'IN';
    const isForeign = countryCode !== 'IN' && countryCode !== 'INDIA';

    const timestamps = [
      cartEntry?.cart?.updatedAt,
      wishlistEntry?.wishlist?.updatedAt,
      orderEntry.lastOrderAt,
      reviewEntry.lastReviewAt,
      visitEntry?.updatedAt,
      visitEntry?.createdAt
    ].filter(Boolean).map(d => new Date(d).getTime());

    const lastActive = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();
    const firstSeen = visitEntry?.createdAt || cartEntry?.cart?.createdAt || wishlistEntry?.wishlist?.createdAt || lastActive;

    directory.push({
      entityId: `visitor_${devKey}`,
      id: devKey,
      userType: 'visitor',
      isGuest: true,
      isVerified: false,
      isClaimed: false,
      name: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      deviceId: devKey,
      channel: visitEntry?.channel || 'Direct Traffic',
      deviceType: visitEntry?.deviceType || 'Desktop',
      countryCode,
      currencyCode: regionObj.currencyCode || 'INR',
      symbol: regionObj.symbol || '₹',
      isForeign,
      cartItemsCount: cartEntry?.itemCount || 0,
      wishlistItemsCount: wishlistEntry?.itemCount || 0,
      ordersCount: orderEntry.totalOrders,
      paidOrdersCount: orderEntry.paidOrders,
      totalSpent: orderEntry.totalSpent,
      reviewsCount: reviewEntry.count,
      avgRating: reviewEntry.count > 0 ? Number((reviewEntry.ratingSum / reviewEntry.count).toFixed(1)) : 0,
      registeredAt: firstSeen,
      lastActive
    });
  });

  // Sort by most recently active first
  directory.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
  return directory;
};

// ==========================================
// 1. GET USERS DASHBOARD STATS
// ==========================================
export const getUserDashboardStats = async (req, res, next) => {
  try {
    const directory = await compileUnifiedUserDirectory();

    const totalProfiles = directory.length;
    const registeredUsersCount = directory.filter(u => u.userType === 'user').length;
    const visitorsCount = directory.filter(u => u.userType === 'visitor').length;
    const activeShoppersCount = directory.filter(u => u.cartItemsCount > 0 || u.wishlistItemsCount > 0).length;
    const totalReviewsSubmitted = directory.reduce((sum, u) => sum + u.reviewsCount, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalProfiles,
        registeredUsersCount,
        visitorsCount,
        activeShoppersCount,
        totalReviewsSubmitted
      }
    });
  } catch (error) {
    console.error("[Admin User Stats Error]:", error);
    next(error);
  }
};

// ==========================================
// 2. GET PAGINATED UNIFIED USERS & VISITORS LIST
// ==========================================
export const getAllUsersAndVisitors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const typeFilter = req.query.type || 'all'; // 'all', 'user', 'visitor'
    const activityFilter = req.query.activity || 'all'; // 'all', 'has_cart', 'has_wishlist', 'has_orders', 'has_reviews'
    const regionFilter = req.query.region || 'global';
    const search = (req.query.search || '').trim().toLowerCase();

    let directory = await compileUnifiedUserDirectory();

    // 1. Filter by User vs Visitor
    if (typeFilter === 'user') {
      directory = directory.filter(item => item.userType === 'user');
    } else if (typeFilter === 'visitor') {
      directory = directory.filter(item => item.userType === 'visitor');
    }

    // 2. Filter by Activity
    if (activityFilter === 'has_cart') {
      directory = directory.filter(item => item.cartItemsCount > 0);
    } else if (activityFilter === 'has_wishlist') {
      directory = directory.filter(item => item.wishlistItemsCount > 0);
    } else if (activityFilter === 'has_orders') {
      directory = directory.filter(item => item.ordersCount > 0);
    } else if (activityFilter === 'has_reviews') {
      directory = directory.filter(item => item.reviewsCount > 0);
    }

    // 3. Filter by Region
    if (regionFilter !== 'global') {
      if (regionFilter === 'domestic') {
        directory = directory.filter(item => !item.isForeign);
      } else if (regionFilter === 'international') {
        directory = directory.filter(item => item.isForeign);
      } else {
        const target = regionFilter.toUpperCase();
        directory = directory.filter(item => (item.countryCode || '').toUpperCase() === target);
      }
    }

    // 4. Search by Name, Email, Phone, or Device ID
    if (search) {
      directory = directory.filter(item =>
        (item.name || '').toLowerCase().includes(search) ||
        (item.email || '').toLowerCase().includes(search) ||
        (item.phone || '').toLowerCase().includes(search) ||
        (item.id || '').toLowerCase().includes(search)
      );
    }

    const totalItems = directory.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const skip = (page - 1) * limit;
    const paginatedData = directory.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("[Admin Get All Users & Visitors Error]:", error);
    next(error);
  }
};

// ==========================================
// 3. GET 360-DEGREE USER / VISITOR DETAILS (CART, WISHLIST, ORDERS, REVIEWS)
// ==========================================
export const getUserFullProfileDetails = async (req, res, next) => {
  try {
    const { entityKey } = req.params; // Format: "user_<ObjectId>" or "visitor_<deviceId>"

    const isRegisteredUser = entityKey.startsWith('user_');
    const rawId = entityKey.replace(/^(user_|visitor_)/, '');

    if (isRegisteredUser) {
      if (!mongoose.Types.ObjectId.isValid(rawId)) {
        return res.status(400).json({ success: false, message: 'Invalid User ID' });
      }

      const user = await User.findById(rawId).populate('addresses').lean();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const [cart, wishlist, orders, reviews, sessions] = await Promise.all([
        Cart.findOne({ user: user._id })
          .populate({ path: 'items.product', select: 'title slug isPremium variants' })
          .lean(),
        Wishlist.findOne({ user: user._id })
          .populate({ path: 'items.productId', select: 'title slug isPremium variants' })
          .lean(),
        Order.find({
          $or: [
            { user: user._id },
            { guestEmail: user.email?.toLowerCase() }
          ]
        })
          .sort({ createdAt: -1 })
          .lean(),
        Review.find({ user: user._id })
          .populate({ path: 'product', select: 'title slug variants' })
          .populate({ path: 'order', select: 'orderNumber' })
          .sort({ createdAt: -1 })
          .lean(),
        Session.find({ user: user._id }).sort({ updatedAt: -1 }).limit(5).lean()
      ]);

      const effectiveRegion = user.lastKnownRegion || cart?.lastKnownRegion || wishlist?.lastKnownRegion || {
        countryCode: 'IN',
        currencyCode: 'INR',
        symbol: '₹',
        rate: 1
      };

      const formattedCart = buildFormattedCart(cart, effectiveRegion);
      const formattedWishlist = buildFormattedWishlist(wishlist, effectiveRegion);

      const formattedReviews = reviews.map(r => {
        const prodImg = r.product?.variants?.[0]?.images?.[0]?.baseUrl || '';
        return {
          _id: r._id,
          productId: r.product?._id,
          productTitle: r.product?.title || 'Deleted Product',
          productSlug: r.product?.slug || '#',
          productImage: prodImg,
          orderNumber: r.order?.orderNumber || null,
          colorName: r.colorName,
          rating: r.rating,
          comment: r.comment,
          images: r.images || [],
          status: r.status,
          createdAt: r.createdAt
        };
      });

      const ratingSum = formattedReviews.reduce((s, r) => s + Number(r.rating || 0), 0);
      const averageRating = formattedReviews.length > 0
        ? Number((ratingSum / formattedReviews.length).toFixed(1))
        : 0;

      const paidOrders = orders.filter(o => ['Completed', 'Partially Paid'].includes(o.paymentStatus));
      const totalSpent = paidOrders.reduce(
        (sum, o) => sum + ((o.subTotal || 0) - (o.discountAmount || 0) + (o.shippingCost || 0)),
        0
      );

      return res.status(200).json({
        success: true,
        data: {
          entityId: `user_${user._id}`,
          userType: 'user',
          isGuest: false,
          profile: {
            id: user._id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Registered User',
            email: user.email,
            phone: user.phoneNumber ? `${user.phoneCode || ''} ${user.phoneNumber}`.trim() : 'Not Provided',
            isVerified: Boolean(user.isVerified),
            isClaimed: Boolean(user.isClaimed),
            countryCode: effectiveRegion.countryCode || 'IN',
            currencyCode: effectiveRegion.currencyCode || 'INR',
            symbol: effectiveRegion.symbol || '₹',
            isForeign: effectiveRegion.countryCode !== 'IN' && effectiveRegion.countryCode !== 'INDIA',
            registeredAt: user.createdAt,
            lastActive: cart?.updatedAt || wishlist?.updatedAt || orders[0]?.createdAt || user.updatedAt,
            addresses: user.addresses || [],
            recentDevices: sessions.map(s => ({
              deviceId: s.device_id,
              ip: s.ip_address,
              userAgent: s.user_agent,
              lastSeen: s.updatedAt
            }))
          },
          cart: formattedCart,
          wishlist: formattedWishlist,
          orders: {
            totalOrders: orders.length,
            paidOrdersCount: paidOrders.length,
            totalSpent,
            list: orders
          },
          reviews: {
            totalReviews: formattedReviews.length,
            averageRating,
            list: formattedReviews
          }
        }
      });
    } else {
      // VISITOR PROFILE LOOKUP BY DEVICE_ID / SESSION_ID
      const deviceKey = rawId;

      const [cart, wishlist, orders, reviews, visits] = await Promise.all([
        Cart.findOne({ deviceId: deviceKey, user: null })
          .populate({ path: 'items.product', select: 'title slug isPremium variants' })
          .lean(),
        Wishlist.findOne({ deviceId: deviceKey, user: null })
          .populate({ path: 'items.productId', select: 'title slug isPremium variants' })
          .lean(),
        Order.find({ deviceId: deviceKey, user: null })
          .sort({ createdAt: -1 })
          .lean(),
        Review.find({ deviceId: deviceKey, user: null, isAdminGenerated: { $ne: true } })
          .populate({ path: 'product', select: 'title slug variants' })
          .populate({ path: 'order', select: 'orderNumber' })
          .sort({ createdAt: -1 })
          .lean(),
        Visit.find({ $or: [{ deviceId: deviceKey }, { sessionId: deviceKey }] })
          .sort({ updatedAt: -1 })
          .limit(10)
          .lean()
      ]);

      const latestVisit = visits[0] || null;
      const effectiveRegion = cart?.lastKnownRegion || wishlist?.lastKnownRegion || {
        countryCode: latestVisit?.country || 'IN',
        currencyCode: 'INR',
        symbol: '₹',
        rate: 1
      };

      const formattedCart = buildFormattedCart(cart, effectiveRegion);
      const formattedWishlist = buildFormattedWishlist(wishlist, effectiveRegion);

      const formattedReviews = reviews.map(r => {
        const prodImg = r.product?.variants?.[0]?.images?.[0]?.baseUrl || '';
        return {
          _id: r._id,
          productId: r.product?._id,
          productTitle: r.product?.title || 'Deleted Product',
          productSlug: r.product?.slug || '#',
          productImage: prodImg,
          orderNumber: r.order?.orderNumber || null,
          colorName: r.colorName,
          rating: r.rating,
          comment: r.comment,
          images: r.images || [],
          status: r.status,
          createdAt: r.createdAt
        };
      });

      const ratingSum = formattedReviews.reduce((s, r) => s + Number(r.rating || 0), 0);
      const averageRating = formattedReviews.length > 0
        ? Number((ratingSum / formattedReviews.length).toFixed(1))
        : 0;

      const paidOrders = orders.filter(o => ['Completed', 'Partially Paid'].includes(o.paymentStatus));
      const totalSpent = paidOrders.reduce(
        (sum, o) => sum + ((o.subTotal || 0) - (o.discountAmount || 0) + (o.shippingCost || 0)),
        0
      );

      const shortCode = deviceKey.slice(0, 6).toUpperCase();
      const guestName =
        cart?.guestName ||
        wishlist?.guestName ||
        (orders[0]?.shippingAddress?.firstName ? `${orders[0].shippingAddress.firstName} ${orders[0].shippingAddress.lastName || ''}`.trim() : null) ||
        reviews[0]?.guestName ||
        `Visitor #${shortCode}`;

      const guestEmail =
        cart?.guestEmail ||
        wishlist?.guestEmail ||
        orders[0]?.guestEmail ||
        orders[0]?.shippingAddress?.email ||
        reviews[0]?.guestEmail ||
        `Anonymous Session (${shortCode})`;

      const guestPhone =
        cart?.guestPhone ||
        orders[0]?.shippingAddress?.phone ||
        'Not Provided (Visitor)';

      return res.status(200).json({
        success: true,
        data: {
          entityId: `visitor_${deviceKey}`,
          userType: 'visitor',
          isGuest: true,
          profile: {
            id: deviceKey,
            deviceId: deviceKey,
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            isVerified: false,
            isClaimed: false,
            channel: latestVisit?.channel || 'Direct Traffic',
            deviceType: latestVisit?.deviceType || 'Desktop',
            browser: latestVisit?.browser || 'Standard Browser',
            countryCode: effectiveRegion.countryCode || 'IN',
            currencyCode: effectiveRegion.currencyCode || 'INR',
            symbol: effectiveRegion.symbol || '₹',
            isForeign: effectiveRegion.countryCode !== 'IN' && effectiveRegion.countryCode !== 'INDIA',
            registeredAt: latestVisit?.createdAt || cart?.createdAt || wishlist?.createdAt || new Date(),
            lastActive: cart?.updatedAt || wishlist?.updatedAt || orders[0]?.createdAt || latestVisit?.updatedAt || new Date(),
            addresses: orders[0]?.shippingAddress ? [orders[0].shippingAddress] : [],
            recentVisits: visits
          },
          cart: formattedCart,
          wishlist: formattedWishlist,
          orders: {
            totalOrders: orders.length,
            paidOrdersCount: paidOrders.length,
            totalSpent,
            list: orders
          },
          reviews: {
            totalReviews: formattedReviews.length,
            averageRating,
            list: formattedReviews
          }
        }
      });
    }
  } catch (error) {
    console.error("[Admin User Full Profile Error]:", error);
    next(error);
  }
};
