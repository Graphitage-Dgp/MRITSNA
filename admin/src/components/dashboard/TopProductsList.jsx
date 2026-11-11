import React from "react";
import { Icon } from "@iconify/react";

const TopProductsList = ({ topProducts }) => {
  if (!topProducts || topProducts.length === 0) return null;

  // Helper to dynamically request a tiny, compressed thumbnail from ImageKit
  const getOptimizedThumbnail = (url) => {
    if (!url) return "";
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}tr=w-100,h-100,q-80,c-at_max`;
  };

  return (
    <div className="top-products-container invisible">
      <div className="flex justify-between items-center mb-4 md:mb-6 px-1 lg:px-2">
        <h2 className="head-font text-xl md:text-2xl txt-dark tracking-tight">Top Performing Pieces</h2>
      </div>
      
      {/* Responsive padding and gap */}
      <div className="bg-white border border-[var(--dark)]/5 rounded-lg p-4 md:p-6 shadow-sm flex flex-col gap-4 md:gap-5">
        {topProducts.map((product, index) => (
          <div key={index} className="top-product-row invisible flex items-center justify-between gap-2">
            
            <div className="flex items-center gap-3 md:gap-4 min-w-0"> {/* min-w-0 ensures truncation works */}
              {/* ImageKit Optimized Thumbnail */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-sm overflow-hidden bg-[#f8f8f8] shrink-0 border border-[var(--dark)]/10 flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={getOptimizedThumbnail(product.image)} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Icon icon="lucide:image" className="text-[var(--dark)] opacity-20 text-xl" />
                )}
              </div>
              
              {/* Product Details with Truncation */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold txt-dark leading-tight truncate">{product.name}</span>
                <span className="text-[0.65rem] tracking-[0.1em] uppercase txt-dark opacity-50 mt-1 truncate">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end shrink-0">
              <span className="text-sm font-bold txt-dark">{product.revenue}</span>
              <span className="text-[0.65rem] tracking-[0.1em] uppercase txt-dark opacity-50 mt-1">
                {product.sold} Sold
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProductsList;