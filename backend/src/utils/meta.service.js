import crypto from 'crypto';
import axios from 'axios'; // Or use native fetch() if you are on Node 18+

/**
 * Normalizes and hashes user data according to Meta's strict requirements.
 * Data must be trimmed, lowercased, and SHA-256 hashed.
 */
const hashData = (data) => {
  if (!data) return undefined;
  const normalized = data.toString().trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

export const sendMetaPurchaseEvent = async (req, orderData, userData) => {
  const { META_PIXEL_ID, META_ACCESS_TOKEN, META_TEST_EVENT_CODE } = process.env;

  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.error('[Meta CAPI] Missing required credentials in .env');
    return;
  }

  // 1. Extract network data for Event Match Quality (EMQ)
  const clientIpAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || "";
  const clientUserAgent = req.headers['user-agent'] || "";

  // 2. Generate Unix timestamp in seconds
  const eventTimeSeconds = Math.floor(Date.now() / 1000); 

  // 3. Construct the strict Meta Graph API payload
  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTimeSeconds,
        action_source: "website",
        user_data: {
          em: hashData(userData.email),
          ph: hashData(userData.phone),
          fn: hashData(userData.firstName),
          ln: hashData(userData.lastName),
          client_ip_address: clientIpAddress,
          client_user_agent: clientUserAgent,
        },
        custom_data: {
          currency: orderData.currency || "INR",
          value: orderData.totalAmount,
          order_id: orderData.orderId,
          contents: orderData.contents || [],
          content_type: "product"
        }
      }
    ],
    // Only append the test code if it exists in the environment
    ...(META_TEST_EVENT_CODE && { test_event_code: META_TEST_EVENT_CODE })
  };

  try {
    // 4. Dispatch to the Graph API endpoint
    const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;
    
    const response = await axios.post(url, payload, {
      params: { access_token: META_ACCESS_TOKEN },
      headers: { "Content-Type": "application/json" }
    });
    
    console.log('[Meta CAPI] Purchase event dispatched successfully:', response.data);
  } catch (error) {
    console.error('[Meta CAPI] Payload rejected:', error.response?.data || error.message);
  }
};