import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

const NotFound = () => {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Ripple Refs
  const rippleRef = useRef(null);
  const textDarkRef = useRef(null);
  const textLightRef = useRef(null);

  const { contextSafe } = useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Cinematic 3D Text Reveal
    tl.fromTo(
      ".char-404",
      { y: 150, opacity: 0, rotateX: -90, transformOrigin: "50% 100%" },
      { y: 0, opacity: 1, rotateX: 0, stagger: 0.1, duration: 1.5, ease: "expo.out" }
    )
    // 2. Elegant Fade for Supporting Elements
    .fromTo(
      ".fade-in",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 1, ease: "power2.out" },
      "-=1"
    );
  }, { scope: containerRef });

  // --- Parallax 404 Background ---
  const handleMouseMove = contextSafe((e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 50;
    const y = (clientY / window.innerHeight - 0.5) * 50;

    gsap.to(".parallax-layer-1", { x: x, y: y, rotationY: x * 0.2, rotationX: -y * 0.2, duration: 1, ease: "power2.out" });
    gsap.to(".parallax-layer-2", { x: -x * 0.5, y: -y * 0.5, duration: 1.5, ease: "power2.out" });
  });

  // --- NEW: Interactive Gravity Smash Physics ---
  const handleScreenClick = contextSafe((e) => {
    // Prevent the smash if they are clicking the Return Home button
    if (e.target.closest('.no-smash')) return;

    const chars = gsap.utils.toArray(".char-404");

    chars.forEach((char) => {
      // Calculate a random scatter trajectory
      const randomX = gsap.utils.random(-200, 200);
      const randomRot = gsap.utils.random(-120, 120);
      const floorDrop = window.innerHeight / 2 + 50;

      // 1. Crash to the floor
      gsap.to(char, {
        y: floorDrop,
        x: randomX,
        rotationZ: randomRot,
        duration: 1.5,
        ease: "bounce.out",
        overwrite: "auto" // Cancels any currently running animations on these elements
      });

      // 2. Magically reassemble and levitate back
      gsap.to(char, {
        y: 0,
        x: 0,
        rotationZ: 0,
        duration: 2.5,
        delay: 2, // Stay shattered on the floor for 2 seconds
        ease: "elastic.out(1, 0.4)",
        overwrite: "auto"
      });
    });
  });

  // --- Magnetic Physics (Triggered by the Wrapper) ---
  const handleMagnetMove = contextSafe((e) => {
    const btn = buttonRef.current;
    const rect = btn.getBoundingClientRect();
    
    const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.4;

    gsap.to(btn, { x, y, duration: 0.3, ease: "power2.out" });
    gsap.to(".magnet-text", { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: "power2.out" });
  });

  const handleMagnetLeave = contextSafe(() => {
    const btn = buttonRef.current;
    gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
    gsap.to(".magnet-text", { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
  });

  // --- Ripple Physics (Triggered by the Button) ---
  const handleRippleEnter = contextSafe((e) => {
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(rippleRef.current, { x, y, scale: 0 });
    gsap.to(rippleRef.current, { scale: 1, duration: 0.5, ease: "power3.out" });

    gsap.to(textDarkRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(textLightRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(".btn-arrow", { x: 4, duration: 0.3, ease: "power2.out" });
  });

  const handleRippleLeave = contextSafe((e) => {
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(rippleRef.current, { scale: 0, x, y, duration: 0.5, ease: "power3.out" });

    gsap.to(textDarkRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(textLightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(".btn-arrow", { x: 0, duration: 0.3, ease: "power2.out" });
  });

  return (
    <main 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onClick={handleScreenClick}
      className="w-full h-[100dvh] bg-[#f8f8f8] text-[#1a1a1a] flex flex-col items-center justify-center relative overflow-hidden perspective-[1000px] cursor-crosshair"
    >
      {/* MASSIVE PARALLAX BACKGROUND */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <div className="parallax-layer-2 absolute flex gap-4 lg:gap-12 text-[15rem] md:text-[25rem] lg:text-[35rem] head-font leading-none tracking-tighter opacity-[0.03] blur-md">
          <span>4</span><span>0</span><span>4</span>
        </div>
        <div className="parallax-layer-1 flex gap-4 lg:gap-12 text-[15rem] md:text-[25rem] lg:text-[35rem] head-font leading-none tracking-tighter opacity-5 transform-style-3d">
          <span className="char-404 inline-block origin-center">4</span>
          <span className="char-404 inline-block origin-center">0</span>
          <span className="char-404 inline-block origin-center">4</span>
        </div>
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="z-10 flex flex-col items-center text-center px-6 pointer-events-none">
        
        <h1 className="fade-in text-[0.65rem] font-bold tracking-[0.4em] uppercase opacity-50 mb-6">
          Fragmented Path
        </h1>
        <h2 className="fade-in head-font text-4xl md:text-5xl lg:text-6xl tracking-wide mb-8">
          This piece has <br className="hidden md:block" />
          shattered.
        </h2>
        <p className="fade-in text-sm font-light opacity-70 max-w-[400px] leading-relaxed mb-16">
          The link you followed is broken, or the page has been permanently removed from the collection.
        </p>

        {/* HYBRID MAGNETIC & RIPPLE CTA BUTTON */}
        <div className="no-smash fade-in p-8 -m-8 pointer-events-auto" onMouseMove={handleMagnetMove} onMouseLeave={handleMagnetLeave}>
          
          <Link 
            to="/" 
            ref={buttonRef}
            onMouseEnter={handleRippleEnter}
            onMouseLeave={handleRippleLeave}
            className="relative inline-flex items-center justify-center w-48 h-16 bg-transparent border border-[#1a1a1a] overflow-hidden"
          >
            {/* The Black Ripple Background */}
            <div 
              ref={rippleRef} 
              className="absolute bg-[#1a1a1a] rounded-full pointer-events-none z-0"
              style={{ width: '400px', height: '400px', top: '-200px', left: '-200px', transform: 'scale(0)' }}
            />

            {/* Dark Text (Visible initially) */}
            <span ref={textDarkRef} className="magnet-text absolute inset-0 z-10 flex items-center justify-center gap-3 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] pointer-events-none">
              Return Home
              <Icon icon="iconamoon:arrow-right-1" className="btn-arrow text-sm" />
            </span>

            {/* Light Text (Revealed on hover inside ripple) */}
            <span ref={textLightRef} className="magnet-text absolute inset-0 z-10 flex items-center justify-center gap-3 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white opacity-0 pointer-events-none">
              Return Home
              <Icon icon="iconamoon:arrow-right-1" className="btn-arrow text-sm" />
            </span>

            {/* Invisible structural placeholder */}
            <span className="invisible flex items-center justify-center gap-3 text-[0.65rem] font-bold tracking-[0.2em] uppercase">
              Return Home
              <Icon icon="iconamoon:arrow-right-1" className="text-sm" />
            </span>
          </Link>
        </div>

      </div>

      {/* INTERACTIVE HINT */}
      <div className="fade-in absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.55rem] font-bold tracking-[0.3em] uppercase opacity-30 pointer-events-none">
        ( Click anywhere to shatter )
      </div>
    </main>
  );
};

export default NotFound;