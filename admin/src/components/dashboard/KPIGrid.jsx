import React from "react";
import { Icon } from "@iconify/react";

const KPIGrid = ({ kpiData }) => {
  // Safe fallback if data hasn't loaded yet
  if (!kpiData || kpiData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
      {kpiData.map((kpi, index) => (
        <div key={index} className="kpi-card invisible h-full group cursor-default">
          
          {/* 
            1. THE HITBOX (outer div above): Added 'group' and it never moves on hover. 
            2. THE VISUAL CARD (inner div below): Changed 'hover:' to 'group-hover:' so it slides up when the parent is hovered. 
          */}
          <div className="relative h-full p-7 bg-white border border-[var(--dark)]/5 rounded-lg transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_-15px_rgba(23,20,16,0.08)] overflow-hidden">
            
            {/* The accent line at the bottom - correctly listens to the new group parent */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent transition-all duration-500 group-hover:w-full"></div>
            
            <div className="flex justify-between items-start mb-8">
              <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase txt-dark opacity-50">
                {kpi.label}
              </p>
              {/* Icon container - correctly listens to the new group parent */}
              <div className="p-2 bg-[var(--dark)]/5 rounded-md group-hover:bg-[var(--dark)]/10 transition-colors duration-500">
                <Icon icon={kpi.icon} className="text-lg txt-dark opacity-70" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-1">
              {kpi.prefix && <span className="text-lg txt-dark opacity-50">{kpi.prefix}</span>}
              <h3 className="head-font text-4xl txt-dark tracking-tight">
                {/* The '0' here is the starting point for the GSAP ticker */}
                <span className="kpi-value">0</span>
              </h3>
              {kpi.suffix && <span className="text-lg txt-dark opacity-50">{kpi.suffix}</span>}
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIGrid;