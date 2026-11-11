import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const SplitText = ({ children, className = "" }) => {
  if (typeof children !== "string") return <span className={className}>{children}</span>;
  return (
    <span className={`inline-block ${className}`}>
      {children.split(" ").map((word, index) => (
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          <span className="shop-title-word inline-block will-change-[transform,filter,opacity]">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

// Accept the new totalCategories prop
const ShopHeader = ({ totalProducts, totalCategories }) => {
  const headerRef = useRef(null);

  useGSAP(() => {
    // Fast, snappy reveal for utility pages
    gsap.fromTo(
      ".shop-title-word",
      { opacity: 0, y: 20, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.05, ease: "power3.out" }
    );
    gsap.fromTo(
      ".shop-subtitle",
      { opacity: 0 },
      { opacity: 1, duration: 1, delay: 0.3, ease: "power2.out" }
    );
  }, { scope: headerRef });

  // Helper to ensure numbers less than 10 have a leading zero (e.g., "04", "07")
  const formatNumber = (num) => (num < 10 ? `0${num}` : num);

  return (
    <div ref={headerRef} className="w-full pt-40 pb-16 px-6 lg:px-12 flex flex-col items-center text-center bg-[#f8f8f8]">
      <span className="shop-subtitle text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
        {formatNumber(totalCategories)} Categories — {formatNumber(totalProducts)} Pieces
      </span>
      <h1 className="head-font text-6xl md:text-8xl lg:text-[8rem] leading-none tracking-tighter">
        <SplitText>Collection</SplitText>
      </h1>
    </div>
  );
};

export default ShopHeader;