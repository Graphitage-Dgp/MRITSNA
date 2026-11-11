import React from "react";
import { useNavigate } from "react-router-dom";
import OrderStatusBadge from "../OrderStatusBadge"; // Reusing the badge we made earlier

const OrderHeader = ({ order }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-gray-100">
      <div>
        <button 
          onClick={() => navigate("/admin/orders")}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-4"
        >
          &larr; Back to Orders
        </button>
        <h1 className="text-2xl md:text-3xl font-light tracking-[0.1em] text-black">
          {order.orderNumber}
        </h1>
        <p className="text-[11px] font-medium tracking-widest text-gray-500 uppercase mt-2">
          Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Payment</span>
          <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 border rounded-sm ${
            order.paymentStatus === 'Completed' ? 'bg-[#F4F9F5] text-[#2E583A] border-[#CDE5D5]' : 
            order.paymentStatus === 'Pending' ? 'bg-[#FDFBF7] text-[#8C6D46] border-[#E8DCCB]' : 
            'bg-[#FCF5F5] text-[#9E4646] border-[#F0D6D6]'
          }`}>
            {order.paymentStatus}
          </span>
        </div>
        <div className="w-px h-8 bg-gray-200 mx-2"></div>
        <div className="flex flex-col items-start">
          <span className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Fulfillment</span>
          <OrderStatusBadge status={order.orderStatus} />
        </div>
      </div>
    </div>
  );
};

export default OrderHeader;