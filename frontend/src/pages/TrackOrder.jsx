import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserOrderDetails, trackPublicOrder, clearTrackedOrder, clearOrderErrors } from "../store/features/orderSlice";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// --- IMAGE OPTIMIZATION HELPER ---
// Automatically requests a lightweight thumbnail from ImageKit instead of the full-res image
const getOptimizedImgUrl = (url) => {
  if (!url) return "";
  if (url.includes("ik.imagekit.io") && !url.includes("tr=")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}tr=w-200,h-200,c-at_max,q-80`; 
  }
  return url;
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Redux State
  const { user, isAuthenticated, isLoading: authLoading } = useSelector((state) => state.auth);
  const { currentTrackedOrder: order, liveTrackingData, trackingLoading, error } = useSelector((state) => state.orders);

  // Local Form State
  const [inputOrderId, setInputOrderId] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [autoFetched, setAutoFetched] = useState(false);

  // Env Variables for the Invoice Print
  const storeName = import.meta.env.VITE_STORE_NAME;
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;
  const storeUrl = import.meta.env.VITE_STORE_URL;
  const warehouseAdd = import.meta.env.VITE_PICKUP_ADD;
  const warehouseCity = import.meta.env.VITE_PICKUP_CITY;
  const warehouseState = import.meta.env.VITE_PICKUP_STATE;
  const warehousePin = import.meta.env.VITE_PICKUP_PIN;
  const warehousePhone = import.meta.env.VITE_PICKUP_PHONE;
  const gstin = import.meta.env.VITE_GSTIN;

  // --- INITIALIZATION & AUTO-FILL ---
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user?.email) {
      setInputEmail(user.email);
    } else if (emailParam) {
      setInputEmail(emailParam);
    }

    if (orderId) {
      setInputOrderId(orderId);
    }

    if (orderId && !autoFetched) {
      if (orderId.length === 24 && isAuthenticated) {
        dispatch(fetchUserOrderDetails(orderId));
        setAutoFetched(true);
      } else if (emailParam || (isAuthenticated && user?.email)) {
        dispatch(trackPublicOrder({ 
          orderNumber: orderId, 
          email: emailParam || user.email 
        }));
        setAutoFetched(true);
      }
    }
  }, [orderId, emailParam, isAuthenticated, user, authLoading, dispatch, autoFetched]);

  useEffect(() => {
    return () => {
      dispatch(clearTrackedOrder());
      dispatch(clearOrderErrors());
    };
  }, [dispatch]);

  // --- GSAP ANIMATIONS ---
  useGSAP(() => {
    if (!order && !trackingLoading) {
      gsap.fromTo(
        ".form-anim",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }
    if (order && !trackingLoading) {
      gsap.fromTo(
        ".result-anim",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, { dependencies: [order, trackingLoading], scope: containerRef });

  // --- HANDLERS ---
  const handleManualTrack = (e) => {
    e.preventDefault();
    dispatch(clearOrderErrors());
    
    const cleanOrderId = inputOrderId.trim();
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (isAuthenticated && cleanOrderId.length === 24) {
      dispatch(fetchUserOrderDetails(cleanOrderId));
    } else {
      dispatch(trackPublicOrder({ orderNumber: cleanOrderId, email: cleanEmail }));
    }
  };

  const handleReset = () => {
    dispatch(clearTrackedOrder());
    navigate("/track-order");
    setInputOrderId("");
    setAutoFetched(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount, currency = "INR") => {
    return Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 });
  };

  if (authLoading) return <div className="min-h-screen bg-[#f8f8f8]" />;

  const grandTotal = order ? Math.round((order.subTotal || 0) - (order.discountAmount || 0) + (order.shippingCost || 0)) : 0;

  return (
    <>
      {/* =================================================================================
          1. DASHBOARD VIEW - Hidden when printing (print:hidden)
          ================================================================================= */}
      <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[120px] lg:pt-[160px] pb-20 px-6 lg:px-12 print:hidden">
        <div className="max-w-[1200px] mx-auto">
          
          {/* --- STATE 1: THE TRACKING FORM --- */}
          {!order && (
            <div className="max-w-md mx-auto mt-10">
              <div className="mb-10 text-center form-anim">
                <h1 className="text-3xl head-font tracking-wide mb-3">Track Order</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">Enter your order ID and email to view real-time logistics.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-medium border border-red-100 rounded-lg text-center form-anim">
                  {error}
                </div>
              )}

              <form onSubmit={handleManualTrack} className="space-y-8 bg-white p-8 md:p-12 border border-black/5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] form-anim">
                <div>
                  <label className="block text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Order Reference</label>
                  <input 
                    type="text" 
                    required
                    value={inputOrderId}
                    onChange={(e) => setInputOrderId(e.target.value)}
                    placeholder="e.g. ORD-12345678"
                    className="w-full bg-transparent border-b border-black/20 pb-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    disabled={isAuthenticated && !!user?.email}
                    placeholder="Used at checkout"
                    className="w-full bg-transparent border-b border-black/20 pb-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={trackingLoading}
                  className="w-full bg-black text-white py-4 mt-4 rounded-xl text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-gray-800 transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-70 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {trackingLoading ? <Icon icon="lucide:loader-2" className="animate-spin" width="16" /> : (
                    <>
                      Track Logistics <Icon icon="lucide:arrow-right" width="14" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}


          {/* --- STATE 2: THE ORDER DETAILS --- */}
          {order && (
            <div className="flex flex-col gap-10">
              
              {/* Header Panel */}
              <div className="result-anim flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 md:p-10 border border-black/5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div>
                  <h1 className="text-2xl 2xl:text-3xl head-font tracking-wide mb-2">Order <span className="body-font text-xl 2xl:text-2xl">#{order.orderNumber}</span></h1>
                  <p className="text-[0.65rem] text-gray-400 font-semibold uppercase tracking-[0.2em]">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="px-4 py-2 bg-[#f8f8f8] rounded-md flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                      {order.orderStatus === 'Pending' || order.orderStatus === 'Processing' ? (
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      ) : null}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${order.orderStatus === 'Delivered' ? 'bg-green-500' : order.orderStatus === 'Cancelled' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </span>
                    <span className="text-[0.65rem] font-bold tracking-widest uppercase text-black">{order.orderStatus}</span>
                  </div>

                  <button 
                    onClick={handlePrint} 
                    className="px-5 py-2.5 bg-black text-white text-[0.65rem] font-bold tracking-widest uppercase rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="lucide:printer" width="14" /> Invoice
                  </button>

                  <button onClick={handleReset} className="p-2.5 bg-white border border-black/10 text-gray-500 hover:text-black hover:border-black transition-colors rounded-md group">
                    <Icon icon="lucide:rotate-ccw" width="16" className="group-hover:-rotate-90 transition-transform duration-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                
                {/* LEFT COLUMN: Items & Addresses */}
                <div className="lg:col-span-8 flex flex-col gap-8 lg:gap-10">
                  
                  {/* Items */}
                  <div className="result-anim bg-white border border-black/5 rounded-2xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-8 border-b border-black/5 pb-4">Merchandise</h2>
                    <div className="flex flex-col divide-y divide-gray-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-6 py-6 first:pt-0 last:pb-0 group">
                          {/* FIX: Removed mix-blend-multiply and added getOptimizedImgUrl to force thumbnail loading */}
                          <div className="w-20 h-24 bg-[#f8f8f8] rounded-xl overflow-hidden shrink-0 border border-black/5 relative">
                            <img 
                              src={getOptimizedImgUrl(item.img)} 
                              alt={item.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center">
                            <p className="text-base font-medium mb-1 group-hover:text-[#796c52] transition-colors">{item.title}</p>
                            <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-3">{item.colorName}</p>
                            <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          
                          <div className="flex flex-col justify-center text-right">
                            <p className="text-base font-medium">{formatCurrency(item.itemTotal, order.paymentCurrency)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Logistics Info Grid */}
                  <div className="result-anim grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                    <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                      <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-6 flex items-center gap-2">
                        <Icon icon="lucide:map-pin" width="14" /> Shipping Address
                      </h2>
                      <div className="text-sm leading-relaxed text-gray-600">
                        <p className="font-semibold text-black mb-1">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pinCode}</p>
                        <p className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                          <Icon icon="lucide:phone" width="12" className="text-gray-400" /> {order.shippingAddress.phone}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                      <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-6 flex items-center gap-2">
                        <Icon icon="lucide:credit-card" width="14" /> Payment Details
                      </h2>
                      <div className="text-sm leading-relaxed text-gray-600">
                        <p className="font-semibold text-black uppercase mb-1">
                          {order.paymentOption === 'PARTIAL_COD' ? 'Partial COD' : 'Prepaid Online'}
                        </p>
                        <p className="flex items-center gap-2">
                          Payment Status: <span className="text-black font-medium">{order.paymentStatus}</span>
                        </p>
                        
                        {order.paymentOption === 'PARTIAL_COD' && order.balanceDueOnDelivery > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-[0.65rem] font-bold tracking-widest text-orange-500 uppercase mb-1">To Collect on Delivery</p>
                            <p className="text-xl font-light text-black">{formatCurrency(order.balanceDueOnDelivery, order.paymentCurrency)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Tracking & Summary */}
                <div className="lg:col-span-4 flex flex-col gap-8 lg:gap-10">
                  
                  {/* Live Courier Tracking */}
                  {liveTrackingData && (
                    <div className="result-anim bg-white border border-black/5 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                      <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#C5A880] mb-8 flex items-center gap-2">
                        <Icon icon="lucide:truck" width="16" /> Live Transit
                      </h2>
                      
                      <div className="relative pl-5 border-l border-gray-100">
                        <div className="relative">
                          <div className="absolute w-2.5 h-2.5 bg-[#C5A880] rounded-full -left-[25px] top-1.5 ring-4 ring-white" />
                          <p className="text-sm font-bold text-black uppercase tracking-wider">{liveTrackingData.status}</p>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{liveTrackingData.instructions}</p>
                          <p className="text-[0.65rem] text-gray-400 font-mono mt-3 uppercase tracking-widest">
                            {new Date(liveTrackingData.statusDateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      {order.courierPartner && (
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-400 uppercase tracking-widest">Courier</span>
                          <span className="text-xs font-bold text-black uppercase tracking-widest">{order.courierPartner}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="result-anim bg-white border border-black/5 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-6">Financial Ledger</h2>
                    
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.subTotal, order.paymentCurrency)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-[#4E7A64]">
                          <span>Discount</span>
                          <span>-{formatCurrency(order.discountAmount, order.paymentCurrency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>{(!order.shippingCost || order.shippingCost === 0) ? "Free" : formatCurrency(order.shippingCost, order.paymentCurrency)}</span>
                      </div>
                      
                      <div className="border-t border-black/10 pt-4 mt-4">
                        <div className="flex justify-between text-lg font-light text-black">
                          <span>Grand Total</span>
                          <span>{formatCurrency(grandTotal, order.paymentCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* =================================================================================
          2. FULL-PAGE A4 INVOICE - Visible ONLY when printing (print:block)
          ================================================================================= */}
      {order && (
        <div id="invoice-print-area" className="hidden print:block bg-white text-black font-sans w-full max-w-none">
          
          <style>
            {`
              @media print {
                @page { margin: 0; }
                body * { visibility: hidden; }
                body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                #invoice-print-area, #invoice-print-area * { visibility: visible; }
                #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; background-color: white !important; padding: 15mm; box-sizing: border-box; }
              }
            `}
          </style>

          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-widest uppercase mb-1 text-black">{storeName}</h1>
              <p className="text-sm text-gray-600 leading-relaxed">{supportEmail}<br/>{storeUrl}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-light text-black tracking-wider mb-2">TAX INVOICE</h2>
              <p className="text-sm text-gray-800"><strong>Order ID:</strong> #{order.orderNumber}</p>
              <p className="text-sm text-gray-800"><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-12 mb-10">
            <div>
              <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider border-b border-gray-200 pb-1 inline-block">Sold By</h3>
              <div className="text-sm text-gray-800 leading-relaxed mt-1">
                <p className="font-bold text-black">{storeName}</p>
                <p>{warehouseAdd}</p>
                <p>{warehouseCity}, Jharkhand</p>
                <p className="mt-1 font-mono text-gray-600">GSTIN: {gstin}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-black mb-2 uppercase text-xs tracking-wider border-b border-gray-200 pb-1 inline-block">Billing & Shipping Address</h3>
              <div className="text-sm text-gray-800 leading-relaxed mt-1">
                <p className="font-bold text-black">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                <p>Pin: {order.shippingAddress?.pinCode}</p>
                <p>Phone: {order.shippingAddress?.phone}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8 text-sm border-collapse border border-gray-800">
            <thead>
              <tr className="bg-gray-100 text-black uppercase text-xs tracking-wider border-b-2 border-gray-800">
                <th className="py-3 px-4 text-left font-bold border-r border-gray-800 w-12">#</th>
                <th className="py-3 px-4 text-left font-bold border-r border-gray-800">Product Description</th>
                <th className="py-3 px-4 text-center font-bold border-r border-gray-800 w-20">Qty</th>
                <th className="py-3 px-4 text-right font-bold border-r border-gray-800 w-28">Price</th>
                <th className="py-3 px-4 text-center font-bold border-r border-gray-800 w-24">GST %</th>
                <th className="py-3 px-4 text-right font-bold w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {order.items.map((item, idx) => {
                const gstRate = order.taxDetails?.reduce((acc, tax) => acc + (tax.rate || 0), 0) || 0;

                return (
                  <tr key={idx} className="border-b border-gray-300 bg-white">
                    <td className="py-4 px-4 text-black align-top border-r border-gray-300">{idx + 1}</td>
                    <td className="py-4 px-4 align-top border-r border-gray-300">
                      <p className="font-bold text-black">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-1">Color: {item.colorName} | Variant ID: <span className="font-mono text-gray-500">{item.variantId}</span></p>
                    </td>
                    <td className="py-4 px-4 text-center align-top text-black font-medium border-r border-gray-300">{item.quantity}</td>
                    <td className="py-4 px-4 text-right align-top text-black border-r border-gray-300">₹{Math.round(item.priceAtPurchase || (item.itemTotal/item.quantity) || 0)}</td>
                    <td className="py-4 px-4 text-center align-top text-black border-r border-gray-300">{gstRate}%</td>
                    <td className="py-4 px-4 text-right font-bold text-black align-top">₹{Math.round(item.itemTotal || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-12 border-t border-gray-300 pt-4">
            <div className="w-1/2 md:w-1/3 text-sm">
              <div className="flex justify-between py-1.5 text-gray-800">
                <span>Taxable Subtotal</span>
                <span>₹{Math.round(order.baseRevenue || order.subTotal || 0)}</span>
              </div>

              {order.taxDetails && order.taxDetails.map((tax, i) => (
                <div key={i} className="flex justify-between py-1.5 text-gray-800">
                  <span>Add: {tax.taxType}</span>
                  <span>₹{Math.round(tax.amount)}</span>
                </div>
              ))}

              <div className="flex justify-between py-1.5 font-semibold text-black border-b border-gray-300 pb-2 mb-2">
                <span>Total Tax Amount</span>
                <span>₹{Math.round(order.totalTaxAmount || 0)}</span>
              </div>
              
              {order.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 text-black">
                  <span>Discount</span>
                  <span>- ₹{Math.round(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 text-black">
                <span>Shipping Charges</span>
                <span>{(!order.shippingCost || order.shippingCost === 0) ? 'Free' : `₹${order.shippingCost}`}</span>
              </div>

              <div className="flex justify-between py-4 text-lg font-black text-black border-t-2 border-gray-800 mt-2 bg-gray-50 px-3">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>

              {/* Print COD Breakdown */}
              {(order.paymentOption === 'PARTIAL_COD' || order.balanceDueOnDelivery > 0) && (
                <div className="flex flex-col bg-gray-50 px-3 pb-3">
                  <div className="flex justify-between py-1 text-gray-800 text-sm">
                    <span>Advance Paid Online</span>
                    <span>₹{Math.round(order.advancePaid || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-black font-bold text-base border-t border-gray-300 mt-1 pt-2">
                    <span>Balance Due on Delivery</span>
                    <span>₹{Math.round(order.balanceDueOnDelivery || 0)}</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer / Policy */}
          <div className="border-t-2 border-gray-800 pt-6 text-sm text-gray-800">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-bold text-black uppercase mb-1">
                  PAYMENT METHOD: {order.paymentOption === 'PARTIAL_COD' ? 'PARTIAL COD' : 'ONLINE'}
                </p>
                <p className="text-xs text-gray-600 max-w-lg">Returns Policy: Items can be returned within 24 hours of delivery. Keep the products intact and make sure to record a video of the unboxing process.</p>
              </div>
              <div className="text-right text-xs text-gray-500 font-mono">
                <p>This is a computer-generated invoice.</p>
                <p>No signature required.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrackOrder;