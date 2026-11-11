import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; 
import { Icon } from "@iconify/react";

// UPDATED: Added "None" as the first option
const sortOptions = [
  "None",
  "Newest", 
  "Price: Low to High", 
  "Price: High to Low"
];

const FilterBar = ({ 
  categories = [], 
  materials = [], 
  activeCategories = [], 
  activeMaterials = [], 
  activeSort 
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState(null); // 'categories', 'materials', 'sort', 'mobileFilters', or null
  
  // Individual refs for precision click-outside detection
  const categoryRef = useRef(null);
  const materialRef = useRef(null);
  const sortRef = useRef(null);
  const mobileFilterRef = useRef(null);

  // Precise click-outside logic targeting individual dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (!categoryRef.current || !categoryRef.current.contains(event.target)) &&
        (!materialRef.current || !materialRef.current.contains(event.target)) &&
        (!sortRef.current || !sortRef.current.contains(event.target)) &&
        (!mobileFilterRef.current || !mobileFilterRef.current.contains(event.target))
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(prev => prev === dropdownName ? null : dropdownName);
  };

  // --- Multi-Select Handlers ---

  const handleToggleCategory = (cat) => {
    let newCategories = [...activeCategories];
    if (newCategories.includes(cat)) {
      newCategories = newCategories.filter(c => c !== cat);
    } else {
      newCategories.push(cat);
    }

    if (newCategories.length > 0) {
      searchParams.set("category", newCategories.join(','));
    } else {
      searchParams.delete("category");
    }
    
    searchParams.delete("page"); 
    setSearchParams(searchParams);
  };

  const handleToggleMaterial = (mat) => {
    let newMaterials = [...activeMaterials];
    if (newMaterials.includes(mat)) {
      newMaterials = newMaterials.filter(m => m !== mat);
    } else {
      newMaterials.push(mat);
    }

    if (newMaterials.length > 0) {
      searchParams.set("material", newMaterials.join(','));
    } else {
      searchParams.delete("material");
    }
    
    searchParams.delete("page"); 
    setSearchParams(searchParams);
  };

  const handleSortChange = (option) => {
    // UPDATED: Check for "None" to keep URL clean
    if (option === "None") {
      searchParams.delete("sort"); 
    } else {
      searchParams.set("sort", option);
    }
    searchParams.delete("page");
    setSearchParams(searchParams);
    setOpenDropdown(null);
  };

  const clearAllFilters = () => {
    searchParams.delete("category");
    searchParams.delete("material");
    searchParams.delete("page");
    setSearchParams(searchParams);
    setOpenDropdown(null);
  };

  const activeFilterCount = activeCategories.length + activeMaterials.length;

  // Stop scroll events from bubbling up to global smooth scrollers
  const stopScrollPropagation = (e) => {
    e.stopPropagation();
  };

  // --- Reusable Elegant Checkbox Component ---
  const CheckboxItem = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-3 w-full text-left group py-1.5">
      <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-[#1a1a1a]/20 group-hover:border-[#1a1a1a]/50'}`}>
        {isActive && <Icon icon="lucide:check" className="text-white text-[10px]" />}
      </div>
      <span className={`text-[0.65rem] font-bold tracking-[0.15em] uppercase transition-colors ${isActive ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/60 group-hover:text-[#1a1a1a]'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="sticky top-[75px] z-40 w-full bg-[#f8f8f8]/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-5 flex justify-between items-center gap-4">
        
        {/* LEFT SIDE: MULTI-SELECT FILTERS */}
        <div className="flex flex-wrap items-center gap-x-4 lg:gap-x-8 gap-y-3">
          
          {/* --- DESKTOP VIEW: Split Dropdowns --- */}
          <div className="hidden lg:flex items-center gap-x-8">
            
            {/* Category Dropdown */}
            <div className="relative" ref={categoryRef}>
              <button 
                onClick={() => toggleDropdown('categories')}
                className={`group flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 border-b transition-colors ${openDropdown === 'categories' || activeCategories.length > 0 ? 'text-[#1a1a1a] border-[#1a1a1a]' : 'text-[#1a1a1a]/70 border-transparent hover:text-[#1a1a1a]'}`}
              >
                Categories {activeCategories.length > 0 && `(${activeCategories.length})`}
                <Icon icon="lucide:chevron-down" width="12" className={`transition-transform duration-300 ${openDropdown === 'categories' ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                onWheel={stopScrollPropagation}
                onTouchMove={stopScrollPropagation}
                className={`absolute top-full left-0 mt-4 w-56 max-h-[65vh] overflow-y-auto no-scrollbar bg-white border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-2 transition-all duration-300 origin-top-left ${openDropdown === 'categories' ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
              >
                {categories.map((cat) => (
                  <CheckboxItem 
                    key={cat} 
                    label={cat} 
                    isActive={activeCategories.includes(cat)} 
                    onClick={() => handleToggleCategory(cat)} 
                  />
                ))}
              </div>
            </div>

            {/* Material Dropdown */}
            <div className="relative" ref={materialRef}>
              <button 
                onClick={() => toggleDropdown('materials')}
                className={`group flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 border-b transition-colors ${openDropdown === 'materials' || activeMaterials.length > 0 ? 'text-[#1a1a1a] border-[#1a1a1a]' : 'text-[#1a1a1a]/70 border-transparent hover:text-[#1a1a1a]'}`}
              >
                Materials {activeMaterials.length > 0 && `(${activeMaterials.length})`}
                <Icon icon="lucide:chevron-down" width="12" className={`transition-transform duration-300 ${openDropdown === 'materials' ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                onWheel={stopScrollPropagation}
                onTouchMove={stopScrollPropagation}
                className={`absolute top-full left-0 mt-4 w-56 max-h-[65vh] overflow-y-auto no-scrollbar bg-white border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-2 transition-all duration-300 origin-top-left ${openDropdown === 'materials' ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
              >
                {materials.map((mat) => (
                  <CheckboxItem 
                    key={mat} 
                    label={mat} 
                    isActive={activeMaterials.includes(mat)} 
                    onClick={() => handleToggleMaterial(mat)} 
                  />
                ))}
              </div>
            </div>

          </div>

          {/* --- MOBILE VIEW: Unified Filters Dropdown --- */}
          <div className="relative lg:hidden" ref={mobileFilterRef}>
            <button 
              onClick={() => toggleDropdown('mobileFilters')}
              className={`group flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 border-b transition-colors ${openDropdown === 'mobileFilters' || activeFilterCount > 0 ? 'text-[#1a1a1a] border-[#1a1a1a]' : 'text-[#1a1a1a]/70 border-transparent hover:text-[#1a1a1a]'}`}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              <Icon icon="lucide:chevron-down" width="12" className={`transition-transform duration-300 ${openDropdown === 'mobileFilters' ? 'rotate-180' : ''}`} />
            </button>
            
            <div 
              onWheel={stopScrollPropagation}
              onTouchMove={stopScrollPropagation}
              className={`absolute top-full left-0 mt-4 w-64 max-h-[65vh] overflow-y-auto no-scrollbar bg-white border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-5 transition-all duration-300 origin-top-left ${openDropdown === 'mobileFilters' ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
            >
              
              {/* Mobile Categories Section */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[0.55rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a]/40 mb-1">Categories</h4>
                {categories.map((cat) => (
                  <CheckboxItem 
                    key={cat} 
                    label={cat} 
                    isActive={activeCategories.includes(cat)} 
                    onClick={() => handleToggleCategory(cat)} 
                  />
                ))}
              </div>

              <div className="w-full h-px bg-black/5"></div>

              {/* Mobile Materials Section */}
              <div className="flex flex-col gap-2">
                <h4 className="text-[0.55rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a]/40 mb-1">Materials</h4>
                {materials.map((mat) => (
                  <CheckboxItem 
                    key={mat} 
                    label={mat} 
                    isActive={activeMaterials.includes(mat)} 
                    onClick={() => handleToggleMaterial(mat)} 
                  />
                ))}
              </div>

            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <button 
              onClick={clearAllFilters}
              className="group flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.15em] uppercase text-[#1a1a1a]/50 hover:text-red-600 transition-colors ml-1 lg:ml-2 pb-1"
            >
              <Icon icon="lucide:x" width="12" />
              Clear All
            </button>
          )}
        </div>

        {/* RIGHT SIDE: SORTING */}
        <div className="relative flex-shrink-0" ref={sortRef}>
          <button 
            onClick={() => toggleDropdown('sort')}
            className={`group flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 border-b transition-colors ${openDropdown === 'sort' ? 'text-[#1a1a1a] border-[#1a1a1a]' : 'text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]/30'}`}
          >
            <span className="opacity-50 hidden sm:inline">Sort:</span> {activeSort}
            <Icon icon="lucide:chevron-down" width="12" className={`transition-transform duration-300 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`absolute top-full right-0 mt-4 w-48 bg-white border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col py-2 transition-all duration-300 origin-top-right ${openDropdown === 'sort' ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}>
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleSortChange(option)}
                className={`text-left px-5 py-3 text-[0.6rem] font-bold tracking-[0.15em] uppercase transition-colors ${activeSort === option ? "text-[#1a1a1a] bg-black/5" : "text-[#1a1a1a]/70 hover:bg-black/5 hover:text-[#1a1a1a]"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;