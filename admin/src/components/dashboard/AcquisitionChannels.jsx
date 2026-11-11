import React from "react";

const AcquisitionChannels = ({ trafficSources }) => {
  // Prevent rendering if data is unavailable
  if (!trafficSources || trafficSources.length === 0) return null;

  // Pure hex codes are used here to prevent Tailwind from purging dynamic background classes
  const barColors = [
    "#171410", 
    "#7e7053", 
    "#64748b", 
    "#4E7A64", 
    "#3e3a35"  
  ];

  return (
    <div className="traffic-container invisible">
      <div className="flex justify-between items-center mb-4 md:mb-6 px-1 lg:px-2">
        <h2 className="head-font text-xl md:text-2xl txt-dark tracking-tight">Acquisition Channels</h2>
      </div>
      
      <div className="bg-white border border-[var(--dark)]/5 rounded-lg p-4 md:p-6 shadow-sm flex flex-col gap-4 md:gap-6">
        {trafficSources.map((source, index) => {
          const hexColor = barColors[index % barColors.length];

          return (
            <div key={index} className="traffic-row invisible">
              <div className="flex justify-between text-xs font-bold txt-dark mb-2">
                <span className="opacity-70">{source.label}</span>
                <span>{source.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--dark)]/5 rounded-full overflow-hidden">
                <div 
                  className="progress-bar-fill h-full rounded-full"
                  data-width={`${source.percentage}%`}
                  style={{ 
                    width: "0%", // Required starting state for GSAP animations
                    backgroundColor: hexColor 
                  }} 
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AcquisitionChannels;