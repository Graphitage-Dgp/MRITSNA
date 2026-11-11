export const DRINKWARE_CATEGORIES = ['mug', 'cup', 'tumbler', 'drinkware', 'tea', 'teapot'];

export const isDrinkwareCategory = (category = '', title = '') => {
    const catLower = (category || '').toLowerCase().trim();
    const titleLower = (title || '').toLowerCase().trim();
    if (catLower === 'tealight candle' || catLower === 'aromatic candle') return false;
    return DRINKWARE_CATEGORIES.some(
        (kw) => catLower === kw || catLower.includes(kw) || titleLower.includes(kw)
    );
};

/**
 * P0: Bundle Radio Selector pricing engine for mug/drinkware items:
 * - Option A (Set of 2): ₹799 (Save ₹100 + Free Delivery)
 * - Option B (Single Unit): ₹450
 * - Option C (Family Pack of 4): ₹1,499 (Free Delivery + Gift Box)
 */
export const calculateDrinkwareBundleTotal = (quantity, regionData) => {
    const safeRegion = regionData || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };
    const isDomestic = !safeRegion.countryCode || safeRegion.countryCode === 'IN' || safeRegion.countryCode === 'INDIA' || safeRegion.currencyCode === 'INR';

    let bundleTotalINR = 450 * quantity;
    let originalTotalINR = 450 * quantity;
    let bundleLabel = 'Single Unit';

    if (quantity === 2) {
        bundleTotalINR = 799;
        originalTotalINR = 900;
        bundleLabel = 'Set of 2 (Save ₹100 + Free Delivery)';
    } else if (quantity === 4) {
        bundleTotalINR = 1499;
        originalTotalINR = 1800;
        bundleLabel = 'Family Pack of 4 (Free Delivery + Gift Box)';
    } else if (quantity === 1) {
        bundleTotalINR = 450;
        originalTotalINR = 450;
        bundleLabel = 'Single Unit';
    }

    if (isDomestic) {
        return {
            unitSellingPrice: Math.round(bundleTotalINR / quantity),
            unitOriginalPrice: Math.round(originalTotalINR / quantity),
            itemTotal: bundleTotalINR,
            bundleLabel,
            currencyCode: 'INR',
            symbol: '₹',
        };
    }

    const rate = Number(safeRegion.rate) || 0.012;
    const convertedTotal = Math.max(1, Math.round(bundleTotalINR * rate));
    const convertedOriginal = Math.max(1, Math.round(originalTotalINR * rate));

    return {
        unitSellingPrice: Math.max(1, Math.round(convertedTotal / quantity)),
        unitOriginalPrice: Math.max(1, Math.round(convertedOriginal / quantity)),
        itemTotal: convertedTotal,
        bundleLabel,
        currencyCode: safeRegion.currencyCode || 'USD',
        symbol: safeRegion.symbol || '$',
    };
};

export const calculateRegionalPricing = (basePriceINR, discountPercentage = 0, isPremium = false, regionData) => {
    const safeRegion = regionData || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    // Calculate the true selling price in INR first (Base - Discount)
    let sellingPriceINR = basePriceINR;
    if (discountPercentage > 0) {
        sellingPriceINR = Math.round(basePriceINR - (basePriceINR * (discountPercentage / 100)));
    }

    // Domestic (India) Routing - Strictly default to INR (₹)
    if (!safeRegion.countryCode || safeRegion.countryCode === 'IN' || safeRegion.countryCode === 'INDIA' || safeRegion.currencyCode === 'INR') {
        return {
            originalPrice: basePriceINR,
            sellingPrice: sellingPriceINR,
            discountPercentage: discountPercentage,
            currencyCode: 'INR',
            symbol: '₹'
        };
    }

    // International (Export) Routing - Apply Markups only when user explicitly selected foreign currency
    const exportMarkupINR = isPremium ? 10000 : 5000;
    const finalSellingPriceINR = sellingPriceINR + exportMarkupINR;
    const finalOriginalPriceINR = basePriceINR + exportMarkupINR;

    const convertedSellingPrice = Math.max(1, Math.round(finalSellingPriceINR * safeRegion.rate));
    const convertedOriginalPrice = Math.max(1, Math.round(finalOriginalPriceINR * safeRegion.rate));

    return {
        originalPrice: convertedOriginalPrice,
        sellingPrice: convertedSellingPrice,
        discountPercentage: discountPercentage,
        currencyCode: safeRegion.currencyCode,
        symbol: safeRegion.symbol
    };
};