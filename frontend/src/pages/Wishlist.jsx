import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { toggleWishlistDB, toggleLocalItem, hydrateGuestWishlistAPI } from "../store/features/wishlistSlice";
import { verifyStock, addToCartDB, addLocalItem, hydrateGuestCartAPI } from "../store/features/cartSlice";

const getOptimizedImgUrl = (url) => {
  if (!url) return null; 
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-500,q-80`;
};

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  
  const emptyHeartRef = useRef(null);
  const svgContainerRef = useRef(null);
  const baseHeartRef = useRef(null);
  const crackRef = useRef(null);

  const { 
    items: wishlistItems, 
    isLoading, 
    currencySymbol, 
    currencyCode 
  } = useSelector((state) => state.wishlist);
  
  const cartItems = useSelector((state) => state.cart?.items || []);
  const isAuth = useSelector((state) => state.auth?.isAuthenticated);

  const [addingToCartId, setAddingToCartId] = useState(null);

  const formatPrice = (price) => {
    const locale = currencyCode === "INR" ? "en-IN" : "en-US";
    return `${currencySymbol || "₹"} ${Number(price || 0).toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  const normalizeItem = (item) => {
    return {
      productId: item.productId,
      variantId: item.variantId,
      title: item.title || "Unknown Product",
      slug: item.slug || "#",
      img: item.img || "",
      colorName: item.colorName || "Unknown Color",
      price: item.price || 0,
      status: item.status ? item.status.toLowerCase() : "active",
      inStock: item.inStock !== undefined ? item.inStock : true, 
      stockQuantity: item.stockQuantity || 5, 
    };
  };

  const { contextSafe } = useGSAP(() => {
    if (wishlistItems.length > 0) {
      gsap.fromTo(
        ".wishlist-header",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(
        cardRefs.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    } else if (emptyHeartRef.current) {
      gsap.to(".empty-heart-float", {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      if (crackRef.current) {
        gsap.set(crackRef.current, { strokeDasharray: 100, strokeDashoffset: 100 });
        gsap.to(crackRef.current, { strokeDashoffset: 0, duration: 1.5, delay: 0.3, ease: "power2.out" });
      }
    }
  }, [wishlistItems.length]);

  const handleEmptyMouseMove = contextSafe((e) => {
    if (wishlistItems.length > 0 || !emptyHeartRef.current) return;
    const rect = emptyHeartRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.05;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.05;

    gsap.to(".empty-heart-track", { x, y, duration: 0.5, ease: "power2.out" });
  });

  const handleDiscoverMouseEnter = contextSafe(() => {
    if (!baseHeartRef.current || !crackRef.current || !svgContainerRef.current) return;
    
    gsap.to(crackRef.current, { strokeDashoffset: -100, duration: 0.4, ease: "power2.in", overwrite: true });
    gsap.to(svgContainerRef.current, { scale: 1.15, opacity: 1, duration: 0.5, ease: "back.out(1.7)", overwrite: true });
    gsap.to(baseHeartRef.current, { fill: "#7e7053", stroke: "#71654c", duration: 0.4, delay: 0.2, overwrite: true });
  });

  const handleDiscoverMouseLeave = contextSafe(() => {
    if (!baseHeartRef.current || !crackRef.current || !svgContainerRef.current) return;
    
    gsap.to(baseHeartRef.current, { fill: "transparent", stroke: "currentColor", duration: 0.3, overwrite: true });
    gsap.to(svgContainerRef.current, { scale: 1, opacity: 0.2, duration: 0.4, ease: "power2.out", overwrite: true });
    gsap.set(crackRef.current, { strokeDashoffset: 100 }); 
    gsap.to(crackRef.current, { strokeDashoffset: 0, duration: 0.4, delay: 0.1, ease: "power2.out", overwrite: true });
  });

  const handleRemove = contextSafe((productId, variantId, index) => {
    const card = cardRefs.current[index];
    
    gsap.to(card, {
      scale: 0.9,
      opacity: 0,
      y: 20,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        if (isAuth) {
          dispatch(toggleWishlistDB({ productId, variantId }));
        } else {
          dispatch(toggleLocalItem({ productId, variantId }));
          // Sync guest wishlist removal to MongoDB for Admin visibility
          dispatch(hydrateGuestWishlistAPI());
        }
      }
    });
  });

  const handleAddToCart = contextSafe(async (itemData, index) => {
    setAddingToCartId(itemData.variantId);
    const card = cardRefs.current[index];

    try {
      const stockCheck = await dispatch(verifyStock({
        productId: itemData.productId,
        variantId: itemData.variantId,
        requestedQuantity: 1
      })).unwrap();

      if (!stockCheck.isAvailable) {
        alert(stockCheck.message);
        setAddingToCartId(null);
        return;
      }

      if (isAuth) {
        await dispatch(addToCartDB({
          productId: itemData.productId,
          variantId: itemData.variantId,
          quantity: 1,
        })).unwrap();
      } else {
        dispatch(addLocalItem({
          productId: itemData.productId,
          variantId: itemData.variantId,
          slug: itemData.slug,
          title: itemData.title,
          colorName: itemData.colorName,
          img: itemData.img,
          price: itemData.price,
          quantity: 1,
          maxLimit: stockCheck.availableStock,
        }));
        dispatch(hydrateGuestCartAPI({ isMutation: true }));
      }

      gsap.to(card, {
        scale: 0.9,
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (isAuth) {
            dispatch(toggleWishlistDB({ productId: itemData.productId, variantId: itemData.variantId }));
          } else {
            dispatch(toggleLocalItem({ productId: itemData.productId, variantId: itemData.variantId }));
            dispatch(hydrateGuestWishlistAPI());
          }
        }
      });

    } catch (error) {
      alert("Failed to move to cart. Please try again.");
      setAddingToCartId(null); 
    }
  });

  if (wishlistItems.length === 0) {
    return (
      <main 
        onMouseMove={handleEmptyMouseMove}
        className="w-full min-h-screen pt-32 pb-20 px-6 lg:px-12 bg-[#f8f8f8] flex flex-col items-center justify-center text-[#1a1a1a] overflow-hidden"
      >
        <div ref={emptyHeartRef} className="mb-10 empty-heart-track w-24 h-24 flex items-center justify-center relative">
          <div className="empty-heart-float relative w-full h-full flex items-center justify-center text-[#1a1a1a]">
            <svg 
              ref={svgContainerRef}
              viewBox="0 0 100 100" 
              className="w-full h-full overflow-visible opacity-20"
            >
              <path 
                ref={baseHeartRef}
                d="M50,90 C50,90 10,60 10,30 C10,10 35,10 50,25 C65,10 90,10 90,30 C90,60 50,90 50,90 Z" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="transition-colors"
              />
              <path 
                ref={crackRef}
                d="M50,25 L40,45 L58,60 L45,75 L50,88" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                pathLength="100" 
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-light tracking-widest uppercase mb-4 text-center">Your wishlist is empty</h1>
        <p className="text-sm opacity-50 mb-8 text-center max-w-md pointer-events-none">
          Save items you love here and view them anytime.
        </p>
        
        <Link 
          to="/shop" 
          onMouseEnter={handleDiscoverMouseEnter}
          onMouseLeave={handleDiscoverMouseLeave}
          className="bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase px-10 py-4 hover:bg-black/80 transition-colors relative z-10"
        >
          Discover Pieces
        </Link>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="w-full min-h-screen pt-32 pb-20 px-6 lg:px-12 bg-[#f8f8f8] text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        
        <header className="wishlist-header mb-12 border-b border-black/10 pb-6 flex items-end justify-between">
          <h1 className="text-3xl lg:text-4xl font-light tracking-widest uppercase">Wishlist</h1>
          <span className="text-sm opacity-50">{wishlistItems.length} items</span>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
          {wishlistItems.map((rawItem, index) => {
            const item = normalizeItem(rawItem);
            const isItemInCart = cartItems.some((cartItem) => cartItem.variantId === item.variantId);
            const isUnavailable = item.status !== "active";
            const isOutOfStock = !item.inStock;
            const isAdding = addingToCartId === item.variantId;

            const productUrl = isUnavailable ? "#" : `/product/${item.slug}?variant=${item.variantId}`;
            const optimizedImg = getOptimizedImgUrl(item.img);

            return (
              <div 
                key={`${item.productId}-${item.variantId}`}
                ref={(el) => (cardRefs.current[index] = el)}
                className="group flex flex-col relative"
              >
                <div className="relative w-full aspect-[4/5] bg-[#f0f0f0] overflow-hidden mb-4">
                  <Link 
                    to={productUrl} 
                    className={`absolute inset-0 block ${isUnavailable ? "pointer-events-none" : ""}`}
                  >
                    {optimizedImg ? (
                      <img 
                        src={optimizedImg} 
                        alt={item.title} 
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isUnavailable ? "grayscale opacity-50" : ""}`}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isUnavailable ? "grayscale opacity-50" : ""}`}>
                        <Icon icon="ph:image-light" className="text-4xl text-black/20" />
                      </div>
                    )}
                  </Link>
                  
                  <button 
                    onClick={() => handleRemove(item.productId, item.variantId, index)}
                    disabled={isLoading}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-black z-10 shadow-sm cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <Icon icon="ph:x-bold" className="text-sm" />
                  </button>

                  {isUnavailable && (
                    <div className="absolute top-4 left-4 bg-[#1a1a1a] text-white text-[0.6rem] font-bold tracking-widest uppercase px-3 py-1.5 z-10">
                      Unavailable
                    </div>
                  )}
                  {!isUnavailable && isOutOfStock && (
                    <div className="absolute top-4 left-4 bg-white/90 text-red-600 text-[0.6rem] font-bold tracking-widest uppercase px-3 py-1.5 z-10 shadow-sm">
                      Out of Stock
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <Link 
                        to={productUrl} 
                        className={`text-sm lg:text-base font-medium tracking-wide hover:opacity-70 transition-opacity ${isUnavailable ? "pointer-events-none opacity-50" : ""}`}
                      >
                        {item.title}
                      </Link>
                      <p className={`text-sm font-medium shrink-0 ${isUnavailable ? "opacity-50" : ""}`}>
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className={`text-xs opacity-50 uppercase tracking-wider mb-4 ${isUnavailable ? "opacity-30" : ""}`}>
                      {item.colorName}
                    </p>
                  </div>

                  {isItemInCart ? (
                    <button 
                      onClick={() => navigate('/cart')}
                      className="w-full h-12 border border-black/20 text-[#1a1a1a] flex items-center justify-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/5 transition-colors cursor-pointer"
                    >
                      <Icon icon="ph:check-bold" />
                      View in Cart
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item, index)}
                      disabled={isUnavailable || isOutOfStock || isAdding}
                      className="relative overflow-hidden w-full h-12 border border-[#1a1a1a] flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors disabled:opacity-40 disabled:border-black/20 disabled:cursor-not-allowed group/btn hover:bg-[#1a1a1a] hover:text-white cursor-pointer"
                    >
                      {isAdding ? (
                        <Icon icon="ph:spinner-gap-bold" className="animate-spin text-lg" />
                      ) : isUnavailable ? (
                        "Not Available"
                      ) : isOutOfStock ? (
                        "Out of Stock"
                      ) : (
                        "Move to Cart"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default Wishlist;
