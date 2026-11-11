import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navmenu from "./Navmenu";
import SearchOverlay from "./SearchOverlay";
import * as IntroContextModule from "../../context/IntroContext";
import { useSelector, useDispatch } from "react-redux";

import { setManualRegion, DEFAULT_INR_REGION } from "../../store/features/regionSlice";
import { openCartDrawer, fetchUserCart, hydrateGuestCartAPI } from "../../store/features/cartSlice";
import { fetchSingleProduct, fetchStoreProducts, fetchNewArrivals } from "../../store/features/productSlice";
import { userAxios } from "../../configs/axiosInstance";

gsap.registerPlugin(ScrollTrigger);

// Safely resolve IntroContext whether exported as default or named export
const IntroContext =
  IntroContextModule.IntroContext || IntroContextModule.default;

const Navbar = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  // --- THE ONLY SEARCH STATE IN NAVBAR ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  // Strictly fallback to INR (IN) if regionData is absent or not manually switched
  const regionData = useSelector((state) => state.region?.data) || DEFAULT_INR_REGION;
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isChangingRegion, setIsChangingRegion] = useState(false);

  const desktopRegionRef = useRef(null);
  const mobileRegionRef = useRef(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const introCtx = (IntroContext ? useContext(IntroContext) : null) || {};
  const introPlayed =
    introCtx.introPlayed ?? introCtx.introComplete ?? true;

  const [currentPath, setCurrentPath] = useState(location.pathname);

  const navbarRef = useRef(null);
  const navContainerRef = useRef(null);
  const underlineRef = useRef(null);
  const isHovering = useRef(false);
  const rightNavContainerRef = useRef(null);
  const rightUnderlineRef = useRef(null);
  const isRightHovering = useRef(false);

  const navigations = [
    { name: "shop", path: "/shop" },
    { name: "collection", path: "/collection" },
    { name: "about", path: "/about" },
    { name: "contact us", path: "/contact" },
  ];

  const serviceNavs = [
    { name: "account", path: "/account" },
    { name: "cart", path: "/cart" },
    { name: "wishlist", path: "/wishlist" },
  ];

  const availableRegions = [
    { code: "IN", label: "India", currency: "INR", symbol: "₹", rate: 1 },
    { code: "US", label: "USA", currency: "USD", symbol: "$", rate: 0.012 },
    { code: "GB", label: "UK", currency: "GBP", symbol: "£", rate: 0.0095 },
    { code: "FR", label: "France", currency: "EUR", symbol: "€", rate: 0.011 },
    { code: "DE", label: "Germany", currency: "EUR", symbol: "€", rate: 0.011 },
    { code: "IT", label: "Italy", currency: "EUR", symbol: "€", rate: 0.011 },
    { code: "ES", label: "Spain", currency: "EUR", symbol: "€", rate: 0.011 },
    { code: "AE", label: "UAE", currency: "AED", symbol: "د.إ", rate: 0.044 },
    { code: "AU", label: "Australia", currency: "AUD", symbol: "A$", rate: 0.018 },
    { code: "CA", label: "Canada", currency: "CAD", symbol: "C$", rate: 0.016 },
    { code: "SG", label: "Singapore", currency: "SGD", symbol: "S$", rate: 0.016 },
    { code: "SA", label: "Saudi Arabia", currency: "SAR", symbol: "ر.س", rate: 0.045 },
    { code: "JP", label: "Japan", currency: "JPY", symbol: "¥", rate: 1.85 },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        desktopRegionRef.current &&
        !desktopRegionRef.current.contains(event.target) &&
        mobileRegionRef.current &&
        !mobileRegionRef.current.contains(event.target)
      ) {
        setIsRegionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // P2: Foreign currency (USD $, etc.) ONLY triggers when the user explicitly clicks the currency dropdown
  const handleRegionChange = async (countryCode) => {
    const activeCode = regionData?.isManual ? regionData.countryCode : "IN";
    if (countryCode === activeCode) {
      setIsRegionDropdownOpen(false);
      return;
    }

    setIsChangingRegion(true);
    setIsRegionDropdownOpen(false);

    try {
      let resolvedRegion = null;

      if (countryCode === "IN") {
        resolvedRegion = {
          ...DEFAULT_INR_REGION,
          isManual: true,
        };
      } else {
        try {
          const response = await userAxios.get("/region/detect", {
            headers: {
              "x-user-region": countryCode,
              "x-region-manual": "true",
            },
          });
          resolvedRegion = {
            ...(response.data?.data || {}),
            isManual: true,
          };
        } catch {
          // Offline / static fallback for explicit manual selection
          const matched = availableRegions.find((r) => r.code === countryCode);
          resolvedRegion = matched
            ? {
                countryCode: matched.code,
                currencyCode: matched.currency,
                symbol: matched.symbol,
                rate: matched.rate,
                isManual: true,
              }
            : { ...DEFAULT_INR_REGION, isManual: true };
        }
      }

      dispatch(setManualRegion(resolvedRegion));

      // Re-fetch active views seamlessly without a jarring full-page reload
      if (isAuthenticated) {
        dispatch(fetchUserCart());
      } else {
        dispatch(hydrateGuestCartAPI());
      }

      if (location.pathname.startsWith("/product/")) {
        const slug = location.pathname.split("/product/")[1]?.split("?")[0];
        if (slug) dispatch(fetchSingleProduct(slug));
      } else if (location.pathname === "/shop") {
        dispatch(fetchStoreProducts());
      } else if (location.pathname === "/") {
        dispatch(fetchNewArrivals());
      }
    } catch (error) {
      console.error("Failed to change region", error);
    } finally {
      setIsChangingRegion(false);
    }
  };

  const scrollBlendRoutes = ["/"];
  const isScrollBlendRoute = scrollBlendRoutes.includes(location.pathname);

  if (location.pathname !== currentPath) {
    setCurrentPath(location.pathname);
    setIsScrolled(false);
    setIsOpen(false);
    setIsRegionDropdownOpen(false);
    setIsSearchOpen(false);
  }

  const isLightMode = isOpen;

  const { contextSafe } = useGSAP(
    () => {
      const entryDelay = !introPlayed && location.pathname === "/" ? 0.2 : 0.2;

      gsap.set(navbarRef.current, { yPercent: -30, opacity: 0 });
      gsap.to(navbarRef.current, {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        delay: entryDelay,
      });

      const existingTrigger = ScrollTrigger.getById("nav-blend");
      if (existingTrigger) {
        existingTrigger.kill();
      }

      ScrollTrigger.create({
        id: "nav-blend",
        start: () => (isScrollBlendRoute ? window.innerHeight * 0.08 : 20),
        onEnter: () => setIsScrolled(true),
        onLeaveBack: () => setIsScrolled(false),
        invalidateOnRefresh: true,
      });
    },
    { scope: navbarRef, dependencies: [location.pathname] }
  );

  const handleItemEnter = contextSafe((e) => {
    const item = e.currentTarget;
    const targetLeft = item.offsetLeft;
    const targetWidth = item.offsetWidth;

    if (!isHovering.current) {
      gsap.set(underlineRef.current, { left: 0, width: 0 });
      isHovering.current = true;
    }

    gsap.to(underlineRef.current, {
      left: targetLeft,
      width: targetWidth,
      opacity: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  const handleNavLeave = contextSafe(() => {
    isHovering.current = false;
    const containerWidth = navContainerRef.current.offsetWidth;

    gsap.to(underlineRef.current, {
      left: containerWidth,
      width: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  const handleRightItemEnter = contextSafe((e) => {
    const item = e.currentTarget;
    const containerWidth = rightNavContainerRef.current.offsetWidth;
    const targetLeft = item.offsetLeft;
    const targetWidth = item.offsetWidth;
    const targetRight = containerWidth - (targetLeft + targetWidth);

    if (!isRightHovering.current) {
      gsap.set(rightUnderlineRef.current, { right: 0, left: "auto", width: 0 });
      isRightHovering.current = true;
    }

    gsap.to(rightUnderlineRef.current, {
      right: targetRight,
      width: targetWidth,
      opacity: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  const handleRightNavLeave = contextSafe(() => {
    isRightHovering.current = false;
    const containerWidth = rightNavContainerRef.current.offsetWidth;

    gsap.to(rightUnderlineRef.current, {
      right: containerWidth,
      width: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  // Strictly default to IN (INR ₹) unless regionData has been manually switched
  const effectiveCountryCode = regionData?.isManual ? regionData.countryCode : "IN";
  const currentRegionDetails =
    availableRegions.find((r) => r.code === effectiveCountryCode) ||
    availableRegions[0];

  return (
    <>
      <div
        key={location.pathname}
        ref={navbarRef}
        className={`navbar w-full fixed top-0 left-0 z-[99999] transition-all duration-500 h-[75px]
          ${
            isScrolled && !isOpen
              ? "bg-[#f8f8f8]/80 backdrop-blur-md shadow-[0_4px_24px_rgba(26,26,26,0.06)] border-b border-black/[0.05]"
              : "bg-transparent shadow-none border-b border-transparent"
          }
        `}
      >
        <div
          className={`w-full py-4 px-6 lg:px-10 2xl:px-14 flex justify-between items-center transition-colors duration-500
            ${isLightMode ? "text-[#f8f8f8]" : "text-[#1a1a1a]"}
          `}
          id="navbar-content"
        >
          {/* LEFT NAV */}
          <nav className="w-1/3 hidden lg:block" id="desktop-first-nav">
            <ul
              ref={navContainerRef}
              onMouseLeave={handleNavLeave}
              className="nav-list flex items-center gap-10 uppercase text-[0.7rem] tracking-wider relative"
            >
              <li
                ref={underlineRef}
                className={`absolute -bottom-1 h-px opacity-0 pointer-events-none transition-colors duration-500
                  ${isLightMode ? "bg-[#f8f8f8]" : "bg-[#1a1a1a]"}
                `}
                style={{ left: 0, width: 0 }}
              />

              {navigations.map(({ name, path }) => (
                <li
                  key={`${name}-desk-nav`}
                  className="nav-list-item"
                  onMouseEnter={handleItemEnter}
                >
                  <Link to={path} className="py-1 inline-block">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* LOGO */}
          <div className="logo lg:w-1/3 flex justify-start lg:justify-center items-center">
            <Link to="/" onClick={() => setIsOpen(false)}>
              <img
                className="w-22 lg:w-36 transition-opacity duration-500"
                src={isLightMode ? "/logo_white.svg" : "/logo_black.svg"}
                alt="Mritsna Logo"
              />
            </Link>
          </div>

          {/* RIGHT NAV (DESKTOP) */}
          <nav className="w-1/3 hidden lg:block" id="desktop-second-nav">
            <ul
              ref={rightNavContainerRef}
              onMouseLeave={handleRightNavLeave}
              className="nav-list flex justify-end items-center gap-10 uppercase text-[0.7rem] tracking-wider relative"
            >
              <li
                ref={rightUnderlineRef}
                className={`absolute -bottom-1 h-px opacity-0 pointer-events-none transition-colors duration-500
                  ${isLightMode ? "bg-[#f8f8f8]" : "bg-[#1a1a1a]"}
                `}
                style={{ right: 0, width: 0 }}
              />

              {/* REGION DROPDOWN */}
              <li
                ref={desktopRegionRef}
                className="nav-list-item relative"
                onMouseEnter={handleRightItemEnter}
              >
                <span
                  className="cursor-pointer py-1 flex items-center gap-1.5 select-none"
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                >
                  <img
                    src={`https://flagcdn.com/w20/${currentRegionDetails.code.toLowerCase()}.png`}
                    alt={currentRegionDetails.code}
                    className="w-[18px] object-contain rounded-sm"
                  />
                  {isChangingRegion ? "..." : `${currentRegionDetails.code} (${currentRegionDetails.symbol})`}
                  <Icon
                    icon="lucide:chevron-down"
                    className={`w-3 h-3 opacity-70 transition-transform duration-300 ${
                      isRegionDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>

                <div
                  className={`absolute top-full right-0 mt-[1.2rem] w-48 max-h-[300px] overflow-y-auto overscroll-none pointer-events-auto custom-scrollbar flex flex-col shadow-xl border transition-all duration-300 origin-top
                    ${
                      isRegionDropdownOpen
                        ? "opacity-100 scale-y-100"
                        : "opacity-0 scale-y-0 pointer-events-none"
                    }
                    bg-white border-black/5 text-black
                  `}
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {availableRegions.map((r) => (
                    <button
                      type="button"
                      key={r.code}
                      onClick={() => handleRegionChange(r.code)}
                      className={`text-left px-4 py-3 text-[0.65rem] uppercase tracking-wider transition-colors flex items-center gap-3 hover:bg-gray-100
                        ${
                          effectiveCountryCode === r.code
                            ? "font-bold opacity-40 cursor-default"
                            : ""
                        }
                      `}
                    >
                      <img
                        src={`https://flagcdn.com/w20/${r.code.toLowerCase()}.png`}
                        alt={r.code}
                        className="w-[18px] object-contain rounded-sm shadow-sm"
                      />
                      <span>
                        {r.label} ({r.currency} {r.symbol})
                      </span>
                    </button>
                  ))}
                </div>
              </li>

              {/* DESKTOP SEARCH TRIGGER */}
              <li
                className="nav-list-item"
                onMouseEnter={handleRightItemEnter}
              >
                <span
                  className="cursor-pointer py-1 inline-block"
                  onClick={() => setIsSearchOpen(true)}
                >
                  search
                </span>
              </li>

              {serviceNavs.map(({ name, path }) => (
                <li
                  key={`${name}-desk-nav`}
                  className="nav-list-item"
                  onMouseEnter={handleRightItemEnter}
                >
                  {name === "cart" ? (
                    <button
                      type="button"
                      onClick={() => dispatch(openCartDrawer())}
                      className="py-1 inline-block uppercase cursor-pointer"
                    >
                      {name}
                      <span className="ml-1 tracking-widest font-medium opacity-80">
                        [{cartCount > 0 ? cartCount : "0"}]
                      </span>
                    </button>
                  ) : (
                    <Link className="py-1 inline-block" to={path}>
                      {name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* MOBILE NAV ACTIONS */}
          <div className="flex items-center gap-5 lg:hidden">
            <div className="relative" ref={mobileRegionRef}>
              <div
                className="cursor-pointer text-[0.65rem] font-bold tracking-wider flex items-center gap-1.5 uppercase select-none"
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              >
                <img
                  src={`https://flagcdn.com/w20/${currentRegionDetails.code.toLowerCase()}.png`}
                  alt={currentRegionDetails.code}
                  className="w-[18px] object-contain rounded-sm"
                />
                {isChangingRegion ? "..." : `${currentRegionDetails.code} (${currentRegionDetails.symbol})`}
                <Icon
                  icon="lucide:chevron-down"
                  className={`w-3 h-3 opacity-70 transition-transform duration-300 ${
                    isRegionDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {isRegionDropdownOpen && (
                <div
                  className="absolute top-full -right-4 mt-6 w-48 max-h-[300px] overflow-y-auto overscroll-none pointer-events-auto custom-scrollbar flex flex-col shadow-2xl border bg-white border-black/5 text-black"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {availableRegions.map((r) => (
                    <button
                      type="button"
                      key={r.code}
                      onClick={() => {
                        handleRegionChange(r.code);
                        setIsRegionDropdownOpen(false);
                      }}
                      className={`text-left px-4 py-3 text-[0.65rem] uppercase tracking-wider transition-colors flex items-center gap-3 hover:bg-gray-100
                        ${
                          effectiveCountryCode === r.code
                            ? "font-bold opacity-40 cursor-default"
                            : ""
                        }
                      `}
                    >
                      <img
                        src={`https://flagcdn.com/w20/${r.code.toLowerCase()}.png`}
                        alt={r.code}
                        className="w-[18px] object-contain rounded-sm shadow-sm"
                      />
                      <span>
                        {r.label} ({r.currency} {r.symbol})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MOBILE SEARCH TRIGGER */}
            <div
              className="cursor-pointer text-xl flex items-center justify-center hover:opacity-70 transition-opacity duration-300"
              onClick={() => {
                setIsOpen(false);
                setIsSearchOpen(true);
              }}
            >
              <Icon icon="iconamoon:search" />
            </div>

            {/* MOBILE HAMBURGER ICON */}
            <div
              onClick={() => setIsOpen((prev) => !prev)}
              className="nav-icon w-6 h-2 flex flex-col justify-between cursor-pointer"
            >
              <span
                className={`block h-[1.5px] transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] 
                  ${isLightMode ? "bg-[#f8f8f8]" : "bg-[#1a1a1a]"} 
                  ${isOpen ? "rotate-45 translate-y-[3px]" : ""}
                `}
              />
              <span
                className={`block h-[1.5px] transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] 
                  ${isLightMode ? "bg-[#f8f8f8]" : "bg-[#1a1a1a]"} 
                  ${isOpen ? "-rotate-45 -translate-y-[3px]" : ""}
                `}
              />
            </div>
          </div>
        </div>
      </div>

      <Navmenu isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* SEARCH OVERLAY COMPONENT */}
      <SearchOverlay
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
      />
    </>
  );
};

export default Navbar;