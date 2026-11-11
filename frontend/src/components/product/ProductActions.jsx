import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";

import {
  toggleWishlistDB,
  toggleLocalItem,
  hydrateGuestWishlistAPI,
} from "../../store/features/wishlistSlice";

import BundleRadioSelector, {
  getBundleByQuantity,
  formatBundlePrice,
} from "./BundleRadioSelector";

const ProductActions = ({
  product,
  activeVariant,
  isDrinkware = false,
  selectedBundle = null,
  onSelectBundle,
  quantity = 1,
  setQuantity,
  isAdding = false,
  isBuying = false,
  onAddToCart,
  onBuyNow,
  mainCtaRef,
  currencySymbol = "₹",
  currencyCode = "INR",
  exchangeRate = 1,
}) => {
  const dispatch = useDispatch();

  const isAuth = useSelector((state) => state.auth?.isAuthenticated);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  const isInWishlist = wishlistItems.some(
    (item) =>
      item.productId === product.id &&
      item.variantId === activeVariant.variantId
  );

  const [isCopied, setIsCopied] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isVerifyingQty] = useState(false);

  const { inStock, stockQuantity } = activeVariant;
  // Support up to 5 items (so Option C: Family Pack of 4 is supported)
  const maxLimit =
    inStock && stockQuantity <= 0 ? 5 : Math.min(5, Math.max(4, stockQuantity));

  const buyBtnRef = useRef(null);
  const buyRippleRef = useRef(null);
  const buyTextDarkRef = useRef(null);
  const buyTextLightRef = useRef(null);

  const handleQuantity = (type) => {
    let newQty = quantity;
    if (type === "dec" && quantity > 1) newQty -= 1;
    if (type === "inc" && quantity < maxLimit) newQty += 1;
    if (newQty === quantity) return;

    setQuantity(newQty);

    // Sync bundle selection if quantity matches Option A (2), Option B (1), or Option C (4)
    if (isDrinkware && onSelectBundle) {
      const matchedBundle = getBundleByQuantity(newQty);
      if (matchedBundle) {
        onSelectBundle(matchedBundle);
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (isTogglingWishlist) return;

    if (isAuth) {
      setIsTogglingWishlist(true);
      try {
        await dispatch(
          toggleWishlistDB({
            productId: product.id,
            variantId: activeVariant.variantId,
          })
        ).unwrap();
      } catch (error) {
        console.error("Failed to update wishlist", error);
      } finally {
        setIsTogglingWishlist(false);
      }
    } else {
      dispatch(
        toggleLocalItem({
          productId: product.id,
          variantId: activeVariant.variantId,
        })
      );
      dispatch(hydrateGuestWishlistAPI());
    }
  };

  const fallbackCopy = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title || "Check out this product",
          text: `I thought you might like this ${activeVariant.colorName} variant!`,
          url: currentUrl,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          fallbackCopy(currentUrl);
        }
      }
    } else {
      fallbackCopy(currentUrl);
    }
  };

  const { contextSafe } = useGSAP();

  const handleBuyMouseEnter = contextSafe((e) => {
    if (!inStock || isBuying || isAdding) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(buyRippleRef.current, { x: x, y: y, scale: 0 });
    gsap.to(buyRippleRef.current, {
      scale: 1,
      duration: 0.5,
      ease: "power3.out",
    });
    gsap.to(buyTextDarkRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(buyTextLightRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  const handleBuyMouseLeave = contextSafe((e) => {
    if (!inStock || isBuying || isAdding) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(buyRippleRef.current, {
      scale: 0,
      x: x,
      y: y,
      duration: 0.5,
      ease: "power3.out",
    });
    gsap.to(buyTextDarkRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(buyTextLightRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    });
  });

  const isActionDisabled = !inStock || isAdding || isBuying || isVerifyingQty;

  const activeBundlePriceLabel =
    isDrinkware && selectedBundle
      ? ` • ${formatBundlePrice(
          selectedBundle.priceINR,
          currencySymbol,
          currencyCode,
          exchangeRate
        )}`
      : "";

  return (
    <div className="product-info-item w-full flex flex-col gap-3 lg:gap-4 mb-8 lg:mb-12">
      {/* P0: Bundle Radio Selector above the CTA button on mug/drinkware pages */}
      {isDrinkware && selectedBundle && (
        <BundleRadioSelector
          selectedBundleId={selectedBundle.id}
          onSelectBundle={onSelectBundle}
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
          exchangeRate={exchangeRate}
          disabled={!inStock}
        />
      )}

      <div className="flex gap-2 lg:gap-4 h-12 lg:h-14 w-full">
        <div className="flex items-center justify-between border border-black/10 px-2.5 lg:px-4 w-[88px] lg:w-32 shrink-0">
          <button
            type="button"
            onClick={() => handleQuantity("dec")}
            disabled={quantity <= 1 || isActionDisabled}
            className={`p-2 cursor-pointer transition-opacity ${
              quantity <= 1 || isActionDisabled
                ? "opacity-20 cursor-not-allowed"
                : "opacity-50 hover:opacity-100"
            }`}
          >
            <Icon icon="ph:minus" />
          </button>

          <span className={`text-sm font-medium ${!inStock && "opacity-30"}`}>
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => handleQuantity("inc")}
            disabled={quantity >= maxLimit || isActionDisabled}
            className={`p-2 cursor-pointer transition-opacity ${
              quantity >= maxLimit || isActionDisabled
                ? "opacity-20 cursor-not-allowed"
                : "opacity-50 hover:opacity-100"
            }`}
          >
            <Icon icon="ph:plus" />
          </button>
        </div>

        {/* Main Add to Cart CTA Button (Observed for Mobile Sticky CTA Bar) */}
        <button
          ref={mainCtaRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(e);
          }}
          disabled={!inStock || isAdding || isVerifyingQty || isBuying}
          className="flex-1 flex justify-center items-center gap-2 bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding || isVerifyingQty ? (
            <>
              <Icon
                icon="ph:spinner-gap-bold"
                className="animate-spin text-lg"
              />
              {isVerifyingQty ? "VERIFYING..." : "ADDING..."}
            </>
          ) : inStock ? (
            `Add to Cart${activeBundlePriceLabel}`
          ) : (
            "Out of Stock"
          )}
        </button>

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isTogglingWishlist}
          className={`w-11 lg:w-14 h-12 lg:h-14 border border-black/10 flex items-center justify-center text-xl hover:bg-black/5 transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
            isInWishlist
              ? "text-[#7e7053] border-[#171410]"
              : "text-[#1a1a1a]"
          }`}
          title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          {isTogglingWishlist ? (
            <Icon icon="ph:spinner-gap-bold" className="animate-spin" />
          ) : (
            <Icon icon={isInWishlist ? "ph:heart-fill" : "ph:heart-light"} />
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="relative w-11 lg:w-14 h-12 lg:h-14 border border-black/10 flex items-center justify-center text-xl hover:bg-black/5 transition-colors shrink-0 group cursor-pointer"
          title="Share Product"
        >
          {isCopied ? (
            <Icon icon="ph:check" className="text-green-600" />
          ) : (
            <Icon icon="ph:share-network-light" />
          )}

          <span
            className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[0.55rem] font-bold tracking-wider uppercase px-3 py-1.5 rounded-[2px] whitespace-nowrap transition-all duration-300 pointer-events-none ${
              isCopied
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            Link Copied
          </span>
        </button>
      </div>

      <button
        ref={buyBtnRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onBuyNow(e);
        }}
        disabled={isActionDisabled}
        onMouseEnter={handleBuyMouseEnter}
        onMouseLeave={handleBuyMouseLeave}
        className="relative overflow-hidden w-full h-12 lg:h-14 border border-[#1a1a1a] flex items-center justify-center group disabled:border-black/20 disabled:cursor-not-allowed cursor-pointer"
      >
        <div
          ref={buyRippleRef}
          className="absolute bg-[#1a1a1a] rounded-full pointer-events-none z-0"
          style={{
            width: "1000px",
            height: "1000px",
            top: "-500px",
            left: "-500px",
            transform: "scale(0)",
          }}
        />
        <span
          ref={buyTextDarkRef}
          className={`absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase ${
            !inStock ? "text-black/30" : "text-[#1a1a1a]"
          }`}
        >
          {isBuying ? (
            <>
              <Icon
                icon="ph:spinner-gap-bold"
                className="animate-spin text-lg"
              />{" "}
              PROCESSING...
            </>
          ) : inStock ? (
            "Buy it now"
          ) : (
            "Unavailable"
          )}
        </span>
        <span
          ref={buyTextLightRef}
          className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white opacity-0"
        >
          {isBuying ? (
            <>
              <Icon
                icon="ph:spinner-gap-bold"
                className="animate-spin text-lg"
              />{" "}
              PROCESSING...
            </>
          ) : (
            "Buy it now"
          )}
        </span>
      </button>
    </div>
  );
};

export default ProductActions;