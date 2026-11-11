import Razorpay from "razorpay";
import crypto from "crypto";
import { createRequire } from "module";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import Coupon from "../../models/coupon.model.js";
import Cart from "../../models/cart.model.js";
import Wishlist from "../../models/wishlist.model.js";
import { calculateRegionalPricing } from "../../utils/pricingEngine.js";
import { sendEmail } from "../../utils/email.sender.js";
import { sendMetaPurchaseEvent } from "../../utils/meta.service.js";

const require = createRequire(import.meta.url);
const hsnMap = require("../../config/hsnRates.json");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getGSTRate = (hsnCode) => {
  if (!hsnCode) return hsnMap["DEFAULT"].rate;
  const codeStr = hsnCode.toString().trim();
  if (hsnMap[codeStr]) return hsnMap[codeStr].rate;
  if (codeStr.length > 6 && hsnMap[codeStr.substring(0, 6)]) {
    return hsnMap[codeStr.substring(0, 6)].rate;
  }
  if (codeStr.length >= 4 && hsnMap[codeStr.substring(0, 4)]) {
    return hsnMap[codeStr.substring(0, 4)].rate;
  }
  return hsnMap["DEFAULT"].rate;
};

const processCheckoutMath = async (
  items,
  country,
  state,
  couponCode,
  paymentOption,
  skipAutoApply,
  userContext,
  regionData,
) => {
  let subTotal = 0;
  const validatedItems = [];

  const safeCountry = country || "";
  const safeState = state || "";

  const isExportShipment =
    safeCountry.toLowerCase() !== "india" && safeCountry.toLowerCase() !== "in";

  for (const item of items) {
    const product = await Product.findOne({ "variants._id": item.variantId }).exec();
    if (!product)
      throw new Error(`Product containing variant ${item.variantId} not found`);

    const variant = product.variants.id(item.variantId);

    const isAvailable = variant.inventory.quantity >= item.quantity || variant.inventory.allowBackorder === true;
    
    if (!isAvailable) {
      throw new Error(
        `Insufficient stock for ${product.title} - ${variant.colorName}`
      );
    }

    const localizedPricing = calculateRegionalPricing(
      variant.pricing.price,
      variant.pricing.discountPercentage || 0,
      product.isPremium || false,
      regionData,
    );

    const itemTotalConverted = localizedPricing.sellingPrice * item.quantity;
    subTotal += itemTotalConverted;

    validatedItems.push({
      product: product._id,
      variantId: variant._id,
      sku: variant.sku || product.sku || 'N/A',
      hsnCode: product.pricing.hsnCode,
      title: product.title,
      colorName: variant.colorName,
      slug: product.slug,
      img: variant.images[0]?.baseUrl,
      quantity: item.quantity,
      priceAtPurchase: localizedPricing.sellingPrice,
      itemTotal: itemTotalConverted,
    });
  }

  let discountAmount = 0;
  let appliedCouponId = null;
  let appliedCouponCode = null;
  let appliedEligibleItemIds = new Set();
  let appliedEligibleSubTotal = 0;

  const evaluateCouponEligibility = async (coupon) => {
    if (
      Array.isArray(coupon.applicableRegions) &&
      coupon.applicableRegions.length > 0
    ) {
      const regions = coupon.applicableRegions
        .filter(Boolean)
        .map((r) => r.toString().toUpperCase());
      if (
        !regions.includes("GLOBAL") &&
        !regions.includes(regionData.countryCode.toUpperCase())
      ) {
        return {
          eligible: false,
          reason: "This coupon is not valid in your shipping region.",
        };
      }
    }

    if (Array.isArray(coupon.targetUsers) && coupon.targetUsers.length > 0) {
      const targetIds = coupon.targetUsers
        .filter(Boolean)
        .map((id) => id.toString());
      if (
        !userContext.userId ||
        !targetIds.includes(userContext.userId.toString())
      ) {
        return {
          eligible: false,
          reason: "This coupon is restricted to specific users.",
        };
      }
    }

    let eligibleSubTotal = 0;
    const eligibleItemIds = new Set();

    const applicableProdIds = Array.isArray(coupon.applicableProducts)
      ? coupon.applicableProducts.filter(Boolean).map((id) => id.toString())
      : [];
    const excludedProdIds = Array.isArray(coupon.excludedProducts)
      ? coupon.excludedProducts.filter(Boolean).map((id) => id.toString())
      : [];

    for (const item of validatedItems) {
      const productIdStr = item.product.toString();
      let isEligible = true;

      if (
        applicableProdIds.length > 0 &&
        !applicableProdIds.includes(productIdStr)
      ) {
        isEligible = false;
      }
      if (
        excludedProdIds.length > 0 &&
        excludedProdIds.includes(productIdStr)
      ) {
        isEligible = false;
      }

      if (isEligible) {
        eligibleSubTotal += item.itemTotal;
        eligibleItemIds.add(productIdStr);
      }
    }

    if (eligibleSubTotal === 0) {
      return {
        eligible: false,
        reason: "Your cart does not contain items eligible for this coupon.",
      };
    }

    const localizedMinOrderValue = Math.round(
      (coupon.minOrderValue || 0) * regionData.rate,
    );
    if (eligibleSubTotal < localizedMinOrderValue) {
      return {
        eligible: false,
        reason: `Minimum eligible order value of ${regionData.symbol}${localizedMinOrderValue} not met.`,
      };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return {
        eligible: false,
        reason: "This coupon has reached its maximum global usage limit.",
      };
    }

    const fingerprintQuery = [];
    if (userContext.userId) fingerprintQuery.push({ user: userContext.userId });
    if (userContext.guestEmail)
      fingerprintQuery.push({
        guestEmail: userContext.guestEmail.toLowerCase(),
      });
    if (userContext.deviceId)
      fingerprintQuery.push({ deviceId: userContext.deviceId });

    if (fingerprintQuery.length > 0) {
      const pastUsageCount = await Order.countDocuments({
        couponApplied: coupon._id,
        paymentStatus: { $in: ["Completed", "Partially Paid"] },
        $or: fingerprintQuery,
      });

      if (pastUsageCount >= (coupon.usagePerUserLimit || 1)) {
        return {
          eligible: false,
          reason: "You have reached the maximum usage limit for this coupon.",
        };
      }
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = Math.round(
        (eligibleSubTotal * coupon.discountValue) / 100,
      );
      if (coupon.maxDiscountAmount) {
        const localizedMaxDiscount = Math.round(
          coupon.maxDiscountAmount * regionData.rate,
        );
        calculatedDiscount = Math.min(calculatedDiscount, localizedMaxDiscount);
      }
    } else if (coupon.discountType === "fixed_amount") {
      calculatedDiscount = Math.round(coupon.discountValue * regionData.rate);
      calculatedDiscount = Math.min(calculatedDiscount, eligibleSubTotal);
    }

    return {
      eligible: true,
      discountAmount: calculatedDiscount,
      eligibleItemIds,
      eligibleSubTotal,
    };
  };

  const now = new Date();

  if (couponCode) {
    const manualCoupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gt: now },
    });

    if (!manualCoupon) throw new Error("Invalid, upcoming, or expired coupon.");

    const evaluation = await evaluateCouponEligibility(manualCoupon);
    if (!evaluation.eligible) throw new Error(evaluation.reason);

    discountAmount = evaluation.discountAmount;
    appliedCouponId = manualCoupon._id;
    appliedCouponCode = manualCoupon.code;
    appliedEligibleItemIds = evaluation.eligibleItemIds;
    appliedEligibleSubTotal = evaluation.eligibleSubTotal;
  } else if (!skipAutoApply) {
    const autoCoupons = await Coupon.find({
      isActive: true,
      isAutoApply: true,
      startDate: { $lte: now },
      expiryDate: { $gt: now },
    });

    let bestDiscount = 0;
    let bestCoupon = null;
    let bestEligibleItemIds = new Set();
    let bestEligibleSubTotal = 0;

    for (const autoCoupon of autoCoupons) {
      const evaluation = await evaluateCouponEligibility(autoCoupon);

      if (
        evaluation.eligible &&
        (evaluation.discountAmount > bestDiscount ||
          (!bestCoupon && evaluation.discountAmount === bestDiscount))
      ) {
        bestDiscount = evaluation.discountAmount;
        bestCoupon = autoCoupon;
        bestEligibleItemIds = evaluation.eligibleItemIds;
        bestEligibleSubTotal = evaluation.eligibleSubTotal;
      }
    }

    if (bestCoupon) {
      discountAmount = bestDiscount;
      appliedCouponId = bestCoupon._id;
      appliedCouponCode = bestCoupon.code;
      appliedEligibleItemIds = bestEligibleItemIds;
      appliedEligibleSubTotal = bestEligibleSubTotal;
    }
  }

  let totalTaxAmount = 0;
  let baseRevenue = 0;
  let taxBuckets = {};

  const isIntraState =
    safeState.toLowerCase().includes("jharkhand") ||
    safeState.toLowerCase() === "mh";

  for (const item of validatedItems) {
    const isItemEligibleForDiscount = appliedEligibleItemIds.has(
      item.product.toString(),
    );
    const itemDiscountRatio =
      isItemEligibleForDiscount && appliedEligibleSubTotal > 0
        ? item.itemTotal / appliedEligibleSubTotal
        : 0;

    const itemDiscount = discountAmount * itemDiscountRatio;
    const discountedItemTotal = item.itemTotal - itemDiscount;

    const itemGSTRate = isExportShipment ? 0 : getGSTRate(item.hsnCode);

    const itemBaseRevenue = discountedItemTotal / (1 + itemGSTRate / 100);
    const itemTaxAmount = discountedItemTotal - itemBaseRevenue;

    baseRevenue += itemBaseRevenue;
    totalTaxAmount += itemTaxAmount;

    if (!isExportShipment && itemGSTRate > 0) {
      if (isIntraState) {
        const halfRate = itemGSTRate / 2;
        const halfTax = itemTaxAmount / 2;

        const cgstKey = `CGST_${halfRate}`;
        if (!taxBuckets[cgstKey])
          taxBuckets[cgstKey] = { taxType: "CGST", rate: halfRate, amount: 0 };
        taxBuckets[cgstKey].amount += halfTax;

        const sgstKey = `SGST_${halfRate}`;
        if (!taxBuckets[sgstKey])
          taxBuckets[sgstKey] = { taxType: "SGST", rate: halfRate, amount: 0 };
        taxBuckets[sgstKey].amount += halfTax;
      } else {
        const igstKey = `IGST_${itemGSTRate}`;
        if (!taxBuckets[igstKey])
          taxBuckets[igstKey] = {
            taxType: "IGST",
            rate: itemGSTRate,
            amount: 0,
          };
        taxBuckets[igstKey].amount += itemTaxAmount;
      }
    }
  }

  const taxDetails = isExportShipment
    ? [{ taxType: "EXPORT", rate: 0, amount: 0 }]
    : Object.values(taxBuckets).map((bucket) => ({
        taxType: bucket.taxType,
        rate: bucket.rate,
        amount: Math.round(bucket.amount),
      }));

  const grandTotal = Math.max(1, subTotal - discountAmount);

  let paymentAmount = grandTotal;
  let advancePaid = grandTotal;
  let balanceDueOnDelivery = 0;

  const strictPaymentOption = paymentOption
    ? paymentOption.toString().trim().toUpperCase()
    : "FULL_ONLINE";

  if (strictPaymentOption === "PARTIAL_COD") {
    paymentAmount = Math.max(1, Math.round(grandTotal * 0.2));
    advancePaid = paymentAmount;
    balanceDueOnDelivery = grandTotal - advancePaid;
  }

  return {
    validatedItems,
    subTotal,
    appliedCouponId,
    appliedCouponCode,
    discountAmount,
    baseRevenue: Math.round(baseRevenue),
    taxableAmount: Math.round(baseRevenue),
    taxDetails,
    totalTaxAmount: Math.round(totalTaxAmount),
    currencyInfo: regionData,
    paymentOption: strictPaymentOption,
    grandTotal,
    paymentAmount,
    advancePaid,
    balanceDueOnDelivery,
  };
};

