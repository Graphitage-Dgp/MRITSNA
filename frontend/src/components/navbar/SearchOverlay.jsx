import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { userAxios } from "../../configs/axiosInstance";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const getOptimizedImgUrl = (url) => {
  if (!url) return null; 
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-300,q-80`; 
};

const SearchOverlay = ({ isSearchOpen, setIsSearchOpen }) => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  // --- Refs for GSAP Animations ---
  const overlayContentRef = useRef(null);
  const inputContainerRef = useRef(null);
  const underlineRef = useRef(null);
  const closeBtnWrapperRef = useRef(null);
  const closeBtnRef = useRef(null);
  
  const regionData = useSelector((state) => state.region?.data);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const formatPrice = (price) => {
    const locale = regionData?.currencyCode === "INR" ? "en-IN" : "en-US";
    return `${regionData?.symbol || "₹"} ${Number(price || 0).toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  // Debounce API Call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await userAxios.get(`/products/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data.data || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const closeSearch = () => {
    setIsSearchOpen(false);
  };

  // Lock body scroll, handle focus, and add Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };

    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => searchInputRef.current?.focus(), 200); 
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      setSearchQuery("");
      setSearchResults([]);
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const handleResultClick = (slug) => {
    closeSearch();
    navigate(`/product/${slug}`);
  };

  // ==========================================
  // GSAP INTERACTIVE ANIMATIONS
  // ==========================================
  const { contextSafe } = useGSAP({ scope: overlayContentRef });

  // 1. Entrance Animations
  useGSAP(() => {
    if (isSearchOpen) {
      // Animate Input Down
      gsap.fromTo(inputContainerRef.current, 
        { y: -30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, delay: 0.1, ease: "power3.out" }
      );
      // Animate Close Button In
      gsap.fromTo(closeBtnWrapperRef.current,
        { scale: 0, opacity: 0, rotation: -45 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.6, delay: 0.3, ease: "back.out(1.5)" }
      );
    }
  }, [isSearchOpen]);

  // 2. Results Cascade Animation
  useGSAP(() => {
    if (searchResults.length > 0 && !isSearching) {
      gsap.fromTo(".search-result-card",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power3.out", overwrite: true }
      );
    }
  }, [searchResults, isSearching]);

  // 3. Playful Magnetic Close Button
  const handleMagneticMove = contextSafe((e) => {
    if (!closeBtnWrapperRef.current || !closeBtnRef.current) return;
    const { left, top, width, height } = closeBtnWrapperRef.current.getBoundingClientRect();
    
    // Calculate distance from center
    const x = (e.clientX - (left + width / 2)) * 0.4;
    const y = (e.clientY - (top + height / 2)) * 0.4;

    gsap.to(closeBtnRef.current, { x, y, duration: 0.3, ease: "power2.out" });
  });

  const handleMagneticLeave = contextSafe(() => {
    if (!closeBtnRef.current) return;
    // Elastic snap back to center
    gsap.to(closeBtnRef.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1.2, 0.3)" });
  });

  // 4. Input Focus Stretch
  const handleInputFocus = contextSafe(() => {
    gsap.to(underlineRef.current, { scaleX: 1, opacity: 1, duration: 0.6, ease: "power3.out" });
  });

  const handleInputBlur = contextSafe(() => {
    gsap.to(underlineRef.current, { scaleX: 0, opacity: 0.3, duration: 0.6, ease: "power3.out" });
  });

  return (
    <div 
      className={`fixed inset-0 z-[1000000] text-[#1a1a1a] transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] flex flex-col
        ${isSearchOpen ? 'opacity-100 pointer-events-auto bg-white/90 backdrop-blur-xl' : 'opacity-0 pointer-events-none bg-transparent'}
      `}
    >
      <div ref={overlayContentRef} className="flex flex-col h-full w-full">
        
        {/* Header / Input Area */}
        <div className="w-full px-6 lg:px-12 py-10 pt-16 lg:pt-20">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-8">
            
            <div ref={inputContainerRef} className="flex-1 flex flex-col relative group">
              <div className="flex items-center gap-4 lg:gap-6 mb-2">
                <Icon icon="iconamoon:search" className="text-3xl lg:text-4xl opacity-30" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search pieces, categories, colors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="w-full bg-transparent text-2xl lg:text-5xl font-light tracking-wide focus:outline-none placeholder:text-black/10 text-black selection:bg-black selection:text-white"
                />
              </div>
              {/* Animated Underline */}
              <div className="w-full h-[1px] bg-black/10 relative overflow-hidden">
                <div 
                  ref={underlineRef}
                  className="absolute inset-0 bg-black origin-left"
                  style={{ transform: "scaleX(0)", opacity: 0.3 }}
                />
              </div>
            </div>

            {/* Magnetic Close Button Wrapper - CLICK EVENT MOVED HERE */}
            <div 
              ref={closeBtnWrapperRef}
              onClick={closeSearch}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className="w-20 h-20 flex items-center justify-center cursor-pointer shrink-0"
            >
              <button 
                ref={closeBtnRef}
                className="w-14 h-14 flex items-center justify-center rounded-full border border-black/10 hover:border-black/30 hover:bg-white bg-transparent transition-colors shadow-sm pointer-events-none"
              >
                <Icon icon="ph:x-light" className="text-2xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 w-full overflow-y-auto px-6 lg:px-12 pb-16 custom-scrollbar">
          <div className="max-w-[1200px] mx-auto pt-6">
            
            {isSearching ? (
              <div className="flex flex-col items-center justify-center mt-32 opacity-30">
                <Icon icon="ph:spinner-gap-light" className="text-4xl animate-spin mb-6" />
                <p className="text-xs tracking-widest uppercase font-bold">Accessing Archives...</p>
              </div>
            ) : searchQuery.length > 0 && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-32 opacity-30">
                <Icon icon="ph:magnifying-glass-minus-light" className="text-5xl mb-6" />
                <p className="text-xs tracking-widest uppercase font-bold">No pieces found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-10 gap-y-12">
                {searchResults.map((product) => {
                  const optimizedImg = getOptimizedImgUrl(product.img);
                  
                  return (
                    <div 
                      key={product._id} 
                      onClick={() => handleResultClick(product.slug)}
                      className="search-result-card group flex flex-col gap-4 cursor-pointer"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full aspect-[4/5] bg-[#f4f4f4] overflow-hidden relative">
                        {optimizedImg ? (
                          <img 
                            src={optimizedImg} 
                            alt={product.altText} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] mix-blend-multiply"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black/10">
                            <Icon icon="ph:image-light" className="text-4xl" />
                          </div>
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-[0.5rem] xl:text-[0.6rem] 2xl:text-xs opacity-40 uppercase tracking-widest mb-1.5">
                              {product.category}
                            </p>
                            <h3 className="text-xs xl:text-sm 2xl:text-base font-medium tracking-wide mb-1 group-hover:opacity-70 transition-opacity">
                              {product.title}
                            </h3>
                          </div>
                          <p className="text-[0.6rem] xl:text-xs 2xl:text-sm font-medium shrink-0">
                            {formatPrice(product.finalPrice)}
                          </p>
                        </div>
                        
                        {product.colorName && (
                          <p className="text-[0.5rem] xl:text-[0.6rem] 2xl:text-xs opacity-50 uppercase tracking-widest">
                            {product.colorName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;