import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

const CustomSelect = ({ options, value, onChange, placeholder, disabled, searchPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative w-full ${isOpen ? 'z-[9999]' : 'z-10'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={wrapperRef}>
      <div
        className="w-full bg-transparent border-b border-black/20 pb-2 text-sm focus:outline-none flex justify-between items-center cursor-pointer transition-colors hover:border-black"
        onClick={(e) => { if (!disabled) { e.preventDefault(); setIsOpen(!isOpen); } }}
      >
        <span className={selectedOption ? 'text-black font-medium' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon icon="lucide:chevron-down" className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-lg shadow-2xl flex flex-col" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
          {options.length > 10 && (
            <div className="p-2 border-b border-black/5 shrink-0 bg-gray-50/50 rounded-t-lg">
              <div className="flex items-center gap-2 px-3 bg-white rounded-md border border-black/10">
                <Icon icon="lucide:search" className="text-gray-400 w-3 h-3 shrink-0" />
                <input
                  type="text" className="w-full bg-transparent py-2 text-xs focus:outline-none"
                  placeholder={searchPlaceholder || "Search..."} value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()} 
                />
              </div>
            </div>
          )}
          <ul className="max-h-[250px] overflow-y-auto overscroll-none bg-white rounded-b-lg relative pointer-events-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={`px-4 py-3 text-xs cursor-pointer transition-colors hover:bg-gray-100 ${value === opt.value ? 'bg-gray-100 font-bold text-black' : 'text-gray-600'}`}
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-xs text-gray-500 text-center italic">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;