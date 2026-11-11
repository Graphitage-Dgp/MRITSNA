import React from "react";
import { Icon } from "@iconify/react";

const formatINR = (amount) => {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const CartMetrics = ({ stats, isLoading }) => {
  const metrics = [
    {
      title: "Pipeline Value",
      value: formatINR(stats.totalPipelineValue),
      icon: "ph:currency-inr-light",
      description: "Total value of all active carts",
    },
    {
      title: "Active Sessions",
      value: stats.totalActiveCarts,
      icon: "ph:shopping-cart-light",
      description: "Users currently holding items",
    },
    {
      title: "Abandoned Carts",
      value: stats.abandonedCartsCount,
      icon: "ph:ghost-light",
      description: "Inactive for > 24 hours",
    },
    {
      title: "Average Cart Value",
      value: formatINR(stats.averageCartValue),
      icon: "ph:chart-bar-light",
      description: "Mean value per user",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div 
          key={index} 
          className="bg-white border border-black/5 p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs tracking-widest uppercase font-bold opacity-60">
              {metric.title}
            </h3>
            <Icon icon={metric.icon} className="text-xl opacity-40" />
          </div>
          
          <div>
            {isLoading ? (
              <div className="h-8 w-24 bg-black/5 animate-pulse mb-1 rounded-sm"></div>
            ) : (
              <p className="text-2xl font-light tracking-wide mb-1">
                {metric.value}
              </p>
            )}
            <p className="text-[0.65rem] uppercase tracking-wider opacity-40">
              {metric.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartMetrics;