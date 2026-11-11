import React from "react";
import { Icon } from "@iconify/react";

const filterOptions = [
  { label: "All Codes", value: "all" },
  { label: "Active", value: "active" },
  { label: "Expired / Paused", value: "expired" }
];

const CouponTable = ({ 
  coupons, 
  pagination, 
  isLoading, 
  currentFilter, 
  searchQuery, 
  onFilterChange, 
  onSearchChange,
  onPageChange, 
  onRowClick 
}) => {
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  const renderDiscountFormat = (type, value) => {
    if (type === 'percentage') return `${value}% OFF`;
    if (type === 'fixed_amount') return `₹${value} OFF`; // Base DB currency
    if (type === 'free_shipping') return `FREE SHIPPING`;
    return `${value}`;
  };

  return (
    <div className="flex flex-col w-full">
      
      {/* Top Controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 mb-6 pb-4">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Icon icon="ph:magnifying-glass-light" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text"
            placeholder="Search coupon code..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm border border-black/10 bg-gray-50 focus:bg-white focus:outline-none focus:border-black transition-colors rounded-sm uppercase tracking-wider"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-6">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`text-[0.65rem] uppercase tracking-widest font-bold pb-1 border-b-2 transition-colors
                ${currentFilter === option.value ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 text-[0.65rem] uppercase tracking-widest opacity-50">
              <th className="py-4 px-4 font-bold">Coupon Code</th>
              <th className="py-4 px-4 font-bold">Reward</th>
              <th className="py-4 px-4 font-bold text-center">Redemptions</th>
              <th className="py-4 px-4 font-bold text-right">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="py-12 text-center">
                  <Icon icon="ph:spinner-gap-light" className="text-3xl animate-spin mx-auto opacity-30" />
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-sm opacity-40">
                  No coupons found matching your criteria.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr 
                  key={coupon.id} 
                  onClick={() => onRowClick(coupon.id)}
                  className="border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold tracking-wider">{coupon.code}</p>
                      {coupon.status === 'Active' ? (
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {coupon.isAutoApply && (
                        <span className="bg-black/5 text-black text-[0.55rem] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm">Auto-Apply</span>
                      )}
                      {coupon.regions.includes('GLOBAL') ? null : (
                         <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[0.55rem] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm">Targeted</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4 text-sm font-medium">
                    {renderDiscountFormat(coupon.discountType, coupon.discountValue)}
                  </td>
                  
                  <td className="py-4 px-4 text-sm text-center">
                    <span className="font-medium">{coupon.usedCount}</span>
                    <span className="opacity-40 text-xs ml-1">/ {coupon.usageLimit || '∞'}</span>
                  </td>

                  <td className="py-4 px-4 text-sm text-right opacity-60">
                    {formatDate(coupon.expiryDate)}
                  </td>
                </tr>
              ))
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

export default CouponTable;