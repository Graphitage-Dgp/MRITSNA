import React, { useRef } from "react";
import { Icon } from "@iconify/react";

const DashboardHeader = ({ admin, startDate, endDate, onDateChange }) => {
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    // Scaled bottom margin and padding for mobile
    <header className="dash-header invisible mb-8 md:mb-12 flex flex-col xl:flex-row xl:justify-between xl:items-end gap-5 md:gap-6 pb-5 md:pb-6 relative z-10">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[var(--dark)]/20 to-transparent"></div>
      
      {/* LEFT: Title & Greeting */}
      <div>
        {/* Title scales from 3xl on phones to 4xl on desktop */}
        <h1 className="head-font text-3xl md:text-4xl txt-dark tracking-tight mb-1.5 md:mb-2">Command Center</h1>
        <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase txt-dark opacity-50">
          Welcome back, {admin?.name || "Admin"}
        </p>
      </div>
      
      {/* RIGHT: Date Range Picker */}
      <div className="flex flex-col md:flex-row items-start xl:items-center gap-3 md:gap-4 self-start xl:self-auto">
        
        {/* Static Today's Date Badge */}
        <p className="inline-block text-[0.65rem] uppercase tracking-[0.1em] txt-dark font-mono bg-white shadow-sm border border-[var(--dark)]/5 px-4 py-2 rounded-full cursor-default">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Elegant Custom Date Range Picker */}
        <div className="flex items-center bg-white border border-[var(--dark)]/10 rounded-sm shadow-sm p-1">
          
          {/* FROM DATE */}
          <div 
            onClick={() => startInputRef.current?.showPicker()} 
            className="relative group flex items-center px-3 py-2 md:px-4 md:py-2 bg-[#f8f8f8] hover:bg-[var(--dark)]/[0.03] transition-colors rounded-sm overflow-hidden cursor-pointer"
          >
            <Icon icon="lucide:calendar-days" className="text-[var(--dark)] opacity-40 mr-2 md:mr-2.5 transition-opacity group-hover:opacity-70" width="14" />
            <div className="flex flex-col relative z-10 pointer-events-none">
              <span className="text-[0.5rem] font-bold tracking-[0.2em] uppercase txt-dark opacity-40 mb-0.5">From</span>
              <span className="text-[0.7rem] font-bold tracking-[0.05em] uppercase txt-dark opacity-80 group-hover:opacity-100 transition-opacity min-w-[70px] md:min-w-[85px]">
                {startDate ? formatDisplayDate(startDate) : 'Start Date'}
              </span>
            </div>
            <input 
              ref={startInputRef}
              type="date" 
              value={startDate}
              max={endDate} 
              onChange={(e) => onDateChange('start', e.target.value)}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
            />
          </div>
          
          {/* SEPARATOR */}
          <div className="px-2 md:px-3 text-[var(--dark)] opacity-20">
            <Icon icon="lucide:arrow-right" width="12" />
          </div>
          
          {/* TO DATE */}
          <div 
            onClick={() => endInputRef.current?.showPicker()} 
            className="relative group flex items-center px-3 py-2 md:px-4 md:py-2 bg-[#f8f8f8] hover:bg-[var(--dark)]/[0.03] transition-colors rounded-sm overflow-hidden cursor-pointer"
          >
            <Icon icon="lucide:calendar-days" className="text-[var(--dark)] opacity-40 mr-2 md:mr-2.5 transition-opacity group-hover:opacity-70" width="14" />
            <div className="flex flex-col relative z-10 pointer-events-none">
              <span className="text-[0.5rem] font-bold tracking-[0.2em] uppercase txt-dark opacity-40 mb-0.5">To</span>
              <span className="text-[0.7rem] font-bold tracking-[0.05em] uppercase txt-dark opacity-80 group-hover:opacity-100 transition-opacity min-w-[70px] md:min-w-[85px]">
                {endDate ? formatDisplayDate(endDate) : 'End Date'}
              </span>
            </div>
            <input 
              ref={endInputRef}
              type="date" 
              value={endDate}
              min={startDate} 
              onChange={(e) => onDateChange('end', e.target.value)}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
            />
          </div>

        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;