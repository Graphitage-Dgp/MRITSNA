import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import {
  fetchUserFullDetails,
  clearCurrentUserDetails,
} from "../../store/slices/userSlice";
import { updateAdminReviewStatus } from "../../store/slices/reviewSlice";

const formatINR = (amount) => {
  return `₹ ${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

const formatForeignCurrency = (amount, currencyCode, symbol) => {
  return `${symbol || "$"} ${Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
};

const getOptimizedImgUrl = (url) => {
  if (!url) return "";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-200,q-80`;
};

const UserDrawer = ({ isOpen, onClose, entityId, initialTab = "cart" }) => {
  const dispatch = useDispatch();
  const { currentUserDetails: details, isDetailsLoading } = useSelector(
    (state) => state.adminUser
  );

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, entityId]);

  useEffect(() => {
    if (isOpen && entityId) {
      dispatch(fetchUserFullDetails(entityId));
    }
  }, [isOpen, entityId, dispatch]);

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
    setTimeout(() => dispatch(clearCurrentUserDetails()), 300);
  };

  const handleModerateReview = async (reviewId, status) => {
    try {
      await dispatch(updateAdminReviewStatus({ reviewId, status })).unwrap();
      toast.success(`Review ${status}.`);
      dispatch(fetchUserFullDetails(entityId));
    } catch (err) {
      toast.error("Failed to update review status.");
    }
  };

  const stopScrollPropagation = (e) => {
    e.stopPropagation();
  };

  const isVisitor = details?.userType === "visitor" || details?.isGuest;
  const profile = details?.profile;

  const drawerTabs = [
    {
      id: "cart",
      label: "Cart",
      count: details?.cart?.totalItems || 0,
      icon: "carbon:shopping-cart",
    },
    {
      id: "wishlist",
      label: "Wishlist",
      count: details?.wishlist?.totalItems || 0,
      icon: "mingcute:heart-line",
    },
    {
      id: "orders",
      label: "Orders",
      count: details?.orders?.totalOrders || 0,
      icon: "ph:package-light",
    },
    {
      id: "reviews",
      label: "Feedback & Rating",
      count: details?.reviews?.totalReviews || 0,
      icon: "ph:star-light",
    },
  ];

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[99998] transition-opacity duration-500
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <div
        data-lenis-prevent="true"
        className={`fixed top-0 right-0 h-[100dvh] w-full max-w-2xl bg-white shadow-2xl z-[99999] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Drawer Header */}
        <div className="shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-b border-black/10 flex justify-between items-center gap-3 bg-[#f8f8f8]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase truncate">
              360° Customer Intelligence
            </h2>
            {details &&
              (isVisitor ? (
                <span className="shrink-0 bg-amber-100 text-amber-900 border border-amber-200 text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                  Visitor
                </span>
              ) : (
                <span className="shrink-0 bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                  User
                </span>
              ))}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close customer drawer"
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black/5 sm:bg-transparent hover:bg-black/10 active:bg-black/15 transition-colors cursor-pointer"
          >
            <Icon icon="ph:x-light" className="text-xl text-black" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          onWheel={stopScrollPropagation}
          onTouchMove={stopScrollPropagation}
          className="flex-1 overflow-y-auto overscroll-contain min-h-0 custom-scrollbar p-4 sm:p-8"
        >
          {isDetailsLoading || !details ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Icon icon="ph:spinner-gap-light" className="text-4xl animate-spin mb-4" />
              <p className="text-xs uppercase tracking-widest font-bold">
                Compiling Customer Profile...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Customer Identity Summary Card */}
              <div className="bg-[#f8f8f8] p-6 border border-black/5 rounded-sm">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-medium">{profile.name}</h3>
                      {isVisitor ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                          Visitor
                        </span>
                      ) : (
                        <span className="bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                          User
                        </span>
                      )}
                      {!isVisitor && profile.isVerified && (
                        <span className="bg-green-100 text-green-800 text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-60 mt-1 break-all">{profile.email}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block bg-black/5 text-black text-[0.6rem] uppercase tracking-widest font-bold px-2.5 py-1 rounded-sm">
                      Region: {profile.countryCode} ({profile.currencyCode})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-black/5 pt-4 mt-4 text-xs">
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-widest opacity-40">
                      Contact / Device
                    </span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-widest opacity-40">
                      {isVisitor ? "Acquisition Channel" : "Member Since"}
                    </span>
                    <span className="font-medium">
                      {isVisitor
                        ? `${profile.channel || "Direct"} (${profile.deviceType || "Web"})`
                        : new Date(profile.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-widest opacity-40">
                      Avg Rating Given
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <Icon icon="ph:star-fill" className="text-amber-500" />
                      {details.reviews.totalReviews > 0
                        ? `${details.reviews.averageRating} / 5 (${details.reviews.totalReviews})`
                        : "No Ratings Yet"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs inside Drawer */}
              <div className="flex border-b border-black/10 overflow-x-auto no-scrollbar">
                {drawerTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative cursor-pointer
                      ${
                        activeTab === t.id
                          ? "text-black"
                          : "text-black/40 hover:text-black/70"
                      }
                    `}
                  >
                    <Icon icon={t.icon} className="text-sm" />
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[0.55rem] rounded-sm ${
                        activeTab === t.id
                          ? "bg-black text-white"
                          : "bg-black/5 text-black/60"
                      }`}
                    >
                      {t.count}
                    </span>
                    {activeTab === t.id && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                    )}
                  </button>
                ))}
              </div>

              {/* TAB 1: ACTIVE CART */}
              {activeTab === "cart" && (
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-widest font-bold opacity-40 mb-1">
                        Active Cart Value
                      </p>
                      <span className="text-2xl font-light">
                        {details.cart.isForeign
                          ? formatForeignCurrency(
                              details.cart.cartValueLocalized,
                              details.cart.currencyCode,
                              details.cart.symbol
                            )
                          : formatINR(details.cart.cartValueBaseINR)}
                      </span>
                    </div>
                    <span className="text-xs opacity-60">
                      {details.cart.totalItems} Items in Cart
                    </span>
                  </div>

                  {details.cart.items.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-black/10 text-xs uppercase tracking-widest opacity-40">
                      Cart is currently empty
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {details.cart.items.map((item) => (
                        <div
                          key={item.cartItemId || item.variantId}
                          className="flex gap-4 border-b border-black/5 pb-4 last:border-0"
                        >
                          <div className="w-16 h-20 bg-[#eeeeee] shrink-0 overflow-hidden">
                            <img
                              src={getOptimizedImgUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-[0.65rem] uppercase tracking-widest opacity-50 mt-0.5">
                                {item.color} | SKU: {item.sku}
                              </p>
                              <p className="text-xs opacity-60 mt-1">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {details.cart.isForeign && item.localizedData
                                  ? formatForeignCurrency(
                                      item.localizedData.itemTotal,
                                      details.cart.currencyCode,
                                      details.cart.symbol
                                    )
                                  : formatINR(item.baseItemTotalINR)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SAVED WISHLIST */}
              {activeTab === "wishlist" && (
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <p className="text-[0.65rem] uppercase tracking-widest font-bold opacity-40">
                      Saved Wishlist Pieces
                    </p>
                    <span className="text-xs opacity-60">
                      {details.wishlist.totalItems} Saved Items
                    </span>
                  </div>

                  {details.wishlist.items.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-black/10 text-xs uppercase tracking-widest opacity-40">
                      No items saved in wishlist
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {details.wishlist.items.map((item) => (
                        <div
                          key={item.wishlistItemKey}
                          className="flex gap-4 border-b border-black/5 pb-4 last:border-0"
                        >
                          <div className="w-16 h-20 bg-[#eeeeee] shrink-0 overflow-hidden">
                            <img
                              src={getOptimizedImgUrl(item.image)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-[0.65rem] uppercase tracking-widest opacity-50 mt-0.5">
                                {item.color} | SKU: {item.sku}
                              </p>
                              <p className="text-[0.6rem] uppercase tracking-widest opacity-40 mt-1">
                                Saved: {new Date(item.addedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {details.wishlist.isForeign && item.localizedData
                                  ? formatForeignCurrency(
                                      item.localizedData.unitPrice,
                                      details.wishlist.currencyCode,
                                      details.wishlist.symbol
                                    )
                                  : formatINR(item.baseUnitPriceINR)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORDERS HISTORY */}
              {activeTab === "orders" && (
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-widest font-bold opacity-40 mb-1">
                        Lifetime Order Value
                      </p>
                      <span className="text-2xl font-light">
                        {formatINR(details.orders.totalSpent)}
                      </span>
                    </div>
                    <span className="text-xs opacity-60">
                      {details.orders.paidOrdersCount} Paid / {details.orders.totalOrders} Total
                    </span>
                  </div>

                  {details.orders.list.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-black/10 text-xs uppercase tracking-widest opacity-40">
                      No orders placed yet
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {details.orders.list.map((order) => {
                        const orderTotal =
                          (order.subTotal || 0) -
                          (order.discountAmount || 0) +
                          (order.shippingCost || 0);
                        return (
                          <div
                            key={order._id}
                            className="p-4 border border-black/10 bg-[#f8f8f8]/50 flex flex-col gap-3"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <Link
                                  to={`/admin/orders/${order._id}`}
                                  onClick={handleClose}
                                  className="text-xs font-bold tracking-widest uppercase underline hover:opacity-70"
                                >
                                  {order.orderNumber}
                                </Link>
                                <p className="text-[0.65rem] opacity-50 mt-0.5">
                                  {new Date(order.createdAt).toLocaleDateString()} •{" "}
                                  {order.items?.length || 0} items
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">
                                  {order.paymentCurrency} {orderTotal.toLocaleString()}
                                </p>
                                <span className="text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 bg-black/5 rounded-sm">
                                  {order.orderStatus} • {order.paymentStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FEEDBACK / REVIEWS & RATING */}
              {activeTab === "reviews" && (
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-widest font-bold opacity-40 mb-1">
                        Customer Rating Summary
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-light">
                          {details.reviews.averageRating || "0.0"}
                        </span>
                        <div className="flex text-amber-500 text-sm">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Icon
                              key={star}
                              icon={
                                star <= Math.round(details.reviews.averageRating || 0)
                                  ? "ph:star-fill"
                                  : "ph:star-light"
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs opacity-60">
                      {details.reviews.totalReviews} Reviews Submitted
                    </span>
                  </div>

                  {details.reviews.list.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-black/10 text-xs uppercase tracking-widest opacity-40">
                      No feedback or ratings submitted by this {isVisitor ? "visitor" : "user"}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {details.reviews.list.map((rev) => (
                        <div
                          key={rev._id}
                          className="p-5 border border-black/10 bg-white flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              {rev.productImage && (
                                <img
                                  src={getOptimizedImgUrl(rev.productImage)}
                                  alt={rev.productTitle}
                                  className="w-10 h-12 object-cover bg-[#eeeeee]"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium">{rev.productTitle}</p>
                                <p className="text-[0.6rem] uppercase tracking-widest opacity-50">
                                  Variant: {rev.colorName} •{" "}
                                  {new Date(rev.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm ${
                                rev.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : rev.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {rev.status}
                            </span>
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center gap-1 text-amber-500 text-sm">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Icon
                                key={star}
                                icon={star <= rev.rating ? "ph:star-fill" : "ph:star-light"}
                              />
                            ))}
                            <span className="text-xs text-black font-bold ml-1">
                              {rev.rating} / 5
                            </span>
                          </div>

                          {/* Review Comment */}
                          <p className="text-xs leading-relaxed text-black/80">
                            "{rev.comment}"
                          </p>

                          {/* Attached Review Images */}
                          {rev.images && rev.images.length > 0 && (
                            <div className="flex gap-2 mt-1">
                              {rev.images.map((img, i) => (
                                <img
                                  key={i}
                                  src={getOptimizedImgUrl(img.baseUrl)}
                                  alt="Review upload"
                                  className="w-14 h-14 object-cover border border-black/10"
                                />
                              ))}
                            </div>
                          )}

                          {/* Quick Approve / Reject Actions */}
                          <div className="flex justify-end gap-2 pt-3 border-t border-black/5">
                            {rev.status !== "approved" && (
                              <button
                                onClick={() => handleModerateReview(rev._id, "approved")}
                                className="px-3 py-1.5 bg-black text-white text-[0.6rem] uppercase tracking-widest font-bold hover:bg-black/80 cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {rev.status !== "rejected" && (
                              <button
                                onClick={() => handleModerateReview(rev._id, "rejected")}
                                className="px-3 py-1.5 border border-black/20 text-black text-[0.6rem] uppercase tracking-widest font-bold hover:bg-black/5 cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default UserDrawer;