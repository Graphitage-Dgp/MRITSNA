import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

// --- Utility: Split Text for GSAP Animation ---
const SplitText = ({ children, className = "" }) => {
  if (typeof children !== "string") return <span className={className}>{children}</span>;
  return (
    <span className={`inline-block ${className}`}>
      {children.split(" ").map((word, index) => (
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          <span className="contact-title-word inline-block will-change-[transform,filter,opacity]">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

// --- Utility: Magnetic Link Component ---
const MagneticLink = ({ children, href, className = "" }) => {
  const linkRef = useRef(null);
  const textRef = useRef(null);
  
  const { contextSafe } = useGSAP();

  const handleMouseMove = contextSafe((e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = linkRef.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    
    gsap.to(textRef.current, { 
      x: x * 0.3, 
      y: y * 0.3, 
      duration: 1, 
      ease: "power3.out" 
    });
  });

  const handleMouseLeave = contextSafe(() => {
    gsap.to(textRef.current, { 
      x: 0, 
      y: 0, 
      duration: 1, 
      ease: "elastic.out(1, 0.3)" 
    });
  });

  return (
    <a 
      ref={linkRef}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block p-4 -m-4 ${className}`}
    >
      <span ref={textRef} className="inline-block pointer-events-none">
        {children}
      </span>
    </a>
  );
};

// --- Main Component ---
const Contact = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Hero Title Blur Reveal
    tl.fromTo(
      ".contact-title-word",
      { opacity: 0, y: 30, filter: "blur(12px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.08, ease: "power3.out" }
    );

    // 2. Distributed Column Details Reveal
    tl.fromTo(
      ".contact-detail-item",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" },
      "-=0.5"
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-32 lg:pt-48 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        
        {/* --- Hero Header --- */}
        <div className="w-full mb-20 lg:mb-32">
          <span className="contact-detail-item block text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
            Get in Touch
          </span>
          <h1 className="head-font text-6xl md:text-8xl lg:text-[9rem] leading-[0.9] tracking-tighter">
            <SplitText>What's Up?</SplitText>
          </h1>
        </div>

        {/* --- Distributed Layout (3 Columns across full width) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-12 w-full">
          
          {/* Section 1: Inquiries */}
          <div className="contact-detail-item flex flex-col">
            <h3 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40 mb-4">
              General Inquiries
            </h3>
            <MagneticLink href="mailto:hello@mritsna.com" className="head-font text-3xl lg:text-4xl hover:text-black/70 transition-colors">
              hello@mritsna.com
            </MagneticLink>

            <p className="head-font text-2xl lg:text-3xl hover:text-black/70 transition-colors mt-5">
              +91 7717799097
            </p>
          </div>

          {/* Section 2: Studio */}
          <div className="contact-detail-item flex flex-col">
            <h3 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40 mb-4">
              Studio & Showroom
            </h3>
            <p className="text-lg lg:text-xl leading-relaxed max-w-sm font-medium">
              Dhanbad<br />
              Jharkhand,<br />
              India 826004
            </p>
            <p className="text-sm text-black/60 mt-4">
              Visits by appointment only.
            </p>
          </div>

          {/* Section 3: Socials */}
          <div className="contact-detail-item flex flex-col">
            <h3 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40 mb-6">
              Socials
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <MagneticLink href="https://instagram.com" className="text-sm font-medium uppercase tracking-widest hover:text-black/60 transition-colors">
                  Instagram
                </MagneticLink>
              </li>
              <li>
                <MagneticLink href="https://facebook.com" className="text-sm font-medium uppercase tracking-widest hover:text-black/60 transition-colors">
                  Facebook
                </MagneticLink>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Contact;