import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

const RecentDispatches = ({ recentOrders }) => {
  const navigate = useNavigate();

  if (!recentOrders || recentOrders.length === 0) return null;

  // Helper to generate the exact badge styling seen in image_2cc8ea.png
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'shipped':
        return 'text-[#4E7A64] bg-[#F5F8F6] border-[#D0E3D9]';
      case 'processing':
      case 'confirmed':
        // The image shows 'CONFIRMED' in a sleek blueish-slate tint
        return 'text-slate-600 bg-slate-50/50 border-slate-200';
      case 'cancelled':
      case 'returned':
      case 'failed':
        return 'text-rose-500 bg-rose-50/30 border-rose-200/80';
      default:
        return 'text-[var(--dark)] bg-[var(--dark)]/5 border-[var(--dark)]/10';
    }
  };

  return (
    <div className="orders-container invisible">
      <div className="flex justify-between items-center mb-4 md:mb-6 px-1 lg:px-2">
        <h2 className="head-font text-xl md:text-2xl txt-dark tracking-tight">Recent Dispatches</h2>
      </div>
      
      <div className="bg-white border border-[var(--dark)]/5 rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col">
          {recentOrders.map((order, index) => {
            const badgeClass = getStatusBadge(order.status);
            
            return (
              <div 
                key={index} 
                onClick={() => navigate(`/admin/orders/${order._id}`)} 
                // Responsive padding: compact on mobile, expansive on md/lg/xl/2xl
                className="table-row invisible relative flex flex-col py-4 px-4 md:py-5 md:px-6 xl:py-6 xl:px-6 border-b border-[var(--dark)]/5 last:border-b-0 group cursor-pointer hover:bg-[var(--dark)]/[0.02] transition-colors duration-300"
              >
                
                {/* TOP ROW: Order ID (Left) & Price (Right) */}
                <div className="flex justify-between items-center w-full mb-2 md:mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold txt-dark leading-none">
                      {order.id}
                    </span>
                    {/* Hover Arrow Animation */}
                    <Icon 
                      icon="lucide:arrow-right" 
                      className="text-[var(--dark)] opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300" 
                      width="14" 
                    />
                  </div>
                  <span className="text-sm font-bold txt-dark leading-none">
                    {order.amount}
                  </span>
                </div>

                {/* BOTTOM ROW: Customer/Date (Left) & Status Badge (Right) */}
                <div className="flex justify-between items-end sm:items-center w-full gap-2 sm:gap-4">
                  
                  {/* Truncation and responsive stacking added for narrow mobile screens */}
                  <span className="text-[0.65rem] font-medium tracking-[0.1em] uppercase txt-dark opacity-50 leading-tight sm:leading-none truncate">
                    {order.customer} 
                    <span className="mx-1.5 opacity-40 hidden sm:inline">•</span>
                    <br className="sm:hidden" /> 
                    <span className="sm:inline mt-0.5 sm:mt-0 block sm:inline-block">{order.date}</span>
                  </span>
                  
                  {/* whitespace-nowrap guarantees the badge never breaks into two lines */}
                  <span className={`text-[0.6rem] whitespace-nowrap font-bold tracking-[0.05em] uppercase px-2 py-1 md:px-2.5 md:py-1 border rounded-sm leading-none ${badgeClass}`}>
                    {order.status}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentDispatches;