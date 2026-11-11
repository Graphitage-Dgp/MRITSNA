import axios from "axios";

const delhiveryAPI = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com",
  headers: {
    Accept: "application/json",
    Authorization: `Token ${process.env.DELHIVERY_API_KEY}`,
  },
});

/**
 * --- ERROR SANITIZER ---
 * Translates Delhivery technical jargon into clean UI messages.
 */
const sanitizeDelhiveryError = (rawError) => {
  if (!rawError) return "Failed to communicate with courier.";
  
  const lowerErr = rawError.toLowerCase();

  // Clean UI overrides for common failures
  if (lowerErr.includes("insufficient balance")) return "Insufficient wallet balance. Please recharge your Delhivery wallet.";
  if (lowerErr.includes("pincode") || lowerErr.includes("serviceable")) return "The destination pincode is not serviceable by the courier.";
  if (lowerErr.includes("phone") || lowerErr.includes("mobile")) return "The customer's phone number is invalid.";
  if (lowerErr.includes("duplicate") || lowerErr.includes("already exists")) return "A shipment for this order number has already been generated.";
  
  // Regex cleanup for unexpected errors (Strips boilerplate and brackets)
  let cleanError = rawError
    .replace(/Crashing while saving package due to exception/gi, "")
    .replace(/Package might have been partially saved\.?/gi, "")
    .replace(/An internal Error has occurred,? Please get in touch with client\.support@delhivery\.com/gi, "Courier API Error")
    .replace(/['"\[\]]/g, "") 
    .trim();

  if (cleanError) {
    cleanError = cleanError.charAt(0).toUpperCase() + cleanError.slice(1);
  }

  return cleanError || "Failed to dispatch order to courier.";
};


export const checkPincodeServiceability = async (pinCode) => {
  try {
    const response = await delhiveryAPI.get(`/c/api/pin-codes/json/?filter_codes=${pinCode}`);
    const deliveryCodes = response.data.delivery_codes || [];
    if (deliveryCodes.length === 0) return { isServiceable: false };

    const pinData = deliveryCodes[0].postal_code;
    return {
      isServiceable: true,
      hasCOD: pinData.cod === "Y",
      hasPrepaid: pinData.pre_paid === "Y",
      city: pinData.city,
      state: pinData.state_code,
    };
  } catch (error) {
    throw new Error("Failed to verify pincode with logistics partner.");
  }
};


export const createShipment = async (orderData) => {
  try {
    const isCOD = orderData.paymentOption === "PARTIAL_COD";
    
    // 1. Calculate Exact Financials (No division by 100)
    // Reconstructing Grand Total: Advance Paid + Balance Due
    const grandTotal = (orderData.advancePaid || 0) + (orderData.balanceDueOnDelivery || 0) || orderData.paymentAmount || 0;
    const codAmountToCollect = isCOD ? (orderData.balanceDueOnDelivery || 0) : 0;

    const cleanPhone = orderData.shippingAddress.phone.replace(/\D/g, '').slice(-10);

    // 2. Calculate Physics & Generate Accurate Label Descriptions
    let totalWeightGrams = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;

    let invoiceProductsDesc = orderData.items.map(item => {
      const qty = item.quantity || 1;
      const product = item.product || {};
      
      // Physics: Stack items for dimensions
      const dims = product.shipping?.dimensions || { lengthCm: 10, widthCm: 10, heightCm: 10 };
      totalWeightGrams += (product.shipping?.weightGrams || 500) * qty;
      
      if (dims.lengthCm > maxLength) maxLength = dims.lengthCm;
      if (dims.widthCm > maxBreadth) maxBreadth = dims.widthCm;
      totalHeight += (dims.heightCm * qty);

      // Extract real SKU from populated variants
      const variant = product.variants?.find(v => v._id.toString() === item.variantId.toString());
      const skuStr = variant?.sku ? ` (SKU: ${variant.sku})` : "";
      
      return `${item.title} - ${item.colorName}${skuStr} x${qty}`;
    }).join(" | ");

    // Fallbacks to prevent 0x0x0 dimensions
    if (totalHeight === 0) totalHeight = 10;
    if (maxLength === 0) maxLength = 10;
    if (maxBreadth === 0) maxBreadth = 10;

    if (invoiceProductsDesc.length > 200) {
      invoiceProductsDesc = invoiceProductsDesc.substring(0, 197) + "...";
    }

    // 3. Assemble Exact Payload
    const shipmentPayload = {
      shipments: [
        {
          name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`.trim(),
          add: orderData.shippingAddress.street,
          pin: orderData.shippingAddress.pinCode,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          country: orderData.shippingAddress.country,
          phone: cleanPhone,
          order: orderData.orderNumber,
          payment_mode: isCOD ? "COD" : "Prepaid",
          
          return_pin: process.env.DELHIVERY_PICKUP_PIN,
          return_name: process.env.DELHIVERY_WAREHOUSE_NAME,
          
          products_desc: invoiceProductsDesc || "Merchandise",
          cod_amount: codAmountToCollect,
          order_date: orderData.createdAt || new Date().toISOString(),
          total_amount: grandTotal,          
          quantity: parseInt(orderData.items.reduce((acc, item) => acc + item.quantity, 0), 10) || 1,
          
          weight: parseFloat(totalWeightGrams),
          length: maxLength,
          breadth: maxBreadth,
          height: totalHeight,
          waybill: ""
        }
      ],
      pickup_location: {
        name: process.env.DELHIVERY_WAREHOUSE_NAME, 
        add: process.env.DELHIVERY_PICKUP_ADD,
        city: process.env.DELHIVERY_PICKUP_CITY,
        pin_code: process.env.DELHIVERY_PICKUP_PIN,
        country: "India",
        phone: process.env.DELHIVERY_PICKUP_PHONE
      }
    };

    const payloadParams = new URLSearchParams();
    payloadParams.append("format", "json");
    payloadParams.append("data", JSON.stringify(shipmentPayload));

    // Bypass instance to enforce application/x-www-form-urlencoded
    const baseUrl = process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com";
    const response = await axios.post(`${baseUrl}/api/cmu/create.json`, payloadParams, {
      headers: {
        "Authorization": `Token ${process.env.DELHIVERY_API_KEY}`
      }
    });

    const resData = response.data;
    const packageData = resData.packages?.[0];
    const isRootSuccess = resData.success === true;
    const isPackageSuccess = packageData && packageData.status === "Success";

    // --- SMART ERROR EXTRACTION & SANITIZATION ---
    if (!isRootSuccess || !isPackageSuccess) {
      let extractedError = "Invalid payload or warehouse configuration.";

      if (packageData?.remarks) {
        extractedError = Array.isArray(packageData.remarks) ? packageData.remarks.join(" | ") : packageData.remarks;
      } else if (packageData?.client_error) {
        extractedError = packageData.client_error;
      } else if (resData.rmk) {
        extractedError = typeof resData.rmk === "string" ? resData.rmk : JSON.stringify(resData.rmk);
      } else if (resData.rmks) {
        extractedError = typeof resData.rmks === "string" ? resData.rmks : JSON.stringify(resData.rmks);
      } else if (typeof resData.error === "string" && resData.error !== "true") {
        extractedError = resData.error;
      }

      throw new Error(sanitizeDelhiveryError(extractedError));
    }

    return {
      success: true,
      waybill: packageData.waybill,
      courierName: "Delhivery",
      labelUrl: packageData.routing_code ? `https://track.delhivery.com/downloads/label_${packageData.waybill}.pdf` : null
    };

  } catch (error) {
    let exactError = error.message;

    if (error.response?.data) {
      const errData = error.response.data;
      if (errData.rmk) {
        exactError = typeof errData.rmk === "string" ? errData.rmk : JSON.stringify(errData.rmk);
      } else if (errData.rmks) {
        exactError = typeof errData.rmks === "string" ? errData.rmks : JSON.stringify(errData.rmks);
      } else if (errData.error && typeof errData.error === "string" && errData.error !== "true") {
        exactError = errData.error;
      }
    }

    throw new Error(sanitizeDelhiveryError(exactError));
  }
};


export const trackShipment = async (waybill) => {
  try {
    const response = await delhiveryAPI.get(`/api/v1/packages/json/?waybill=${waybill}&ref_ids=`);
    const shipmentData = response.data.ShipmentData?.[0]?.Shipment;
    if (!shipmentData) throw new Error("Tracking data not found for this Waybill.");

    return {
      status: shipmentData.Status?.Status, 
      instructions: shipmentData.Status?.Instructions,
      statusDateTime: shipmentData.Status?.StatusDateTime,
      destination: shipmentData.Destination,
      pickupDate: shipmentData.PickUpDate,
    };
  } catch (error) {
    throw new Error("Unable to fetch live tracking data at this time.");
  }
};


export const generateShippingLabel = async (waybill) => {
  try {
    const response = await delhiveryAPI.get(`/api/p/packing_slip?wbns=${waybill}&pdf=true`);
    if (response.data?.pdf_download_link) {
      return response.data.pdf_download_link;
    }
    throw new Error("Label URL not returned by provider.");
  } catch (error) {
    throw new Error("Failed to fetch shipping label.");
  }
};