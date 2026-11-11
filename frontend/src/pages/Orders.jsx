import React, { useRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/features/authSlice";
import { fetchUserOrderHistory } from "../store/features/orderSlice";

const Orders = () => {
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(1);
  
  const { isLoading } = useSelector((state) => state.auth);
  const { orderHistory, historyLoading, pagination } = useSelector((state) => state.orders);

  useEffect(() => {
    // Fetch 10 orders per page
    dispatch(fetchUserOrderHistory({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  useGSAP(() => {
    gsap.fromTo(
      ".dash-anim",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: "power2.out", delay: 0.1 }
    );
  }, { scope: containerRef });

  const handleLogout = async () => {
    const resultAction = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(resultAction)) {
      navigate("/account/signin");
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    return Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency });
  };

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[120px] lg:pt-[160px] pb-20 px-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-[250px] shrink-0 lg:sticky lg:top-[120px] h-fit">
          <h1 className="dash-anim head-font text-3xl mb-10">My Account</h1>
          
          <nav className="flex flex-col gap-6">
            <Link to="/account" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 flex items-center gap-4 group transition-opacity">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              Overview
            </Link>
            
            <Link to="/account/orders" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-100 origin-left transition-transform duration-300" />
              Order History
            </Link>
            
            <Link to="/account/addresses" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              Address Book
            </Link>

            <button 
              onClick={handleLogout}
              disabled={isLoading}
              className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity flex items-center gap-4 group mt-8 text-left disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              {isLoading ? "Logging Out..." : "Log Out"}
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <section className="flex-1 flex flex-col gap-8">
          
          <div className="dash-anim border-b border-black/10 pb-6">
            <h2 className="text-2xl head-font capitalize tracking-wide">Order History</h2>
            <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 mt-2">
              {pagination.totalOrders} Total Orders
            </p>
          </div>

          <div className="dash-anim">
            {historyLoading ? (
              <div className="w-full flex items-center justify-center py-32">
                <div className="w-6 h-6 border border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : orderHistory?.length > 0 ? (
              <div className="flex flex-col bg-white border border-black/5 rounded-xl px-4 py-2 shadow-sm">
                {orderHistory.map((order) => {
                   const totalItems = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                   const grandTotal = (order.advancePaid || 0) + (order.balanceDueOnDelivery || 0) || order.paymentAmount || 0;
                   
                   return (
                    <div key={order._id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 border-b border-black/5 last:border-0 gap-6 lg:gap-4 hover:bg-gray-50 transition-colors px-4 -mx-4 rounded-lg">
                      
                      <div className="flex flex-col gap-1 w-full lg:w-1/3">
                        <span className="text-[0.6rem] font-bold tracking-widest uppercase text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm font-medium">{order.orderNumber}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1 w-full lg:w-1/4">
                        <span className="text-sm font-medium">{formatCurrency(grandTotal, order.paymentCurrency)}</span>
                        <span className="text-[0.65rem] text-gray-500 uppercase tracking-widest">{totalItems} Item(s)</span>
                      </div>

                      <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end mt-2 lg:mt-0">
                        <span className="text-[0.65rem] font-bold tracking-widest uppercase px-3 py-1 bg-gray-100 rounded-sm border border-black/5">
                          {order.orderStatus}
                        </span>
                        <Link 
                          to={`/track-order/${order._id}`} 
                          className="text-[0.65rem] font-bold tracking-widest uppercase border-b border-black pb-[1px] hover:text-gray-500 hover:border-gray-500 transition-colors whitespace-nowrap"
                        >
                          View Details
                        </Link>
                      </div>

                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-32 bg-white border border-black/5 rounded-xl shadow-sm text-center px-6">
                <p className="text-lg head-font mb-2">No orders found</p>
                <p className="text-sm text-gray-500 mb-6">Looks like you haven't made your first purchase yet.</p>
                <Link to="/shop" className="text-[0.65rem] font-bold tracking-widest uppercase bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors">
                  Start Shopping
                </Link>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && !historyLoading && (
              <div className="flex items-center justify-center gap-8 mt-10">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-[0.65rem] font-bold tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-500 transition-colors"
                >
                  &larr; Prev
                </button>
                <span className="text-sm font-medium font-mono text-gray-500">
                  {currentPage} / {pagination.totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="text-[0.65rem] font-bold tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-500 transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>

        </section>
      </div>
    </main>
  );
};

export default Orders;