import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrderById, fulfillAdminOrder, updateAdminOrderStatus, clearCurrentOrder, clearOrderErrors } from "../../../store/slices/orderSlice";
import toast, { Toaster } from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import OrderHeader from "../../../components/orders/details/OrderHeader";
import CustomerLogistics from "../../../components/orders/details/CustomerLogistics";
import OrderLedger from "../../../components/orders/details/OrderLedger";
import FulfillmentEngine from "../../../components/orders/details/FulfillmentEngine";

gsap.registerPlugin(useGSAP);

const OrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  const { currentOrder: order, currentOrderLoading, actionLoading, error, actionError } = useSelector((state) => state.adminOrders);

  // Environment Variables for Dynamic Printing
  const storeName = import.meta.env.VITE_STORE_NAME || "Mritsna";
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "help@mritsna.com";
  const storeUrl = import.meta.env.VITE_STORE_URL || "www.mritsna.com";
  const warehouseAdd = import.meta.env.VITE_PICKUP_ADD || "Registered Dispatch Facility";
  const warehouseCity = import.meta.env.VITE_PICKUP_CITY || "Jharkhand";
  const gstin = import.meta.env.VITE_GSTIN || "20AAFCF1838H1Z0";

  useEffect(() => {
    if (orderId) {
      dispatch(fetchAdminOrderById(orderId));
    }
    return () => {
      dispatch(clearCurrentOrder());
      dispatch(clearOrderErrors());
    };
  }, [dispatch, orderId]);

  useGSAP(() => {
    if (order && !currentOrderLoading) {
      gsap.fromTo(
        ".stagger-block",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }
  }, { dependencies: [order, currentOrderLoading], scope: containerRef });

  useEffect(() => {
    const activeError = error || actionError;
    if (activeError) {
      toast.error(activeError, {
        style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' },
        iconTheme: { primary: '#ff4b4b', secondary: '#fff' },
      });
      dispatch(clearOrderErrors());
    }
  }, [error, actionError, dispatch]);

  const handleFulfill = async () => {
    const toastId = toast.loading("Connecting to Delhivery...", { style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }});
    try {
      await dispatch(fulfillAdminOrder(order._id)).unwrap();
      toast.success("Order Shipped via Delhivery", { id: toastId });
    } catch (err) {
      toast.dismiss(toastId);
    }
  };

  const handleStatusOverride = async (newStatus) => {
    const toastId = toast.loading("Updating Ledger...", { style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }});
    try {
      await dispatch(updateAdminOrderStatus({ orderId: order._id, orderStatus: newStatus })).unwrap();
      toast.success("Order Status Updated", { id: toastId });
    } catch (err) {
      toast.dismiss(toastId);
    }
  };

  // Triggers the native browser print dialog
  const handlePrint = () => {
    window.print();
  };

  if (currentOrderLoading || !order) {
    return (
      <div className="w-full min-h-screen bg-[#f8f8f8] flex justify-center items-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border border-[#1a1a1a]/10 rounded-full" />
          <div className="absolute inset-0 border border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate strict grand total logic
  const grandTotal = Math.round((order.subTotal || 0) - (order.discountAmount || 0) + (order.shippingCost || 0));

  return (
    <>
      {/* =================================================================================
          1. DASHBOARD VIEW - Hidden when printing (print:hidden)
          ================================================================================= */}
      <div className="w-full bg-[#f8f8f8] min-h-screen py-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" ref={containerRef}>
          
          <div className="flex justify-between items-center stagger-block">
            <button onClick={() => window.history.back()} className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
              &larr; Back to Orders
            </button>
            
            <button 
              onClick={handlePrint}
              className="border border-gray-200 bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print Invoice
            </button>
          </div>

          <div className="bg-white p-8 md:p-12 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[800px]">
            <div className="stagger-block"><OrderHeader order={order} /></div>
            <div className="stagger-block"><CustomerLogistics order={order} /></div>
            <div className="stagger-block"><OrderLedger order={order} /></div>
            <div className="stagger-block">
              <FulfillmentEngine 
                order={order} 
                onFulfill={handleFulfill} 
                onStatusOverride={handleStatusOverride}
                actionLoading={actionLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================================
          2. FULL-PAGE A4 INVOICE - Visible ONLY when printing (print:block)
          ================================================================================= */}
      <div id="invoice-print-area" className="hidden print:block bg-white text-black font-sans w-full max-w-none">
        
        {/* Strict CSS to override browser print headers and layout wrappers */}
        <style>
          {`
            @media print {
              /* Removes the Date, Title, and URL from the page edges */
              @page { margin: 0; }
              
              /* Hide all existing layout elements (navbars, sidebars, backgrounds) */
              body * {
                visibility: hidden;
              }
              
              /* Force white background */
              body { 
                background-color: white !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }

              /* Break the invoice out of its container and show only its contents */
              #invoice-print-area, #invoice-print-area * {
                visibility: visible;
              }
              
              /* Snap to edges to override any parent container borders or padding */
              #invoice-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background-color: white !important;
                padding: 15mm; /* Apply print margin safely inside the wrapper */
                box-sizing: border-box;
              }
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
                  <td className="py-4 px-4 text-right align-top text-black border-r border-gray-300">₹{Math.round(item.priceAtPurchase || item.itemTotal/item.quantity)}</td>
                  <td className="py-4 px-4 text-center align-top text-black border-r border-gray-300">{gstRate}%</td>
                  <td className="py-4 px-4 text-right font-bold text-black align-top">₹{Math.round(item.itemTotal)}</td>
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
              <span>₹{Math.round(order.baseRevenue || order.subTotal)}</span>
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
              <span>{order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost}`}</span>
            </div>

            <div className="flex justify-between py-3 text-lg font-black text-black border-t-2 border-gray-800 mt-2 bg-gray-50 px-3">
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
            {/* End Print COD Breakdown */}

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
    </>
  );
};

export default OrderDetails;