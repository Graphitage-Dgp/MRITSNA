import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true 
  },
  // Aligned with Order Model: Split names for better logistics integrations
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  
  // Added email to align with Order Model requirements
  email: { type: String, required: true, lowercase: true, trim: true },
  
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { 
    type: String, 
    required: true,
    trim: true,
    index: true // Indexed for rapid Tax (CGST vs IGST) queries
  },
  pinCode: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  country: { 
    type: String, 
    required: true, 
    trim: true,
    default: 'India' 
  },
  type: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home'
  },
  // Soft Delete: User can "delete" it from their view, but we keep the data safe
  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Pre-save hook to ensure only one default address exists per user
addressSchema.pre('save', async function () {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
});

export default mongoose.model('Address', addressSchema);