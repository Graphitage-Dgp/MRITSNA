import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PrivacyPolicy = () => {
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
            privacy policy.
          </h1>
          <p className="text-sm font-light opacity-70">
            Last updated: July 2026
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-12">
          
          {/* Section 1: Introduction */}
          <section className="policy-element flex flex-col gap-4">
            <p className="text-sm font-light opacity-80 leading-relaxed">
              At Mritsna, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from our studio.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              1. Information We Collect
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              We collect information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products, or otherwise contact us.
            </p>
            <ul className="list-disc pl-5 text-sm font-light opacity-80 leading-relaxed space-y-2">
              <li><strong>Personal Data:</strong> Name, shipping address, billing address, email address, and phone number.</li>
              <li><strong>Financial Data:</strong> Payment details (processed securely by our third-party payment gateways; we do not store full credit card numbers on our servers).</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website, including IP address, browser type, device information, and pages visited.</li>
            </ul>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              2. How We Use Your Information
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              We use the information we collect or receive to:
            </p>
            <ul className="list-disc pl-5 text-sm font-light opacity-80 leading-relaxed space-y-2">
              <li>Fulfill and manage your orders, payments, and returns.</li>
              <li>Create and manage your Mritsna account.</li>
              <li>Send you administrative information, such as order confirmations and shipping updates.</li>
              <li>Deliver targeted marketing and studio updates (only if you have opted in to our newsletter).</li>
              <li>Improve our website, customer service, and overall user experience.</li>
            </ul>
          </section>

          {/* Section 4: Sharing Your Information */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              3. Sharing Your Information
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We only share your information with trusted third-party service providers who assist us in operating our website and fulfilling your orders. These include:
            </p>
            <ul className="list-disc pl-5 text-sm font-light opacity-80 leading-relaxed space-y-2">
              <li>Payment processors to securely handle transactions.</li>
              <li>Shipping and logistics partners to deliver your ceramics.</li>
              <li>Email service providers to send transactional and marketing emails.</li>
            </ul>
            <p className="text-sm font-light opacity-80 leading-relaxed mt-2">
              We may also disclose your information if required by law or to protect the rights, property, or safety of Mritsna, our customers, or others.
            </p>
          </section>

          {/* Section 5: Cookies */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              4. Cookies & Tracking Technologies
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              We use cookies and similar tracking technologies to analyze website traffic, remember your preferences, and keep track of items in your shopping cart. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our website may not function properly.
            </p>
          </section>

          {/* Section 6: Your Rights */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              5. Your Rights
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              You have the right to access, update, or delete the personal information we hold about you. You can manage your account details directly through your Mritsna profile dashboard. If you wish to close your account or have your data completely removed from our systems, please contact us.
            </p>
          </section>

          {/* Section 7: Contact Us */}
          <section className="policy-element flex flex-col gap-4">
            <h2 className="text-sm font-bold tracking-[0.1em] uppercase border-b border-[#1a1a1a]/10 pb-2 mb-2">
              6. Contact Us
            </h2>
            <p className="text-sm font-light opacity-80 leading-relaxed">
              If you have any questions or concerns regarding this Privacy Policy or our data practices, please reach out to us at:
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

export default PrivacyPolicy;