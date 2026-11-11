import React from "react";
import { Link } from "react-router-dom";
import { formatBundlePrice } from "./BundleRadioSelector";

const ProductInfo = ({
  product,
  activeVariant,
  isDrinkware = false,
  selectedBundle = null,
  currencySymbol = "₹",
  currencyCode = "INR",
  exchangeRate = 1,
}) => {
  // P2: Strictly default to INR (₹) unless foreign currency was explicitly set
  const isINR = !currencyCode || currencyCode === "INR";
  const safeSymbol = isINR ? "₹" : currencySymbol || "$";

  const formatPrice = (price) => {
    const locale = isINR ? "en-IN" : "en-US";
    return `${safeSymbol} ${Number(price || 0).toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  };

  const calculatedOriginalPrice = Math.round(activeVariant.finalPrice / 0.7);

  // If this is a drinkware/mug page and a bundle option is active, reflect the active bundle price
  const displaySellingPrice =
    isDrinkware && selectedBundle
      ? formatBundlePrice(
          selectedBundle.priceINR,
          safeSymbol,
          currencyCode,
          exchangeRate
        )
      : `${formatPrice(activeVariant.finalPrice)}.00`;

  const displayOriginalPrice =
    isDrinkware && selectedBundle
      ? selectedBundle.originalPriceINR > selectedBundle.priceINR
        ? formatBundlePrice(
            selectedBundle.originalPriceINR,
            safeSymbol,
            currencyCode,
            exchangeRate
          )
        : null
      : `${formatPrice(calculatedOriginalPrice)}.00`;

  return (
    <>
      {/* Breadcrumbs */}
      <div className="product-info-item flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-5 lg:mb-8">
        <Link to="/" className="hover:opacity-100 transition-opacity">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:opacity-100 transition-opacity">
          Shop
        </Link>
        <span>/</span>
        <Link
          to={`/product/${product.slug}?variant=${activeVariant.variantId}`}
          className="hover:opacity-100 transition-opacity"
        >
          {product.title}
        </Link>
      </div>

      {/* Main Title (Includes specific color name) */}
      <h1 className="product-info-item head-font text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-wide mb-3 lg:mb-4">
        {product.title} - {activeVariant.colorName}
      </h1>

      {/* Dynamic Pricing */}
      <div className="product-info-item text-lg tracking-widest font-light mb-6 lg:mb-8 flex flex-wrap items-center gap-3">
        <span className="font-medium text-[#1a1a1a]">{displaySellingPrice}</span>

        {displayOriginalPrice && (
          <span className="text-sm text-gray-400 line-through">
            {displayOriginalPrice}
          </span>
        )}

        {isDrinkware && selectedBundle && (
          <span className="text-[0.62rem] font-bold tracking-[0.15em] uppercase px-2.5 py-1 bg-[#7e7053]/15 text-[#7e7053] rounded-[2px]">
            {selectedBundle.title} • {selectedBundle.subtitle}
          </span>
        )}
      </div>
    </>
  );
};

export default ProductInfo;