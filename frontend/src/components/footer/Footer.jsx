import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef(null);

  useGSAP(
    () => {
      // 1. The "Curtain Reveal" Parallax Effect
      gsap.fromTo(
        ".footer-inner",
        { yPercent: -40 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );

      // 2. The Link Reveal (Fades in slightly as the curtain rises)
      gsap.fromTo(
        ".footer-fade",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: footerRef },
  );

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const shopCategories = ["Vase", "Decor", "Tumbler"];

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-[#0a0a0a] text-[#f8f8f8] overflow-hidden z-0"
    >
      <div className="footer-inner relative w-full pt-40 lg:pt-32 pb-6 px-6 lg:px-12 flex flex-col justify-between min-h-screen lg:min-h-[80vh]">
        <div className="max-w-[1400px] mx-auto w-full flex-grow">
          {/* TOP HALF: The Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8 mb-20 lg:mb-32">
            
            {/* Column 1: Explore */}
            <div className="flex flex-col">
              <span className="footer-fade block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
                Explore
              </span>
              <ul className="flex flex-col gap-3">
                <li className="footer-fade">
                  <Link
                    to="/"
                    className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                  >
                    Home
                  </Link>
                </li>
                <li className="footer-fade">
                  <Link
                    to="/shop"
                    className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                  >
                    Shop
                  </Link>
                </li>
                <li className="footer-fade">
                  <Link
                    to="/collection"
                    className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                  >
                    Curated Sets
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Categories */}
            <div className="flex flex-col">
              <span className="footer-fade block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
                Categories
              </span>
              <ul className="flex flex-col gap-3">
                {shopCategories.map((cat) => (
                  <li key={cat} className="footer-fade">
                    <Link
                      to={`/shop?category=${encodeURIComponent(cat)}`}
                      className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className="flex flex-col">
              <span className="footer-fade block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
                Support
              </span>
              <ul className="flex flex-col gap-3">
                <li className="footer-fade">
                  <Link
                    to="/contact"
                    className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                  >
                    Contact
                  </Link>
                </li>
                <li className="footer-fade">
                  <Link
                    to="/shipping-returns"
                    className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                  >
                    Shipping & Returns
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Socials & Top Button */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="footer-fade block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
                  Social
                </span>
                <ul className="flex flex-col gap-3">
                  <li className="footer-fade">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                    >
                      Instagram
                    </a>
                  </li>
                  <li className="footer-fade">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-light tracking-widest uppercase hover:opacity-50 transition-opacity duration-300"
                    >
                      Facebook
                    </a>
                  </li>
                </ul>
              </div>

              <div className="footer-fade mt-12 md:mt-0">
                <button
                  onClick={scrollToTop}
                  className="text-xs font-bold tracking-[0.2em] uppercase pb-1 border-b border-[#f8f8f8]/30 hover:border-[#f8f8f8] transition-colors duration-300"
                >
                  Back to top ↑
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM HALF: The Anchor Typography & Legal */}
        <div className="w-full flex flex-col items-center mt-auto relative">
          {/* The Edge-to-Edge Brand Name */}
          <div className="w-full overflow-hidden flex justify-center pointer-events-none select-none">
            <Link to="/">
              <img
                className="w-[80vw] lg:w-[70vw]"
                src="/logo_white.svg"
                alt="Mritsna Logo"
              />
            </Link>
          </div>

          {/* Copyright & Legal Bar */}
          <div className="w-full max-w-[1400px] flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-[#f8f8f8]/10 gap-4">
            <span className="footer-fade text-[0.6rem] font-light tracking-[0.2em] uppercase opacity-50">
              © {new Date().getFullYear()} Mritsna. All rights reserved.
            </span>

            <div className="flex gap-6">
              <Link
                to="/privacy"
                className="footer-fade text-[0.6rem] font-light tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="footer-fade text-[0.6rem] font-light tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;