import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true 
    },
    password: { 
      type: String, 
      default: null 
    },
    // --- UPDATED ALIGNMENT ---
    firstName: { 
      type: String,
      default: null,
      trim: true
    },
    lastName: { 
      type: String,
      default: null,
      trim: true
    },
    phoneCode: {
      type: String, // e.g., "+91"
      default: null
    },
    phoneNumber: {
      type: String, // e.g., "9876543210"
      default: null
    },
    addresses: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Address' 
    }],

    lastKnownRegion: {
      countryCode: { type: String, default: 'IN' },
      currencyCode: { type: String, default: 'INR' },
      symbol: { type: String, default: '₹' },
      rate: { type: Number, default: 1 }
    },

    isClaimed: { 
      type: Boolean, 
      default: false 
    },
    role: { 
      type: String, 
      enum: ["user", "admin"], 
      default: "user" 
    },
    isActive: {
      type: Boolean,
      default: true 
    },
    isVerified: {
      type: Boolean,
      default: false 
    },
    verificationToken: {
      type: String,
      default: null
    },
    verificationTokenExpiry: {
      type: Date,
      default: null
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockoutUntil: {
      type: Date,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken; 
  delete user.verificationTokenExpiry;
  delete user.failedLoginAttempts;
  delete user.lockoutUntil;
  delete user.isActive;
  return user;
};

export default mongoose.model("User", userSchema);