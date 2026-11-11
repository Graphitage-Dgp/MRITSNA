import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';

const CollectionHotspotEditor = ({ lookbookImage, hotspots, setHotspots, availableProducts }) => {
  const imageContainerRef = useRef(null);
  
  // State for the temporary hotspot currently being placed/edited
  const [activeDraft, setActiveDraft] = useState(null);

  // 1. Calculate Percentages on Click
  const handleImageClick = (e) => {
    // Prevent clicking if they are clicking ON an existing hotspot or the popover
    if (e.target !== imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    
    // Calculate exact click coordinates relative to the image container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to percentages for responsive scaling
    const leftPercentage = Number(((x / rect.width) * 100).toFixed(2));
    const topPercentage = Number(((y / rect.height) * 100).toFixed(2));

    // Open the draft popover at these coordinates
    setActiveDraft({
      topPercentage,
      leftPercentage,
      selectedProductId: ''
    });
  };

  // 2. Save the Draft to the Main Array
  const handleSaveHotspot = () => {
    if (!activeDraft.selectedProductId) return;

    // Find the product details to display its name on the pin (UI only, backend only needs ID)
    const productData = availableProducts.find(p => p._id === activeDraft.selectedProductId);

    const newHotspot = {
      topPercentage: activeDraft.topPercentage,
      leftPercentage: activeDraft.leftPercentage,
      product: activeDraft.selectedProductId,
      _productName: productData?.title || 'Unknown Product' // Temporary UI helper
    };

    setHotspots([...hotspots, newHotspot]);
    setActiveDraft(null); // Close popover
  };

  // 3. Remove an Existing Hotspot
  const handleRemoveHotspot = (indexToRemove) => {
    const updated = hotspots.filter((_, idx) => idx !== indexToRemove);
    setHotspots(updated);
  };

  if (!lookbookImage) {
    return (
      <div className="w-full aspect-[4/5] md:aspect-video bg-[#f8f8f8] border border-dashed border-black/20 flex flex-col items-center justify-center text-black/40">
        <Icon icon="ph:image-light" className="text-4xl mb-2" />
        <p className="text-sm font-medium">Upload a lookbook image first to add hotspots</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-sm font-bold text-[#1a1a1a]">Lookbook Hotspots</h3>
          <p className="text-xs text-black/50 font-medium mt-1">
            Click anywhere on the image to pin a product.
          </p>
        </div>
        <span className="text-xs font-bold bg-black/5 px-2 py-1">
          {hotspots.length} Pinned
        </span>
      </div>

      {/* The Interactive Visual Area */}
      <div className="relative w-full aspect-[4/5] md:aspect-video bg-black/5 overflow-hidden group">
        
        {/* The Base Image */}
        <img 
          ref={imageContainerRef}
          src={lookbookImage.baseUrl || lookbookImage} 
          alt="Lookbook Editor"
          className="w-full h-full object-cover cursor-crosshair"
          onClick={handleImageClick}
          draggable="false"
        />

        {/* Render Saved Hotspots */}
        {hotspots.map((spot, index) => (
          <div 
            key={index} 
            className="absolute z-10 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group/pin"
            style={{ top: `${spot.topPercentage}%`, left: `${spot.leftPercentage}%` }}
          >
            {/* The Dot */}
            <div className="w-5 h-5 bg-white rounded-full shadow-lg border-2 border-black flex items-center justify-center cursor-pointer">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>

            {/* Hover Tooltip for Saved Pins */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-3 py-2 text-xs min-w-[120px] whitespace-nowrap opacity-0 pointer-events-none group-hover/pin:opacity-100 group-hover/pin:pointer-events-auto transition-opacity flex justify-between items-center gap-4">
              <span className="font-medium truncate">{spot._productName || 'Product Linked'}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveHotspot(index); }}
                className="text-red-400 hover:text-red-300"
                title="Remove Pin"
              >
                <Icon icon="ph:trash-light" className="text-sm" />
              </button>
            </div>
          </div>
        ))}

        {/* Render the Active Draft Popover (Currently placing) */}
        {activeDraft && (
          <div 
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${activeDraft.topPercentage}%`, left: `${activeDraft.leftPercentage}%` }}
          >
            {/* Pulsing Target Dot */}
            <div className="w-5 h-5 bg-white rounded-full shadow-lg border-2 border-black flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>

            {/* Selection Popover */}
            <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white shadow-2xl border border-black/10 p-4 min-w-[250px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[0.65rem] font-bold tracking-[0.1em] uppercase text-black/50">
                  Link Product
                </span>
                <button 
                  onClick={() => setActiveDraft(null)}
                  className="text-black/40 hover:text-black transition-colors"
                >
                  <Icon icon="ph:x-light" className="text-lg" />
                </button>
              </div>

              <select 
                className="w-full text-sm border-b border-black/20 pb-2 mb-4 focus:outline-none focus:border-black bg-transparent"
                value={activeDraft.selectedProductId}
                onChange={(e) => setActiveDraft({ ...activeDraft, selectedProductId: e.target.value })}
              >
                <option value="" disabled>Select a product...</option>
                {availableProducts.map(prod => (
                  <option key={prod._id} value={prod._id}>
                    {prod.title} {prod.sku ? `(${prod.sku})` : ''}
                  </option>
                ))}
              </select>

              <button 
                onClick={handleSaveHotspot}
                disabled={!activeDraft.selectedProductId}
                className="w-full bg-[#1a1a1a] text-white py-2 text-[0.65rem] font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
              >
                Save Pin
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default CollectionHotspotEditor;