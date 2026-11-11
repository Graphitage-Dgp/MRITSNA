import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    // --- CORE IDENTIFICATION ---
    sessionId: {
      type: String,
      required: true,
      index: true,
      description: "Unique identifier stored in the user's 24-hour cookie"
    },
    deviceId: {
      type: String,
      default: null,
      index: true,
      description: "Persistent 1-year device identifier linking visits to guest carts/wishlists"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // --- HIGH-LEVEL ATTRIBUTION (Granular Social Data) ---
    channel: {
      type: String,
      required: true,
      enum: [
        "Organic Search", 
        "Instagram",
        "Facebook",
        "YouTube",
        "Twitter",
        "LinkedIn",
        "TikTok",
        "Direct Traffic", 
        "Referral & PR",
        "Other"
      ],
      default: "Direct Traffic"
    },

    // --- GRANULAR TRAFFIC DATA (Future-proofing) ---
    sourceUrl: {
      type: String,
      default: null,
      description: "The exact referring URL (e.g., https://www.google.com/)"
    },
    
    // --- UTM MARKETING CAMPAIGNS (Future-proofing for Ads) ---
    utmSource: { type: String, default: null },
    utmMedium: { type: String, default: null },
    utmCampaign: { type: String, default: null },

    // --- TECHNICAL & DEVICE METRICS ---
    deviceType: {
      type: String,
      enum: ["Mobile", "Tablet", "Desktop", "Unknown"],
      default: "Unknown"
    },
    browser: { type: String, default: null },
    os: { type: String, default: null },

    // --- GEOLOCATION ---
    country: { type: String, default: null },
    region: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// --- PERFORMANCE INDEXING ---
visitSchema.index({ createdAt: -1, channel: 1 });
visitSchema.index({ deviceId: 1, updatedAt: -1 });

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;
