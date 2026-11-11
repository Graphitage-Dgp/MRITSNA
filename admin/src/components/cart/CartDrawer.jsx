import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { 
  fetchCartDetails, 
  clearCurrentCartDetails, 
  adminClearCart, 
  triggerCartReminder 
} from "../../store/slices/cartSlice";

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

const CartDrawer = ({ isOpen, onClose, cartId }) => {
  const dispatch = useDispatch();
  
  const { currentCartDetails: cart, isDetailsLoading, isActionLoading } = useSelector((state) => state.adminCart);

  useEffect(() => {
    if (isOpen && cartId) {
      dispatch(fetchCartDetails(cartId));
    }
  }, [isOpen, cartId, dispatch]);

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
    setTimeout(() => dispatch(clearCurrentCartDetails()), 300);
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to forcibly clear this cart? This will release the inventory holds.")) {
      try {
        await dispatch(adminClearCart(cartId)).unwrap();
        toast.success("Inventory holds released.", toastConfig);
        handleClose();
      } catch (error) {
        toast.error("Failed to clear cart.", toastConfig);
      }
    }
  };

  const handleSendReminder = async () => {
    try {
      await dispatch(triggerCartReminder(cartId)).unwrap();
      toast.success("Reminder email queued.", toastConfig);
    } catch (error) {
      toast.error(error || "Failed to send reminder.", toastConfig);
    }
  };

  const stopScrollPropagation = (e) => {
    e.stopPropagation();
  };

  const isVisitor = cart?.isGuest || cart?.user?.isGuest || cart?.userType === "visitor";
  const hasRealEmail = cart?.user?.email && !cart.user.email.startsWith("Anonymous");

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
        <div className="shrink-0 px-8 py-6 border-b border-black/10 flex justify-between items-center bg-[#f8f8f8]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold tracking-widest uppercase">Cart Details</h2>
            {cart && (
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

        <div 
          onWheel={stopScrollPropagation}
          onTouchMove={stopScrollPropagation}
          className="flex-1 overflow-y-auto overscroll-contain min-h-0 custom-scrollbar p-8"
        >
          {isDetailsLoading || !cart ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Icon icon="ph:spinner-gap-light" className="text-4xl animate-spin mb-4" />
              <p className="text-xs uppercase tracking-widest font-bold">Accessing Records...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              
              <div>
                <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50 mb-4">Customer Profile</h3>
                <div className="bg-[#f8f8f8] p-5 border border-black/5 rounded-sm">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-medium">{cart.user.name}</p>
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
                    {cart.summary.isForeign && (
                      <span className="bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm shrink-0">
                        Export: {cart.user.countryCode}
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-60 mb-4">{cart.user.email}</p>
                  <div className="flex justify-between text-xs border-t border-black/5 pt-4 mt-2">
                    <span className="opacity-50">Phone: {cart.user.phone}</span>
                    <span className="opacity-50">
                      {isVisitor ? "First Seen: " : "Since: "}
                      {new Date(cart.user.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50 mb-4">Pipeline Breakdown</h3>
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="text-3xl font-light">
                      {cart.summary.isForeign 
                        ? formatForeignCurrency(cart.summary.cartValueLocalized, cart.summary.currencyCode, cart.summary.symbol) 
                        : formatINR(cart.summary.cartValueBaseINR)
                      }
                    </span>
                    {cart.summary.isForeign && (
                      <p className="text-xs opacity-50 font-medium mt-1">
                        Base Value: {formatINR(cart.summary.cartValueBaseINR)}
                      </p>
                    )}
                  </div>
                  <span className="text-sm opacity-60 mb-1">{cart.summary.totalItems} Items Total</span>
                </div>

                <div className="flex flex-col gap-6">
                  {cart.items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-4 border-b border-black/5 pb-6 last:border-0">
                      <div className="w-20 h-24 bg-[#eeeeee] shrink-0 overflow-hidden">
                        <img 
                          src={getOptimizedImgUrl(item.image)} 
                          alt={item.title} 
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-1 py-1">
                        <div>
                          <p className="text-sm font-medium leading-tight mb-1 line-clamp-1">{item.title}</p>
                          <p className="text-[0.65rem] uppercase tracking-widest opacity-50 mb-2">
                            {item.color} | SKU: {item.sku}
                          </p>
                          {item.isStockBottleneck && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-[0.6rem] uppercase tracking-widest font-bold rounded-sm mt-1">
                              <Icon icon="ph:warning-circle" /> Stock Bottleneck ({item.stockAvailable} left)
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-end text-sm mt-2">
                          <span className="opacity-60">Qty: {item.quantityInCart}</span>
                          <div className="text-right">
                            <span className="font-medium">
                              {cart.summary.isForeign && item.localizedData
                                ? formatForeignCurrency(item.localizedData.itemTotal, cart.summary.currencyCode, cart.summary.symbol)
                                : formatINR(item.baseItemTotalINR)
                              }
                            </span>
                            {cart.summary.isForeign && (
                              <p className="text-[0.6rem] opacity-40">
                                Base: {formatINR(item.baseItemTotalINR)}
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

        {!isDetailsLoading && cart && (
          <div className="shrink-0 p-6 border-t border-black/10 bg-[#f8f8f8] flex gap-4">
            <button
              onClick={handleClearCart}
              disabled={isActionLoading}
              className="flex-1 py-4 border border-black text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              Force Clear
            </button>
            <button
              onClick={handleSendReminder}
              disabled={isActionLoading || !hasRealEmail}
              title={!hasRealEmail ? "Visitor has not entered an email address yet" : "Send reminder email"}
              className="flex-1 py-4 bg-black border border-black text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {hasRealEmail ? "Send Reminder" : "No Email Yet"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
