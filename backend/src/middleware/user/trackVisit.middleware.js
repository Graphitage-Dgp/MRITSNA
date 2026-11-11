import crypto from "crypto";
import Visit from "../../models/visit.model.js";
import { cookieOptions } from "../../utils/cookie-options.js";

export const trackVisit = async (req, res, next) => {
  try {
    // 1. Ensure a persistent 1-year device_id cookie ALWAYS exists for every visitor
    let deviceId = req.cookies?.device_id;
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      res.cookie("device_id", deviceId, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      if (req.cookies) {
        req.cookies.device_id = deviceId;
      }
    }

    // 2. Check for existing 24-hour visit session
    if (req.cookies && req.cookies.store_session) {
      // Touch/link deviceId or user in the background if missing
      Visit.findOneAndUpdate(
        { sessionId: req.cookies.store_session },
        {
          $set: {
            deviceId,
            ...(req.user ? { user: req.user } : {}),
            ...(req.region?.countryCode ? { country: req.region.countryCode } : {})
          }
        }
      ).catch(() => {});
      return next();
    }

    // 3. Extract Data from the Request
    const referer = req.get("Referrer") || req.get("Referer") || "";
    const userAgent = req.get("User-Agent") || "";
    const { utm_source, utm_medium, utm_campaign } = req.query;

    let channel = "Direct Traffic";
    const refererLower = referer.toLowerCase();
    const sourceLower = (utm_source || "").toLowerCase();

    if (
      refererLower.includes("google.") || 
      refererLower.includes("bing.com") || 
      refererLower.includes("yahoo.com") || 
      refererLower.includes("duckduckgo.com")
    ) {
      channel = "Organic Search";
    } 
    else if (refererLower.includes("instagram.com") || sourceLower.includes("instagram")) {
      channel = "Instagram";
    } 
    else if (refererLower.includes("facebook.com") || sourceLower.includes("facebook")) {
      channel = "Facebook";
    } 
    else if (refererLower.includes("youtube.com") || sourceLower.includes("youtube")) {
      channel = "YouTube";
    } 
    else if (refererLower.includes("twitter.com") || refererLower.includes("x.com") || sourceLower.includes("twitter")) {
      channel = "Twitter";
    } 
    else if (refererLower.includes("linkedin.com") || sourceLower.includes("linkedin")) {
      channel = "LinkedIn";
    } 
    else if (refererLower.includes("tiktok.com") || sourceLower.includes("tiktok")) {
      channel = "TikTok";
    } 
    else if (referer !== "") {
      const host = req.get("host") || "";
      if (!refererLower.includes(host.toLowerCase())) {
        channel = "Referral & PR";
      }
    }

    // Lightweight Device Detection
    let deviceType = "Desktop";
    const uaLower = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(uaLower)) {
      deviceType = "Tablet";
    } else if (
      /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(uaLower)
    ) {
      deviceType = "Mobile";
    }

    const sessionId = crypto.randomUUID();

    await Visit.create({
      sessionId,
      deviceId,
      user: req.user || null,
      channel,
      sourceUrl: referer || null,
      utmSource: utm_source || null,
      utmMedium: utm_medium || null,
      utmCampaign: utm_campaign || null,
      deviceType,
      browser: userAgent.substring(0, 100),
      country: req.region?.countryCode || "IN"
    });

    res.cookie("store_session", sessionId, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    next();
  } catch (error) {
    console.error("[Analytics Error]: Failed to track visit -", error.message);
    next();
  }
};
