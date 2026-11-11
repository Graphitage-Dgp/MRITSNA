import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

const timeAgo = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const regionOptions = [
  { value: "global", label: "Global (All)" },
  { value: "domestic", label: "Domestic (India)" },
  { value: "international", label: "International (Exports)" },
  { type: "divider" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "EU", label: "Europe" },
  { value: "AE", label: "UAE" },
];

const activityOptions = [
  { value: "all", label: "All Activity" },
  { value: "has_cart", label: "Has Active Cart" },
  { value: "has_wishlist", label: "Has Saved Wishlist" },
  { value: "has_orders", label: "Has Placed Orders" },
  { value: "has_reviews", label: "Has Left Reviews" },
];

const UserTable = ({
  users,
  pagination,
  currentPage,
  isLoading,
  currentType,
  currentActivity,
  currentRegion,
  searchQuery,
  onTypeChange,
  onActivityChange,
  onRegionChange,
  onSearchChange,
  onPageChange,
  onInspectUser,
}) => {
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const regionRef = useRef(null);
  const activityRef = useRef(null);

  const activePage = currentPage || pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;

  const tabs = [
    { id: "all", label: "All Profiles" },
    { id: "user", label: "Registered Users" },
    { id: "visitor", label: "Visitors (Guests)" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (regionRef.current && !regionRef.current.contains(event.target)) {
        setIsRegionOpen(false);
      }
      if (activityRef.current && !activityRef.current.contains(event.target)) {
        setIsActivityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRegionLabel =
    regionOptions.find((opt) => opt.value === currentRegion)?.label || "Global (All)";
  const selectedActivityLabel =
    activityOptions.find((opt) => opt.value === currentActivity)?.label || "All Activity";

  return (
    <div className="flex flex-col w-full">
      {/* Top Controls: Identity Tabs, Search, Activity Filter & Region Filter */}
      <div className="flex flex-wrap items-center justify-between border-b border-black/10 mb-6 gap-4">
        {/* Identity Tabs */}
        <div className="flex items-center gap-6 lg:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTypeChange(tab.id)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative cursor-pointer
                ${currentType === tab.id ? "text-black" : "text-black/40 hover:text-black/70"}
              `}
            >
              {tab.label}
              {currentType === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
              )}
            </button>
          ))}
        </div>

        {/* Right Controls: Search + Activity + Region */}
        <div className="flex flex-wrap items-center gap-6 pb-3">
          {/* Search Input */}
          <div className="relative w-60">
            <Icon
              icon="ph:magnifying-glass-light"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 text-sm"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, email, device..."
              className="w-full bg-[#f8f8f8] border border-black/10 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Activity Dropdown */}
          <div className="relative" ref={activityRef}>
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              className="flex items-center gap-2 text-black/60 hover:text-black transition-colors outline-none cursor-pointer"
            >
              <Icon icon="ph:funnel-light" className="text-lg" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {selectedActivityLabel}
              </span>
              <Icon
                icon="ph:caret-down-bold"
                className={`text-[0.65rem] opacity-50 transition-transform duration-300 ${
                  isActivityOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {isActivityOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white shadow-xl border border-black/5 z-[60] py-2">
                {activityOptions.map((option) => {
                  const isSelected = currentActivity === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        onActivityChange(option.value);
                        setIsActivityOpen(false);
                      }}
                      className={`w-full text-left px-5 py-2.5 text-[0.65rem] uppercase tracking-widest transition-colors flex justify-between items-center
                        ${
                          isSelected
                            ? "bg-black/5 text-black font-bold"
                            : "text-black/60 hover:bg-black/5 hover:text-black font-medium"
                        }
                      `}
                    >
                      {option.label}
                      {isSelected && <Icon icon="ph:check-bold" className="text-black" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Region Dropdown */}
          <div className="relative" ref={regionRef}>
            <button
              onClick={() => setIsRegionOpen(!isRegionOpen)}
              className="flex items-center gap-2 text-black/60 hover:text-black transition-colors outline-none cursor-pointer"
            >
              <Icon icon="ph:globe-light" className="text-lg" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {selectedRegionLabel}
              </span>
              <Icon
                icon="ph:caret-down-bold"
                className={`text-[0.65rem] opacity-50 transition-transform duration-300 ${
                  isRegionOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {isRegionOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white shadow-xl border border-black/5 z-[60] py-2">
                {regionOptions.map((option, index) => {
                  if (option.type === "divider") {
                    return <div key={`div-${index}`} className="h-px bg-black/5 my-2" />;
                  }
                  const isSelected = currentRegion === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        onRegionChange(option.value);
                        setIsRegionOpen(false);
                      }}
                      className={`w-full text-left px-5 py-2.5 text-[0.65rem] uppercase tracking-widest transition-colors flex justify-between items-center
                        ${
                          isSelected
                            ? "bg-black/5 text-black font-bold"
                            : "text-black/60 hover:bg-black/5 hover:text-black font-medium"
                        }
                      `}
                    >
                      {option.label}
                      {isSelected && <Icon icon="ph:check-bold" className="text-black" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 text-[0.65rem] uppercase tracking-widest opacity-50">
              <th className="py-4 px-4 font-bold">Identity</th>
              <th className="py-4 px-4 font-bold">Cart</th>
              <th className="py-4 px-4 font-bold">Wishlist</th>
              <th className="py-4 px-4 font-bold">Orders</th>
              <th className="py-4 px-4 font-bold">Feedback & Rating</th>
              <th className="py-4 px-4 font-bold text-right">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <Icon
                    icon="ph:spinner-gap-light"
                    className="text-3xl animate-spin mx-auto opacity-30"
                  />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-sm opacity-40">
                  No users or visitors match the current filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isVisitor = u.userType === "visitor" || u.isGuest;
                return (
                  <tr
                    key={u.entityId}
                    onClick={() => onInspectUser(u.entityId, "cart")}
                    className="border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* Identity Column with User / Visitor Badge */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{u.name}</p>
                        {isVisitor ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                            Visitor
                          </span>
                        ) : (
                          <span className="bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                            User
                          </span>
                        )}
                        {u.isForeign && (
                          <span className="bg-black/5 text-black text-[0.55rem] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm">
                            {u.countryCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-50">{u.email}</p>
                    </td>

                    {/* Cart Quick Action Badge */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectUser(u.entityId, "cart");
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                          u.cartItemsCount > 0
                            ? "bg-black text-white hover:bg-black/80"
                            : "bg-black/5 text-black/40 hover:bg-black/10"
                        }`}
                        title="Inspect Cart"
                      >
                        <Icon icon="carbon:shopping-cart" className="text-xs" />
                        <span>{u.cartItemsCount}</span>
                      </button>
                    </td>

                    {/* Wishlist Quick Action Badge */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectUser(u.entityId, "wishlist");
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                          u.wishlistItemsCount > 0
                            ? "bg-[#7e7053] text-white hover:opacity-90"
                            : "bg-black/5 text-black/40 hover:bg-black/10"
                        }`}
                        title="Inspect Wishlist"
                      >
                        <Icon icon="mingcute:heart-line" className="text-xs" />
                        <span>{u.wishlistItemsCount}</span>
                      </button>
                    </td>

                    {/* Orders Quick Action Badge */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectUser(u.entityId, "orders");
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                          u.ordersCount > 0
                            ? "bg-green-100 text-green-900 hover:bg-green-200"
                            : "bg-black/5 text-black/40 hover:bg-black/10"
                        }`}
                        title="Inspect Orders"
                      >
                        <Icon icon="ph:package-light" className="text-xs" />
                        <span>{u.ordersCount}</span>
                      </button>
                    </td>

                    {/* Reviews & Rating Quick Action Badge */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectUser(u.entityId, "reviews");
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                          u.reviewsCount > 0
                            ? "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                            : "bg-black/5 text-black/40 hover:bg-black/10"
                        }`}
                        title="Inspect Feedback & Rating"
                      >
                        <Icon
                          icon={u.reviewsCount > 0 ? "ph:star-fill" : "ph:star-light"}
                          className={u.reviewsCount > 0 ? "text-amber-500 text-xs" : "text-xs"}
                        />
                        <span>
                          {u.reviewsCount > 0
                            ? `${u.avgRating} ★ (${u.reviewsCount})`
                            : "0 Reviews"}
                        </span>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-sm text-right opacity-60">
                      {timeAgo(u.lastActive)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-black/5">
          <span className="text-xs opacity-50 uppercase tracking-widest font-bold">
            Page {activePage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(activePage - 1)}
              disabled={activePage <= 1}
              className="w-8 h-8 flex items-center justify-center border border-black/10 disabled:opacity-30 hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Icon icon="ph:caret-left-bold" />
            </button>
            <button
              onClick={() => onPageChange(activePage + 1)}
              disabled={activePage >= totalPages}
              className="w-8 h-8 flex items-center justify-center border border-black/10 disabled:opacity-30 hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Icon icon="ph:caret-right-bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;