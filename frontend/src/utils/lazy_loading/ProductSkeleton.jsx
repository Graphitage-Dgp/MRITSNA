import React from 'react';

const ProductSkeleton = () => {
  return (
    <div className="w-full flex flex-col animate-pulse">
      {/* Image Box Skeleton */}
      <div className="w-full aspect-[4/5] bg-gray-200/60 overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
      
      {/* Text Lines Skeleton */}
      <div className="flex flex-col items-start mt-4 lg:mt-5 gap-2">
        <div className="h-4 lg:h-5 bg-gray-200/80 rounded w-3/4"></div>
        <div className="h-3 lg:h-4 bg-gray-200/80 rounded w-1/3 mt-1"></div>
      </div>
    </div>
  );
};

export default ProductSkeleton;