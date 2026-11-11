import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useDispatch, useSelector } from 'react-redux';
import { setPaymentOption, setManualCoupon, removeCoupon } from '../../store/features/checkoutSlice';

// Helper for optimized ImageKit URLs
const getOptimizedImgUrl = (url) => {
  if (!url) return "";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-200,q-80`; 
};

const CheckoutSummary = ({ cartItems, shippingState, currencySymbol, currencyCode, onPay }) => {
  const dispatch = useDispatch();
  const [localCouponInput, setLocalCouponInput] = useState('');
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  // --- LIVE REDUX DATA ---
  const { 
    financials, 
    appliedCouponCode, 
    paymentOption, 
    calculationStatus,
    orderCreationStatus, 
    error 
  } = useSelector((state) => state.checkout);

  const formatPrice = (price) => {
    const locale = currencyCode === "INR" ? "en-IN" : "en-US";
    return `${currencySymbol || "₹"} ${Number(price || 0).toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  const handleApplyCoupon = () => {
    if (localCouponInput.trim()) {
      dispatch(setManualCoupon(localCouponInput.trim().toUpperCase()));
      setLocalCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  const isProcessing = calculationStatus === 'loading' || orderCreationStatus === 'loading';

  // --- ERROR CATEGORIZATION ENGINE ---
  const isCouponError = error && (
    error.toLowerCase().includes('coupon') || 
    error.toLowerCase().includes('eligible') ||
    error.toLowerCase().includes('discount') ||
    appliedCouponCode !== null 
  );
  
  const isGeneralError = error && !isCouponError;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 relative flex flex-col">
      
      {/* Loading Overlay */}
      {calculationStatus === 'loading' && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
           <Icon icon="lucide:loader-2" className="animate-spin text-black" width="24" />
        </div>
      )}

      <h2 className="text-lg font-medium mb-6">Order Summary</h2>

      {/* --- SYSTEM CRASH / GENERAL ERROR BANNER --- */}
      {isGeneralError && calculationStatus === 'failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-800 animate-in fade-in slide-in-from-top-2">
          <Icon icon="lucide:alert-triangle" className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] uppercase tracking-widest font-bold text-red-600 mb-1">System Notice</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Cart Items Preview (Scroll-Hijack Fix Applied Here) */}
      <div 
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
      >
        {cartItems && cartItems.length > 0 ? (
          cartItems.map((item, idx) => (
            <div key={item.variantId || idx} className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative shrink-0">
                 <img src={getOptimizedImgUrl(item.img)} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                 <span className="absolute top-0 right-0 bg-black text-white text-[0.5rem] w-5 h-5 flex items-center justify-center rounded-full z-10">
                   {item.quantity}
                 </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">{item.colorName}</p>
              </div>
              <p className="text-sm shrink-0">{formatPrice(item.priceAtPurchase || item.price)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">Your cart is empty.</p>
        )}
      </div>

      {/* Coupon Engine UI */}
      <div className="mb-8 border-b border-black/10 pb-8">
        {appliedCouponCode ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:tag" width="14" />
              <span className="font-bold">{appliedCouponCode}</span>
            </div>
            <button onClick={handleRemoveCoupon} className="hover:text-black transition-colors">
              <Icon icon="lucide:x" width="16" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-col lg:flex-row">
              <input 
                type="text" 
                value={localCouponInput}
                onChange={(e) => setLocalCouponInput(e.target.value.toUpperCase())}
                placeholder="Gift card or discount code" 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black uppercase tracking-widest transition-colors"
              />
              <button 
                onClick={handleApplyCoupon}
                className="bg-black text-white px-6 py-3 rounded-lg text-[0.65rem] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
            </div>
            
            {/* --- SPECIFIC COUPON ERROR DISPLAY --- */}
            {isCouponError && calculationStatus === 'failed' && (
              <p className="text-[0.65rem] text-red-600 tracking-widest uppercase font-bold px-1 mt-1 flex items-center gap-1">
                <Icon icon="lucide:alert-circle" width="12" /> {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Live Financial Breakdown */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Item Total (Tax Incl.)</span>
          <span>{formatPrice(financials.subTotal)}</span>
        </div>

        {financials.discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(financials.discountAmount)}</span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
          <div className="flex justify-between text-gray-500 mb-2">
            <span>Taxable Value</span>
            <span>{formatPrice(financials.taxableAmount)}</span>
          </div>

          <button 
            type="button"
            onClick={() => setShowTaxDetails(!showTaxDetails)}
            className="w-full flex justify-between text-gray-500 hover:text-black transition-colors items-center group"
          >
            <span className="flex items-center gap-1">
              Total Tax (Included)
              <Icon icon="lucide:chevron-down" className={`transition-transform duration-300 ${showTaxDetails ? 'rotate-180' : ''}`} />
            </span>
            <span>{formatPrice(financials.totalTaxAmount)}</span>
          </button>
          
          <div className={`overflow-hidden transition-all duration-500 ${showTaxDetails ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-500 space-y-1">
              {financials.taxDetails && financials.taxDetails.length > 0 ? (
                financials.taxDetails.map((tax, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{tax.taxType} ({tax.rate}%)</span>
                    <span>{formatPrice(tax.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="italic text-[0.6rem]">{shippingState ? "Tax calculation applied." : "Enter state to see detailed tax breakdown."}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between text-lg font-medium pt-4 border-t border-black/10 mt-4">
          <span>Grand Total</span>
          <span>{formatPrice(financials.grandTotal)}</span>
        </div>
      </div>

      {/* Payment Options */}
      <div className="mt-8 pt-6 border-t border-black/10">
        <h3 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">Payment Options</h3>
        <div className="space-y-3">
          <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${paymentOption === 'FULL_ONLINE' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black/30'}`}>
            <div className="flex items-center gap-3">
              <input 
                type="radio" 
                name="paymentType" 
                checked={paymentOption === 'FULL_ONLINE'} 
                onChange={() => dispatch(setPaymentOption('FULL_ONLINE'))}
                className="w-4 h-4 text-black focus:ring-black" 
              />
              <span className="text-sm font-medium">Pay In Full</span>
            </div>
          </label>

          <label className={`flex items-start justify-between p-4 rounded-lg border cursor-pointer transition-all ${paymentOption === 'PARTIAL_COD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black/30'}`}>
            <div className="flex items-center gap-3">
              <input 
                type="radio" 
                name="paymentType" 
                checked={paymentOption === 'PARTIAL_COD'} 
                onChange={() => dispatch(setPaymentOption('PARTIAL_COD'))}
                className="w-4 h-4 text-black focus:ring-black mt-1" 
              />
              <div>
                <span className="text-sm font-medium block">20% Advance (COD)</span>
                <span className="text-xs text-gray-500 mt-1 block">Pay 20% now to confirm. Pay the rest on delivery.</span>
              </div>
            </div>
          </label>
        </div>

        {paymentOption === 'PARTIAL_COD' && (
           <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-900 flex justify-between items-center">
             <span>Due Today (20%):</span>
             <span className="font-bold text-lg">{formatPrice(financials.advancePaid)}</span>
           </div>
        )}
      </div>

      <button 
        onClick={onPay}
        disabled={!cartItems || cartItems.length === 0 || isProcessing}
        className="w-full bg-black text-white py-4 mt-8 rounded-lg text-xs font-bold tracking-[0.2em] uppercase hover:bg-gray-900 transform hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isProcessing ? <Icon icon="lucide:loader-2" className="animate-spin" width="16" /> : `Pay ${formatPrice(financials.paymentAmount)}`}
      </button>
    </div>
  );
};

export default CheckoutSummary;