export const calculateCheckoutTotals = async (req, res) => {
  try {
    const {
      items,
      country,
      state,
      couponCode,
      paymentOption,
      skipAutoApply,
      guestEmail,
    } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id || req.body.deviceId;

    // --- SILENT LEAD CAPTURE FOR GUEST CARTS & WISHLISTS ---
    if (!userId && deviceId && guestEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      const cleanGuestEmail = guestEmail.trim().toLowerCase();
      Cart.findOneAndUpdate(
        { deviceId, user: null },
        { $set: { guestEmail: cleanGuestEmail } }
      ).catch(() => {});
      Wishlist.findOneAndUpdate(
        { deviceId, user: null },
        { $set: { guestEmail: cleanGuestEmail } }
      ).catch(() => {});
    }

    const safePaymentOption = paymentOption
      ? paymentOption.toString().trim().toUpperCase()
      : "FULL_ONLINE";
    const safeSkipAutoApply = skipAutoApply || false;

    const regionData = req.region || {
      countryCode: "IN",
      currencyCode: "INR",
      symbol: "₹",
      rate: 1,
    };

    const mathResult = await processCheckoutMath(
      items,
      country,
      state,
      couponCode,
      safePaymentOption,
      safeSkipAutoApply,
      { userId, guestEmail, deviceId },
      regionData,
    );

    return res.status(200).json({
      success: true,
      data: {
        subTotal: mathResult.subTotal,
        appliedCouponCode: mathResult.appliedCouponCode,
        discountAmount: mathResult.discountAmount,
        taxableAmount: mathResult.taxableAmount,
        totalTaxAmount: mathResult.totalTaxAmount,
        taxDetails: mathResult.taxDetails,
        grandTotal: mathResult.grandTotal,
        paymentAmount: mathResult.paymentAmount,
        advancePaid: mathResult.advancePaid,
        balanceDueOnDelivery: mathResult.balanceDueOnDelivery,
        currency: mathResult.currencyInfo.currencyCode,
        symbol: mathResult.currencyInfo.symbol,
      },
    });
  } catch (error) {
    console.error("[Checkout Calculate Error]", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to calculate totals",
    });
  }
};

