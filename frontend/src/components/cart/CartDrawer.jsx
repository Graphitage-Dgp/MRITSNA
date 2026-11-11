import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  closeCartDrawer,
  updateLocalQuantity,
  removeLocalItem,
  updateCartQuantityDB,
  removeFromCartDB,
  hydrateGuestCartAPI,
} from "../../store/features/cartSlice";
import { getBundleByQuantity } from "../product/BundleRadioSelector";

const getOptimizedImgUrl = (url) => {
  if (!url) return "/mug.webp";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-240,q-80`;
};

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    items: cartItems = [],
    subTotal = 0,
    isDrawerOpen = false,
    isLoading = false,
    currencySymbol = "₹",
    currencyCode = "INR",
  } = useSelector((state) => state.cart || {});

  const regionData = useSelector((state) => state.region?.data);
  const isAuth = useSelector((state) => state.auth?.isAuthenticated);

  // Enforce strict INR default unless user manually switched currency dropdown
  const isManualForeign = Boolean(
    regionData?.isManual && regionData?.currencyCode && regionData.currencyCode !== "INR"
  );
  const activeCurrencyCode = isManualForeign ? regionData.currencyCode : "INR";
  const activeCurrencySymbol = isManualForeign ? regionData.symbol || currencySymbol : "₹";

  const formatPrice = (price) => {
    const locale = activeCurrencyCode === "INR" ? "en-IN" : "en-US";
    return `${activeCurrencySymbol} ${Number(price || 0).toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  };

  const computedSubTotal =
    cartItems.reduce((acc, item) => {
      const lineTotal =
        item.itemTotal !== undefined
          ? Number(item.itemTotal)
          : Number(item.price || 0) * Number(item.quantity || 1);
      return acc + lineTotal;
    }, 0) || subTotal;

  const handleClose = () => {
    dispatch(closeCartDrawer());
  };

  const handleQtyChange = async (item, delta) => {
    const currentQty = Number(item.quantity) || 1;
    const maxLimit = Number(item.maxLimit) || 5;
    const newQty = currentQty + delta;

    if (newQty < 1 || newQty > maxLimit) return;

    if (isAuth) {
      await dispatch(
        updateCartQuantityDB({
          productId: item.productId,
          variantId: item.variantId,
          quantity: newQty,
        })
      );
    } else {
      dispatch(
        updateLocalQuantity({
          productId: item.productId,
          variantId: item.variantId,
          quantity: newQty,
        })
      );
      dispatch(hydrateGuestCartAPI({ isMutation: true }));
    }
  };

  const handleRemove = (variantId) => {
    if (isAuth) {
      dispatch(removeFromCartDB(variantId));
    } else {
      dispatch(removeLocalItem(variantId));
      dispatch(hydrateGuestCartAPI({ isMutation: true }));
    }
  };

  const handleCheckout = () => {
    dispatch(closeCartDrawer());
    navigate("/checkout");
  };

  const handleViewCart = () => {
    dispatch(closeCartDrawer());
    navigate("/cart");
  };

  return (
    <div
      aria-hidden={!isDrawerOpen}
      className={`fixed inset-0 z-[999995] transition-opacity duration-300 ${
        isDrawerOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Dim Backdrop (clicking outside closes the bottom sheet on mobile and side drawer on desktop) */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
      />

      {/* 
        Responsive Drawer Container:
        - Mobile (<768px): Takes exactly 80% height of screen from the bottom (h-[80vh] max-h-[80vh] rounded-t-2xl), leaving the top 20% visible
        - Desktop (>=768px): Slides in from the right edge (top-0 right-0 h-full w-[420px])
      */}
      <aside
        aria-label="Shopping Cart Drawer"
        className={`absolute bg-[#f8f8f8] text-[#1a1a1a] flex flex-col justify-between transition-transform duration-300 ease-out 
          /* Mobile Bottom Sheet: Exactly 80% screen height from bottom */
          bottom-0 left-0 right-0 w-full h-[80vh] max-h-[80vh] rounded-t-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.35)] border-t border-black/10
          ${isDrawerOpen ? "translate-y-0" : "translate-y-full"}

          /* Desktop Side Drawer: Slides IN from right */
          md:top-0 md:bottom-auto md:left-auto md:right-0 md:w-[420px] md:h-full md:max-h-full md:rounded-none md:shadow-[-12px_0_40px_rgba(0,0,0,0.28)] md:border-t-0 md:border-l md:border-black/10
          ${isDrawerOpen ? "md:translate-x-0 md:translate-y-0" : "md:translate-x-full md:translate-y-0"}
        `}
      >
        {/* Mobile Pull-Down Indicator Pill */}
        <div className="md:hidden w-full flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 bg-black/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-5 border-b border-black/10 flex items-center justify-between bg-white shrink-0 rounded-t-2xl md:rounded-none">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
              Your Bag
            </h2>
            <span className="text-[0.6rem] sm:text-[0.65rem] font-semibold bg-[#1a1a1a] text-white px-2 py-0.5 rounded-full">
              {cartItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Cart Drawer"
            className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <Icon icon="ph:x" className="text-lg" />
          </button>
        </div>

        {/* Body */}
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center">
            <Icon
              icon="ph:shopping-bag-light"
              className="text-4xl sm:text-5xl opacity-30 mb-3"
            />
            <p className="text-xs sm:text-sm uppercase tracking-widest font-medium mb-1.5">
              Your cart is empty
            </p>
            <p className="text-[0.7rem] sm:text-xs opacity-60 mb-5 max-w-[220px]">
              Explore our studio stoneware pieces and curated sets.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#1a1a1a] text-white text-[0.62rem] sm:text-[0.65rem] font-bold tracking-[0.2em] uppercase px-6 sm:px-8 py-3 sm:py-3.5 hover:bg-black/80 transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 sm:py-5 flex flex-col gap-3.5 sm:gap-5 custom-scrollbar min-h-0">
              {cartItems.map((item) => {
                const matchedBundle = item.isDrinkware
                  ? getBundleByQuantity(item.quantity)
                  : null;
                const lineTotal =
                  item.itemTotal !== undefined
                    ? item.itemTotal
                    : (item.price || 0) * (item.quantity || 1);

                return (
                  <div
                    key={item.variantId}
                    className="flex gap-3 sm:gap-4 pb-3.5 sm:pb-5 border-b border-black/10 last:border-b-0"
                  >
                    <Link
                      to={`/product/${item.slug || ""}`}
                      onClick={handleClose}
                      className="w-16 h-20 sm:w-20 sm:h-24 bg-[#eaeaea] rounded-[2px] overflow-hidden shrink-0"
                    >
                      <img
                        src={getOptimizedImgUrl(item.img)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${item.slug || ""}`}
                            onClick={handleClose}
                            className="text-[0.75rem] sm:text-xs font-semibold tracking-wide text-[#1a1a1a] truncate hover:opacity-70"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.variantId)}
                            className="text-xs opacity-40 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Remove item"
                          >
                            <Icon icon="ph:trash-light" className="text-sm" />
                          </button>
                        </div>

                        {item.colorName && (
                          <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-wider opacity-50 mt-0.5">
                            Color: {item.colorName}
                          </p>
                        )}

                        {(item.bundleLabel || matchedBundle) && (
                          <div className="mt-1 inline-flex flex-wrap items-center gap-1 bg-[#7e7053]/15 text-[#7e7053] px-1.5 py-0.5 rounded-[2px] text-[0.55rem] sm:text-[0.6rem] font-bold tracking-wider uppercase">
                            <span>
                              {item.bundleLabel ||
                                `${matchedBundle.title} (${matchedBundle.subtitle})`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                        <div className="flex items-center border border-black/15 bg-white h-7 sm:h-8 w-20 sm:w-24">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item, -1)}
                            disabled={item.quantity <= 1 || isLoading}
                            className="flex-1 h-full flex items-center justify-center opacity-60 hover:opacity-100 disabled:opacity-20 cursor-pointer"
                          >
                            <Icon icon="ph:minus" className="text-[0.65rem] sm:text-xs" />
                          </button>
                          <span className="text-[0.7rem] sm:text-xs font-semibold px-1.5">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item, 1)}
                            disabled={
                              item.quantity >= (item.maxLimit || 5) || isLoading
                            }
                            className="flex-1 h-full flex items-center justify-center opacity-60 hover:opacity-100 disabled:opacity-20 cursor-pointer"
                          >
                            <Icon icon="ph:plus" className="text-[0.65rem] sm:text-xs" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[0.75rem] sm:text-xs font-bold text-[#1a1a1a]">
                            {formatPrice(lineTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 bg-white border-t border-black/10 flex flex-col gap-2.5 sm:gap-3 shrink-0">
              <div className="flex items-center justify-between text-[0.65rem] sm:text-xs uppercase tracking-widest opacity-60">
                <span>Shipping</span>
                <span>Free on Sets & Bundles</span>
              </div>

              <div className="flex items-center justify-between py-1.5 sm:py-2 border-t border-black/5">
                <span className="text-[0.7rem] sm:text-xs font-bold uppercase tracking-[0.2em]">
                  Subtotal
                </span>
                <span className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                  {formatPrice(computedSubTotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full h-10 sm:h-12 bg-[#1a1a1a] text-white text-[0.62rem] sm:text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/85 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <Icon icon="ph:arrow-right-light" className="text-base" />
              </button>

              <button
                type="button"
                onClick={handleViewCart}
                className="w-full h-8 sm:h-10 border border-black/15 text-[#1a1a1a] text-[0.6rem] sm:text-[0.62rem] font-bold tracking-[0.2em] uppercase hover:bg-black/5 transition-colors cursor-pointer"
              >
                View Full Bag
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;