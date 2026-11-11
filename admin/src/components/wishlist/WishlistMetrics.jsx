import React from "react";
import { Icon } from "@iconify/react";

const getOptimizedImgUrl = (url) => {
  if (!url) return "";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-100,h-100,q-80`;
};

const WishlistMetrics = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-black/5 p-6 h-32 animate-pulse flex flex-col justify-between">
            <div className="h-3 w-24 bg-black/5 rounded-sm"></div>
            <div className="h-8 w-16 bg-black/5 rounded-sm"></div>
          </div>
        ))}
      </div>
    );
  }

  const topProduct = stats?.topWishlistedProducts?.[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Total Active Wishlists */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Total Wishlists</h3>
          <Icon icon="ph:heart-straight-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <p className="text-4xl font-light">{stats?.totalActiveWishlists?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Average Items per Wishlist */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Avg Items / Wishlist</h3>
          <Icon icon="ph:list-numbers-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <p className="text-4xl font-light">{stats?.averageItemsPerWishlist || 0}</p>
        </div>
      </div>

      {/* Top Wishlisted Product */}
      <div className="bg-white border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[0.65rem] uppercase tracking-widest font-bold opacity-50">Highest Demand</h3>
          <Icon icon="ph:trend-up-light" className="text-xl opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {topProduct ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-14 bg-[#eeeeee] shrink-0 overflow-hidden">
              <img 
                src={getOptimizedImgUrl(topProduct.image)} 
                alt={topProduct.title} 
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div>
              <p className="text-sm font-medium line-clamp-1 leading-tight mb-1">{topProduct.title}</p>
              <p className="text-[0.65rem] uppercase tracking-widest opacity-50">
                {topProduct.count} Saves | SKU: {topProduct.sku}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm opacity-40">No demand data available</p>
        )}
      </div>

    </div>
  );
};

export default WishlistMetrics;