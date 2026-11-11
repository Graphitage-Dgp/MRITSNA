import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const Origins = () => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const textContainerRef = useRef(null);
  
  // Separate refs for sequential animation
  const headingRefs = useRef([]);
  const bodyRefs = useRef([]);

  const addToHeadings = (el) => {
    if (el && !headingRefs.current.includes(el)) {
      headingRefs.current.push(el);
    }
  };

  const addToBody = (el) => {
    if (el && !bodyRefs.current.includes(el)) {
      bodyRefs.current.push(el);
    }
  };

  useGSAP(() => {
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP ANIMATION (Screens 1024px and wider)
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      
      // 1. Desktop Image Parallax
      gsap.fromTo(
        imageRef.current,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true, 
          },
        }
      );

      // 2. Desktop Typography Sequence
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: textContainerRef.current,
          start: "top 75%", // Triggers when text container is 75% down the screen
          toggleActions: "play none none reverse",
        }
      });

      tl.fromTo(headingRefs.current,
        { opacity: 0, y: 30, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, stagger: 0.2, ease: "power3.out" }
      )
      .fromTo(bodyRefs.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.2, ease: "power2.out" },
        "<0.4" 
      );
    });

    // ==========================================
    // MOBILE ANIMATION (Screens under 1024px)
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      
      // 1. Mobile Image Parallax (Slightly softer due to smaller image height)
      gsap.fromTo(
        imageRef.current,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true, 
          },
        }
      );

      // 2. Mobile Typography Sequence
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: textContainerRef.current,
          start: "top 60%", // Triggers slightly later because the text stacks below the image
          toggleActions: "play none none reverse",
        }
      });

      tl.fromTo(headingRefs.current,
        { opacity: 0, y: 30, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, stagger: 0.15, ease: "power3.out" }
      )
      .fromTo(bodyRefs.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1.0, stagger: 0.15, ease: "power2.out" },
        "<0.3" 
      );
    });

    return () => mm.revert(); // Clean up on unmount
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="w-full flex flex-col lg:flex-row bg-[#f8f8f8] text-[#1a1a1a] mt-20 lg:mt-40"
      id="origins-story"
    >
      {/* Left Side: Massive Image */}
      <div className="w-full lg:w-1/2 h-[60vh] lg:h-screen overflow-hidden relative flex items-center justify-center">
        <img
          ref={imageRef}
          src="/pottery_bw.webp" 
          alt="The crafting process"
          className="w-full h-[120%] object-cover absolute top-0 left-0"
        />
      </div>

      {/* Right Side: Editorial Typography & Negative Space */}
      <div 
        ref={textContainerRef}
        className="w-full lg:w-1/2 flex flex-col justify-center items-start p-6 py-14 lg:p-24 xl:p-32"
      >
        <span 
          ref={addToHeadings}
          className="text-[0.6rem] lg:text-xs font-bold tracking-[0.2em] uppercase mb-8 lg:mb-12 opacity-0"
        >
          The Process
        </span>
        
        <h2 
          ref={addToHeadings}
          className="head-font text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight leading-[1.1] mb-8 lg:mb-10 opacity-0"
        >
          Shaped by time. <br />
          Refined by human hands.
        </h2>
        
        <p 
          ref={addToBody}
          className="text-sm lg:text-base leading-relaxed max-w-md mb-12 font-normal opacity-0"
        >
          Every piece of Mritsna pottery begins as raw, untamed earth. We embrace the 
          imperfections of the wheel and the unpredictability of the kiln, ensuring that 
          no two pieces are ever exactly alike. It is not just homeware; it is a quiet 
          celebration of slowness.
        </p>

        {/* Custom Animated Link */}
        <div ref={addToBody} className="opacity-0">
          <Link 
            to="/about"
            className="group relative inline-flex items-center gap-3 text-xs lg:text-sm font-bold tracking-[0.2em] uppercase pb-2"
          >
            <span>Read our story</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#1a1a1a] transition-all duration-500 ease-out group-hover:w-full" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Origins;