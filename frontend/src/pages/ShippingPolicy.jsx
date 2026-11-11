import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const ShippingPolicy = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      ".policy-element",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-32 pb-24 px-6 lg:px-12">
      <div className="max-w-[800px] mx-auto">
        
        {/* Header */}
        <div className="mb-16 policy-element">
          <span className="block text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
            Client Care
          </span>
          <h1 className="head-font text-5xl lg:text-7xl tracking-tighter lowercase leading-none mb-6">
            shipping & refunds.
          </h1>
          <p className="text-sm font-light opacity-70">
            Last updated: July 2026
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-12">
          
          {/* Section 1: Processing & Shipping */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              1. Order Processing & Dispatch
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              Every Mritsna piece is carefully inspected and securely packaged by our studio team to ensure its safe transit. Orders are typically processed and dispatched within 2 days and delivered within 5 to 7 business days. Once your order has left our atelier, you will receive a confirmation email containing tracking details. 
            </p>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              Please note that transit times vary depending on the destination and the courier service. We are not liable for delays caused by carrier disruptions or unforeseen weather conditions.
            </p>
          </section>

          {/* Section 2: Cancellations */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              2. Cancellations
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              If you need to request a cancellation, you must contact us immediately at <strong>hello@mritsna.com</strong>. However, <strong>once an order has been shipped or dispatched from our studio, it cannot be cancelled under any circumstances.</strong> We process orders quickly to ensure timely delivery, so the window for cancellation is extremely limited.
            </p>
          </section>

          {/* Section 3: Failed Deliveries & Non-Receipt */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              3. Failed Deliveries & Non-Receipt
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              It is the customer's responsibility to provide an accurate shipping address and be available to receive the package. If an order fails to be delivered (e.g., due to an incorrect address, unavailability, or refusal to accept) and is returned to our studio, the following refund policies apply:
            </p>
            <ul className="list-disc pl-5 text-sm font-light opacity-80 leading-relaxed space-y-2">
              <li>
                <strong>Fully Prepaid Orders:</strong> We will issue a refund to your original payment method, minus a <strong>strict deduction</strong> to cover the two-way shipping, packaging, and handling costs incurred by our studio.
              </li>
              <li>
                <strong>Advance Payment (COD) Orders:</strong> If your order was placed using the partial advance payment method for Cash on Delivery, <strong>the advance payment is strictly non-refundable</strong> if the package is unreceived or rejected by the customer after shipping.
              </li>
            </ul>
          </section>

          {/* Section 4: No Return Policy */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              4. Strict No Return Policy
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              Due to the highly fragile, bespoke, and artisanal nature of our stoneware, <strong>Mritsna operates under a strict return and exchange policy.</strong> Once a product has been successfully delivered to the customer, it can only be returned within 24 hours, exchanged, or refunded. We strongly encourage you to review all dimensions, details, and imagery carefully before placing an order.
            </p>
          </section>

          {/* Section 5: Damages in Transit */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              5. Damages in Transit & Unboxing
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              We take exceptional care in wrapping our ceramics. However, in the rare event that your piece arrives damaged or broken due to courier mishandling, you must notify us within <strong>24 hours of delivery</strong>. 
            </p>
            
            {/* NEW BOLD TEXT ADDED HERE */}
            <p className="text-sm leading-relaxed text-[#1a1a1a]">
              <strong>Please make sure to do a video of unboxing to get a refund or return the product, or even if the product reaches broken.</strong>
            </p>

            <p className="text-sm font-light opacity-80 leading-relaxed">
              Please email <strong>hello@mritsna.com</strong> with your order number, the unboxing video, and clear photographic evidence of both the broken item and the original packaging. Claims made after 30 minutes of delivery, or without proper documentation, will not be accepted. Valid claims will be compensated with a replacement (if available) or a full refund at our discretion.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
};

export default ShippingPolicy;