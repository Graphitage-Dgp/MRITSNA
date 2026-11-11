import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  updateLocalQuantity,
  removeLocalItem,
  updateCartQuantityDB,
  removeFromCartDB,
  verifyStock,
  hydrateGuestCartAPI,
} from "../store/features/cartSlice";

const getOptimizedImgUrl = (url) => {
  if (!url) return "";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-400,q-80`;
};

const Cart = () => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const itemsRef = useRef([]);

  const emptyBagRef = useRef(null);

  const {
    items: cartItems,
    isLoading,
    currencySymbol,
    currencyCode,
  } = useSelector((state) => state.cart);

  const isAuth = useSelector((state) => state.auth?.isAuthenticated);

  const [stagedQty, setStagedQty] = useState({});
  const [isVerifying, setIsVerifying] = useState({});
  const debounceTimers = useRef({});

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const formatPrice = (price) => {
    const locale = currencyCode === "INR" ? "en-IN" : "en-US";
    return `${currencySymbol || "₹"} ${Number(price).toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  const liveSubTotal = cartItems.reduce((total, item) => {
    const currentQty = stagedQty[item.variantId] ?? item.quantity;
    return total + (item.price * currentQty);
  }, 0);

  const handleQuantityChange = (item, type) => {
    const currentQty = stagedQty[item.variantId] ?? item.quantity;
    let newQty = currentQty;

    if (type === "inc" && currentQty < item.maxLimit) newQty += 1;
    if (type === "dec" && currentQty > 1) newQty -= 1;
    if (newQty === currentQty) return;

    setStagedQty((prev) => ({ ...prev, [item.variantId]: newQty }));

    if (debounceTimers.current[item.variantId]) {
      clearTimeout(debounceTimers.current[item.variantId]);
    }

    debounceTimers.current[item.variantId] = setTimeout(async () => {
      setIsVerifying((prev) => ({ ...prev, [item.variantId]: true }));

      try {
        const stockCheck = await dispatch(
          verifyStock({
            productId: item.productId,
            variantId: item.variantId,
            requestedQuantity: newQty,
          }),
        ).unwrap();

        if (!stockCheck.isAvailable) {
          alert(stockCheck.message);
          newQty = stockCheck.availableStock;
        }

        if (isAuth) {
          await dispatch(
            updateCartQuantityDB({
              productId: item.productId,
              variantId: item.variantId,
              quantity: newQty,
            }),
          ).unwrap();
        } else {
          dispatch(
            updateLocalQuantity({
              productId: item.productId,
              variantId: item.variantId,
              quantity: newQty,
            }),
          );
          // Sync updated guest cart quantity to MongoDB for Admin visibility
          dispatch(hydrateGuestCartAPI({ isMutation: true }));
        }
      } catch (error) {
        alert("Failed to verify stock.");
      } finally {
        setStagedQty((prev) => {
          const newState = { ...prev };
          delete newState[item.variantId];
          return newState;
        });
        setIsVerifying((prev) => ({ ...prev, [item.variantId]: false }));
      }
    }, 800);
  };

  const handleRemoveItem = (variantId, index) => {
    const itemElement = itemsRef.current[index];

    gsap.to(itemElement, {
      x: -50,
      opacity: 0,
      height: 0,
      padding: 0,
      margin: 0,
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => {
        if (isAuth) {
          dispatch(removeFromCartDB(variantId));
        } else {
          dispatch(removeLocalItem(variantId));
          // Sync guest cart item removal to MongoDB for Admin visibility
          dispatch(hydrateGuestCartAPI({ isMutation: true }));
        }
      },
    });
  };

  const { contextSafe } = useGSAP(() => {
    if (cartItems.length > 0) {
      gsap.fromTo(".cart-item-row", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" });
      gsap.fromTo(".cart-summary", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power2.out" });
    }
    if (cartItems.length === 0 && emptyBagRef.current) {
      gsap.to(".bag-body-group", { y: -8, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
  }, [cartItems.length]);

  const handleMouseMove = contextSafe((e) => {
    if (cartItems.length > 0 || !emptyBagRef.current) return;
    const bagRect = emptyBagRef.current.getBoundingClientRect();
    const bagCenterX = bagRect.left + bagRect.width / 2;
    const bagCenterY = bagRect.top + bagRect.height / 2;
    const deltaX = e.clientX - bagCenterX;
    const deltaY = e.clientY - bagCenterY;
    const maxMove = 3.5;
    const moveX = Math.max(-maxMove, Math.min(maxMove, deltaX * 0.01));
    const moveY = Math.max(-maxMove, Math.min(maxMove, deltaY * 0.01));
    gsap.to(".bag-pupil", { x: moveX, y: moveY, duration: 0.2, ease: "power1.out" });
  });

  const handleBagClick = contextSafe(() => {
    const tl = gsap.timeline();
    tl.to(".bag-body-group", { scaleY: 0.7, scaleX: 1.1, transformOrigin: "bottom center", duration: 0.15, ease: "power2.in" })
      .to(".bag-body-group", { scaleY: 1.1, scaleX: 0.9, y: -20, duration: 0.2, ease: "power2.out" })
      .to(".bag-body-group", { scaleY: 1, scaleX: 1, y: 0, duration: 0.4, ease: "bounce.out" });
  });

  const handleButtonHover = contextSafe((isHovering) => {
    if (!emptyBagRef.current) return;
    if (isHovering) {
      gsap.to(".bag-mouth", { attr: { d: "M 42 66 Q 50 78 58 66" }, duration: 0.4, ease: "back.out(1.5)" });
      gsap.to(".bag-eye-group", { y: -3, duration: 0.3, ease: "power2.out" });
    } else {
      gsap.to(".bag-mouth", { attr: { d: "M 45 70 Q 50 64 55 70" }, duration: 0.4, ease: "power2.out" });
      gsap.to(".bag-eye-group", { y: 0, duration: 0.3, ease: "power2.out" });
    }
  });

  const handleRemoveHover = contextSafe((e, isEnter) => {
    const lid = e.currentTarget.querySelector(".trash-lid");
    const body = e.currentTarget.querySelector(".trash-body");
    if (isEnter) {
      gsap.to(lid, { y: -4, rotation: 15, x: 2, duration: 0.3, ease: "back.out(2)" });
      gsap.to(body, { rotation: -2, transformOrigin: "bottom center", duration: 0.2 });
    } else {
      gsap.to(lid, { y: 0, rotation: 0, x: 0, duration: 0.4, ease: "bounce.out" });
      gsap.to(body, { rotation: 0, duration: 0.2 });
    }
  });

  if (cartItems.length === 0) {
    return (
      <main onMouseMove={handleMouseMove} className="w-full min-h-screen pt-32 pb-20 px-6 lg:px-12 bg-[#f8f8f8] flex flex-col items-center justify-center text-[#1a1a1a] overflow-hidden">
        <div ref={emptyBagRef} onClick={handleBagClick} className="mb-8 opacity-40 cursor-pointer" title="Give me a poke!">
          <svg className="overflow-visible" width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <g className="bag-body-group" style={{ transformOrigin: "bottom center" }}>
              <path d="M35 35 V25 A 15 15 0 0 1 65 25 V35" />
              <path d="M20 35 H80 L75 85 H25 Z" fill="#f8f8f8" />
              <g className="bag-eye-group">
                <circle cx="40" cy="55" r="6.5" stroke="currentColor" fill="#f8f8f8" />
                <circle cx="40" cy="55" r="3" fill="currentColor" stroke="none" className="bag-pupil" />
                <circle cx="60" cy="55" r="6.5" stroke="currentColor" fill="#f8f8f8" />
                <circle cx="60" cy="55" r="3" fill="currentColor" stroke="none" className="bag-pupil" />
              </g>
              <path className="bag-mouth" d="M 45 70 Q 50 64 55 70" />
            </g>
          </svg>
        </div>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-4">Your cart is empty</h1>
        <p className="text-sm opacity-50 mb-8 text-center max-w-md pointer-events-none">Looks like you haven't added anything to your cart yet. Discover our latest collections.</p>
        <Link to="/shop" onMouseEnter={() => handleButtonHover(true)} onMouseLeave={() => handleButtonHover(false)} className="bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase px-10 py-4 hover:bg-black/80 transition-colors relative z-10">
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="w-full min-h-screen pt-32 pb-20 px-6 lg:px-12 bg-[#f8f8f8] text-[#1a1a1a]">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-12 border-b border-black/10 pb-6 flex items-end justify-between">
          <h1 className="text-3xl lg:text-4xl font-light tracking-widest uppercase">Your Cart</h1>
          <span className="text-sm opacity-50 hidden md:block">{cartItems.length} items</span>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
          <div className="w-full lg:w-[65%] flex flex-col gap-8">
            {cartItems.map((item, index) => {
              const displayQty = stagedQty[item.variantId] ?? item.quantity;
              const isItemVerifying = isVerifying[item.variantId];

              return (
                <div key={item.variantId} ref={(el) => (itemsRef.current[index] = el)} className="cart-item-row flex gap-6 pb-8 border-b border-black/5 group">
                  <Link to={`/product/${item.slug}`} className="w-24 h-32 lg:w-32 lg:h-40 shrink-0 overflow-hidden bg-[#f0f0f0]">
                    <img src={getOptimizedImgUrl(item.img)} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </Link>

                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link to={`/product/${item.slug}`} className="text-sm lg:text-base font-medium tracking-wide hover:opacity-70 transition-opacity">
                          {item.title}
                        </Link>
                        <p className="text-xs opacity-50 uppercase tracking-wider mt-1">Color: {item.colorName}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#1a1a1a]">{formatPrice(item.price * displayQty)}</p>
                        {displayQty > 1 && (
                          <p className="text-[0.65rem] opacity-50 mt-1 uppercase tracking-widest">{formatPrice(item.price)} each</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className={`flex items-center border border-black/10 w-24 lg:w-28 h-10 transition-opacity ${isItemVerifying ? "opacity-50 pointer-events-none" : ""}`}>
                        <button onClick={() => handleQuantityChange(item, "dec")} disabled={displayQty <= 1 || isLoading} className="flex-1 h-full flex items-center justify-center opacity-50 hover:opacity-100 disabled:opacity-20 transition-opacity cursor-pointer">
                          <Icon icon="ph:minus" />
                        </button>
                        <div className="w-8 flex items-center justify-center relative">
                          {isItemVerifying ? <Icon icon="ph:spinner-gap-bold" className="animate-spin text-sm" /> : <span className="text-xs font-medium">{displayQty}</span>}
                        </div>
                        <button onClick={() => handleQuantityChange(item, "inc")} disabled={displayQty >= item.maxLimit || isLoading} className="flex-1 h-full flex items-center justify-center opacity-50 hover:opacity-100 disabled:opacity-20 transition-opacity cursor-pointer">
                          <Icon icon="ph:plus" />
                        </button>
                      </div>

                      <button onClick={() => handleRemoveItem(item.variantId, index)} onMouseEnter={(e) => handleRemoveHover(e, true)} onMouseLeave={(e) => handleRemoveHover(e, false)} disabled={isLoading} className="text-[0.65rem] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 cursor-pointer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
                          <g className="trash-lid" style={{ transformOrigin: "right bottom" }}>
                            <path d="M3 6h18" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </g>
                          <g className="trash-body">
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                          </g>
                        </svg>
                        <span className="hidden sm:block mt-0.5">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary w-full lg:w-[35%]">
            <div className="bg-white p-8 border border-black/5 lg:sticky lg:top-32">
              <h2 className="text-sm uppercase tracking-widest font-bold mb-8">Order Summary</h2>

              <div className="flex flex-col gap-4 text-sm mb-8 border-b border-black/10 pb-8">
                <div className="flex justify-between">
                  <span className="opacity-60">Subtotal</span>
                  <span className="font-medium text-[#1a1a1a]">{formatPrice(liveSubTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Shipping</span>
                  <span className="text-[0.65rem] uppercase tracking-widest opacity-50 mt-0.5">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-medium uppercase tracking-widest">Total</span>
                <span className="text-xl font-bold text-[#1a1a1a]">{formatPrice(liveSubTotal)}</span>
              </div>

              <Link to="/checkout" className="w-full h-14 bg-[#1a1a1a] text-white flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-50" style={{ pointerEvents: isLoading ? "none" : "auto" }}>
                {isLoading ? <Icon icon="ph:spinner-gap-bold" className="animate-spin text-lg" /> : "Proceed to Checkout"}
              </Link>
              <p className="text-[0.65rem] text-center opacity-40 mt-4 tracking-wider uppercase">Taxes and discounts calculated at checkout</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;
