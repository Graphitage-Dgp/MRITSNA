import React from "react";
import { Icon } from "@iconify/react";

const UserMetrics = ({ stats, isLoading }) => {
  const metrics = [
    {
      title: "Total Tracked Profiles",
      value: stats?.totalProfiles || 0,
      icon: "ph:users-three-light",
      description: "Registered accounts & unique visitors",
    },
    {
      title: "Registered Users",
      value: stats?.registeredUsersCount || 0,
      icon: "ph:user-check-light",
      description: "Verified & claimed member accounts",
    },
    {
      title: "Anonymous Visitors",
      value: stats?.visitorsCount || 0,
      icon: "ph:detective-light",
      description: "Device-tracked guest sessions",
    },
    {
      title: "Active Cart / Wishlist",
      value: stats?.activeShoppersCount || 0,
      icon: "ph:shopping-bag-open-light",
      description: "Users or visitors holding items now",
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
                {Number(metric.value).toLocaleString()}
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

export default UserMetrics;
