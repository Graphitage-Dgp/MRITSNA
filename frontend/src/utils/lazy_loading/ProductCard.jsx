import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import PremiumImage from "./PremiumImage";
import useCardActions from "../useCardActions";

const ProductCard = ({ product, currencySymbol = "₹" }) => {
  const {
    isInWishlist,
    isAdding,
    isTogglingWishlist,
    handleAddToCart,
    handleWishlistToggle,
  } = useCardActions({
    productId: product._id,
    variantId: product.variantId,
    slug: product.slug,
    name: product.name,
    colorName: product.colorName,
    img: product.img,
    finalPrice: product.finalPrice,
    originalPrice: product.originalPrice,
    inStock: product.inStock,
    category: product.category,
  });

  const formatPrice = (price) => {
    const locale = currencySymbol === "₹" ? "en-IN" : "en-US";
    return `${currencySymbol} ${price.toLocaleString(locale)}`;
  };

  const calculatedOriginalPrice = Math.round(product.finalPrice / 0.7);
  const inStock = product.inStock !== false;
  const productUrl = `/product/${product.slug}${
    product.variantId ? `?variant=${product.variantId}` : ""
  }`;

  return (
    <div className="gsap-reveal-card group relative flex flex-col w-full opacity-0 translate-y-8">
      <div className="relative w-full aspect-[4/5] bg-[#eeeeee] overflow-hidden">
        <Link
          to={productUrl}
          data-cursor="explore"
          className="block w-full h-full cursor-none lg:cursor-none"
          aria-label={`View ${product.name}`}
        >
          <div className="w-full h-full transition-transform duration-700 group-hover:scale-105">
            <PremiumImage src={product.img} alt={product.alt || product.name} />
          </div>
        </Link>

        {product.isPremium && (
          <div className="absolute top-3 left-3 z-10 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
            Premium
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isTogglingWishlist}
          title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          className={`absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60 ${
            isInWishlist
              ? "text-[#7e7053]"
              : "text-[#1a1a1a] hover:text-[#7e7053]"
          }`}
        >
          {isTogglingWishlist ? (
            <Icon icon="ph:spinner-gap-bold" className="animate-spin" />
          ) : (
            <Icon icon={isInWishlist ? "ph:heart-fill" : "ph:heart-light"} />
          )}
        </button>

        <div className="absolute inset-x-0 bottom-0 z-20 p-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || isAdding}
            className="w-full h-9 lg:h-10 flex items-center justify-center gap-1.5 bg-[#1a1a1a] text-white text-[0.62rem] lg:text-[0.68rem] font-bold tracking-[0.18em] uppercase border border-[#1a1a1a] shadow-[0_4px_14px_rgba(28,26,23,0.2)] hover:bg-black/80 hover:border-black/80 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <>
                <Icon icon="ph:spinner-gap-bold" className="animate-spin" />
                Adding
              </>
            ) : !inStock ? (
              "Sold Out"
            ) : (
              <>
                <Icon icon="ph:bag-simple" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>

      <Link
        to={productUrl}
        data-cursor="explore"
        className="flex flex-col items-start mt-4 lg:mt-5 text-sm lg:text-base tracking-wide font-medium cursor-none lg:cursor-none"
      >
        <h3 className="line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs lg:text-sm font-medium text-[#1a1a1a]">
            {formatPrice(product.finalPrice)}.00
          </span>
          <span className="text-[10px] lg:text-xs text-gray-400 line-through">
            {formatPrice(calculatedOriginalPrice)}.00
          </span>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