export const createRazorpayOrder = async (req, res) => {
  const ZERO_DECIMAL_CURRENCIES = ["JPY", "KRW", "VND", "CLP", "PYG"];

  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      couponCode,
      paymentOption,
      skipAutoApply,
      guestEmail,
    } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id || req.body.deviceId;
    const isGuestCheckout = !userId;

    // Enrich guest Cart & Wishlist with shipping contact details if guest
    if (isGuestCheckout && deviceId && shippingAddress) {
      const fullName = `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim();
      const cleanEmail = (guestEmail || shippingAddress.email || "").trim().toLowerCase() || null;
      const cleanPhone = shippingAddress.phone || null;

      Cart.findOneAndUpdate(
        { deviceId, user: null },
        {
          $set: {
            ...(cleanEmail ? { guestEmail: cleanEmail } : {}),
            ...(fullName ? { guestName: fullName } : {}),
            ...(cleanPhone ? { guestPhone: cleanPhone } : {})
          }
        }
      ).catch(() => {});

      Wishlist.findOneAndUpdate(
        { deviceId, user: null },
        {
          $set: {
            ...(cleanEmail ? { guestEmail: cleanEmail } : {}),
            ...(fullName ? { guestName: fullName } : {})
          }
        }
      ).catch(() => {});
    }

    const safePaymentOption = paymentOption
      ? paymentOption.toString().trim().toUpperCase()
      : "FULL_ONLINE";
    const safeSkipAutoApply = skipAutoApply || false;

    const regionData = req.region || {
      countryCode: "IN",
      currencyCode: "INR",
      symbol: "₹",
      rate: 1,
    };

    const mathResult = await processCheckoutMath(
      items,
      shippingAddress.country,
      shippingAddress.state,
      couponCode,
      safePaymentOption,
      safeSkipAutoApply,
      { userId, guestEmail, deviceId },
      regionData,
    );

    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(
      mathResult.currencyInfo.currencyCode.toUpperCase(),
    );
    const subunitMultiplier = isZeroDecimal ? 1 : 100;

    const razorpayAmountInSubunits = Math.round(
      mathResult.paymentAmount * subunitMultiplier,
    );

    const razorpayOptions = {
      amount: razorpayAmountInSubunits,
      currency: mathResult.currencyInfo.currencyCode,
      receipt: `RCPT_${Date.now().toString().slice(-8)}`,
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    const newOrder = new Order({
      user: userId,
      isGuestCheckout,
      guestEmail: guestEmail ? guestEmail.toLowerCase() : (shippingAddress?.email?.toLowerCase() || null),
      deviceId,
      shippingAddress,
      billingAddress,
      items: mathResult.validatedItems,
      baseCurrency: "INR",
      paymentCurrency: mathResult.currencyInfo.currencyCode,
      exchangeRateAtPurchase: mathResult.currencyInfo.rate,
      subTotal: mathResult.subTotal,
      couponApplied: mathResult.appliedCouponId,
      discountAmount: mathResult.discountAmount,
      baseRevenue: mathResult.baseRevenue,
      taxDetails: mathResult.taxDetails,
      totalTaxAmount: mathResult.totalTaxAmount,
      paymentOption: mathResult.paymentOption,
      paymentAmount: mathResult.paymentAmount,
      advancePaid: mathResult.advancePaid,
      balanceDueOnDelivery: mathResult.balanceDueOnDelivery,
      paymentMethod: "RAZORPAY",
      paymentStatus: "Pending",
      transactionId: razorpayOrder.id,
    });

    const savedOrder = await newOrder.save();

    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        orderId: savedOrder._id,
        amount: razorpayAmountInSubunits,
        currency: mathResult.currencyInfo.currencyCode,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("[Checkout Create Order Error]", error);
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Failed to initialize checkout",
      });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      db_order_id,
    } = req.body;

    const pendingOrder = await Order.findById(db_order_id);
    if (!pendingOrder) {
      return res.status(404).json({ success: false, message: "Order not found in database" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      pendingOrder.paymentStatus = "Failed";
      pendingOrder.paymentErrorLog = "Signature mismatch. Potential spoofing attempt.";
      await pendingOrder.save();
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    if (pendingOrder.paymentStatus === "Pending") {
      const finalPaymentStatus = pendingOrder.paymentOption === "PARTIAL_COD" ? "Partially Paid" : "Completed";

      pendingOrder.paymentStatus = finalPaymentStatus;
      pendingOrder.orderStatus = "Confirmed";
      pendingOrder.paidAt = new Date();
      pendingOrder.transactionId = razorpay_payment_id;

      const confirmedOrder = await pendingOrder.save();

      // Clear the guest cart in MongoDB upon confirmed purchase
      if (confirmedOrder.isGuestCheckout && confirmedOrder.deviceId) {
        Cart.findOneAndUpdate(
          { deviceId: confirmedOrder.deviceId, user: null },
          { $set: { items: [] } }
        ).catch(() => {});
      }

      try {
        const userData = {
          email: confirmedOrder.isGuestCheckout ? confirmedOrder.guestEmail : confirmedOrder.shippingAddress.email,
          phone: confirmedOrder.shippingAddress.phone,
          firstName: confirmedOrder.shippingAddress.firstName,
          lastName: confirmedOrder.shippingAddress.lastName,
        };

        const orderData = {
          currency: confirmedOrder.paymentCurrency,
          totalAmount: confirmedOrder.paymentAmount + (confirmedOrder.balanceDueOnDelivery || 0),
          orderId: confirmedOrder.orderNumber, 
          contents: confirmedOrder.items.map(item => ({
            id: item.product.toString(),
            quantity: item.quantity,
            item_price: item.priceAtPurchase
          }))
        };

        sendMetaPurchaseEvent(req, orderData, userData).catch(err => 
          console.error("[Meta CAPI Error in Controller]:", err)
        );
      } catch (metaErr) {
        console.error("[Meta CAPI Extraction Error]:", metaErr);
      }

      if (confirmedOrder.couponApplied) {
        await Coupon.findByIdAndUpdate(confirmedOrder.couponApplied, {
          $inc: { usedCount: 1 },
        });
      }

      const inventoryUpdates = confirmedOrder.items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (product) {
          const variant = product.variants.id(item.variantId);
          if (variant) {
            variant.inventory.quantity = Math.max(0, variant.inventory.quantity - item.quantity);
            product.markModified('variants'); 
            await product.save();
          }
        }
      });
      await Promise.all(inventoryUpdates);

      const customerEmail = confirmedOrder.isGuestCheckout ? confirmedOrder.guestEmail : confirmedOrder.shippingAddress.email;
      const customerName = confirmedOrder.shippingAddress.firstName;
      
      const baseUrl = process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173';
      const queryParams = confirmedOrder.isGuestCheckout && confirmedOrder.guestEmail ? `?email=${encodeURIComponent(customerEmail)}` : "";
      const trackingLink = `${baseUrl}/track-order/${confirmedOrder.orderNumber}${queryParams}`;

      const formatCurrency = (amount, currencyCode) => {
        const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          maximumFractionDigits: 2
        }).format(amount);
      };

      const getSafeImage = (url) => {
        if (!url) return '';
        const encodedUrl = encodeURI(url);
        return encodedUrl.includes('?') ? `${encodedUrl}&tr=f-jpg,w-200` : `${encodedUrl}?tr=f-jpg,w-200`;
      };

      const itemsHtml = confirmedOrder.items.map(item => `
        <tr style="border-bottom: 1px solid #EEEEEE;">
          <td style="padding: 15px 0; width: 70px;">
            <img src="${getSafeImage(item.img)}" alt="${item.title}" style="display: block; width: 55px; height: 70px; object-fit: cover; border-radius: 2px; background-color: #f8f8f8;" />
          </td>
          <td style="padding: 15px 10px; vertical-align: top;">
            <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 13px; color: #111111;">${item.title}</p>
            <p style="margin: 0 0 3px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888888;">SKU: ${item.sku || 'N/A'}</p>
            <p style="margin: 0 0 3px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888888;">Color: ${item.colorName}</p>
            <p style="margin: 0; font-size: 11px; color: #888888;">Qty: ${item.quantity}</p>
          </td>
          <td style="padding: 15px 0; vertical-align: top; text-align: right; font-weight: 500; font-size: 13px; color: #111111;">
            ${formatCurrency(item.itemTotal, confirmedOrder.paymentCurrency)}
          </td>
        </tr>
      `).join('');

      const emailHtml = `
        <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111; padding: 40px 20px;">
          <h2 style="font-weight: 300; letter-spacing: 1px; margin-bottom: 30px; text-transform: uppercase;">Order Confirmed</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #555555;">Hello ${customerName},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #555555;">Thank you for your purchase. Your payment has been securely processed and your order is currently being prepared for dispatch.</p>
          
          <div style="background-color: #f8f8f8; border: 1px solid #EEEEEE; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888; margin: 0 0 5px 0;">Order Reference</p>
            <p style="font-size: 18px; font-weight: 600; margin: 0;">${confirmedOrder.orderNumber}</p>
          </div>

          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px; margin-top: 40px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Paid Today</td>
              <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 15px; color: #111111;">
                ${formatCurrency(confirmedOrder.paymentAmount, confirmedOrder.paymentCurrency)}
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${trackingLink}" style="display: inline-block; padding: 14px 30px; background-color: #171410; color: #f8f8f8; text-decoration: none; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; border-radius: 2px;">Track Your Order</a>
          </div>
          
          <p style="font-size: 12px; line-height: 1.6; color: #999999; text-align: center;">Click the button above to view live logistics, download your tax invoice, and check your delivery status 24/7.</p>
          
          <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #AAAAAA; border-top: 1px solid #EEEEEE; padding-top: 20px;">
            <p>&copy; ${new Date().getFullYear()} Mritsna. All rights reserved.</p>
          </div>
        </div>
      `;

      sendEmail({
        to: customerEmail,
        subject: `Order Confirmed: ${confirmedOrder.orderNumber}`,
        html: emailHtml,
      }).catch(err => console.error("[Customer Email Error]:", err));

      if (process.env.ADMIN_MAIL) {
        sendEmail({
          to: process.env.ADMIN_MAIL,
          subject: `🚨 NEW ORDER: ${confirmedOrder.orderNumber} - ${confirmedOrder.paymentCurrency} ${confirmedOrder.paymentAmount}`,
          html: emailHtml,
        }).catch(err => console.error("[Admin Email Error]:", err));
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: { orderNumber: pendingOrder.orderNumber },
    });
  } catch (error) {
    console.error("[Payment Verification Error]", error);
    return res.status(500).json({ success: false, message: "Payment verification process failed" });
  }
};
