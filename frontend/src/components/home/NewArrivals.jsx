// src/components/home/NewArrivals.jsx
import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

import { fetchNewArrivals } from "../../store/features/productSlice";
import ProductCard from "../../utils/lazy_loading/ProductCard"; // Adjust path
import ProductSkeleton from "../../utils/lazy_loading/ProductSkeleton"; // Adjust path

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

gsap.registerPlugin(ScrollTrigger);

const SplitText = ({ children, className = "" }) => {
  if (typeof children !== "string") return <span className={className}>{children}</span>;
  return (
    <span className={`inline-block ${className}`}>
      {children.split(" ").map((word, index) => (
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          <span className="reveal-word inline-block will-change-[transform,filter,opacity]">{word}</span>
        </span>
      ))}
    </span>
  );
};

const NewArrivals = () => {
  const dispatch = useDispatch();
  
  // --- FIX 1: Extract currencySymbol from the Redux store ---
  const { newArrivals, isLoading, currencySymbol } = useSelector((state) => state.product);

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const sliderWrapperRef = useRef(null);
  const [swiperInstance, setSwiperInstance] = useState(null);

  useEffect(() => {
    dispatch(fetchNewArrivals());
  }, [dispatch]);

  // Heading Animation Hook
  useGSAP(() => {
    const words = gsap.utils.toArray(".reveal-word", headingRef.current);
    
    gsap.fromTo(words,
      { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
      {
        opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 1, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%", toggleActions: "play none none reverse" }
      }
    );

    gsap.fromTo(sliderWrapperRef.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 60%", toggleActions: "play none none reverse" }
      }
    );
  }, { scope: sectionRef });

  // Data Reveal Animation Hook - Only fires when data actually loads!
  useGSAP(() => {
    if (!isLoading && newArrivals.length > 0) {
      ScrollTrigger.refresh(); // Recalculate heights
      
      gsap.to(".gsap-reveal-card", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1, // This creates the beautiful "wave" reveal
        ease: "power3.out",
        scrollTrigger: {
          trigger: sliderWrapperRef.current,
          start: "top 80%",
        }
      });
    }
  }, [isLoading, newArrivals]); 

  // Create an array of 5 Skeletons for the initial load state
  const skeletonArray = Array(5).fill(0);

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-32 pb-20 overflow-hidden relative cursor-auto"
      id="new-arrivals"
    >
      <div className="w-full px-6 lg:px-10 mb-14 lg:mb-20 pointer-events-none">
        <div ref={headingRef} className="relative inline-block mt-10 lg:mt-0">
          <span className="absolute left-1 lg:top-4 lg:left-2 text-xs lg:text-base font-bold tracking-[0.2em] uppercase">
            <SplitText>New</SplitText>
          </span>
          <h2 className="head-font text-6xl md:text-8xl lg:text-[8rem] leading-none tracking-tighter">
            <SplitText>arrivals</SplitText>
          </h2>
        </div>
      </div>

      <div ref={sliderWrapperRef} className="w-full pl-6 lg:pl-10 min-h-[400px]">
        <Swiper
          modules={[Autoplay]} 
          onSwiper={setSwiperInstance}
          loop={!isLoading && newArrivals.length > 4} 
          observer={true} 
          observeParents={true}
          speed={800} 
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          breakpoints={{
            0: { slidesPerView: 1.2, spaceBetween: 16 },
            768: { slidesPerView: 2.5, spaceBetween: 24 },
            1024: { slidesPerView: 4.5, spaceBetween: 10 },
          }}
          className="w-full pb-6" 
        >
          {/* CONDITION 1: IS LOADING -> Render Skeletons */}
          {isLoading && newArrivals.length === 0 ? (
            skeletonArray.map((_, index) => (
              <SwiperSlide key={`skeleton-${index}`}>
                <ProductSkeleton />
              </SwiperSlide>
            ))
          ) : (
            /* CONDITION 2: DATA LOADED -> Render Real Cards */
            newArrivals.map((product) => (
              <SwiperSlide key={product._id || product.id}>
                {/* --- FIX 2: Pass currencySymbol down to ProductCard --- */}
                <ProductCard 
                  product={product} 
                  currencySymbol={currencySymbol || '₹'} 
                />
              </SwiperSlide>
            ))
          )}
        </Swiper>

        {/* Custom Navigation Arrows */}
        <div className="flex justify-center gap-4 pr-6 lg:pr-10 mt-6 lg:mt-10">
          <button 
            onClick={() => swiperInstance?.slidePrev()}
            className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300"
            aria-label="Previous slide"
          >
            <Icon icon="lucide:arrow-left" width="20" />
          </button>
          <button 
            onClick={() => swiperInstance?.slideNext()}
            className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300"
            aria-label="Next slide"
          >
            <Icon icon="lucide:arrow-right" width="20" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;