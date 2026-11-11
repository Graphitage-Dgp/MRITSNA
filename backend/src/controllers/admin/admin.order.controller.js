import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import { createShipment } from "../../services/logistics.service.js";

const buildOrderFilter = (query) => {
  const { currency, startDate, endDate, search } = query;
  let filter = {};

  if (currency) {
    const currUpper = currency.toUpperCase();
    if (currUpper === "DOMESTIC") {
      filter.paymentCurrency = "INR";
    } else if (currUpper === "INTERNATIONAL") {
      filter.paymentCurrency = { $ne: "INR" };
    } else if (currUpper !== "ALL") {
      filter.paymentCurrency = currUpper;
    }
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); 
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { guestEmail: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
};

export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = buildOrderFilter(req.query);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email") 
      .lean(); 

    // Run parallel counts for efficiency
    const [totalOrders, successfulOrders] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({
        ...filter,
        orderStatus: { $in: ["Confirmed", "Processing", "Shipped", "Delivered"] },
        paymentStatus: { $in: ["Completed", "Partially Paid"] }
      })
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        successfulOrders 
      },
      data: orders,
    });
  } catch (error) {
    console.error("[Admin Get All Orders Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve orders.",
    });
  }
};

export const exportOrders = async (req, res) => {
  try {
    const { exportType } = req.query; 
    const filter = buildOrderFilter(req.query);

    if (exportType === "profit") {
      filter.orderStatus = { $in: ["Confirmed", "Processing", "Shipped", "Delivered"] };
      filter.paymentStatus = { $in: ["Completed", "Partially Paid"] };
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName email")
      .lean();

    const exportData = orders.map((order) => {
      let customerName = "Guest";
      if (order.shippingAddress?.firstName) {
        customerName = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
      } else if (order.user) {
        customerName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
      }

      const customerEmail = order.isGuestCheckout ? order.guestEmail : (order.user?.email || "Unknown");
      const grandTotal = (order.advancePaid || 0) + (order.balanceDueOnDelivery || 0) || order.paymentAmount || 0;

      return {
        "Order Number": order.orderNumber,
        "Date": new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
        "Customer Name": customerName,
        "Customer Email": customerEmail,
        "Payment Status": order.paymentStatus,
        "Order Status": order.orderStatus,
        "Currency": order.paymentCurrency,
        "Grand Total": grandTotal,
        "Total Tax Amount": order.totalTaxAmount || 0,
        "Profit (Base Revenue)": order.baseRevenue || 0,
        "Courier Partner": order.courierPartner || "N/A",
        "Tracking Number": order.trackingNumber || "N/A"
      };
    });

    return res.status(200).json({
      success: true,
      count: exportData.length,
      data: exportData,
    });
  } catch (error) {
    console.error("[Admin Export Orders Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate order export.",
    });
  }
};

// Get Single Order Details
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      // Populating referenced data just in case the UI needs deeper linking
      .populate("user", "firstName lastName email phone")
      .populate("couponApplied", "code discountType discountValue")
      .populate("items.product", "slug") 
      .lean();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found." 
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("[Admin Get Order By ID Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve order details.",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const isAlreadyRestocked = ["Cancelled", "Returned"].includes(order.orderStatus);
    const isNowRestocking = ["Cancelled", "Returned"].includes(orderStatus);

    if (isNowRestocking && !isAlreadyRestocked) {
      for (const item of order.items) {
        await Product.updateOne(
          {
            _id: item.product,
            "variants._id": item.variantId,
          },
          {
            $inc: { "variants.$.inventory.quantity": item.quantity },
          }
        );
      }
      order.cancelledAt = new Date();
    }

    if (orderStatus === 'Delivered' && order.orderStatus !== 'Delivered') {
      order.deliveredAt = new Date();
    }

    order.orderStatus = orderStatus;
    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status manually updated to ${orderStatus}.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("[Admin Update Order Status Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status.",
    });
  }
};

export const fulfillOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate({
      path: "items.product",
      select: "shipping variants title",
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be fulfilled. Current status is: ${order.orderStatus}`,
      });
    }

    if (order.paymentStatus === "Pending" || order.paymentStatus === "Failed") {
      return res.status(400).json({
        success: false,
        message: "Cannot fulfill an order with a Pending or Failed payment.",
      });
    }

    const shipmentResult = await createShipment(order);

    order.trackingNumber = shipmentResult.waybill;
    order.shippingLabelUrl = shipmentResult.labelUrl;
    order.courierPartner = shipmentResult.courierName;
    order.orderStatus = "Shipped";
    order.shippedAt = new Date();

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: `Order successfully dispatched via ${shipmentResult.courierName}.`,
      data: {
        orderNumber: updatedOrder.orderNumber,
        trackingNumber: updatedOrder.trackingNumber,
        shippingLabelUrl: updatedOrder.shippingLabelUrl,
        orderStatus: updatedOrder.orderStatus,
      },
    });
  } catch (error) {
    console.error("[Admin Fulfill Order Error]:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process logistics fulfillment.",
    });
  }
};