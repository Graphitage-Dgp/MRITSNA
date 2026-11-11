import axios from "axios";
import ExchangeRate from "../models/exchangeRate.model.js";

/**
 * Master Currency & Region Dictionary
 * Base Currency: INR (Indian Rupee)
 */

// 1. Map Country Codes (ISO 3166-1 alpha-2) to Currency Codes
export const countryToCurrency = {
  IN: "INR", // India
  US: "USD", // United States
  AE: "AED", // United Arab Emirates 
  GB: "GBP", // United Kingdom
  AU: "AUD", // Australia
  CA: "CAD", // Canada
  SG: "SGD", // Singapore
  SA: "SAR", // Saudi Arabia
  JP: "JPY", // Japan
  
  // Eurozone Countries
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
};

// 2. Currency Details (Symbols and Static Base Rates)
export const currencyDetails = {
  INR: { code: "INR", symbol: "₹", rate: 1 },          // Base
  USD: { code: "USD", symbol: "$", rate: 0.012 },       // USA
  AED: { code: "AED", symbol: "د.إ", rate: 0.044 },     // UAE Dirham
  EUR: { code: "EUR", symbol: "€", rate: 0.011 },       // Eurozone
  GBP: { code: "GBP", symbol: "£", rate: 0.0095 },      // UK
  AUD: { code: "AUD", symbol: "A$", rate: 0.018 },      // Australia
  CAD: { code: "CAD", symbol: "C$", rate: 0.016 },      // Canada
  SGD: { code: "SGD", symbol: "S$", rate: 0.016 },      // Singapore Dollar
  SAR: { code: "SAR", symbol: "ر.س", rate: 0.045 },     // Saudi Riyal
  JPY: { code: "JPY", symbol: "¥", rate: 1.85 },        // Japan
};

const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 Hours

export const updateLiveExchangeRates = async () => {
  try {
    const now = new Date();
    
    let dbCache = await ExchangeRate.findOne({ baseCurrency: "INR" });

    if (dbCache && (now - dbCache.lastUpdated < CACHE_DURATION_MS)) {
      return dbCache.rates; 
    }

    const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
    
    if (!API_KEY) {
      console.warn("[CurrencyMap] Missing EXCHANGE_RATE_API_KEY in .env. Falling back to DB/Static rates.");
      return dbCache ? dbCache.rates : null;
    }

    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/INR`);
    const newRates = response.data.conversion_rates; 

    dbCache = await ExchangeRate.findOneAndUpdate(
      { baseCurrency: "INR" },
      { $set: { rates: newRates, lastUpdated: now } },
      { new: true, upsert: true }
    );

    console.log("[CurrencyMap] Live exchange rates successfully updated in MongoDB.");
    return dbCache.rates;

  } catch (error) {
    console.error("[CurrencyMap] Failed to update live rates in DB.", error.message);
    return null; 
  }
};

/**
 * Get Currency Profile for a specific Country Code
 * Upgraded to intercept direct currency codes sent by the UI.
 */
export const getCurrencyForCountry = async (countryCode) => {
  const formattedInput = countryCode ? countryCode.toUpperCase() : "IN";
  
  // --- THE FIX: Smart Routing ---
  let currencyCode = "INR";
  
  // 1. Check if the frontend accidentally sent a direct Currency Code (like "AED")
  if (currencyDetails[formattedInput]) {
    currencyCode = formattedInput;
  } 
  // 2. Otherwise, map the Country Code (like "AE") to the Currency Code
  else {
    currencyCode = countryToCurrency[formattedInput] || "INR";
  }

  const details = currencyDetails[currencyCode];
  let finalRate = details.rate;

  try {
    const dbCache = await ExchangeRate.findOne({ baseCurrency: "INR" });
    if (dbCache && dbCache.rates && dbCache.rates.get(currencyCode)) {
      finalRate = dbCache.rates.get(currencyCode);
    }
  } catch (error) {
    console.error(`[CurrencyMap] DB read failed for ${currencyCode}, using static fallback.`, error.message);
  }

  return {
    countryCode: formattedInput, // Still pass back what the user sent
    currencyCode: details.code,
    symbol: details.symbol,
    rate: finalRate,
  };
};