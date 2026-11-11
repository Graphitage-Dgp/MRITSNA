import Coupon from '../../models/coupon.model.js';

// ==========================================
// GET DASHBOARD METRICS
// ==========================================
export const getCouponDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Run aggregations and counts in parallel for maximum speed
    const [totalActive, totalExpired, allCoupons] = await Promise.all([
      Coupon.countDocuments({ isActive: true, expiryDate: { $gt: now } }),
      Coupon.countDocuments({ $or: [{ isActive: false }, { expiryDate: { $lte: now } }] }),
      Coupon.find().select('code usedCount maxDiscountAmount discountType discountValue').lean()
    ]);

    let totalGlobalUses = 0;
    
    // Sort to find the highest used coupons
    const sortedByUsage = [...allCoupons].sort((a, b) => b.usedCount - a.usedCount);
    const topCoupons = sortedByUsage.slice(0, 5).map(c => ({
      code: c.code,
      usedCount: c.usedCount,
      discountType: c.discountType
    }));

    allCoupons.forEach(c => {
      totalGlobalUses += c.usedCount;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalActive,
        totalExpired,
        totalGlobalUses,
        topCoupons
      }
    });

  } catch (error) {
    console.error("[Admin Coupon Stats Error]", error);
    next(error);
  }
};

// ==========================================
// GET PAGINATED LIST (TABLE VIEW)
// ==========================================
export const getAllCoupons = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const filterType = req.query.filter || 'all'; // 'all', 'active', 'expired'
    const searchSearch = req.query.search || '';

    const now = new Date();
    let query = {};

    // Search by Code
    if (searchSearch) {
      query.code = { $regex: searchSearch, $options: 'i' };
    }

    // Status Filters
    if (filterType === 'active') {
      query.isActive = true;
      query.expiryDate = { $gt: now };
    } else if (filterType === 'expired') {
      query.$or = [
        { isActive: false },
        { expiryDate: { $lte: now } }
      ];
    }

    const skip = (page - 1) * limit;

    const [coupons, totalCount] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(query)
    ]);

    const formattedCoupons = coupons.map(coupon => {
      const isActuallyExpired = new Date(coupon.expiryDate) <= now;
      const status = (!coupon.isActive || isActuallyExpired) ? 'Expired/Inactive' : 'Active';

      return {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit,
        isAutoApply: coupon.isAutoApply,
        status,
        expiryDate: coupon.expiryDate,
        regions: coupon.applicableRegions
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedCoupons,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("[Admin Get All Coupons Error]", error);
    next(error);
  }
};

// ==========================================
// GET DEEP-DIVE DETAILS
// ==========================================
export const getCouponDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate('applicableProducts', 'title slug isPremium')
      .populate('excludedProducts', 'title slug isPremium')
      .populate('targetUsers', 'firstName lastName email')
      .lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.status(200).json({
      success: true,
      data: coupon
    });

  } catch (error) {
    console.error("[Admin Get Coupon Details Error]", error);
    next(error);
  }
};

// ==========================================
// CREATE NEW COUPON
// ==========================================
export const createCoupon = async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Ensure code is uniformly uppercase
    if (payload.code) {
      payload.code = payload.code.trim().toUpperCase();
    }

    // Clean arrays if they come in empty
    if (payload.applicableRegions && payload.applicableRegions.length === 0) {
      payload.applicableRegions = ['GLOBAL'];
    }

    const newCoupon = new Coupon(payload);
    const savedCoupon = await newCoupon.save();

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: savedCoupon
    });

  } catch (error) {
    console.error("[Admin Create Coupon Error]", error);
    // Handle Mongoose duplicate key error specifically for the unique Code index
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      return res.status(400).json({ success: false, message: 'This coupon code already exists.' });
    }
    next(error);
  }
};

// ==========================================
// UPDATE EXISTING COUPON
// ==========================================
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // Prevent direct manipulation of usage tracking
    delete payload.usedCount;

    if (payload.code) {
      payload.code = payload.code.trim().toUpperCase();
    }

    if (payload.applicableRegions && payload.applicableRegions.length === 0) {
      payload.applicableRegions = ['GLOBAL'];
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: updatedCoupon
    });

  } catch (error) {
    console.error("[Admin Update Coupon Error]", error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      return res.status(400).json({ success: false, message: 'This coupon code is already in use.' });
    }
    next(error);
  }
};

// ==========================================
// KILL SWITCH: TOGGLE STATUS
// ==========================================
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Flip the boolean
    coupon.isActive = !coupon.isActive;
    
    // If reviving an expired coupon, automatically push the expiry date out by 30 days
    // to prevent the pre-save hook from immediately killing it again.
    if (coupon.isActive && coupon.expiryDate <= new Date()) {
       const newExpiry = new Date();
       newExpiry.setDate(newExpiry.getDate() + 30);
       coupon.expiryDate = newExpiry;
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon is now ${coupon.isActive ? 'Active' : 'Paused'}`
    });

  } catch (error) {
    console.error("[Admin Toggle Coupon Status Error]", error);
    next(error);
  }
};

// ==========================================
// PERMANENT DELETE (OPTIONAL ADMIN OVERRIDE)
// ==========================================
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon permanently deleted'
    });

  } catch (error) {
    console.error("[Admin Delete Coupon Error]", error);
    next(error);
  }
};