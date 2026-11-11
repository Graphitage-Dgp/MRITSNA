import { getCurrencyForCountry, updateLiveExchangeRates } from '../../config/currencyMap.js';

const DEFAULT_INR_REGION = {
  countryCode: 'IN',
  currencyCode: 'INR',
  symbol: '₹',
  rate: 1,
};

export const regionMiddleware = async (req, res, next) => {
  try {
    // Fire the lazy update checker in the background
    updateLiveExchangeRates().catch(err => console.error("Lazy update failed:", err));

    // P2: Currency Fallback Hardening
    // Strictly default to INR (₹). Do NOT auto-switch to USD ($) via Geo-IP lookup.
    // Foreign currency only triggers if the user explicitly switched the currency dropdown.
    let countryCode = "IN";
    const explicitHeaderRegion = req.headers['x-user-region']?.toString().trim().toUpperCase();
    const isManualHeader = req.headers['x-region-manual'] === 'true';
    const manualCookieRegion = req.cookies?.region?.toString().trim().toUpperCase();

    if (explicitHeaderRegion && (isManualHeader || explicitHeaderRegion !== "IN")) {
      countryCode = explicitHeaderRegion;
    } else if (manualCookieRegion && manualCookieRegion !== "IN") {
      countryCode = manualCookieRegion;
    }

    if (countryCode === "IN") {
      req.region = { ...DEFAULT_INR_REGION };
      return next();
    }

    // Look up foreign exchange rate only when explicitly requested via currency switcher
    const regionData = await getCurrencyForCountry(countryCode);

    req.region = regionData || { ...DEFAULT_INR_REGION };
    next();
  } catch (error) {
    console.error("[Region Middleware Error]:", error);
    // Strictly fallback to INR (₹)
    req.region = { ...DEFAULT_INR_REGION };
    next();
  }
};