import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSingleProduct,
  clearSingleProduct,
} from "../store/features/productSlice";
import {
  addToCartDB,
  addLocalItem,
  hydrateGuestCartAPI,
  openCartDrawer,
} from "../store/features/cartSlice";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

// Meta Pixel Utility
import { trackViewContent, trackAddToCart } from "../utils/metaPixel";

// Sub-components
import ProductGallery from "../components/product/ProductGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductSwatches from "../components/product/ProductSwatches";
import ProductActions from "../components/product/ProductActions";
import ProductAccordion from "../components/product/ProductAccordion";
import CareBadges from "../components/product/CareBadges";
import ProductReviews from "../components/product/ProductReviews";
import MobileStickyBar from "../components/product/MobileStickyBar";
import {
  BUNDLE_OPTIONS,
  isDrinkwareProduct,
} from "../components/product/BundleRadioSelector";

const Product = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const mainCtaRef = useRef(null);

  // Guard ref to prevent duplicate ViewContent fires on color changes
  const hasTrackedView = useRef(false);

  const [desktopZoom, setDesktopZoom] = useState({
    show: false,
    img: "",
    x: 0,
    y: 0,
  });
  const [activeVariant, setActiveVariant] = useState(null);

  // P0: Bundle Radio Selector State (Option A: Set of 2 is default on mug/drinkware pages)
  const [selectedBundle, setSelectedBundle] = useState(BUNDLE_OPTIONS[0]);
  const [quantity, setQuantity] = useState(BUNDLE_OPTIONS[0].quantity);

  // P0: Mobile Sticky CTA Bar State (<768px when main Add to Cart scrolls out of view)
  const [isStickyBarVisible, setIsStickyBarVisible] = useState(false);

  // Action loading states shared between main CTA and Mobile Sticky CTA Bar
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const isAuth = useSelector((state) => state.auth?.isAuthenticated);
  const regionData = useSelector((state) => state.region?.data);

  // Pull product data from Redux
  const {
    singleProduct: product,
    isLoading,
    isError,
    message,
    currencySymbol: productCurrencySymbol,
    currencyCode: productCurrencyCode,
  } = useSelector((state) => state.product);

  // P2: Strictly default to INR (₹) unless the user explicitly switched the currency dropdown
  const isManualForeign = Boolean(
    regionData?.isManual &&
      regionData?.currencyCode &&
      regionData.currencyCode !== "INR"
  );
  const currencyCode = isManualForeign
    ? regionData.currencyCode || productCurrencyCode || "USD"
    : "INR";
  const currencySymbol = isManualForeign
    ? regionData.symbol || productCurrencySymbol || "$"
    : "₹";
  const exchangeRate = isManualForeign ? Number(regionData.rate) || 0.012 : 1;

  const isDrinkware = isDrinkwareProduct(product);

  // Fetch the product when the component mounts or the slug changes
  useEffect(() => {
    hasTrackedView.current = false;
    dispatch(fetchSingleProduct(slug));
    return () => {
      dispatch(clearSingleProduct());
    };
  }, [dispatch, slug]);

  // Sync the variant state with the URL and Product Data
  useEffect(() => {
    if (product && product.variants?.length > 0) {
      const urlVariantId = searchParams.get("variant");
      const matchedVariant = product.variants.find(
        (v) => v.variantId === urlVariantId
      );
      setActiveVariant(matchedVariant || product.variants[0]);
    }
  }, [product, searchParams]);

  // Reset bundle & quantity defaults when product or variant changes
  useEffect(() => {
    if (!product) return;
    if (isDrinkwareProduct(product)) {
      setSelectedBundle(BUNDLE_OPTIONS[0]); // Option A (Default): Set of 2 – ₹799
      setQuantity(BUNDLE_OPTIONS[0].quantity); // 2
    } else {
      setSelectedBundle(null);
      setQuantity(1);
    }
  }, [product, activeVariant?.variantId]);

  // P0: Observe when the main Add to Cart button scrolls out of view on mobile (<768px)
  useEffect(() => {
    const ctaEl = mainCtaRef.current;
    if (!ctaEl) return;

    const evaluateVisibility = (isIntersecting) => {
      const isMobileViewport = window.innerWidth < 768;
      setIsStickyBarVisible(isMobileViewport && !isIntersecting);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        evaluateVisibility(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    observer.observe(ctaEl);

    const handleResizeOrScroll = () => {
      if (!mainCtaRef.current) return;
      const rect = mainCtaRef.current.getBoundingClientRect();
      const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
      evaluateVisibility(inViewport);
    };

    window.addEventListener("resize", handleResizeOrScroll, { passive: true });
    window.addEventListener("scroll", handleResizeOrScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll);
    };
  }, [product, activeVariant]);

  // --- META PIXEL VIEW CONTENT TRACKING ---
  useEffect(() => {
    if (product && activeVariant && !hasTrackedView.current) {
      trackViewContent(
        product.title,
        product.id,
        isDrinkware ? 799 : activeVariant.finalPrice,
        currencyCode || "INR"
      );
      hasTrackedView.current = true;
    }
  }, [product, activeVariant, isDrinkware, currencyCode]);

  // Handle when a user clicks a color swatch
  const handleVariantChange = (variant) => {
    setActiveVariant(variant);
    setSearchParams({ variant: variant.variantId }, { replace: true });
  };

  // Handle when a user selects a bundle radio option on mug/drinkware pages
  const handleSelectBundle = useCallback((bundleOption) => {
    setSelectedBundle(bundleOption);
    setQuantity(bundleOption.quantity);
  }, []);

  // Shared Add to Cart logic for both Main CTA and Mobile Sticky CTA Bar
  // Prevents page reloads and triggers instant Cart Drawer state
  const handleAddToCart = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!product || !activeVariant || !activeVariant.inStock || isAdding) {
      return;
    }

    const effectiveQty =
      isDrinkware && selectedBundle ? selectedBundle.quantity : quantity;

    const bundleTotalINR =
      isDrinkware && selectedBundle
        ? selectedBundle.priceINR
        : (activeVariant.finalPrice || 450) * effectiveQty;

    const finalLineTotal =
      currencyCode === "INR"
        ? bundleTotalINR
        : Math.max(1, Math.round(bundleTotalINR * exchangeRate));

    const effectiveUnitPrice = Math.round(finalLineTotal / effectiveQty);
    const primaryImage =
      activeVariant.images?.find((img) => img.isPrimary)?.url ||
      activeVariant.images?.[0]?.url ||
      "/mug.webp";

    setIsAdding(true);

    try {
      // Optimistically update guest cart & open instant drawer immediately (no page reload)
      if (!isAuth) {
        dispatch(
          addLocalItem({
            cartItemId: `guest-${activeVariant.variantId}`,
            productId: product.id,
            variantId: activeVariant.variantId,
            slug: product.slug,
            title: product.title,
            colorName: activeVariant.colorName,
            img: primaryImage,
            price: effectiveUnitPrice,
            originalPrice: activeVariant.originalPrice || 450,
            quantity: effectiveQty,
            itemTotal: finalLineTotal,
            isDrinkware: isDrinkware,
            bundleId: selectedBundle?.id || null,
            bundleLabel:
              isDrinkware && selectedBundle
                ? `${selectedBundle.title} (${selectedBundle.subtitle})`
                : null,
            replaceQuantity: isDrinkware,
            maxLimit: 5,
          })
        );

        // Trigger instant drawer state immediately
        dispatch(openCartDrawer());

        // Background sync with backend
        dispatch(hydrateGuestCartAPI({ isMutation: true }));
      } else {
        // Trigger instant drawer state & persist to DB for logged-in user
        dispatch(openCartDrawer());

        await dispatch(
          addToCartDB({
            productId: product.id,
            variantId: activeVariant.variantId,
            quantity: effectiveQty,
          })
        ).unwrap();
      }

      // Fire Meta Pixel AddToCart event
      trackAddToCart(product.title, product.id, finalLineTotal, currencyCode);
    } catch (error) {
      console.warn("Add to cart sync warning:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!product || !activeVariant || !activeVariant.inStock || isBuying) {
      return;
    }

    setIsBuying(true);
    try {
      await handleAddToCart(e);
      navigate("/checkout");
    } finally {
      setIsBuying(false);
    }
  };

  // Entrance Animations
  useGSAP(() => {
    if (product && activeVariant) {
      const tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(
        ".product-image",
        { opacity: 0, y: 50, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          stagger: 0.15,
          ease: "power3.out",
        }
      ).fromTo(
        ".product-info-item",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out",
        },
        "-=1.5"
      );
    }
  }, [product]);

  // Loading State
  if (isLoading || !product || !activeVariant) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <Icon
          icon="lucide:loader-2"
          className="animate-spin text-gray-400"
          width="32"
        />
      </main>
    );
  }

  // Error State
  if (isError) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-500 mb-8">{message}</p>
        <Link
          to="/shop"
          className="bg-[#1a1a1a] text-white px-8 py-3 text-xs tracking-widest uppercase font-bold"
        >
          Return to Shop
        </Link>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[80px] lg:pt-[100px] pb-28 md:pb-20"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-12 lg:gap-20">
        {/* Left Column: Image Gallery */}
        <ProductGallery
          images={activeVariant.images}
          setDesktopZoom={setDesktopZoom}
        />

        {/* Right Column: Sticky Product Info */}
        <div className="w-full lg:w-[45%] relative">
          <div className="lg:sticky lg:top-[120px] flex flex-col items-start w-full lg:max-w-[500px]">
            <div
              className={`transition-opacity duration-300 w-full ${
                desktopZoom.show
                  ? "lg:opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <ProductInfo
                product={product}
                activeVariant={activeVariant}
                isDrinkware={isDrinkware}
                selectedBundle={selectedBundle}
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
                exchangeRate={exchangeRate}
              />

              <ProductSwatches
                variants={product.variants}
                activeVariant={activeVariant}
                onVariantChange={handleVariantChange}
              />

              <ProductActions
                product={product}
                activeVariant={activeVariant}
                isDrinkware={isDrinkware}
                selectedBundle={selectedBundle}
                onSelectBundle={handleSelectBundle}
                quantity={quantity}
                setQuantity={setQuantity}
                isAdding={isAdding}
                isBuying={isBuying}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                mainCtaRef={mainCtaRef}
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
                exchangeRate={exchangeRate}
              />

              <CareBadges product={product} />

              <p className="product-info-item text-sm lg:text-base font-light opacity-80 leading-relaxed mb-8 lg:mb-10 w-full lg:w-[90%]">
                {product.description}
              </p>

              <ProductAccordion variant={activeVariant} />
            </div>

            {/* Desktop Zoom Overlay */}
            <div
              className={`hidden lg:block absolute inset-0 w-full h-[600px] bg-[#f8f8f8] z-10 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-[2px]
                ${desktopZoom.show ? "opacity-100" : "opacity-0"}
              `}
              style={{
                backgroundImage: `url(${desktopZoom.img})`,
                backgroundPosition: `${desktopZoom.x}% ${desktopZoom.y}%`,
                backgroundSize: "400%",
                backgroundRepeat: "no-repeat",
              }}
            />
          </div>
        </div>
      </div>

      <ProductReviews product={product} activeVariant={activeVariant} />

      {/* P0: Mobile Sticky CTA Bar (<768px when main Add to Cart scrolls out of view) */}
      <MobileStickyBar
        isVisible={isStickyBarVisible}
        product={product}
        activeVariant={activeVariant}
        isDrinkware={isDrinkware}
        selectedBundle={selectedBundle}
        currencySymbol={currencySymbol}
        currencyCode={currencyCode}
        exchangeRate={exchangeRate}
        isAdding={isAdding}
        onAddToCart={handleAddToCart}
      />
    </main>
  );
};

export default Product;