import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

const ProductMultiSelect = ({ products, selectedIds, onChange, label, subtitle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef(null);

  // --- The Bulletproof Scroll Fix ---
  // We attach native event listeners directly to the DOM node. 
  // This fires before React's synthetic events and stops parent wrappers from hijacking the scroll.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const stopScroll = (e) => {
      e.stopPropagation();
      // Optional fallback if you use global smooth scrolling libraries (like Lenis/Locomotive)
      if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    };

    el.addEventListener('wheel', stopScroll, { passive: false });
    el.addEventListener('touchmove', stopScroll, { passive: false });

    return () => {
      el.removeEventListener('wheel', stopScroll);
      el.removeEventListener('touchmove', stopScroll);
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const titleMatch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const skuMatch = p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || skuMatch;
  });

  const toggleSelection = (productId) => {
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter(id => id !== productId));
    } else {
      onChange([...selectedIds, productId]);
    }
  };

  return (
    <div className="flex flex-col w-full h-[400px] border border-black/20 bg-white">
      
      {/* Header & Search */}
      <div className="p-4 border-b border-black/10 shrink-0">
        <label className="block text-xs font-bold text-black/70 uppercase tracking-widest mb-1">{label}</label>
        <p className="text-[0.65rem] text-black/50 mb-3 font-medium uppercase tracking-widest">{subtitle}</p>
        <div className="relative">
          <Icon icon="ph:magnifying-glass-light" className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 text-lg" />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-black/20 focus:outline-none focus:border-black bg-[#f8f8f8] transition-colors"
          />
        </div>
      </div>
      
      {/* Scrollable List Container */}
      <div 
        ref={scrollContainerRef}
        // data-lenis-prevent="true" is a safeguard if you happen to be using Lenis smooth scroll
        data-lenis-prevent="true"
        className="flex-1 overflow-y-auto min-h-0 p-2 scroll-smooth scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent hover:scrollbar-thumb-black/40"
      >
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-black/40">
            <Icon icon="ph:magnifying-glass-light" className="text-3xl mb-2" />
            <p className="text-xs font-medium tracking-widest uppercase">No products found</p>
          </div>
        ) : (
          filteredProducts.map(prod => {
            const isSelected = selectedIds.includes(prod._id);
            const imageUrl = prod.image?.baseUrl ? `${prod.image.baseUrl}?tr=w-100,h-100,fo-auto` : null;

            return (
              <div 
                key={prod._id}
                onClick={() => toggleSelection(prod._id)}
                className={`flex items-center gap-4 p-2 mb-1 cursor-pointer border transition-colors group ${
                  isSelected 
                    ? 'border-black bg-black/5' 
                    : 'border-transparent hover:bg-[#f8f8f8]'
                }`}
              >
                <div className="w-12 h-12 bg-[#f0f0f0] shrink-0 border border-black/10 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon="ph:image-light" className="text-black/30 text-xl" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a1a1a] truncate transition-colors group-hover:text-black">
                    {prod.title}
                  </p>
                  <p className="text-[0.65rem] text-black/50 uppercase tracking-widest truncate mt-0.5">
                    {prod.sku || 'No SKU'}
                  </p>
                </div>
                
                <div className="shrink-0 pl-2">
                  <div className={`w-5 h-5 flex items-center justify-center border transition-colors ${
                    isSelected ? 'bg-black border-black text-white' : 'border-black/30 bg-white group-hover:border-black/60'
                  }`}>
                    {isSelected && <Icon icon="ph:check-bold" className="text-xs" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-black/10 bg-[#f8f8f8] flex justify-between items-center shrink-0">
        <span className="text-[0.65rem] font-bold tracking-widest uppercase text-black/60">
          {selectedIds.length} Selected
        </span>
        {selectedIds.length > 0 && (
          <button 
            type="button"
            onClick={() => onChange([])}
            className="text-[0.65rem] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest"
          >
            Clear All
          </button>
        )}
      </div>

    </div>
  );
};

export default ProductMultiSelect;