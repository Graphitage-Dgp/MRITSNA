import crypto from "crypto";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import { sendEmail } from "../../utils/email.sender.js";


export const handleDelhiveryWebhook = async (req, res) => {
  try {
    const payloadString = req.body.toString("utf8");
    const payload = JSON.parse(payloadString);

    const waybill = payload.Waybill || payload.awb || payload.WaybillNumber;
    const statusObj = payload.Status || {};
    const currentStatus = statusObj.Status || payload.status || "";

    if (!waybill) {
      return res.status(400).send("Bad Request: Missing Waybill");
    }

    const isReturned = ["RTO", "RTO DELIVERED", "RETURN TO ORIGIN", "RETURNED"].includes(
      currentStatus.toUpperCase()
    );

    if (!isReturned) {
      return res.status(200).send("Status acknowledged. No inventory action required.");
    }

    const order = await Order.findOne({ trackingNumber: waybill });

    if (!order) {
      console.warn(`[Webhook Warning] RTO received for unknown Waybill: ${waybill}`);
      return res.status(200).send("Order not found in system.");
    }

    if (order.orderStatus === "Returned") {
      return res.status(200).send("Order is already marked as Returned. Ignored.");
    }

    for (const item of order.items) {
      await Product.updateOne(
        { 
          _id: item.product, 
          "variants._id": item.variantId 
        },
        { 
          $inc: { "variants.$.inventory.quantity": item.quantity } 
        }
      );
    }

    order.orderStatus = "Returned";
    order.cancelledAt = new Date();
    await order.save();

    console.log(`[Logistics Webhook] Order ${order.orderNumber} successfully auto-restocked.`);
    return res.status(200).send("RTO Processed and Inventory Restocked.");

  } catch (error) {
    console.error("[Delhivery Webhook Error]:", error);
    return res.status(500).send("Internal Webhook Error");
  }
};



export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const payloadString = req.body.toString("utf8");

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadString)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[Security Alert] Invalid Razorpay Webhook Signature.");
      return res.status(400).send("Invalid Signature");
    }

    const payload = JSON.parse(payloadString);

    if (payload.event === "order.paid" || payload.event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id; 

      const order = await Order.findOne({ transactionId: razorpayOrderId });

      if (!order) {
        console.error(`[Webhook Error] Paid order not found in DB: ${razorpayOrderId}`);
        return res.status(200).send("Order not found, but acknowledged.");
      }

      if (order.paymentStatus !== "Pending") {
        return res.status(200).send("Order already processed.");
      }

      order.paymentStatus = order.paymentOption === "PARTIAL_COD" ? "Partially Paid" : "Completed";
      order.orderStatus = "Confirmed";
      order.paidAt = new Date();
      await order.save();

      console.log(`[Payment Webhook] Order ${order.orderNumber} confirmed successfully.`);

      const customerEmail = order.isGuestCheckout ? order.guestEmail : order.shippingAddress.email;
      const customerName = order.shippingAddress.firstName;
      
      const baseUrl = process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173';
      const queryParams = order.isGuestCheckout && order.guestEmail ? `?email=${encodeURIComponent(customerEmail)}` : "";
      const trackingLink = `${baseUrl}/track-order/${order.orderNumber}${queryParams}`;

      const formatCurrency = (amount, currencyCode) => {
        const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
      };

      const getSafeImage = (url) => {
        if (!url) return '';
        const encodedUrl = encodeURI(url);
        return encodedUrl.includes('?') ? `${encodedUrl}&tr=f-jpg,w-200` : `${encodedUrl}?tr=f-jpg,w-200`;
      };

      const itemsHtml = order.items.map(item => `
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
            ${formatCurrency(item.itemTotal, order.paymentCurrency)}
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
            <p style="font-size: 18px; font-weight: 600; margin: 0;">${order.orderNumber}</p>
          </div>

          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888888; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px; margin-top: 40px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Paid Today</td>
              <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 15px; color: #111111;">
                ${formatCurrency(order.paymentAmount, order.paymentCurrency)}
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
        subject: `Order Confirmed: ${order.orderNumber}`,
        html: emailHtml,
      }).catch(err => console.error("[Customer Email Error]:", err));

      if (process.env.ADMIN_MAIL) {
        sendEmail({
          to: process.env.ADMIN_MAIL,
          subject: `🚨 NEW ORDER: ${order.orderNumber} - ${order.paymentCurrency} ${order.paymentAmount}`,
          html: emailHtml,
        }).catch(err => console.error("[Admin Email Error]:", err));
      }
    }

    return res.status(200).send("Webhook Processed");

  } catch (error) {
    console.error("[Razorpay Webhook Error]:", error);
    return res.status(500).send("Internal Webhook Error");
  }
};