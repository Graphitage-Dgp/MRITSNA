import React, { useState } from "react";
import CustomSelect from "../CustomSelect";

const FulfillmentEngine = ({ order, onFulfill, onStatusOverride, actionLoading }) => {
  const [overrideStatus, setOverrideStatus] = useState(order.orderStatus);

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Returned', label: 'Returned' }
  ];

  const handleOverrideSubmit = () => {
    if (overrideStatus !== order.orderStatus) {
      onStatusOverride(overrideStatus);
    }
  };

  const isFulfillable = ["Confirmed", "Processing"].includes(order.orderStatus) && ["Completed", "Partially Paid"].includes(order.paymentStatus);
  const isShipped = ["Shipped", "Delivered"].includes(order.orderStatus);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8">
      
      {/* Left Side: Delhivery Fulfillment */}
      <div className="bg-[#fcfcfc] p-6 border border-gray-200 rounded-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-900 mb-2">Logistics Control</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-6">
          Generate AWB and schedule pickup via Delhivery. Only Confirmed & Paid orders can be fulfilled.
        </p>

        {isShipped ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Courier</span>
              <span className="text-sm font-medium text-black">{order.courierPartner || "Delhivery"}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Tracking / AWB</span>
              <span className="text-sm font-mono text-black">{order.trackingNumber}</span>
            </div>
            {order.shippingLabelUrl && (
              <a 
                href={order.shippingLabelUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 block w-full py-3 text-center bg-black text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-colors"
              >
                Download Shipping Label
              </a>
            )}
          </div>
        ) : (
          <button 
            onClick={onFulfill}
            disabled={!isFulfillable || actionLoading}
            className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
              isFulfillable 
                ? "bg-black text-white hover:bg-gray-800 disabled:opacity-50" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
          >
            {actionLoading ? "Processing..." : isFulfillable ? "Fulfill via Delhivery" : "Fulfillment Locked"}
          </button>
        )}
      </div>

      {/* Right Side: Manual Override */}
      <div className="bg-white p-6 border border-gray-100 rounded-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-900 mb-2">Manual Status Override</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-6">
          Forcefully change the order state. Warning: Changing to Cancelled or Returned will auto-restock inventory.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative z-50">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Current Status</label>
            <div className="border-b border-gray-200">
               <CustomSelect 
                 name="overrideStatus" 
                 options={statusOptions} 
                 value={overrideStatus} 
                 onChange={(e) => setOverrideStatus(e.target.value)} 
               />
            </div>
          </div>
          <button 
            onClick={handleOverrideSubmit}
            disabled={overrideStatus === order.orderStatus || actionLoading}
            className="px-6 py-2.5 bg-gray-100 text-black border border-gray-200 text-[10px] font-bold uppercase tracking-[0.15em] hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>

    </div>
  );
};

export default FulfillmentEngine;