import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema(
  {
    // The currency that all rates are calculated against
    baseCurrency: {
      type: String,
      required: true,
      default: 'INR',
      unique: true, // Ensures we only ever have ONE document for INR in the collection
      uppercase: true,
      trim: true,
      index: true,
    },
    rates: {
      type: Map,
      of: Number,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// We export it as default to match your standard architecture
const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

export default ExchangeRate;
