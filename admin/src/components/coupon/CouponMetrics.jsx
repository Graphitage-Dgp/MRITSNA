import React from "react";
import { Icon } from "@iconify/react";

const CouponMetrics = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-black/5 p-6 h-32 animate-pulse flex flex-col justify-between shadow-sm">
            <div className="h-3 w-24 bg-black/5 rounded-sm"></div>
            <div className="h-8 w-16 bg-black/5 rounded-sm"></div>
          </div>
        ))}
      </div>
    );
  }

  const topCoupon = stats?.topCoupons?.[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Total Active Campaigns */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Active Campaigns</h3>
          <Icon icon="ph:ticket-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <p className="text-4xl font-light">{stats?.totalActive?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Total Global Redemptions */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Total Redemptions</h3>
          <Icon icon="ph:shopping-bag-open-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <p className="text-4xl font-light">{stats?.totalGlobalUses?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Top Performing Code */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Top Performing Code</h3>
          <Icon icon="ph:fire-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {topCoupon ? (
          <div>
            <p className="text-2xl font-medium tracking-wider uppercase mb-1">{topCoupon.code}</p>
            <p className="text-[0.65rem] uppercase tracking-widest opacity-50">
              {topCoupon.usedCount} Uses | {topCoupon.discountType.replace('_', ' ')}
            </p>
          </div>
        ) : (
          <p className="text-sm opacity-40 mt-2">No usage data available</p>
        )}
      </div>

    </div>
  );
};

export default CouponMetrics;