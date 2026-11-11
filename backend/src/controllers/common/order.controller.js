import Order from "../../models/order.model.js";
import { trackShipment } from "../../services/logistics.service.js";

// Fetch Paginated Order History (Logged-in Users)
export const getUserOrderHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Fetch orders belonging strictly to the logged-in user's account
    const orders = await Order.find({ user: req.user }) // Safely handle populated or unpopulated user
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ user: req.user });

    return res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
      data: orders,
    });
  } catch (error) {
    console.error("[User Order History Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve order history.",
    });
  }
};

// Fetch Single Order Details (Logged-in Users)
export const getUserOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Secure the lookup by requiring the order ID AND matching user ID
    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or unauthorized access.",
      });
    }

    let liveTracking = null;

    // If the order has been processed and shipped, bridge live courier tracking data
    if (order.trackingNumber) {
      try {
        liveTracking = await trackShipment(order.trackingNumber);
      } catch (trackingError) {
        console.error("[Tracking Fetch Failure]:", trackingError.message);
        // Fallback gracefully so the base order details still load
        liveTracking = {
          status: order.orderStatus,
          instructions: "Live tracking data temporarily unavailable.",
          statusDateTime: order.updatedAt,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: order,
      liveTracking,
    });
  } catch (error) {
    console.error("[User Order Details Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve order details.",
    });
  }
};

// Universal Public Tracking (For Guests AND Lazy Users)
export const trackGuestOrder = async (req, res) => {
  try {
    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide both the order number and your email address.",
      });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    // Universal Match: Find the order by ID, and verify the email matches EITHER the guest email OR the shipping email
    const order = await Order.findOne({
      orderNumber: orderNumber.toString().trim(),
      $or: [
        { guestEmail: cleanEmail },
        { "shippingAddress.email": cleanEmail }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No matching order found with the provided credentials.",
      });
    }

    let liveTracking = null;

    // Extract real-time courier checkpoints
    if (order.trackingNumber) {
      try {
        liveTracking = await trackShipment(order.trackingNumber);
      } catch (trackingError) {
        console.error("[Guest Tracking Fetch Failure]:", trackingError.message);
        liveTracking = {
          status: order.orderStatus,
          instructions: "Live tracking data temporarily unavailable.",
          statusDateTime: order.updatedAt,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        items: order.items,
        shippingAddress: order.shippingAddress,
        subTotal: order.subTotal,
        discountAmount: order.discountAmount,
        grandTotal: order.paymentAmount || order.subTotal, // Safe fallback
        paymentOption: order.paymentOption,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        balanceDueOnDelivery: order.balanceDueOnDelivery,
        courierPartner: order.courierPartner,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        shippingCost: order.shippingCost,
        taxDetails: order.taxDetails,
        totalTaxAmount: order.totalTaxAmount,
        baseRevenue: order.baseRevenue,
        advancePaid: order.advancePaid,
        paymentCurrency: order.paymentCurrency
      },
      liveTracking,
    });
  } catch (error) {
    console.error("[Guest Order Tracking Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process order tracking.",
    });
  }
};