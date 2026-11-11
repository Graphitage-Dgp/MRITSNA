import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ProductCard from "../../utils/lazy_loading/ProductCard";
import ProductSkeleton from "../../utils/lazy_loading/ProductSkeleton";

// --- ADDED currencySymbol TO PROPS ---
const ProductGrid = ({ products, isLoading, currencySymbol = "₹" }) => {
  const gridRef = useRef(null);

  useGSAP(() => {
    if (!isLoading && products.length > 0) {
      gsap.killTweensOf(".gsap-reveal-card");

      gsap.fromTo(
        ".gsap-reveal-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.05,
          ease: "power2.out"
        }
      );
    }
  }, { scope: gridRef, dependencies: [products, isLoading] });

  const skeletonArray = Array(8).fill(0);

  return (
    <div className="w-full bg-[#f8f8f8] py-16 min-h-[50vh]">
      <div 
        ref={gridRef}
        className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-14"
      >
        {isLoading ? (
          skeletonArray.map((_, idx) => (
            <ProductSkeleton key={`skeleton-${idx}`} />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 font-medium">
            No products found matching your filters.
          </div>
        ) : (
          products.map((product) => (
            // --- PASSED currencySymbol DOWN TO THE CARD ---
            <ProductCard 
              key={product._id} 
              product={product} 
              currencySymbol={currencySymbol} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProductGrid;