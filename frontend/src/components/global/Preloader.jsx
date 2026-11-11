// frontend/src/components/global/Preloader.jsx
import React, { useEffect, useState } from "react";
import { useIntro } from "../../context/IntroContext";

const Preloader = ({ onComplete }) => {
  const intro = useIntro();
  const setIntroComplete =
    intro?.setIntroComplete || intro?.setIsIntroComplete || (() => {});

  const [stage, setStage] = useState("entering"); // "entering" | "splitting" | "done"

  useEffect(() => {
    // Only run the preloader once per session so internal navigation stays instant
    const alreadySeen = sessionStorage.getItem("mritsna_intro_seen");
    if (alreadySeen) {
      setIntroComplete(true);
      onComplete?.();
      setStage("done");
      return;
    }

    // Pre-decode /hero.webp in parallel
    const img = new Image();
    img.src = "/hero.webp";

    const splitTimer = setTimeout(() => {
      setStage("splitting");
      setIntroComplete(true);
      onComplete?.();
      sessionStorage.setItem("mritsna_intro_seen", "1");
    }, 550);

    const doneTimer = setTimeout(() => {
      setStage("done");
    }, 1250);

    return () => {
      clearTimeout(splitTimer);
      clearTimeout(doneTimer);
    };
  }, [setIntroComplete, onComplete]);

  if (stage === "done") return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 pointer-events-none flex flex-col overflow-hidden"
    >
      {/* Top Plaster Curtain */}
      <div
        className={`w-full flex-1 bg-[#EFECE6] border-b border-[#1C1A17]/10 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          stage === "splitting" ? "-translate-y-full" : "translate-y-0"
        }`}
      />

      {/* Bottom Plaster Curtain */}
      <div
        className={`w-full flex-1 bg-[#EFECE6] transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          stage === "splitting" ? "translate-y-full" : "translate-y-0"
        }`}
      />

      {/* Center Studio Mark & Progress Line */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-out ${
          stage === "splitting"
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100"
        }`}
      >
        <img
          src="/logo_black.svg"
          alt="Mritsna"
          className="h-8 sm:h-10 w-auto object-contain mb-3"
        />
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#1C1A17]/65 font-medium">
          Handmade Studio Ceramics
        </span>
        <div className="mt-4 w-28 h-[1px] bg-[#1C1A17]/15 overflow-hidden">
          <div className="h-full w-full bg-[#1C1A17] origin-left animate-[preloaderBar_0.55s_ease-out_forwards]" />
        </div>
      </div>

      <style>{`
        @keyframes preloaderBar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};

export default Preloader;