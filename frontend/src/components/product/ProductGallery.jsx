// src/components/product/ProductGallery.jsx
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/zoom";
import PremiumImage from "../../utils/lazy_loading/PremiumImage";

const ProductGallery = ({ images, setDesktopZoom }) => {
  // Responsive Image Width State
  const [imgWidth, setImgWidth] = useState(1600); // Default to desktop

  // Mobile Zoom State
  const [isMobileZoomOpen, setIsMobileZoomOpen] = useState(false);
  const [mobileInitialSlide, setMobileInitialSlide] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(1);

  // --- Dynamic Resolution Hook ---
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setImgWidth(1600); // Desktop
      } else if (width >= 768) {
        setImgWidth(1200); // Tablet
      } else {
        setImgWidth(1000); // Mobile
      }
    };

    // Fire once on mount
    handleResize();

    // Update if the user rotates their tablet or resizes their browser
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseMove = (e, imgUrl) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setDesktopZoom({ show: true, img: imgUrl, x, y });
  };

  const safeImages = images?.length > 0 ? images : [{ url: null, alt: "Product Image" }];

  return (
    <>
      {/* DESKTOP GALLERY */}
      <div className="hidden lg:grid w-full lg:w-[55%] grid-cols-2 gap-4 pb-32">
        {safeImages.map((img, index) => {
          const colSpanClass = index === 0 ? "col-span-2" : "col-span-1";
          
          // For the zoom lens, we strictly want 1600px so it stays sharp when scaled up 300%
          const zoomResUrl = img.url ? `${img.url}?tr=w-1600,q-90` : "/hero_product.png";

          return (
            <div 
              key={index} 
              className={`product-image ${colSpanClass} aspect-[4/5] bg-[#eeeeee] overflow-hidden rounded-[2px] relative cursor-crosshair group`}
              onMouseEnter={() => setDesktopZoom((prev) => ({ ...prev, show: true, img: zoomResUrl }))}
              onMouseMove={(e) => handleMouseMove(e, zoomResUrl)}
              onMouseLeave={() => setDesktopZoom((prev) => ({ ...prev, show: false }))}
            >
              {/* Pass the dynamically calculated imgWidth to the component */}
              <PremiumImage src={img.url} alt={img.alt || `Product angle ${index + 1}`} width={imgWidth} />
            </div>
          );
        })}
      </div>

      {/* MOBILE / TABLET GALLERY */}
      <div className="block lg:hidden w-full mb-4 relative">
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[0.6rem] font-bold tracking-[0.2em] text-[#1a1a1a] shadow-sm flex items-center gap-1">
          <span>{currentMobileSlide < 10 ? `0${currentMobileSlide}` : currentMobileSlide}</span>
          <span className="opacity-40 font-light">/</span>
          <span className="opacity-40">{safeImages.length < 10 ? `0${safeImages.length}` : safeImages.length}</span>
        </div>

        <Swiper 
          onSlideChange={(swiper) => setCurrentMobileSlide(swiper.realIndex + 1)}
          className="w-full aspect-[4/5] product-image"
        >
          {safeImages.map((img, index) => (
            <SwiperSlide key={index} onClick={() => {
              setMobileInitialSlide(index);
              setIsMobileZoomOpen(true);
            }}>
              {/* Pass the dynamically calculated imgWidth down */}
              <PremiumImage src={img.url} alt={img.alt} width={imgWidth} />
              
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur text-black p-2 rounded-full shadow-lg text-xs flex items-center justify-center">
                <Icon icon="iconamoon:zoom-in-light" className="text-lg" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* MOBILE FULLSCREEN MODAL */}
      <div className={`fixed inset-0 z-[999999] bg-black transition-opacity duration-500 flex flex-col ${isMobileZoomOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="w-full p-6 flex justify-end absolute top-0 z-10">
          <button onClick={() => setIsMobileZoomOpen(false)} className="text-white bg-black/50 backdrop-blur p-3 rounded-full hover:bg-white/20 transition-colors">
            <Icon icon="ph:x" className="text-xl" />
          </button>
        </div>
        <div className="flex-1 w-full h-full flex items-center justify-center">
          {isMobileZoomOpen && (
            <Swiper modules={[Pagination, Zoom]} zoom={true} initialSlide={mobileInitialSlide} pagination={{ clickable: true }} className="w-full h-full">
              {safeImages.map((img, index) => (
                <SwiperSlide key={index} className="flex items-center justify-center">
                  <div className="swiper-zoom-container">
                    {/* For the fullscreen zoom, we enforce 1600px so it stays crystal clear when pinched/zoomed */}
                    <img src={img.url ? `${img.url}?tr=w-1600` : "/hero_product.png"} alt="Zoomed" className="max-w-full max-h-full object-contain" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductGallery;