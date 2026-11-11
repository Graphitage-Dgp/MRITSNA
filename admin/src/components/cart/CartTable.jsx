import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

const formatINR = (amount) => {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatForeignCurrency = (amount, currencyCode, symbol) => {
  return `${symbol} ${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const timeAgo = (dateString) => {
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
  { value: "international", label: "International (All Exports)" },
  { type: "divider" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "EU", label: "Europe" },
  { value: "AE", label: "UAE" },
];

const CartTable = ({ 
  carts, 
  pagination, 
  isLoading, 
  currentFilter, 
  currentRegion, 
  onFilterChange, 
  onRegionChange, 
  onPageChange, 
  onRowClick 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tabs = [
    { id: "all", label: "All Carts" },
    { id: "users", label: "Users" },
    { id: "visitors", label: "Visitors" },
    { id: "recent", label: "Recent (< 24h)" },
    { id: "abandoned", label: "Abandoned (> 24h)" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleOptionClick = (value) => {
    onRegionChange(value);
    setIsDropdownOpen(false);
  };

  const selectedRegionLabel = regionOptions.find(opt => opt.value === currentRegion)?.label || "Global (All)";

  return (
    <div className="flex flex-col w-full">
      
      {/* Top Controls: Tabs & Custom Region Filter */}
      <div className="flex flex-wrap items-center justify-between border-b border-black/10 mb-6 gap-y-4">
        
        {/* Left: Time & Identity Filters */}
        <div className="flex flex-wrap items-center gap-6 lg:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative cursor-pointer
                ${currentFilter === tab.id ? "text-black" : "text-black/40 hover:text-black/70"}
              `}
            >
              {tab.label}
              {currentFilter === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
              )}
            </button>
          ))}
        </div>

        {/* Right: Custom Region Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pb-4 text-black/60 hover:text-black transition-colors outline-none cursor-pointer"
          >
            <Icon icon="ph:globe-light" className="text-lg" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {selectedRegionLabel}
            </span>
            <Icon 
              icon="ph:caret-down-bold" 
              className={`text-[0.65rem] opacity-50 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : "rotate-0"}`} 
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white shadow-xl border border-black/5 z-[60] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {regionOptions.map((option, index) => {
                if (option.type === "divider") {
                  return <div key={`divider-${index}`} className="h-px bg-black/5 my-2" />;
                }
                
                const isSelected = currentRegion === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className={`w-full text-left px-5 py-2.5 text-[0.65rem] uppercase tracking-widest transition-colors flex justify-between items-center group
                      ${isSelected ? "bg-black/5 text-black font-bold" : "text-black/60 hover:bg-black/5 hover:text-black font-medium"}
                    `}
                  >
                    {option.label}
                    {isSelected && (
                      <Icon icon="ph:check-bold" className="text-black" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 text-[0.65rem] uppercase tracking-widest opacity-50">
              <th className="py-4 px-4 font-bold">Customer</th>
              <th className="py-4 px-4 font-bold">Items</th>
              <th className="py-4 px-4 font-bold">Value</th>
              <th className="py-4 px-4 font-bold">Status</th>
              <th className="py-4 px-4 font-bold text-right">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <Icon icon="ph:spinner-gap-light" className="text-3xl animate-spin mx-auto opacity-30" />
                </td>
              </tr>
            ) : carts.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-sm opacity-40">
                  No carts found for this filter.
                </td>
              </tr>
            ) : (
              carts.map((cart) => {
                const isVisitor = cart.isGuest || cart.user?.isGuest || cart.userType === "visitor";
                return (
                  <tr 
                    key={cart.cartId} 
                    onClick={() => onRowClick(cart.cartId)}
                    className="border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{cart.user.name}</p>
                        
                        {/* USER / VISITOR BADGE */}
                        {isVisitor ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                            Visitor
                          </span>
                        ) : (
                          <span className="bg-black text-white text-[0.55rem] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm">
                            User
                          </span>
                        )}

                        {cart.isForeign && (
                          <span className="bg-black/5 text-black text-[0.55rem] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm">
                            {cart.user.countryCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-50">{cart.user.email}</p>
                    </td>
                    
                    <td className="py-4 px-4 text-sm">{cart.itemCount}</td>
                    
                    {/* DUAL DISPLAY VALUE COLUMN */}
                    <td className="py-4 px-4">
                      {cart.isForeign ? (
                        <div>
                          <p className="text-sm font-medium">
                            {formatForeignCurrency(cart.cartValueLocalized, cart.currencyCode, cart.symbol)}
                          </p>
                          <p className="text-[0.65rem] opacity-50 font-medium mt-0.5">
                            Base: {formatINR(cart.cartValueBaseINR)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium">{formatINR(cart.cartValueBaseINR)}</p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {cart.isAbandoned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-100 text-red-800 text-[0.65rem] uppercase tracking-widest font-bold">
                          Abandoned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-green-100 text-green-800 text-[0.65rem] uppercase tracking-widest font-bold">
                          Active
                        </span>
                      )}
                    </td>
                    
                    <td className="py-4 px-4 text-sm text-right opacity-60">
                      {timeAgo(cart.lastActive)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-black/5">
          <span className="text-xs opacity-50 uppercase tracking-widest font-bold">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="w-8 h-8 flex items-center justify-center border border-black/10 disabled:opacity-30 hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Icon icon="ph:caret-left-bold" />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
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

export default CartTable;
