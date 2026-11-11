import React, { useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/features/authSlice";
import { fetchUserOrderHistory } from "../store/features/orderSlice";

const Dashboard = () => {
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, isLoading } = useSelector((state) => state.auth);
  // Pull order history state
  const { orderHistory, historyLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    // Fetch only the 3 most recent orders for the dashboard preview
    dispatch(fetchUserOrderHistory({ page: 1, limit: 3 }));
  }, [dispatch]);

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

  if (!user) return null; 

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[120px] lg:pt-[160px] pb-20 px-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-[250px] shrink-0 lg:sticky lg:top-[120px] h-fit">
          <h1 className="dash-anim head-font text-3xl mb-10">My Account</h1>
          
          <nav className="flex flex-col gap-6">
            <Link to="/account" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-100 origin-left transition-transform duration-300" />
              Overview
            </Link>
            
            <Link to="/account/orders" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
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
        <section className="flex-1 flex flex-col gap-16">
          
          <div className="dash-anim border-b border-black/10 pb-8">
            <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-4">Account Details</h2>
            <p className="text-2xl head-font capitalize tracking-wide">
              Welcome back, {user.firstName}.
            </p>
            <div className="mt-4 flex flex-col gap-1">
              <p className="text-sm font-light opacity-80">{user.email}</p>
            </div>
          </div>

          <div className="dash-anim">
            <div className="flex justify-between items-end border-b border-black/10 pb-4 mb-4">
              <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50">Recent Orders</h2>
              {orderHistory?.length > 0 && (
                <Link to="/account/orders" className="text-[0.55rem] tracking-[0.1em] uppercase hover:opacity-60 transition-opacity border-b border-black pb-[1px]">
                  View All
                </Link>
              )}
            </div>
            
            {historyLoading ? (
              <div className="w-full flex items-center justify-center py-20">
                <div className="w-5 h-5 border border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : orderHistory?.length > 0 ? (
              <div className="flex flex-col">
                {orderHistory.map((order) => {
                   const totalItems = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                   const grandTotal = (order.advancePaid || 0) + (order.balanceDueOnDelivery || 0) || order.paymentAmount || 0;
                   
                   return (
                    <div key={order._id} className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-black/5 last:border-0 gap-4 hover:bg-white/50 transition-colors px-2 -mx-2 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.6rem] font-bold tracking-widest uppercase text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm font-medium">{order.orderNumber}</span>
                      </div>
                      
                      <div className="flex flex-col md:items-center gap-1">
                        <span className="text-sm">{formatCurrency(grandTotal, order.paymentCurrency)}</span>
                        <span className="text-[0.65rem] text-gray-500 uppercase tracking-widest">{totalItems} Item(s)</span>
                      </div>

                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                        <span className="text-[0.65rem] font-bold tracking-widest uppercase px-3 py-1 bg-gray-100 rounded-sm">
                          {order.orderStatus}
                        </span>
                        <Link 
                          to={`/track-order/${order._id}`} 
                          className="text-[0.65rem] font-bold tracking-widest uppercase border-b border-black pb-[1px] hover:text-gray-500 hover:border-gray-500 transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="w-full flex items-center justify-center py-20 bg-white/50 border border-black/5 rounded-lg mt-4">
                <p className="text-sm font-light opacity-50">You haven't placed any orders yet.</p>
              </div>
            )}
          </div>

        </section>
      </div>
    </main>
  );
};

export default Dashboard;