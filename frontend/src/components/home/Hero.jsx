// frontend/src/components/home/Hero.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as IntroContextModule from "../../context/IntroContext";

gsap.registerPlugin(ScrollTrigger);

const IntroContext =
  IntroContextModule.IntroContext || IntroContextModule.default;

const Hero = () => {
  const introCtx = (IntroContext ? useContext(IntroContext) : null) || {};
  const introComplete =
    introCtx.introComplete ?? introCtx.introPlayed ?? true;

  const [revealed, setRevealed] = useState(false);
  const heroSectionRef = useRef(null);
  const parallaxBgRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRevealed(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [introComplete]);

  // Smooth GSAP ScrollTrigger Parallax for Background Image
  useGSAP(
    () => {
      if (!parallaxBgRef.current || !heroSectionRef.current) return;

      gsap.fromTo(
        parallaxBgRef.current,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    { scope: heroSectionRef }
  );

  const featuredPiece = {
    tag: "Exclusive of this month",
    name: "The Patina Gourd Vase",
    image: "/hero_prod.webp",
    link: "/shop",
  };

  return (
    <section
      ref={heroSectionRef}
      className="relative w-full h-screen min-h-[700px] bg-[#EFECE6] text-[#1a1a1a] overflow-hidden select-none"
    >
      {/* =========================================================
          PARALLAX BACKGROUND IMAGE (Shared across Mobile & Desktop)
         ========================================================= */}
      <div
        ref={parallaxBgRef}
        className="pointer-events-none absolute -top-[12%] left-0 w-full h-[124%] will-change-transform"
      >
        <img
          src="/hero.webp"
          alt="Mritsna handmade studio ceramics styled on a floating fluted oak console"
          fetchPriority="high"
          decoding="async"
          className={`w-full h-full object-cover object-[52%_center] lg:object-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            revealed ? "scale-100" : "scale-[1.06]"
          }`}
        />
      </div>

      {/* Ambient Top & Bottom Gradients for Readability Over Background Image */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#EFECE6]/85 via-[#EFECE6]/35 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#E5DEC9]/90 via-[#E5DEC9]/40 to-transparent"
        aria-hidden="true"
      />

      {/* =========================================================
          CONTENT OVERLAY (Padding: px-6 lg:px-10 2xl:px-14)
         ========================================================= */}
      <div className="relative z-10 w-full h-full px-6 lg:px-10 2xl:px-14 pt-24 sm:pt-28 lg:pt-28 2xl:pt-32 pb-6 sm:pb-8 lg:pb-10 2xl:pb-12 flex flex-col justify-between">
        
        {/* ================= TOP ROW: Headings (Using head-font & Larger on Mobile) ================= */}
        <div className="w-full flex flex-col lg:flex-row items-start justify-between gap-1.5 sm:gap-2 lg:gap-8">
          {/* 1st Half of Heading (Top Left) */}
          <div
            className={`transition-all duration-1000 delay-100 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h1 className="head-font font-light text-[#1a1a1a] text-[2.5rem] sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-[1.05] tracking-tight">
              Handmade Studio <br className="hidden sm:block" />
              Ceramics.
            </h1>
          </div>

          {/* 2nd Half of Heading (Top Right on Desktop, Stacked on Mobile) */}
          <div
            className={`lg:text-right transition-all duration-1000 delay-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <p className="head-font font-light text-[#1a1a1a] text-[2rem] sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-[1.06] tracking-tight">
              Crafted for{" "}
              <br className="hidden lg:block" />
              <span className="italic font-normal">modern living.</span>
            </p>
          </div>
        </div>

        {/* ================= BOTTOM ROW: White CTA Card (Left) + Untinted Frosted Card (Right) ================= */}
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3.5 sm:gap-5 lg:gap-8 z-20">
          
          {/* Bottom-Left: White Card with Subcopy + Animated Explore CTA + Trust Bar */}
          <div
            className={`w-full lg:max-w-md xl:max-w-lg bg-white/85 backdrop-blur-md border border-black/10 p-4 sm:p-5 lg:p-6 shadow-[0_12px_40px_rgba(28,26,23,0.08)] transition-all duration-1000 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <p className="text-xs sm:text-sm md:text-base xl:text-lg leading-relaxed text-[#1a1a1a]/90 font-normal mb-3.5 sm:mb-5">
              Thoughtfully wheel-thrown pottery designed to bring warmth &amp;
              texture into your everyday spaces.
            </p>

            {/* Animated Explore CTA Button */}
            <Link
              to="/shop"
              className="group relative overflow-hidden inline-flex items-center justify-between w-full sm:w-auto gap-6 bg-[#1a1a1a] text-white px-6 sm:px-7 xl:px-8 py-3 sm:py-3.5 xl:py-4 text-[11px] sm:text-xs xl:text-sm tracking-[0.22em] uppercase font-medium border border-[#1a1a1a] transition-colors duration-500"
            >
              <span
                className="absolute inset-0 bg-[#EFECE6] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]"
                aria-hidden="true"
              />
              <span className="relative z-10 transition-colors duration-500 group-hover:text-[#1a1a1a]">
                Explore Collection
              </span>
              <span className="relative z-10 inline-block transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-[#1a1a1a]">
                &rarr;
              </span>
            </Link>

            {/* Trust Bar */}
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-black/10 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] sm:text-xs xl:text-sm tracking-[0.04em] text-[#1a1a1a]/80 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#1a1a1a] font-semibold">&#10003;</span>
                Breakage-Safe Transit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#1a1a1a] font-semibold">&#10003;</span>
                Studio Crafted
              </span>
            </div>
          </div>

          {/* Bottom-Right: Horizontal Frosted Glass Card (No Black Tint, With "Exclusive of this month" Heading) */}
          <Link
            to={featuredPiece.link}
            className={`group w-full lg:w-auto bg-white/35 backdrop-blur-xl border border-white/60 p-2.5 sm:p-3 xl:p-3.5 shadow-[0_16px_40px_rgba(28,26,23,0.1)] flex flex-row items-center gap-3.5 sm:gap-4 xl:gap-5 transition-all duration-500 hover:bg-white/50 ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {/* Image Container: Product image takes 100% of container */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 xl:w-24 xl:h-24 shrink-0 overflow-hidden">
              <img
                src={featuredPiece.image}
                alt={featuredPiece.name}
                loading="eager"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Right Info Stack: "Exclusive of this month" Heading + Product Name */}
            <div className="flex flex-col justify-center pr-2 sm:pr-4 xl:pr-5">
              <span className="text-[10px] sm:text-[11px] xl:text-xs tracking-[0.18em] uppercase font-semibold text-[#1a1a1a]/75 mb-1">
                {featuredPiece.tag}
              </span>
              <h2 className="head-font text-base sm:text-lg xl:text-xl 2xl:text-2xl text-[#1a1a1a] leading-snug font-normal">
                {featuredPiece.name}
              </h2>
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
};

export default Hero;