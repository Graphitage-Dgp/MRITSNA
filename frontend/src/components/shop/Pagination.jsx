import React from "react";
import { Icon } from "@iconify/react";

const Pagination = ({ pagination, onPageChange, isLoading }) => {
  const { currentPage, hasNextPage, hasPrevPage, totalPages } = pagination;

  // Prevent clicking if there's no page to go to, or if data is currently fetching
  const handlePrev = () => {
    if (hasPrevPage && !isLoading) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (hasNextPage && !isLoading) onPageChange(currentPage + 1);
  };

  return (
    <div className="w-full flex items-center justify-center gap-8 pb-32 bg-[#f8f8f8]">
      
      {/* Previous Button */}
      <button 
        onClick={handlePrev}
        disabled={!hasPrevPage || isLoading}
        className="group relative flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] pb-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        <Icon icon="lucide:arrow-left" width="14" />
        Prev
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10" />
        <span className="absolute bottom-0 right-0 w-0 h-[1px] bg-black transition-all duration-300 ease-out group-hover:w-full group-disabled:w-0" />
      </button>

      {/* Page Indicator */}
      <span className="text-xs font-medium text-gray-500 tracking-widest">
        {currentPage} / {totalPages || 1}
      </span>

      {/* Next Button */}
      <button 
        onClick={handleNext}
        disabled={!hasNextPage || isLoading}
        className="group relative flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] pb-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        Next
        <Icon icon="lucide:arrow-right" width="14" />
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10" />
        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-black transition-all duration-300 ease-out group-hover:w-full group-disabled:w-0" />
      </button>

    </div>
  );
};

export default Pagination;