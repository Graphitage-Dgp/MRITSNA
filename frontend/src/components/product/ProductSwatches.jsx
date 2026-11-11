import React from "react";

const ProductSwatches = ({ variants, activeVariant, onVariantChange }) => {
  if (!variants || variants.length <= 1) return null;

  return (
    <div className="product-info-item w-full flex flex-col gap-3 mb-6 lg:mb-8">
      <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50">
        Color: <span className="opacity-100 text-[#1a1a1a] ml-1">{activeVariant.colorName}</span>
      </span>
      
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isActive = activeVariant.variantId === variant.variantId || activeVariant._id === variant._id;
          
          // FIXED: Reverted back to checking the boolean, with a fallback just in case
          const isOutOfStock = !variant.inStock || (variant.inventory && variant.inventory.quantity <= 0);

          return (
            <button
              key={variant.variantId || variant._id}
              onClick={() => onVariantChange(variant)}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                ${isActive ? "border border-[#1a1a1a] p-[2px]" : "border border-transparent hover:scale-110"}
                ${isOutOfStock ? "opacity-50" : ""}
              `}
              aria-label={`Select ${variant.colorName}`}
              title={isOutOfStock ? `${variant.colorName} - Out of Stock` : variant.colorName}
            >
              {/* Inner Color Circle / Multicolor Swatch */}
              <div 
                className="w-full h-full rounded-full border border-black/10 relative overflow-hidden"
                style={
                  variant.isMulticolor 
                    ? { 
                        backgroundImage: `url('/swatch/multicolor_swatch.webp')`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                      }
                    : { backgroundColor: variant.colorHex }
                }
              >
                {/* Diagonal line for Out of Stock variants */}
                {isOutOfStock && (
                  <div className="absolute top-1/2 left-[-20%] w-[140%] h-[1px] bg-red-500 -rotate-45" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductSwatches;