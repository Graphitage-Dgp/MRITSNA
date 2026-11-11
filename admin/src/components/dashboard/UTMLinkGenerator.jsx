import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

const platforms = [
  { id: "instagram", label: "Instagram", icon: "mdi:instagram" },
  { id: "facebook", label: "Facebook", icon: "mdi:facebook" },
  { id: "youtube", label: "YouTube", icon: "mdi:youtube" },
  { id: "tiktok", label: "TikTok", icon: "ic:baseline-tiktok" },
  { id: "twitter", label: "Twitter / X", icon: "mdi:twitter" },
  { id: "linkedin", label: "LinkedIn", icon: "mdi:linkedin" },
  { id: "custom", label: "Custom Referral...", icon: "lucide:users" },
];

const UTMLinkGenerator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState(platforms[0]);
  const [customSource, setCustomSource] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const dropdownRef = useRef(null);

  const baseUrl = "https://mritsna.com";

  // Generate the final URL dynamically
  const generatedUrl = source.id === "custom" 
    ? `${baseUrl}${customSource ? `?utm_source=${customSource.toLowerCase().replace(/\s+/g, '')}` : ""}`
    : `${baseUrl}?utm_source=${source.id}`;

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (source.id === "custom" && !customSource) return;
    
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="link-generator-container invisible">
      <div className="flex justify-between items-center mb-4 md:mb-6 px-1 lg:px-2">
        <h2 className="head-font text-xl md:text-2xl txt-dark tracking-tight">Tracking Link Generator</h2>
      </div>
      
      <div className="bg-white border border-[var(--dark)]/5 rounded-lg p-4 md:p-6 shadow-sm">
        
        {/* Fully Stacked (Top-and-Down) Layout */}
        <div className="flex flex-col gap-5 w-full">
          
          {/* 1. Custom Elegant Dropdown */}
          <div className="w-full relative z-[100]" ref={dropdownRef}>
            <label className="block text-[0.65rem] font-bold tracking-[0.1em] uppercase txt-dark opacity-50 mb-2">
              Platform
            </label>
            
            <div 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between w-full bg-[#f8f8f8] border border-[var(--dark)]/10 rounded-sm px-4 py-3 cursor-pointer hover:bg-[var(--dark)]/[0.02] hover:border-[var(--dark)]/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Icon icon={source.icon} className="text-[var(--dark)] opacity-60" width="16" />
                <span className="text-sm font-bold txt-dark">{source.label}</span>
              </div>
              <Icon 
                icon="lucide:chevron-down" 
                className={`text-[var(--dark)] opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                width="16" 
              />
            </div>

            {/* Floating Dropdown Menu (Fixed with CSS overscroll-contain & data attributes) */}
            {isOpen && (
              <div 
                className="absolute top-full left-0 w-full mt-2 bg-white border border-[var(--dark)]/10 rounded-sm shadow-xl z-[100] overflow-y-auto overflow-x-hidden max-h-[200px] overscroll-contain custom-scrollbar pointer-events-auto"
                data-scroll-lock="true" 
                data-lenis-prevent="true"
              >
                {platforms.map((platform) => (
                  <div 
                    key={platform.id}
                    onClick={() => {
                      setSource(platform);
                      setIsOpen(false);
                      if (platform.id !== "custom") setCustomSource("");
                    }}
                    className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-[#f8f8f8] transition-colors ${source.id === platform.id ? 'bg-[#f8f8f8] border-l-2 border-[var(--dark)]' : 'border-l-2 border-transparent'}`}
                  >
                    <Icon icon={platform.icon} className={`text-[var(--dark)] ${source.id === platform.id ? 'opacity-80' : 'opacity-40'}`} width="16" />
                    <span className={`text-sm ${source.id === platform.id ? 'font-bold txt-dark' : 'font-medium txt-dark opacity-70'}`}>
                      {platform.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Custom Input (Only shows if "Custom Referral" is selected) */}
          {source.id === "custom" && (
            <div className="w-full animate-fade-in relative z-10">
              <label className="block text-[0.65rem] font-bold tracking-[0.1em] uppercase txt-dark opacity-50 mb-2">
                Referral Name
              </label>
              <input 
                type="text"
                placeholder="e.g. john_doe"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="w-full bg-[#f8f8f8] border border-[var(--dark)]/10 text-sm font-bold txt-dark rounded-sm px-4 py-3 outline-none focus:border-[var(--dark)]/30 transition-colors placeholder:font-medium placeholder:opacity-40"
              />
            </div>
          )}

          {/* 3. The Generated Link & Copy Button */}
          <div className="w-full relative z-10">
            <label className="block text-[0.65rem] font-bold tracking-[0.1em] uppercase txt-dark opacity-50 mb-2">
              Your Tracking Link
            </label>
            <div 
              onClick={handleCopy}
              className="group relative flex items-center justify-between w-full bg-[var(--dark)] text-white rounded-sm px-4 py-3 cursor-pointer hover:bg-black transition-colors overflow-hidden"
            >
              <span className="text-sm font-mono truncate mr-4 opacity-90 group-hover:opacity-100 transition-opacity">
                {generatedUrl}
              </span>
              
              <div className="shrink-0 flex items-center bg-[var(--dark)] pl-2">
                {isCopied ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#A8C3B5]">
                    <Icon icon="lucide:check" width="16" /> Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                    <Icon icon="lucide:copy" width="16" /> Copy
                  </span>
                )}
              </div>
              
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UTMLinkGenerator;