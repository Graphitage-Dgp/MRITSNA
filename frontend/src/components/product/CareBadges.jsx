import React from "react";

const CareBadges = ({ product }) => {
  const items = [
    {
      icon: "🛡",
      title: "100% Transit Safe",
      description: "Instant free courier replacement if broken on delivery.",
    },
    ...(product?.care?.isFoodSafe
      ? [
          {
            icon: "🍵",
            title: "100% Food Safe & Lead Free",
            description: "Premium studio stoneware.",
          },
        ]
      : []),
    ...(product?.care?.isMicrowaveDishwasherSafe
      ? [
          {
            icon: "⚡",
            title: "Microwave & Dishwasher Safe",
            description: "",
          },
        ]
      : []),
  ];

  return (
    <div className="product-info-item w-full border-t border-black/10 py-5 mb-6">
      <p className="text-[0.62rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-3">
        Care Instructions
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-2.5 rounded-[3px] border border-[#7e7053]/25 bg-[#7e7053]/10 px-3 py-2 text-[0.72rem] lg:text-[0.8rem] font-light opacity-90"
          >
            <span aria-hidden="true" className="text-sm lg:text-base leading-5">
              {item.icon}
            </span>
            <span>
              <span className="font-medium text-[#1a1a1a]">{item.title}</span>
              {item.description ? (
                <span className="block text-[0.68rem] lg:text-[0.74rem] text-[#1a1a1a]/65 mt-0.5">
                  {item.description}
                </span>
              ) : (
                "."
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CareBadges;
