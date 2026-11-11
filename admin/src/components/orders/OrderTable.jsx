import React, { useRef, useState, useEffect } from "react";
import OrderStatusBadge from "./OrderStatusBadge";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fulfillAdminOrder, updateAdminOrderStatus } from "../../store/slices/orderSlice";
import toast from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const OrderTable = ({ orders, startIndex }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tableRef = useRef(null);
  
  // State to track which row's dropdown is open
  const [openMenuId, setOpenMenuId] = useState(null);

  // --- CLICK OUTSIDE LISTENER ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If the user clicks anywhere that is NOT inside an element with the 'action-menu-wrapper' class, close the menu
      if (!e.target.closest(".action-menu-wrapper")) {
        setOpenMenuId(null);
      }
    };

    // Only attach the listener if a menu is actually open
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    // Cleanup listener on unmount or state change
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  useGSAP(() => {
    if (orders && orders.length > 0) {
      gsap.fromTo(
        ".table-row",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.8, ease: "power3.out" }
      );
    }
  }, { dependencies: [orders], scope: tableRef });

  // --- QUICK ACTIONS ---
  const handleShip = async (order) => {
    if (["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.orderStatus)) {
      toast.error(`Order is already ${order.orderStatus} and cannot be shipped.`);
      return;
    }
    const toastId = toast.loading("Connecting to Delhivery...", { style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }});
    try {
      await dispatch(fulfillAdminOrder(order._id)).unwrap();
      toast.success("Order Shipped via Delhivery", { id: toastId });
    } catch (err) {
      toast.dismiss(toastId);
    }
  };

  const handleCancel = async (order) => {
    if (["Cancelled", "Delivered", "Returned", "Shipped"].includes(order.orderStatus)) {
      toast.error(`Order cannot be cancelled. Current status is ${order.orderStatus}.`);
      return;
    }
    const toastId = toast.loading("Cancelling Order...", { style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }});
    try {
      await dispatch(updateAdminOrderStatus({ orderId: order._id, orderStatus: "Cancelled" })).unwrap();
      toast.success("Order Cancelled Successfully", { id: toastId });
    } catch (err) {
      toast.dismiss(toastId);
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-24 bg-white border border-gray-100 rounded-sm">
        <p className="text-sm tracking-widest uppercase text-gray-400">No orders found.</p>
      </div>
    );
  }

  return (
    <div ref={tableRef} className="overflow-x-auto bg-white min-h-[400px] pb-32">
      <table className="min-w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">S.No</th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Order ID</th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Date</th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Customer</th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total</th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order, index) => {
            const orderTotal = (order.advancePaid || 0) + (order.balanceDueOnDelivery || 0) || order.paymentAmount || 0;
            const isMenuOpen = openMenuId === order._id;

            return (
              <tr 
                key={order._id} 
                className={`table-row hover:bg-[#FAFAFA] transition-colors duration-300 relative ${isMenuOpen ? 'z-50' : 'z-0'}`}
              >
                <td className="px-6 py-6 whitespace-nowrap text-xs text-gray-400 tracking-wide">
                  {(startIndex + index + 1).toString().padStart(2, '0')}
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900 tracking-wide">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                  {order.isGuestCheckout ? order.guestEmail : order?.user?.email || "Unknown"}
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900 tracking-wide">
                  {orderTotal.toLocaleString("en-IN", {
                    style: "currency", currency: order.paymentCurrency || "INR",
                  })}
                </td>
                <td className="px-6 py-6 whitespace-nowrap">
                  <OrderStatusBadge status={order.orderStatus} />
                </td>
                
                {/* FIX: Added 'action-menu-wrapper' class here so our global listener knows what to ignore */}
                <td className="px-6 py-6 whitespace-nowrap text-right text-sm relative action-menu-wrapper">
                  
                  {/* 3-Dot Kebab Menu Button */}
                  <button
                    onClick={() => setOpenMenuId(isMenuOpen ? null : order._id)}
                    className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>

                  {/* Dropdown Menu (Transparent Overlay Removed) */}
                  {isMenuOpen && (
                    <div className="absolute right-8 top-12 w-40 bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-2 rounded-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col text-left">
                        
                        <button
                          onClick={() => { setOpenMenuId(null); handleShip(order); }}
                          className="w-full text-left px-5 py-2.5 text-[10px] font-bold text-gray-700 uppercase tracking-widest hover:bg-gray-50 hover:text-black transition-colors"
                        >
                          Ship Order
                        </button>
                        
                        <button
                          onClick={() => { setOpenMenuId(null); navigate(`/admin/orders/${order._id}`); }}
                          className="w-full text-left px-5 py-2.5 text-[10px] font-bold text-gray-700 uppercase tracking-widest hover:bg-gray-50 hover:text-black transition-colors"
                        >
                          Manage Order
                        </button>
                        
                        <div className="my-1 border-t border-gray-100"></div>
                        
                        <button
                          onClick={() => { setOpenMenuId(null); handleCancel(order); }}
                          className="w-full text-left px-5 py-2.5 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors"
                        >
                          Cancel Order
                        </button>
                        
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;