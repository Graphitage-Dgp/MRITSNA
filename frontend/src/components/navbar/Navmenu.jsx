import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useSelector } from "react-redux"; // <-- 1. Import Redux Hook

const Navmenu = ({ isOpen, setIsOpen }) => {
  // <-- 2. Read directly from the Redux store
  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const menuRef = useRef(null);
  const tl = useRef(null);
  const linkRefs = useRef([]);

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

  const addToRefs = (el) => {
    if (el && !linkRefs.current.includes(el)) {
      linkRefs.current.push(el);
    }
  };

  useGSAP(
    () => {
      gsap.set(menuRef.current, { yPercent: -100 });

      tl.current = gsap
        .timeline({ paused: true })
        .to(menuRef.current, {
          yPercent: 0,
          duration: 0.8,
          ease: "power4.inOut",
        })
        .fromTo(
          linkRefs.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.05,
            ease: "power3.out",
          },
          "-=0.4", 
        );
    },
    { scope: menuRef },
  );

  useGSAP(() => {
    if (tl.current) {
      if (isOpen) {
        tl.current.play();
      } else {
        tl.current.reverse();
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div
      ref={menuRef}
      className="fixed top-0 left-0 w-full h-screen bg-dark text-[#f5f5f5] z-[99998] flex flex-col px-6 py-3 lg:hidden"
    >
      {/* <div className="w-full flex justify-between items-center">
        <div className="logo w-20 lg:w-36 flex justify-center items-center">
          <Link to="/" onClick={handleClose}>
            <img className="w-full" src="/logo_white.svg" alt="Mritsna Logo" />
          </Link>
        </div>

        <div
          onClick={handleClose}
          className="w-7 h-7 flex flex-col justify-center items-center cursor-pointer group"
        >
          <span className="block w-6 h-[1.5px] bg-[#f5f5f5] rotate-45 translate-y-[1px] transition-transform duration-300 group-hover:rotate-180" />
          <span className="block w-6 h-[1.5px] bg-[#f5f5f5] -rotate-45 -translate-y-[0.5px] transition-transform duration-300 group-hover:-rotate-180" />
        </div>
      </div> */}

      <div className="flex-1 flex flex-col justify-center mt-10">
        <ul className="flex flex-col gap-6 lg:gap-10">
          {navigations.map(({ name, path }, index) => (
            <li
              key={`mobile-nav-${index}`}
              className="overflow-hidden"
              ref={addToRefs}
            >
              <Link
                to={path}
                onClick={handleClose}
                className="inline-block text-4xl lg:text-6xl uppercase tracking-widest font-light hover:text-[#a8a8a8] transition-colors duration-300"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16 border-t border-[#333333] pt-8" ref={addToRefs}>
          <ul className="flex flex-col gap-4">
            {serviceNavs.map(({ name, path }, index) => (
              <li key={`mobile-service-${index}`}>
                <Link
                  to={path}
                  onClick={handleClose}
                  className="text-sm lg:text-[0.7rem] uppercase tracking-wider font-light flex items-center gap-1 hover:text-[#a8a8a8] transition-colors duration-300 w-max"
                >
                  <span className="inline-flex w-1 border-y border-l border-[#f8f8f8] rounded-[1px] h-[14px]"></span>

                  {name}

                  <span className="inline-flex w-1 border-y border-r border-[#f8f8f8] rounded-[1px] h-[14px]"></span>
                  
                  {name === "cart" && (
                    <span className="ml-1 tracking-widest font-medium opacity-80">
                      [{cartCount > 0 ? cartCount : "0"}]
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navmenu;