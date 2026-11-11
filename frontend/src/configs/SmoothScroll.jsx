import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocation } from "react-router-dom"; 

gsap.registerPlugin(ScrollTrigger);

const SmoothScroll = ({ children }) => {
  const lenisRef = useRef(null);
  const location = useLocation();

  // --- Core Lenis Initialization ---
  useEffect(() => {
    const lenis = new Lenis({
      // Stretched Duration: Creates a heavier, more luxurious glide
      duration: 1.2, 
      
      // Quartic Out Easing: Softer start and a much more elegant fade-out
      easing: (t) => 1 - Math.pow(1 - t, 4), 
      
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false, 
      
      // Wheel Multiplier: Tightens visual frames for perceived higher FPS
      wheelMultiplier: 1.2, 
      touchMultiplier: 2,
    });

    lenisRef.current = lenis; 

    // Sync Lenis scroll with GSAP's ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Sync Lenis's requestAnimationFrame with GSAP's Ticker for zero-jitter
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Turn off GSAP's lag smoothing to prevent animation conflicts
    gsap.ticker.lagSmoothing(0);

    // Clean up on unmount to prevent memory leaks
    return () => {
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      lenis.destroy();
    };
  }, []); 

  // --- The SPA Router Fix (The Cascading Refresh) ---
  useEffect(() => {
    if (!lenisRef.current) return;

    // Instantly snap scroll back to the top on page transition
    lenisRef.current.scrollTo(0, { immediate: true });

    // Force recalculations as the DOM settles
    const refreshScroll = () => {
      ScrollTrigger.refresh();
      // Explicitly tell Lenis to remeasure the document body height
      if (lenisRef.current) {
        lenisRef.current.resize(); 
      }
    };

    // We stagger the refresh calls to catch images and dynamic data rendering 
    // at different intervals during the initial page transition.
    const t1 = setTimeout(refreshScroll, 100);
    const t2 = setTimeout(refreshScroll, 500);
    const t3 = setTimeout(refreshScroll, 1200);
    const t4 = setTimeout(refreshScroll, 2500); // Safety net for slow 3G networks

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname]); 

  return <>{children}</>;
};

export default SmoothScroll;