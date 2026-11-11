import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Terms = () => {
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
            Legal
          </span>
          <h1 className="head-font text-5xl lg:text-7xl tracking-tighter lowercase leading-none mb-6">
            terms of service.
          </h1>
          <p className="text-sm font-light opacity-70">
            Last updated: July 2026
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-12">
          
          {/* Section 1: Agreement to Terms */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              1. Agreement to Terms
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              By accessing or using the Mritsna website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using or accessing this site. We reserve the right to update or modify these terms at any time without prior notice.
            </p>
          </section>

          {/* Section 2: Artisanal Nature of Products */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              2. Artisanal Nature of Products
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              Every Mritsna piece is individually handcrafted in our studio. Due to the bespoke nature of stoneware and the firing processes, slight variations in glaze texture, color, scale, and form are inherent and expected. These organic differences are the hallmark of handcrafted ceramics and are not considered defects or valid grounds for dispute.
            </p>
          </section>

          {/* Section 3: Intellectual Property Rights */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              3. Intellectual Property Rights
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              All content on this website, including but not limited to photography, text, graphics, logos, and product designs, is the exclusive property of Mritsna. You may not reproduce, distribute, or exploit any of our intellectual property for commercial purposes without our express written consent.
            </p>
          </section>

          {/* Section 4: User Accounts & Responsibilities */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              4. User Accounts & Responsibilities
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              If you create an account on the Mritsna website, you are entirely responsible for maintaining the confidentiality of your account details and password. You agree to accept responsibility for all activities that occur under your account. We reserve the right to terminate accounts, remove or edit content, or cancel orders at our sole discretion.
            </p>
          </section>

          {/* Section 5: Pricing & Payments */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              5. Pricing & Payments
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              All prices are subject to change without notice. We reserve the right to modify or discontinue any product or service at any time. We shall not be liable to you or any third party for any modification, price change, or suspension of products. Payment must be completed prior to the dispatch of fully prepaid orders, or as agreed upon under our partial advance (COD) terms.
            </p>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              6. Limitation of Liability
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              In no event shall Mritsna, its directors, employees, or affiliates be liable for any direct, indirect, incidental, punitive, or consequential damages arising from your use of any of our products or the website. Our maximum liability to you will not exceed the total amount you paid for the product in question.
            </p>
          </section>

          {/* Section 7: Governing Law */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              7. Governing Law
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts located in Jharkhand, India.
            </p>
          </section>

          {/* Section 8: Contact Us */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              8. Contact
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              Questions about the Terms of Service should be sent to us at:
            </p>
            <p className="text-sm font-medium opacity-100">
              hello@mritsna.com
            </p>
          </section>

        </div>
      </div>
    </main>
  );
};

export default Terms;