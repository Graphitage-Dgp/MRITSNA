import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// Custom helper to split text into individually animatable words
const SplitText = ({ children, className = "" }) => {
  if (typeof children !== "string") return <span className={className}>{children}</span>;
  
  return (
    <span className={`inline-block ${className}`}>
      {children.split(" ").map((word, index) => (
        // We add a right margin to replace the space character
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          {/* Removed opacity from will-change since we are no longer animating it */}
          <span className="reveal-word inline-block will-change-[transform,filter]">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

const Curation = () => {
  const sectionRef = useRef(null);

  useGSAP(() => {
    const words = gsap.utils.toArray(".reveal-word");
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP & TABLET ANIMATION
    // ==========================================
    mm.add("(min-width: 768px)", () => {
      
      // 1. Pure Optical Focus Reveal (Desktop Trigger)
      gsap.fromTo(words, 
        { 
          filter: "blur(12px)",
          scale: 0.95
        }, 
        { 
          filter: "blur(0px)",
          scale: 1,
          stagger: 0.15, 
          duration: 1, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 25%", // Desktop start point
            toggleActions: "play none none reverse",
          }
        }
      );

      // 2. Desktop Parallax Animation
      const parallaxElements = gsap.utils.toArray(".parallax-item");
      parallaxElements.forEach((el) => {
        const speed = parseFloat(el.dataset.speed);
        
        gsap.fromTo(el, 
          { y: () => window.innerHeight * speed * 0.2 }, 
          {
            y: () => -window.innerHeight * speed * 0.2, 
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.1,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    });

    // ==========================================
    // MOBILE ANIMATION
    // ==========================================
    mm.add("(max-width: 767px)", () => {
      
      // 1. Pure Optical Focus Reveal (Mobile Trigger)
      gsap.fromTo(words, 
        { 
          filter: "blur(12px)",
          scale: 0.95
        }, 
        { 
          filter: "blur(0px)",
          scale: 1,
          stagger: 0.15, 
          duration: 1, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 30%", // Adjusted for smaller vertical viewports
            toggleActions: "play none none reverse",
          }
        }
      );

      // 2. Mobile Parallax Animation
      const parallaxElements = gsap.utils.toArray(".parallax-item");
      parallaxElements.forEach((el) => {
        const speed = parseFloat(el.dataset.speed);
        
        gsap.fromTo(el, 
          { y: () => window.innerHeight * speed * 0.06 }, 
          {
            y: () => -window.innerHeight * speed * 0.06, 
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.1,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#f8f8f8] text-[#1a1a1a] pt-32 pb-10 relative overflow-hidden"
      id="curated-collection"
    >
      <div className="max-w-[1400px] mx-auto w-full relative px-6 lg:px-10">

        {/* --- MAIN TITLE --- */}
        <div 
          className="parallax-item relative md:absolute pt-10 md:pt-0 -top-14 md:-top-34 left-0 md:left-[5%] lg:left-[10%] z-30 mix-blend-difference text-[#f8f8f8] pointer-events-none -mb-32 md:mb-0"
          data-speed="1.5"
        >
          <span className="block text-[0.55rem] lg:text-[0.65rem] font-bold tracking-[0.3em] uppercase mb-4 md:ml-2">
            Curated Series
          </span>
          <h2 className="head-font text-6xl md:text-8xl lg:text-[8rem] leading-[0.85] tracking-tighter">
            {/* SplitText handles the blur reveal while the parent handles the parallax */}
            <SplitText>the art of</SplitText> <br />
            <SplitText>stillness</SplitText>
          </h2>
        </div>

        {/* --- IMAGE 1: TALL VESSEL --- */}
        <div 
          className="parallax-item w-[90%] md:w-[45%] lg:w-[35%] ml-auto md:ml-[15%] mt-0 md:mt-32 relative z-10"
          data-speed="0.2"
        >
          <div className="aspect-[4/5] overflow-hidden">
            <img 
              src="/curated1.webp" 
              alt="Tall Mritsna vessel"
              className="w-full h-full object-cover origin-center mix-blend-multiply"
            />
          </div>
        </div>

        {/* --- TEXT BLOCK 1: THE STORY --- */}
        <div 
          className="parallax-item w-[90%] md:w-[35%] lg:w-[25%] ml-[5%] md:ml-auto md:mr-[10%] mt-5 md:-mt-32 relative z-20"
          data-speed="1.5"
        >
           <h3 className="head-font text-2xl lg:text-3xl mb-4">
             Form & Function
           </h3>
           <p className="text-sm font-light leading-relaxed opacity-70">
             We believe that the objects we surround ourselves with shape our daily rituals. 
             This collection is an exploration of form and feeling—pieces designed not just 
             to be seen, but to be lived with, adding a quiet gravity to your space.
           </p>
        </div>

        {/* --- IMAGE 2: MACRO DETAIL --- */}
        <div 
          className="parallax-item w-[80%] md:w-[40%] lg:w-[30%] ml-auto mr-[5%] mt-10 md:mt-5 relative z-10"
          data-speed="1.8" 
        >
          <div className="aspect-square overflow-hidden shadow-sm">
            <img 
              src="/curated2.webp" 
              alt="Intricate glaze texture detail"
              className="w-full h-full object-cover origin-center mix-blend-multiply hover:scale-105 transition-transform duration-[2s] ease-out"
            />
          </div>
        </div>

        {/* --- IMAGE 3: WIDE STILL LIFE --- */}
        <div 
          className="parallax-item w-[95%] md:w-[60%] lg:w-[50%] ml-[2.5%] md:ml-[25%] mt-24 md:mt-40 relative z-0"
          data-speed="1.8" 
        >
          <div className="aspect-video overflow-hidden">
            <img 
              src="/curated3.webp" 
              alt="Mritsna Matsya teal wall plate paired with a smooth white plate to showcase textural contrast"
              className="w-full h-full object-cover origin-center mix-blend-multiply"
            />
          </div>
        </div>

        {/* --- TEXT BLOCK 2: CAPTION --- */}
        <div 
           className="parallax-item relative md:absolute mt-10 md:mt-0 md:bottom-0 left-[5%] md:left-[10%] z-20 w-[90%] md:w-[20%]"
           data-speed="3" 
        >
           <span className="block head-font lg:text-lg font-bold tracking-[0.1em] uppercase mb-3">
             Textural Duality
           </span>
           <p className="text-xs font-light leading-loose opacity-70">
             A striking dialogue between intricately sculpted motion and pure, unblemished stillness.
           </p>
        </div>

      </div>
    </section>
  );
};

export default Curation;