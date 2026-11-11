import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance';

// --- STRICT INR DEFAULT (P2: Currency Fallback Hardening) ---
export const DEFAULT_INR_REGION = {
  countryCode: 'IN',
  currencyCode: 'INR',
  symbol: '₹',
  rate: 1,
  isManual: false,
};

// --- SYNCHRONOUS BOOTSTRAP ---
// Strictly defaults to INR (₹). Foreign currency (e.g., USD $) is ONLY loaded
// if the user previously switched the currency dropdown explicitly (isManual === true).
const loadRegionFromStorage = () => {
  if (typeof window === 'undefined') return DEFAULT_INR_REGION;
  try {
    const stored = localStorage.getItem('user_region');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only honor a non-INR currency if the user explicitly switched the dropdown
      if (
        parsed &&
        parsed.isManual === true &&
        parsed.countryCode &&
        parsed.currencyCode &&
        parsed.symbol
      ) {
        return parsed;
      }
    }
    // Enforce strict INR default in localStorage so stale IP-detected foreign currencies are wiped
    localStorage.setItem('user_region', JSON.stringify(DEFAULT_INR_REGION));
    return DEFAULT_INR_REGION;
  } catch (error) {
    console.warn('[Region Slice] Failed to parse region from local storage, defaulting to INR:', error);
    return DEFAULT_INR_REGION;
  }
};

const initialState = {
  data: loadRegionFromStorage(),
  isLoading: false,
  error: null,
};

// --- THE DETECTION / SWITCH THUNK ---
// Only switches to foreign currency if explicitly requested via manual countryCode
// or if the user already has an explicit manual override stored.
export const fetchUserRegion = createAsyncThunk(
  'region/fetchUserRegion',
  async (explicitCountryCode = null, { getState }) => {
    try {
      const currentRegion = getState()?.region?.data;
      const targetCountry = explicitCountryCode || (currentRegion?.isManual ? currentRegion.countryCode : 'IN');

      // If no explicit foreign currency was chosen by the user, strictly enforce INR (₹)
      if (!targetCountry || targetCountry.toUpperCase() === 'IN') {
        const inrData = {
          ...DEFAULT_INR_REGION,
          isManual: Boolean(explicitCountryCode),
        };
        localStorage.setItem('user_region', JSON.stringify(inrData));
        return inrData;
      }

      const response = await userAxios.get('/region/detect', {
        headers: {
          'x-user-region': targetCountry.toUpperCase(),
          'x-region-manual': 'true',
        },
      });

      const regionData = {
        ...(response.data?.data || DEFAULT_INR_REGION),
        isManual: true,
      };

      localStorage.setItem('user_region', JSON.stringify(regionData));
      return regionData;
    } catch (error) {
      console.warn('[Region Slice] Falling back strictly to INR (₹):', error?.message);
      localStorage.setItem('user_region', JSON.stringify(DEFAULT_INR_REGION));
      return DEFAULT_INR_REGION;
    }
  }
);

const regionSlice = createSlice({
  name: 'region',
  initialState,
  reducers: {
    // Triggered ONLY when the user explicitly switches the currency dropdown in the Navbar
    setManualRegion: (state, action) => {
      const payload = action.payload || DEFAULT_INR_REGION;
      const manualData = {
        countryCode: payload.countryCode || 'IN',
        currencyCode: payload.currencyCode || 'INR',
        symbol: payload.symbol || '₹',
        rate: Number(payload.rate) || 1,
        isManual: true,
      };
      state.data = manualData;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_region', JSON.stringify(manualData));
      }
    },
    resetToDefaultINR: (state) => {
      state.data = DEFAULT_INR_REGION;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_region', JSON.stringify(DEFAULT_INR_REGION));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserRegion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserRegion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload || DEFAULT_INR_REGION;
      })
      .addCase(fetchUserRegion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
        // Strict fallback to INR (₹)
        state.data = DEFAULT_INR_REGION;
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_region', JSON.stringify(DEFAULT_INR_REGION));
        }
      });
  },
});

export const { setManualRegion, resetToDefaultINR } = regionSlice.actions;
export default regionSlice.reducer;