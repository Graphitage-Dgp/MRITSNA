import React, { useState } from "react";
import { Icon } from "@iconify/react";

const ProductAccordion = ({ variant }) => {
  const [openAccordion, setOpenAccordion] = useState("Dimensions");

  const details = {
    ...(variant?.material && { Material: variant.material }),
    ...(variant?.finish && { Finish: variant.finish }),

    // Dynamically pull the exact care instructions the admin typed for this specific variant!
    // We keep a gentle fallback just in case an old product hasn't been updated yet.
    Care: variant?.careInstructions || "Handle with care. Wipe clean with a damp cloth.",

    Shipping: "Free shipping on every order. Ships within 5-7 business days.",
  };

  return (
    <div className="product-info-item w-full border-t border-black/10 flex flex-col">
      {Object.entries(details).map(([key, value]) => (
        <div
          key={key}
          className="w-full border-b border-black/10 overflow-hidden"
        >
          <button
            onClick={() => setOpenAccordion(openAccordion === key ? "" : key)}
            className="w-full py-5 flex items-center justify-between text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-80 hover:opacity-100 transition-opacity"
          >
            {key}
            <Icon
              icon="ph:plus"
              className={`text-lg transition-transform duration-500 ${openAccordion === key ? "rotate-45" : ""}`}
            />
          </button>
          <div
            className={`text-sm font-light leading-relaxed opacity-70 transition-all duration-500 ease-in-out ${openAccordion === key ? "max-h-96 pb-5 opacity-70" : "max-h-0 opacity-0 pointer-events-none"}`}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductAccordion;
