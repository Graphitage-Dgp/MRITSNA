import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

// Custom helper to split text into individually animatable words
const SplitText = ({ children, className }) => {
  if (typeof children !== "string") return <span className={className}>{children}</span>;
  
  return (
    <span className={`inline-block ${className}`}>
      {children.split(" ").map((word, index) => (
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          <span className="reveal-word inline-block will-change-[transform,filter,opacity]">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

const BespokeRegistry = () => {
  const sectionRef = useRef(null);

  useGSAP(() => {
    const words = gsap.utils.toArray(".reveal-word");
    const studioImg = sectionRef.current.querySelector(".studio-img");
    const studioText = gsap.utils.toArray(".studio-reveal");

    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP ANIMATION
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",       
          end: "center center",   
          scrub: 1, 
        }
      });

      tl.fromTo(words, 
        { y: 40, opacity: 0, filter: "blur(12px)", scale: 0.95 }, 
        { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, stagger: 0.1, ease: "power2.out" }, 
        0
      )
      .fromTo(studioImg,
        { scale: 1.1, filter: "blur(10px)", opacity: 0 },
        { scale: 1, filter: "blur(0px)", opacity: 1, ease: "power2.out" },
        0.1
      )
      .fromTo(studioText,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, ease: "power2.out" },
        0.2
      );
    });

    // ==========================================
    // MOBILE ANIMATION
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 100%",      
          end: "bottom 90%",      
          scrub: 1,
        }
      });

      tl.fromTo(words, 
        { y: 40, opacity: 0, filter: "blur(12px)", scale: 0.95 }, 
        { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, stagger: 0.1, ease: "power2.out" }, 
        0
      )
      .fromTo(studioImg,
        { scale: 1.1, filter: "blur(10px)", opacity: 0 },
        { scale: 1, filter: "blur(0px)", opacity: 1, ease: "power2.out" },
        0.4
      )
      .fromTo(studioText,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, ease: "power2.out" },
        0.2
      );
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-[#f4f3f0] text-[#1a1a1a] py-32 lg:py-48 relative z-20 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-10">
          
          {/* ========================================== */}
          {/* LEFT SIDE: Account Creation CTA            */}
          {/* ========================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pr-20">
            <span className="studio-reveal block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-8">
              Membership
            </span>
            
            <h2 className="head-font text-6xl md:text-8xl lg:text-[7rem] tracking-tighter lowercase leading-[0.9] mb-12">
              <SplitText>join the inner circle.</SplitText>
            </h2>
            
            <p className="studio-reveal text-sm md:text-base font-light opacity-80 max-w-md leading-relaxed mb-12">
              Create a Mritsna account to curate your personal wishlist, expedite checkout, and receive priority access to our limited-run ceramic releases and private studio collections.
            </p>

            <div className="studio-reveal">
              <Link 
                to="/account/signup"
                className="inline-flex items-center justify-center bg-[#1a1a1a] text-white px-10 py-5 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-[#1a1a1a]/80 transition-colors w-full sm:w-auto"
              >
                Create an Account
              </Link>
            </div>
          </div>

          {/* ========================================== */}
          {/* RIGHT SIDE: The Studio Aesthetic           */}
          {/* ========================================== */}
          <div className="lg:col-span-5 flex flex-col mt-10 lg:mt-0">
            <div className="w-full aspect-[4/5] overflow-hidden mb-8 relative group">
              <img 
                src="/bespoke.jpg" 
                alt="Ceramist working on raw clay"
                className="studio-img w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              />
            </div>

            <div className="flex flex-col">
              <span className="studio-reveal block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-3">
                The Studio
              </span>
              <h3 className="studio-reveal head-font text-4xl tracking-tighter lowercase">
                behind the craft
              </h3>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BespokeRegistry;