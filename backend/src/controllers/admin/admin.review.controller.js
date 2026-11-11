import mongoose from 'mongoose';
import Review from '../../models/review.model.js';
import Product from '../../models/product.model.js';

// ==========================================
// THE MATH ENGINE
// ==========================================
// Recalculates the exact average rating and total review count for a product
const updateProductRatingStats = async (productId) => {
  try {
    const stats = await Review.aggregate([
      { 
        $match: { 
          product: new mongoose.Types.ObjectId(productId), 
          status: 'approved' // Only count approved reviews!
        } 
      },
      { 
        $group: { 
          _id: '$product', 
          avgRating: { $avg: '$rating' }, 
          numReviews: { $sum: 1 } 
        } 
      }
    ]);

    if (stats.length > 0) {
      // If there are approved reviews, update the product with the new math
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(stats[0].avgRating * 10) / 10, // Rounds to 1 decimal (e.g., 4.7)
        totalReviews: stats[0].numReviews
      });
    } else {
      // If all reviews were rejected/deleted, reset to 0
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        totalReviews: 0
      });
    }
  } catch (error) {
    console.error(`[Math Engine Error] Failed to update stats for product ${productId}:`, error);
  }
};


// ==========================================
// ADMIN DASHBOARD CONTROLLERS
// ==========================================

// Gets the list of products with their review counts for the Admin Dashboard
export const getAdminReviewSummary = async (req, res, next) => {
  try {
    const summary = await Review.aggregate([
      {
        $group: {
          _id: "$product",
          totalApproved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          totalPending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          totalReviews: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productId: "$_id",
          productName: "$productDetails.title",
          // Safely grab the first image of the first variant
          productImg: { $arrayElemAt: [{ $arrayElemAt: ["$productDetails.variants.images.baseUrl", 0] }, 0] },
          totalApproved: 1,
          totalPending: 1,
          totalReviews: 1
        }
      },
      { $sort: { totalPending: -1, totalReviews: -1 } } // Show items needing moderation first
    ]);

    return res.status(200).json({ success: true, data: summary });

  } catch (error) {
    console.error("[Admin Review Summary Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch review summary" });
  }
};

// Gets the specific list of reviews for a single product in the Admin Panel
export const getAdminProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { status, sort } = req.query; // e.g., ?status=pending&sort=newest

    const filter = { product: productId };
    if (status && status !== 'all') filter.status = status;

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };

    const reviews = await Review.find(filter)
      .sort(sortOption)
      .populate('user', 'firstName lastName email')
      .populate('order', 'orderNumber')
      .lean();

    return res.status(200).json({ success: true, data: reviews });

  } catch (error) {
    console.error("[Admin Product Reviews Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch product reviews" });
  }
};

export const updateReviewStatus = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status update" });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId, 
      { status },
      { new: true }
    );

    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // --- TRIGGER THE MATH ENGINE ---
    // Recalculate product stars because a review was just approved or rejected
    await updateProductRatingStats(review.product);

    return res.status(200).json({ success: true, message: `Review ${status} successfully.`, data: review });

  } catch (error) {
    console.error("[Update Review Status Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

export const adminAddReview = async (req, res, next) => {
  try {
    const { productId, rating, comment, images, guestName, colorName } = req.body;

    const newReview = new Review({
      product: productId,
      guestName,
      colorName,
      rating,
      comment,
      images: images || [],
      status: 'approved', // Admin reviews are automatically live
      isAdminGenerated: true // Bypasses the strict Order/Device ID requirements
    });

    await newReview.save();

    // --- TRIGGER THE MATH ENGINE ---
    // Recalculate product stars because a new 5-star review was just seeded!
    await updateProductRatingStats(productId);

    return res.status(201).json({ success: true, message: 'Admin review added successfully.', data: newReview });

  } catch (error) {
    console.error("[Admin Add Review Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to add admin review" });
  }
};