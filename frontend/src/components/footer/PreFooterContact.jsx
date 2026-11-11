import React, { useRef } from "react";
import { Link } from "react-router-dom";
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
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          <span className="reveal-word inline-block will-change-[transform,filter,opacity]">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

const PreFooterContact = () => {
  const sectionRef = useRef(null);

  useGSAP(() => {
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP ANIMATION
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      const tlDesk = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%", 
          toggleActions: "play none none reverse",
        }
      });

      tlDesk.fromTo(".reveal-word",
        { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
        { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 1, stagger: 0.05, ease: "power3.out" }
      )
      .fromTo(".fade-up-text",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" },
        "-=1.1"
      )
      .fromTo(".divider-line",
        { scaleX: 0 },
        { scaleX: 1, duration: 1, stagger: 0.15, ease: "power3.inOut", transformOrigin: "left center" },
        "-=1.1"
      )
      .fromTo(".contact-item",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" },
        "-=1.1"
      );
    });

    // ==========================================
    // MOBILE ANIMATION
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      const tlMob = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%", 
          toggleActions: "play none none reverse",
        }
      });

      tlMob.fromTo(".reveal-word",
        { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
        { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 1, stagger: 0.05, ease: "power3.out" }
      )
      .fromTo(".fade-up-text",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" },
        "-=0.7"
      )
      .fromTo(".divider-line",
        { scaleX: 0 },
        { scaleX: 1, duration: 1, stagger: 0.15, ease: "power3.inOut", transformOrigin: "left center" },
        "-=0.8"
      )
      .fromTo(".contact-item",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" },
        "-=0.8"
      );
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef} 
      className="w-full bg-dark text-[#f8f8f8] py-24 lg:py-32 relative z-10 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-10">
          
          {/* ========================================== */}
          {/* LEFT SIDE: The Welcome Message             */}
          {/* ========================================== */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <span className="fade-up-text block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-8">
                Client Care
              </span>
              
              <h2 className="head-font text-5xl md:text-7xl lg:text-[6rem] tracking-tighter lowercase leading-[0.9] mb-10 max-w-xl">
                <SplitText>we are here to help you.</SplitText>
              </h2>
            </div>
            
            <p className="fade-up-text text-sm md:text-base font-light opacity-70 max-w-md leading-relaxed">
              Whether you are inquiring about international shipping, seeking care instructions for your stoneware, or looking for styling advice, our studio team is here to assist.
            </p>
          </div>

          {/* ========================================== */}
          {/* RIGHT SIDE: The Utility Links              */}
          {/* ========================================== */}
          <div className="lg:col-span-5 lg:col-start-8 flex flex-col mt-10 lg:mt-0">
            
            {/* Contact Block 1: General Inquiries */}
            <div className="relative w-full pt-8 pb-8 group">
              <div className="divider-line absolute top-0 left-0 w-full h-[1px] bg-[#f8f8f8]/20" />
              
              <a 
                href="mailto:hello@mritsna.com" 
                className="contact-item flex items-center justify-between w-full outline-none"
              >
                <div>
                  <span className="block text-[0.6rem] font-light tracking-[0.2em] uppercase opacity-50 mb-2">
                    General Inquiries
                  </span>
                  <span className="block text-xl md:text-2xl font-light tracking-wide group-hover:opacity-70 transition-opacity duration-300">
                    hello@mritsna.com
                  </span>
                </div>
                <div className="text-xl transform group-hover:translate-x-2 transition-transform duration-300 opacity-50 group-hover:opacity-100">
                  →
                </div>
              </a>
            </div>

            {/* Contact Block 2: Wholesale & Trade */}
            <div className="relative w-full pt-8 pb-8 group">
              <div className="divider-line absolute top-0 left-0 w-full h-[1px] bg-[#f8f8f8]/20" />
              
              <Link 
                to="/contact" 
                className="contact-item flex items-center justify-between w-full outline-none"
              >
                <div>
                  <span className="block text-[0.6rem] font-light tracking-[0.2em] uppercase opacity-50 mb-2">
                    Partnerships
                  </span>
                  <span className="block text-xl md:text-2xl font-light tracking-wide group-hover:opacity-70 transition-opacity duration-300">
                    Wholesale & Trade
                  </span>
                </div>
                <div className="text-xl transform group-hover:translate-x-2 transition-transform duration-300 opacity-50 group-hover:opacity-100">
                  →
                </div>
              </Link>
            </div>

            {/* Contact Block 3: Order Tracking */}
            <div className="relative w-full pt-8 pb-8 group">
              <div className="divider-line absolute top-0 left-0 w-full h-[1px] bg-[#f8f8f8]/20" />
              <div className="divider-line absolute bottom-0 left-0 w-full h-[1px] bg-[#f8f8f8]/20" />
              
              <Link 
                to="/track-order" 
                className="contact-item flex items-center justify-between w-full outline-none"
              >
                <div>
                  <span className="block text-[0.6rem] font-light tracking-[0.2em] uppercase opacity-50 mb-2">
                    Self-Service
                  </span>
                  <span className="block text-xl md:text-2xl font-light tracking-wide group-hover:opacity-70 transition-opacity duration-300">
                    Track Your Order
                  </span>
                </div>
                <div className="text-xl transform group-hover:translate-x-2 transition-transform duration-300 opacity-50 group-hover:opacity-100">
                  →
                </div>
              </Link>
            </div>

            {/* Physical Location Detail */}
            <div className="contact-item pt-10">
              <span className="block text-[0.6rem] font-light tracking-[0.2em] uppercase opacity-50 mb-2">
                Location
              </span>
              <p className="text-sm font-light opacity-70 leading-relaxed max-w-xs">
                Available by appointment only.<br />
                Dhanbad, Jharkhand, India - 826004
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default PreFooterContact;