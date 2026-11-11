import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

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

const categories = [
  {
    id: "01",
    title: "Vase",
    subtitle: "Tall forms & centerpieces",
    image: "/vase.webp",
    link: `/shop?category=${encodeURIComponent("Vase")}`,
  },
  {
    id: "02",
    title: "Tealight Candle",
    subtitle: "Ambient glowing fixtures",
    image: "/tealight_candle.webp",
    link: `/shop?category=${encodeURIComponent("Tealight Candle")}`,
  },
  {
    id: "03",
    title: "Mug",
    subtitle: "Comforting handled forms",
    image: "/mug.webp",
    link: `/shop?category=${encodeURIComponent("Mug")}`,
  },
  {
    id: "04",
    title: "Decor",
    subtitle: "Abstract & sculptural forms",
    image: "/decor.webp",
    link: `/shop?category=${encodeURIComponent("Decor")}`,
  },
  {
    id: "05",
    title: "Tumbler",
    subtitle: "Handleless drinking vessels",
    image: "/tumbler.webp", // Reusing image style, update if you have specific assets
    link: `/shop?category=${encodeURIComponent("Tumbler")}`,
  },
  {
    id: "06",
    title: "Cup",
    subtitle: "Everyday essentials",
    image: "/cup.webp", 
    link: `/shop?category=${encodeURIComponent("Cup")}`,
  },
];

const leftCategories = categories.filter((_, i) => i % 2 === 0);
const rightCategories = categories.filter((_, i) => i % 2 !== 0);

const CategoryIndex = () => {
  const desktopSectionRef = useRef(null);
  const centerCardRef = useRef(null);
  const mobCardRef = useRef(null); 
  
  useGSAP(() => {
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP ANIMATION
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      
      const deskWords = gsap.utils.toArray(".reveal-word", centerCardRef.current);
      gsap.fromTo(deskWords,
        { opacity: 0, y: 30, filter: "blur(8px)" },
        { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)", 
          duration: 1, 
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: centerCardRef.current,
            start: "top 80%", 
            toggleActions: "play none none reverse", 
          }
        }
      );

      gsap.utils.toArray(".desk-cat-item").forEach(item => {
        gsap.fromTo(item,
          { opacity: 0, y: 60 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1.2, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none reverse", 
            }
          }
        );
      });
    });

    // ==========================================
    // MOBILE ANIMATION
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      
      const mobWords = gsap.utils.toArray(".reveal-word", mobCardRef.current);
      gsap.fromTo(mobWords,
        { opacity: 0, y: 30, filter: "blur(8px)" },
        { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)", 
          duration: 1, 
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: mobCardRef.current,
            start: "top 85%", 
            toggleActions: "play none none reverse",
          }
        }
      );

      gsap.utils.toArray(".mob-cat-item").forEach(item => {
        gsap.fromTo(item,
          { opacity: 0, y: 40 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none reverse",
            }
          }
        );
      });
    });

    return () => mm.revert();
  }, []);


  const CategoryItem = ({ cat, className = "" }) => (
    <Link 
      to={cat.link} 
      data-cursor="explore"
      className={`group flex flex-col cursor-none lg:cursor-none ${className}`}
    >
      <div className="w-full aspect-[3/4] overflow-hidden mb-6 bg-[#e4e4e2]">
        <img 
          src={cat.image} 
          alt={cat.title}
          className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">
          {cat.id} — {cat.subtitle}
        </span>
        <div className="flex items-center gap-4">
          <h3 className="head-font text-4xl lg:text-5xl tracking-tight">
            {cat.title}s
          </h3>
          <span className="opacity-0 -translate-x-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-x-0">
            →
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="w-full bg-[#f8f8f8] text-[#1a1a1a] mt-10 lg:mt-24 relative">
      
      {/* ========================================== */}
      {/* DESKTOP LAYOUT (3 Columns)                 */}
      {/* ========================================== */}
      <section ref={desktopSectionRef} className="hidden lg:flex max-w-[1500px] mx-auto px-12 relative pt-32 pb-40">
        
        {/* Left Column */}
        <div className="w-1/3 flex flex-col gap-32">
          {leftCategories.map(cat => (
            <CategoryItem key={cat.id} cat={cat} className="desk-cat-item pr-10" />
          ))}
        </div>

        {/* Center Column (NATIVE CSS STICKY) */}
        <div className="w-1/3 flex justify-center">
          <div className="sticky top-[50vh] -translate-y-1/2 w-[90%] max-w-[400px] h-fit z-20">
            <div 
              ref={centerCardRef} 
              className="w-full bg-white p-12 lg:p-16 flex flex-col items-center text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2px]"
            >
              <h2 className="head-font text-5xl lg:text-6xl tracking-tighter lowercase mb-8">
                <SplitText>categories</SplitText>
              </h2>
              <span className="block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
                Shop by Form
              </span>
              <p className="text-sm font-light opacity-80 leading-relaxed">
                Explore the Mritsna archives. Each piece is categorized by its functional intent and architectural shape.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Masonry Offset) */}
        <div className="w-1/3 flex flex-col gap-32 pt-[25vh]">
          {rightCategories.map(cat => (
            <CategoryItem key={cat.id} cat={cat} className="desk-cat-item pl-10" />
          ))}
        </div>

      </section>

      {/* ========================================== */}
      {/* MOBILE LAYOUT (Stacked)                    */}
      {/* ========================================== */}
      <section className="flex lg:hidden flex-col px-6 pt-24 pb-32">
        
        <div 
          ref={mobCardRef}
          className="w-full bg-white p-10 flex flex-col items-center text-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] rounded-[2px] mb-20"
        >
          <h2 className="head-font text-5xl tracking-tighter lowercase mb-6">
            <SplitText>categories</SplitText>
          </h2>
          <span className="block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-4">
            Shop by Form
          </span>
          <p className="text-sm font-light opacity-80 leading-relaxed max-w-xs">
            Explore the Mritsna archives. Each piece is categorized by its functional intent and architectural shape.
          </p>
        </div>

        <div className="flex flex-col gap-20">
          {categories.map(cat => (
            <CategoryItem key={cat.id} cat={cat} className="mob-cat-item" />
          ))}
        </div>

      </section>

    </div>
  );
};

export default CategoryIndex;