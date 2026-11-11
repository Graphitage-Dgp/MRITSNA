import React from "react";

// P0: Bundle Radio Selector Options for Mug / Drinkware PDPs
// Option A (Default): Set of 2 – ₹799 (Save ₹100 + Free Delivery)
// Option B: Single Unit – ₹450
// Option C: Family Pack of 4 – ₹1,499 (Free Delivery + Gift Box)
export const BUNDLE_OPTIONS = [
  {
    id: "option_a",
    optionCode: "Option A",
    isDefault: true,
    title: "Set of 2",
    quantity: 2,
    priceINR: 799,
    originalPriceINR: 900,
    savingsINR: 100,
    subtitle: "Save ₹100 + Free Delivery",
    badge: "Most Popular • Default",
    perks: ["Save ₹100", "Free Delivery"],
  },
  {
    id: "option_b",
    optionCode: "Option B",
    isDefault: false,
    title: "Single Unit",
    quantity: 1,
    priceINR: 450,
    originalPriceINR: 450,
    savingsINR: 0,
    subtitle: "Standard single piece",
    badge: null,
    perks: [],
  },
  {
    id: "option_c",
    optionCode: "Option C",
    isDefault: false,
    title: "Family Pack of 4",
    quantity: 4,
    priceINR: 1499,
    originalPriceINR: 1800,
    savingsINR: 301,
    subtitle: "Free Delivery + Gift Box",
    badge: "Best Value",
    perks: ["Free Delivery", "Gift Box"],
  },
];

export const DEFAULT_BUNDLE_ID = "option_a";

export const getBundleById = (bundleId) =>
  BUNDLE_OPTIONS.find((b) => b.id === bundleId) || BUNDLE_OPTIONS[0];

export const getBundleByQuantity = (quantity) => {
  if (Number(quantity) === 2) return BUNDLE_OPTIONS[0]; // Option A: Set of 2
  if (Number(quantity) === 1) return BUNDLE_OPTIONS[1]; // Option B: Single Unit
  if (Number(quantity) === 4) return BUNDLE_OPTIONS[2]; // Option C: Family Pack of 4
  return null;
};

// Detects mug / drinkware products from category, title, or slug
export const isDrinkwareProduct = (product) => {
  if (!product) return false;
  const drinkwareKeywords = [
    "mug",
    "cup",
    "tumbler",
    "drinkware",
    "tea",
    "teapot",
    "kulhad",
    "chalice",
    "goblet",
  ];
  const category = (product.category || "").toLowerCase().trim();
  const title = (product.title || "").toLowerCase().trim();
  const slug = (product.slug || "").toLowerCase().trim();

  // Exclude non-drinkware candle category even if it contains "tea" ("tealight candle")
  if (category === "tealight candle" || category === "aromatic candle") {
    return false;
  }

  return drinkwareKeywords.some(
    (kw) => category === kw || category.includes(kw) || title.includes(kw) || slug.includes(kw)
  );
};

// Helper to format price strictly in INR (₹) by default, or converted if user manually switched currency
export const formatBundlePrice = (
  amountINR,
  currencySymbol = "₹",
  currencyCode = "INR",
  rate = 1
) => {
  const isINR = !currencyCode || currencyCode === "INR";
  const finalAmount = isINR
    ? amountINR
    : Math.max(1, Math.round(amountINR * (Number(rate) || 0.012)));
  const locale = isINR ? "en-IN" : "en-US";
  const symbol = isINR ? "₹" : currencySymbol || "$";
  return `${symbol}${finalAmount.toLocaleString(locale, {
    maximumFractionDigits: 0,
  })}`;
};

const BundleRadioSelector = ({
  selectedBundleId = DEFAULT_BUNDLE_ID,
  onSelectBundle,
  currencySymbol = "₹",
  currencyCode = "INR",
  exchangeRate = 1,
  disabled = false,
}) => {
  const isINR = !currencyCode || currencyCode === "INR";

  return (
    <fieldset
      className="product-info-item w-full mb-6 border-0 p-0 m-0"
      aria-label="Select Bundle Option"
    >
      <div className="flex items-center justify-between mb-3">
        <legend className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a]/70">
          Select Pack / Bundle
        </legend>
        <span className="text-[0.6rem] font-semibold tracking-[0.15em] uppercase text-[#7e7053]">
          Studio Drinkware Offer
        </span>
      </div>

      <div className="flex flex-col gap-2.5" role="radiogroup">
        {BUNDLE_OPTIONS.map((option) => {
          const isSelected = selectedBundleId === option.id;
          const displayPrice = formatBundlePrice(
            option.priceINR,
            currencySymbol,
            currencyCode,
            exchangeRate
          );
          const displayOriginalPrice = formatBundlePrice(
            option.originalPriceINR,
            currencySymbol,
            currencyCode,
            exchangeRate
          );
          const displaySubtitle =
            option.id === "option_a" && !isINR
              ? `Save ${formatBundlePrice(
                  option.savingsINR,
                  currencySymbol,
                  currencyCode,
                  exchangeRate
                )} + Free Delivery`
              : option.subtitle;

          return (
            <label
              key={option.id}
              htmlFor={`bundle-radio-${option.id}`}
              className={`relative flex items-center justify-between p-3.5 lg:p-4 rounded-[2px] border transition-all duration-200 cursor-pointer select-none ${
                isSelected
                  ? "border-[#1a1a1a] bg-white shadow-[0_6px_20px_rgba(23,20,16,0.06)]"
                  : "border-black/15 bg-[#f8f8f8] hover:border-black/35"
              } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-start gap-3 pr-2">
                <input
                  id={`bundle-radio-${option.id}`}
                  type="radio"
                  name="pdp-drinkware-bundle"
                  value={option.id}
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => onSelectBundle(option)}
                  className="mt-1 h-4 w-4 accent-[#1a1a1a] cursor-pointer shrink-0"
                />

                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs lg:text-sm font-semibold tracking-wide text-[#1a1a1a]">
                      {option.optionCode}
                      {option.isDefault ? " (Default)" : ""}: {option.title} –{" "}
                      <span className="font-bold">{displayPrice}</span>
                    </span>

                    {option.badge && (
                      <span className="text-[0.55rem] font-bold tracking-[0.15em] uppercase px-2 py-0.5 bg-[#1a1a1a] text-white rounded-[2px]">
                        {option.badge}
                      </span>
                    )}
                  </div>

                  {(option.id === "option_a" || option.id === "option_c") ? (
                    <span className="text-[0.7rem] font-medium text-[#7e7053] mt-0.5">
                      ({displaySubtitle})
                    </span>
                  ) : (
                    <span className="text-[0.7rem] text-[#1a1a1a]/50 mt-0.5">
                      {displaySubtitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm lg:text-base font-bold text-[#1a1a1a]">
                  {displayPrice}
                </span>
                {option.originalPriceINR > option.priceINR && (
                  <span className="text-[0.68rem] text-gray-400 line-through">
                    {displayOriginalPrice}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default BundleRadioSelector;