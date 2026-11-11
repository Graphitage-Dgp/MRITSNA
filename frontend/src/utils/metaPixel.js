/**
 * Meta Pixel Utility Service
 * Provides safe wrappers for Meta tracking events to prevent app crashes from ad-blockers.
 */

// Core safe-execution function
const trackEvent = (eventName, data = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, data);
  } else {
    // Silently fail in production, but log in development if blocked
    if (import.meta.env.DEV) {
      console.warn(`[Meta Pixel] Event blocked or uninitialized: ${eventName}`);
    }
  }
};

// Global Page View (Fired on route change)
export const trackPageView = () => {
  trackEvent("PageView");
};

// Product Page View (Fired on ProductDetails mount)
export const trackViewContent = (contentName, contentId, price, currency = "INR") => {
  trackEvent("ViewContent", {
    content_name: contentName,
    content_ids: [contentId],
    content_type: "product",
    value: Number(price),
    currency: currency,
  });
};

// Add to Cart (Fired on button click)
export const trackAddToCart = (contentName, contentId, price, currency = "INR") => {
  trackEvent("AddToCart", {
    content_name: contentName,
    content_ids: [contentId],
    content_type: "product",
    value: Number(price),
    currency: currency,
  });
};

// Initiate Checkout (Fired when entering the checkout flow)
export const trackInitiateCheckout = (cartTotal, currency = "INR") => {
  trackEvent("InitiateCheckout", {
    value: Number(cartTotal),
    currency: currency,
  });
};