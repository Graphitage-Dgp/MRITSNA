import React, { useState } from 'react';
import { Icon } from '@iconify/react';

// NEW: Added 'width' prop. Defaulting to 400px is highly optimized for grid thumbnails!
const PremiumImage = ({ src, alt, className = "", width = 700 }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Premium Fallback State 
  if (!src) {
    return (
      <div className={`relative flex items-center justify-center bg-[#eeeeee] w-full h-full text-gray-400 ${className}`}>
        <Icon icon="lucide:image" width="32" className="opacity-40" />
      </div>
    );
  }

  // 2. Micro-thumbnail for the blur effect
  const blurUrl = `${src}?tr=w-50,bl-10,q-10`;
  
  // 3. Dynamic High-Res Image based on the requested width
  const highResUrl = `${src}?tr=w-${width},q-80`;

  return (
    <div className={`relative overflow-hidden bg-[#eeeeee] w-full h-full ${className}`}>
      {/* The Blurred Placeholder */}
      <img
        src={blurUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl transition-opacity duration-700"
        style={{ opacity: isLoaded ? 0 : 1 }}
      />
      
      {/* The Actual Image */}
      <img
        src={highResUrl}
        alt={alt || "Product image"}
        onLoad={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1.2s] ease-out ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
      />
    </div>
  );
};

export default PremiumImage;