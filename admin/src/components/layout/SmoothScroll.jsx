import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocation } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const SmoothScroll = ({ children }) => {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // 1. Identify the scroll container
    // If we are in admin, we find the <main> tag. Otherwise, we use the window.
    const isAdmin = location.pathname.startsWith("/admin");
    const scrollWrapper = isAdmin ? document.querySelector("main") : window;
    const scrollContent = isAdmin ? document.querySelector("main > div") : document.documentElement;

    // If we are in admin but the main tag hasn't rendered yet, skip this frame
    if (isAdmin && !scrollWrapper) return;

    const lenis = new Lenis({
      // The "Secret Sauce": We tell Lenis exactly which element to move
      wrapper: isAdmin ? scrollWrapper : window, 
      content: isAdmin ? scrollContent : document.documentElement,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Sync ScrollTrigger with the specific container
    lenis.on("scroll", ScrollTrigger.update);

    const update = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // If we are in admin, we need to tell ScrollTrigger to use the <main> tag as its proxy
    if (isAdmin && scrollWrapper) {
      ScrollTrigger.defaults({ scroller: scrollWrapper });
    } else {
      ScrollTrigger.defaults({ scroller: window });
    }

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [location.pathname]); // Re-init whenever we change routes to re-calculate the container

  // Reset scroll to top on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
      
      const timeoutId = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname]);

  return <>{children}</>;
};

export default SmoothScroll;