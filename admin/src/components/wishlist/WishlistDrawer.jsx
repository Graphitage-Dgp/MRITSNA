import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { 
  fetchWishlistDetails, 
  clearCurrentWishlistDetails 
} from "../../store/slices/wishlistSlice";

const formatINR = (amount) => {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatForeignCurrency = (amount, currencyCode, symbol) => {
  return `${symbol} ${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const getOptimizedImgUrl = (url) => {
  if (!url) return "";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-200,q-80`;
};

const toastConfig = {
  style: {
    borderRadius: '2px',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '12px 20px',
  },
  iconTheme: {
    primary: '#fff',
    secondary: '#1a1a1a',
  },
};

const WishlistDrawer = ({ isOpen, onClose, wishlistId }) => {
  const dispatch = useDispatch();
  
  const { currentWishlistDetails: wishlist, isDetailsLoading } = useSelector((state) => state.adminWishlist);

  useEffect(() => {
    if (isOpen && wishlistId) {
      dispatch(fetchWishlistDetails(wishlistId));
    }
  }, [isOpen, wishlistId, dispatch]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => dispatch(clearCurrentWishlistDetails()), 300);
  };

  const handleSendDiscount = () => {
    toast.success("Engagement email queued.", toastConfig);
  };

  const stopScrollPropagation = (e) => {
    e.stopPropagation();
  };

  const isVisitor = wishlist?.isGuest || wishlist?.user?.isGuest || wishlist?.userType === "visitor";
  const hasRealEmail = wishlist?.user?.email && !wishlist.user.email.startsWith("Anonymous");

  return (
    <>
      <div 
        onClick={handleClose}
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[99998] transition-opacity duration-500
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <div 
        data-lenis-prevent="true"
        className={`fixed top-0 right-0 h-[100dvh] w-full max-w-lg bg-white shadow-2xl z-[99999] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="shrink-0 px-8 py-6 border-b border-black/10 flex justify-between items-center bg-[#f8f8f8]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold tracking-widest uppercase">Wishlist Details</h2>
            {wishlist && (
              isVisitor ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                  Visitor
                </span>
              ) : (
                <span className="bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                  User
                </span>
              )
            )}
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
          >
            <Icon icon="ph:x-light" className="text-xl" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div 
          onWheel={stopScrollPropagation}
          onTouchMove={stopScrollPropagation}
          className="flex-1 overflow-y-auto overscroll-contain min-h-0 custom-scrollbar p-8"
        >
          {isDetailsLoading || !wishlist ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Icon icon="ph:spinner-gap-light" className="text-4xl animate-spin mb-4" />
              <p className="text-xs uppercase tracking-widest font-bold">Fetching Records...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              
              {/* Customer Profile */}
              <div>
                <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50 mb-4">Customer Profile</h3>
                <div className="bg-[#f8f8f8] p-5 border border-black/5 rounded-sm">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-medium">{wishlist.user.name}</p>
                      {isVisitor ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                          Visitor
                        </span>
                      ) : (
                        <span className="bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                          User
                        </span>
                      )}
                    </div>
                    {wishlist.summary.isForeign && (
                      <span className="bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm shrink-0">
                        Export: {wishlist.user.countryCode}
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-60 mb-4">{wishlist.user.email}</p>
                  <div className="flex justify-between text-xs border-t border-black/5 pt-4 mt-2">
                    <span className="opacity-50">Phone: {wishlist.user.phone}</span>
                    <span className="opacity-50">
                      {isVisitor ? "First Seen: " : "Since: "}
                      {new Date(wishlist.user.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Saved Items</h3>
                  <span className="text-sm opacity-60 font-medium">{wishlist.summary.totalItems} Items Total</span>
                </div>

                <div className="flex flex-col gap-6">
                  {wishlist.items.map((item) => (
                    <div key={item.wishlistItemKey} className="flex gap-4 border-b border-black/5 pb-6 last:border-0">
                      <div className="w-20 h-24 bg-[#eeeeee] shrink-0 overflow-hidden relative">
                        <img 
                          src={getOptimizedImgUrl(item.image)} 
                          alt={item.title} 
                          className={`w-full h-full object-cover mix-blend-multiply ${item.stockAvailable === 0 ? "opacity-40 grayscale" : ""}`}
                        />
                        {item.stockAvailable === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                            <span className="text-[0.55rem] uppercase tracking-widest font-bold bg-black text-white px-1.5 py-0.5">Sold Out</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between flex-1 py-1">
                        <div>
                          <p className="text-sm font-medium leading-tight mb-1 line-clamp-2">{item.title}</p>
                          <p className="text-[0.65rem] uppercase tracking-widest opacity-50 mb-2">
                            {item.color} | SKU: {item.sku}
                          </p>
                          <p className="text-[0.6rem] uppercase tracking-widest opacity-40">
                            Saved: {new Date(item.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex justify-end items-end text-sm mt-2">
                          <div className="text-right">
                            <span className="font-medium">
                              {wishlist.summary.isForeign && item.localizedData
                                ? formatForeignCurrency(item.localizedData.unitPrice, wishlist.summary.currencyCode, wishlist.summary.symbol)
                                : formatINR(item.baseUnitPriceINR)
                              }
                            </span>
                            {wishlist.summary.isForeign && (
                              <p className="text-[0.6rem] opacity-40 mt-0.5">
                                Base: {formatINR(item.baseUnitPriceINR)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isDetailsLoading && wishlist && (
          <div className="shrink-0 p-6 border-t border-black/10 bg-[#f8f8f8] flex gap-4">
            <button
              onClick={handleSendDiscount}
              disabled={!hasRealEmail}
              title={!hasRealEmail ? "Visitor has not entered an email address yet" : "Send engagement email"}
              className="flex-1 py-4 bg-black border border-black text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {hasRealEmail ? "Email Discount" : "No Email Yet"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistDrawer;
