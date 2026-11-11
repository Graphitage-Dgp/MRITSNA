import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import useCardActions from "../../utils/useCardActions";

const CollectionCard = ({ product, currencyCode, offsetClass }) => {
  const firstVariant = product.variants?.[0] || {};
  const livePrice = firstVariant.pricing?.price || 0;
  const primaryImage = firstVariant.images?.[0]?.baseUrl;
  const variantId = firstVariant._id;
  const inStock =
    (firstVariant.inventory?.quantity || 0) > 0 ||
    (firstVariant.inventory?.allowBackorder || false);

  const locale = currencyCode === "INR" ? "en-IN" : "en-US";
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode || "INR",
    maximumFractionDigits: 0,
  }).format(livePrice);

  const productUrl = `/product/${product.slug}${
    variantId ? `?variant=${variantId}` : ""
  }`;

  const {
    isInWishlist,
    isAdding,
    isTogglingWishlist,
    handleAddToCart,
    handleWishlistToggle,
  } = useCardActions({
    productId: product._id,
    variantId,
    slug: product.slug,
    name: product.title,
    colorName: firstVariant.colorName,
    img: primaryImage,
    finalPrice: livePrice,
    originalPrice: firstVariant.pricing?.originalPrice || livePrice,
    inStock,
    category: product.category,
  });

  return (
    <div className={`product-card group flex flex-col relative ${offsetClass}`}>
      <div className="relative w-full aspect-[4/5] overflow-hidden mb-6 bg-[#f0f0f0]">
        <Link to={productUrl} className="block w-full h-full" aria-label={`View ${product.title}`}>
          {primaryImage ? (
            <img
              src={`${primaryImage}?tr=w-1200,q-80,f-webp`}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/20">
              <span className="text-xs uppercase tracking-widest font-bold">No Image</span>
            </div>
          )}
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
          className={`absolute top-3 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60 ${
            isInWishlist ? "text-[#7e7053]" : "text-[#1a1a1a] hover:text-[#7e7053]"
          }`}
        >
          {isTogglingWishlist ? (
            <Icon icon="ph:spinner-gap-bold" className="animate-spin" />
          ) : (
            <Icon icon={isInWishlist ? "ph:heart-fill" : "ph:heart-light"} />
          )}
        </button>

        <div className="absolute inset-x-0 bottom-0 z-20 p-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || isAdding}
            className="w-full h-10 flex items-center justify-center gap-1.5 bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.18em] uppercase border border-[#1a1a1a] shadow-[0_4px_14px_rgba(28,26,23,0.2)] hover:bg-black/80 hover:border-black/80 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
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
        className="flex justify-between items-start gap-4"
      >
        <h4 className="head-font text-2xl lg:text-3xl transition-colors group-hover:text-black/60">
          {product.title}
        </h4>
        <p className="text-[0.65rem] font-bold tracking-widest mt-1 shrink-0">
          {formattedPrice}
        </p>
      </Link>
    </div>
  );
};

const CollectionGrid = ({ products = [], currencyCode }) => {
  const gridRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(".product-card",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: "power3.out", scrollTrigger: {
        trigger: gridRef.current,
        start: "top 75%",
      }}
    );
  }, { scope: gridRef });

  const getOffsetClass = (index) => {
    const columnPosition = index % 3;
    if (columnPosition === 0) return "mt-0";
    if (columnPosition === 1) return "lg:mt-32";
    return "lg:mt-16";
  };

  return (
    <section ref={gridRef} className="w-full px-6 lg:px-12 pb-32 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end border-b border-black/10 pb-8 mb-16">
        <h3 className="head-font text-4xl lg:text-5xl">The Pieces</h3>
        <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50">
          {products.length} Items
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 xl:gap-24">
        {products.map((product, index) => (
          <CollectionCard
            key={product._id}
            product={product}
            currencyCode={currencyCode}
            offsetClass={getOffsetClass(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default CollectionGrid;
