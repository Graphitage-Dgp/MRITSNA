import mongoose from 'mongoose';
import Review from '../../models/review.model.js';
import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';
import imagekit, { deleteImageKitFile } from '../../utils/imagekit.js';

export const checkEligibility = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user; 
    const deviceId = req.cookies.device_id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const query = userId ? { product: productId, user: userId } : { product: productId, deviceId, isAdminGenerated: false };
    const existingReview = await Review.findOne(query);

    // If they already reviewed, we still block a duplicate review
    if (existingReview) {
      return res.status(200).json({
        success: true,
        eligibility: 'ALREADY_REVIEWED',
        review: existingReview
      });
    }

    // --- PREVIOUS LOGIC: STRICT ORDER CHECKING (COMMENTED OUT) ---
    /*
    const orderQuery = {
      orderStatus: 'Delivered',
      'items.product': productId,
      ...(userId ? { user: userId } : { deviceId })
    };

    const matchingOrder = await Order.findOne(orderQuery).sort({ createdAt: -1 }).lean();

    if (!matchingOrder) {
      return res.status(200).json({
        success: true,
        eligibility: 'NOT_ELIGIBLE',
        message: 'No delivered order found for this product.'
      });
    }

    const purchasedItem = matchingOrder.items.find(item => item.product.toString() === productId);
    const productData = await Product.findById(productId).lean();
    const matchedVariant = productData.variants?.find(v => v.colorName === purchasedItem.colorName);
    const sku = matchedVariant ? matchedVariant.sku : (productData.variants?.[0]?.sku || 'unknown-sku');

    return res.status(200).json({
      success: true,
      eligibility: 'CAN_REVIEW',
      orderId: matchingOrder._id,
      colorName: purchasedItem.colorName,
      sku: sku,
      guestName: matchingOrder.shippingAddress.firstName,
      guestEmail: matchingOrder.shippingAddress.email
    });
    */

    // --- NEW LOGIC: ANYONE CAN REVIEW ---
    // Since there's no existing review, everyone is eligible immediately!
    // We no longer pass orderId, guestName, etc., as the frontend will collect them manually.
    return res.status(200).json({
      success: true,
      eligibility: 'CAN_REVIEW'
    });

  } catch (error) {
    console.error("[Review Eligibility Error]:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment, images, colorName, guestName, guestEmail } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    const query = userId ? { product: productId, user: userId } : { product: productId, deviceId, isAdminGenerated: false };
    const existingReview = await Review.findOne(query);

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const newReview = new Review({
      product: productId,
      
      // --- PREVIOUS LOGIC ---
      // order: orderId,
      
      // --- NEW LOGIC: OPTIONALLY ADD ORDER IF IT EXISTS ---
      ...(orderId && { order: orderId }), 
      
      colorName,
      user: userId || null,
      guestName: userId ? undefined : guestName,
      guestEmail: userId ? undefined : guestEmail,
      deviceId: userId ? undefined : deviceId,
      rating,
      comment,
      images: images || [],
      status: 'pending'
    });

    await newReview.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Review submitted successfully and is pending approval.',
      review: newReview
    });

  } catch (error) {
    console.error("[Submit Review Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to submit review" });
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Verify ownership
    const isOwner = userId ? (review.user?.toString() === userId.toString()) : (review.deviceId === deviceId && !review.isAdminGenerated);
    
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this review.' });
    }

    // Update fields and reset status to pending for safety
    review.rating = rating;
    review.comment = comment;
    review.images = images || [];
    review.status = 'pending';

    await review.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Review updated successfully and is pending approval.',
      review
    });

  } catch (error) {
    console.error("[Update Review Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to update review" });
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    const product = await Product.findOne({ slug }).select('_id').lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const authConditions = [];
    if (userId) authConditions.push({ user: userId });
    if (deviceId) authConditions.push({ deviceId });

    // It fetches approved reviews OR pending reviews that belong ONLY to the current user/device
    const filter = {
      product: product._id,
      $or: [
        { status: 'approved' },
        ...(authConditions.length > 0 ? [{ status: 'pending', $or: authConditions }] : [])
      ]
    };

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName') 
      .lean();

    const formattedReviews = reviews.map(rev => ({
      _id: rev._id,
      rating: rev.rating,
      comment: rev.comment,
      colorName: rev.colorName,
      images: rev.images,
      createdAt: rev.createdAt,
      status: rev.status, 
      author: rev.user ? `${rev.user.firstName} ${rev.user.lastName[0]}.` : rev.guestName,
      
      // --- PREVIOUS LOGIC ---
      // isVerifiedBuyer: rev.isAdminGenerated ? false : true
      
      // --- NEW LOGIC ---
      // Without strict order checking, we can't definitively call them a "verified buyer"
      // Unless they have an order attached. For now, we will mark false unless there is an order.
      isVerifiedBuyer: rev.order ? true : false 
    }));

    return res.status(200).json({ success: true, data: formattedReviews });

  } catch (error) {
    console.error("[Get Product Reviews Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

export const getImageKitAuth = (req, res) => {
  try {
    const result = imagekit.getAuthenticationParameters();
    res.status(200).json(result);
  } catch (error) {
    console.error("ImageKit Auth Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate ImageKit signature" });
  }
};

export const deleteImageKitFileRoute = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ success: false, message: "File ID is required" });
    }

    await deleteImageKitFile(fileId);
    
    res.status(200).json({ success: true, message: "Image deletion process completed" });
  } catch (error) {
    console.error("ImageKit Delete Route Error:", error);
    res.status(500).json({ success: false, message: "Server error during image deletion" });
  }
};