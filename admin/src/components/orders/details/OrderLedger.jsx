import React from "react";

const OrderLedger = ({ order }) => {
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: order.paymentCurrency || 'INR',
  });

  const grandTotal = (order.advancePaid || 0) + (order.balanceDueOnDelivery || 0) || order.paymentAmount || 0;

  return (
    <div className="py-8 border-b border-gray-100">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-6">Order Ledger</h3>
      
      {/* Items Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Product</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Price</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Qty</th>
              <th className="pb-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="py-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-sm overflow-hidden border border-gray-200">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm text-black font-medium">{item.title}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.colorName}</p>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-600">{currencyFormatter.format(item.priceAtPurchase)}</td>
                <td className="py-4 text-sm text-gray-600">x{item.quantity}</td>
                <td className="py-4 text-right text-sm text-black font-medium">{currencyFormatter.format(item.itemTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Math */}
      <div className="flex justify-end">
        <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{currencyFormatter.format(order.subTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Shipping</span>
            <span>{currencyFormatter.format(order.shippingCost)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-[#9E4646]">
              <span>Discount</span>
              <span>-{currencyFormatter.format(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
            <span className="uppercase tracking-widest">Total Tax Collected</span>
            <span>{currencyFormatter.format(order.totalTaxAmount)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className="uppercase tracking-widest">Base Revenue (Profit)</span>
            <span>{currencyFormatter.format(order.baseRevenue)}</span>
          </div>
          <div className="flex justify-between text-lg text-black font-light pt-4 border-t border-gray-900 mt-2">
            <span>Grand Total</span>
            <span>{currencyFormatter.format(grandTotal)}</span>
          </div>

          {/* Conditional COD / Partial COD Block */}
          {(order.paymentOption === 'PARTIAL_COD' || order.balanceDueOnDelivery > 0) && (
            <div className="pt-3 mt-3 border-t border-gray-100 border-dashed space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Advance Paid Online</span>
                <span>{currencyFormatter.format(order.advancePaid || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-black">
                <span>Balance Due (To Collect)</span>
                <span>{currencyFormatter.format(order.balanceDueOnDelivery || 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderLedger;