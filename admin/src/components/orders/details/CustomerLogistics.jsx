import React from 'react';

const CustomerLogistics = ({ order }) => {
  // Use env variables or fallback to your Noctowls Durgapur defaults
  const warehouseAdd = import.meta.env.VITE_PICKUP_ADD;
  const warehouseCity = import.meta.env.VITE_PICKUP_CITY;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-8 border-b border-gray-100">
      
      {/* Column 1: Sold By (Replaces redundant Billing Address) */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sold By</h3>
        <div>
          <p className="text-sm font-semibold text-black">Mritsna</p>
          <p className="text-sm text-gray-600">{warehouseAdd}</p>
          <p className="text-sm text-gray-600">{warehouseCity}</p>
          <p className="text-sm text-gray-600">{warehouseCity}, Jharkhand</p>
          <p className="font-mono text-gray-600 mt-1">GSTIN: 20AAFCF1838H1Z0</p>
        </div>
      </div>

      {/* Column 2: Combined Shipping & Billing */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shipping & Billing Address</h3>
        <div>
          <p className="text-sm font-semibold text-black">
            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
            {order.isGuestCheckout && <span className="ml-2 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Guest</span>}
          </p>
          <p className="text-sm text-gray-600">{order.shippingAddress?.street}</p>
          <p className="text-sm text-gray-600">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
          <p className="text-sm text-gray-600">Pin: <span className="font-mono text-gray-800">{order.shippingAddress?.pinCode}</span></p>
          <p className="text-sm text-gray-600 mt-1">Ph: {order.shippingAddress?.phone}</p>
          <p className="text-sm text-gray-600">{order.isGuestCheckout ? order.guestEmail : order.user?.email}</p>
        </div>
      </div>

    </div>
  );
};

export default CustomerLogistics;