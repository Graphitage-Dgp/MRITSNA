import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";

const CustomSelect = ({ name, options, value, onChange, placeholder = "Select option" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside of the component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // GSAP micro-interaction for the dropdown reveal
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  // Find the label of the currently selected option
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  const handleSelect = (optionValue) => {
    // Mock the standard event structure so it works seamlessly with existing onChange handlers
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full px-4 border-b border-gray-200 focus:border-black transition-colors" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent text-[11px] uppercase tracking-wider py-2 text-left text-gray-900 focus:outline-none flex justify-between items-center"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-400 ease-in-out ${
            isOpen ? "-rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 z-50 w-full mt-2 bg-white border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.06)] py-2 max-h-60 overflow-y-auto"
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`px-4 py-3 text-[10px] uppercase tracking-widest cursor-pointer transition-colors duration-200 ${
                value === option.value
                  ? "bg-[#FAFAFA] text-black font-semibold"
                  : "text-gray-500 hover:bg-[#FAFAFA] hover:text-black"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;