import React from "react";
import { Icon } from "@iconify/react";

const getOptimizedThumbnail = (url) => {
  if (!url) return "/mug.webp";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-200,q-80`;
};

/**
 * P0: Mobile Sticky CTA Bar
 * On mobile viewports (<768px), when the main Add to Cart button scrolls out of view,
 * shows a fixed bottom bar: [Thumbnail | Title | ₹450 | "Add to Cart" button].
 * Prevents page reloads; triggers instant drawer state.
 */
const MobileStickyBar = ({
  isVisible,
  product,
  activeVariant,
  isDrinkware = false,
  selectedBundle = null,
  currencySymbol = "₹",
  currencyCode = "INR",
  exchangeRate = 1,
  isAdding = false,
  onAddToCart,
}) => {
  if (!product || !activeVariant) return null;

  const isINR = !currencyCode || currencyCode === "INR";
  const symbol = isINR ? "₹" : currencySymbol || "$";
  const locale = isINR ? "en-IN" : "en-US";

  const formatAmount = (amountINR) => {
    const val = isINR
      ? amountINR
      : Math.max(1, Math.round(amountINR * (Number(exchangeRate) || 0.012)));
    return `${symbol}${Number(val).toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  };

  const singleUnitDisplay = formatAmount(
    isDrinkware ? 450 : activeVariant.finalPrice || 450
  );
  const activeBundleDisplay =
    isDrinkware && selectedBundle
      ? formatAmount(selectedBundle.priceINR)
      : singleUnitDisplay;

  const thumbnailSrc = getOptimizedThumbnail(
    activeVariant.images?.[0]?.url || "/mug.webp"
  );
  const inStock = Boolean(activeVariant.inStock);

  const handleStickyAddClick = (e) => {
    // Prevent any form submission or page reload
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!inStock || isAdding) return;
    onAddToCart(e);
  };

  return (
    <div
      aria-hidden={!isVisible}
      className={`md:hidden fixed bottom-0 left-0 right-0 z-[99990] bg-white/95 backdrop-blur-md border-t border-black/10 shadow-[0_-8px_30px_rgba(23,20,16,0.12)] px-3.5 py-2.5 transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-[767px] mx-auto flex items-center justify-between gap-2.5">
        {/* 1. Thumbnail */}
        <div className="w-11 h-11 rounded-[2px] overflow-hidden bg-[#f0f0f0] border border-black/10 shrink-0">
          <img
            src={thumbnailSrc}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. Title (& active variant/bundle subtitle) */}
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#1a1a1a] truncate">
            {product.title}
          </p>
          <p className="text-[0.62rem] text-[#1a1a1a]/60 truncate">
            {activeVariant.colorName}
            {isDrinkware && selectedBundle ? ` • ${selectedBundle.title}` : ""}
          </p>
        </div>

        {/* 3. Price (₹450 unit / active bundle price) */}
        <div className="flex flex-col items-end shrink-0 px-1">
          <span className="text-xs font-bold text-[#1a1a1a] whitespace-nowrap">
            {activeBundleDisplay}
          </span>
          {isDrinkware && selectedBundle && selectedBundle.quantity > 1 && (
            <span className="text-[0.58rem] text-[#7e7053] font-medium whitespace-nowrap">
              ({singleUnitDisplay}/unit)
            </span>
          )}
        </div>

        {/* 4. "Add to Cart" Button */}
        <button
          type="button"
          onClick={handleStickyAddClick}
          disabled={!inStock || isAdding}
          className="h-10 px-4 bg-[#1a1a1a] text-white text-[0.62rem] font-bold tracking-[0.16em] uppercase rounded-[2px] flex items-center justify-center gap-1.5 shrink-0 hover:bg-black/85 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <>
              <Icon icon="ph:spinner-gap-bold" className="animate-spin text-sm" />
              <span>Adding...</span>
            </>
          ) : inStock ? (
            "Add to Cart"
          ) : (
            "Out of Stock"
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileStickyBar;