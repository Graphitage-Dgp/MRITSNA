import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    device_id: { 
      type: String, 
      required: true
    },
    ip_address: { 
      type: String, 
      default: null
    },
    user_agent: { 
      type: String
    },
    role: { 
      type: String, 
      default: "user" 
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    expiry_at: { 
      type: Date, 
      required: true
    }
  },
  { 
    timestamps: true 
  }
);

sessionSchema.index({ expiry_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);