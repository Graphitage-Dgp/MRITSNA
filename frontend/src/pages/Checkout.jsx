import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Country, State } from 'country-state-city'; 
import { 
  calculateCheckoutTotals, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../store/features/checkoutSlice'; 
import { fetchAddresses } from '../store/features/addressSlice'; 
import { clearLocalCart, clearCartDB } from '../store/features/cartSlice'; 

import CheckoutAddresses from '../components/checkout/CheckoutAddresses';
import CheckoutForm from '../components/checkout/CheckoutForm';
import CheckoutSummary from '../components/checkout/CheckoutSummary';

// --- META PIXEL UTILITY ---
import { trackInitiateCheckout } from '../utils/metaPixel';

// Helper to dynamically load the Razorpay SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // --- REAL REDUX STATE ---
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cartItems, currencySymbol, currencyCode } = useSelector((state) => state.cart);
  const { 
    appliedCouponCode, 
    paymentOption, 
    skipAutoApply, 
    guestEmail, 
    deviceId 
  } = useSelector((state) => state.checkout);
  
  // Pull addresses from the store
  const { addresses, loading: addressLoading } = useSelector((state) => state.addresses);

  const isGuest = !isAuthenticated;

  // --- MASTER STATE ---
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    street: '', city: '', pinCode: '', 
    country: 'India', countryCode: 'IN', // Default to India
    state: '', stateCode: '' 
  });

  // --- META PIXEL INITIATE CHECKOUT TRACKING ---
  const hasTrackedCheckout = useRef(false);

  useEffect(() => {
    if (cartItems && cartItems.length > 0 && !hasTrackedCheckout.current) {
      const cartTotal = cartItems.reduce(
        (total, item) => total + ((item.finalPrice || item.price || 0) * item.quantity), 
        0
      );

      trackInitiateCheckout(cartTotal, currencyCode || 'INR');
      hasTrackedCheckout.current = true;
    }
  }, [cartItems, currencyCode]);

  // --- HANDOFF 1: Initial Auth Prefill & Fetch Addresses ---
  useEffect(() => {
    if (isAuthenticated && !isGuest) {
      if (user) {
        setFormData(prev => ({ ...prev, email: user.email || '' }));
      }
      dispatch(fetchAddresses());
    }
  }, [user, isGuest, isAuthenticated, dispatch]);

  // --- Address Selection Prefill (WITH REVERSE LOOKUP FIX) ---
  const handleAddressSelect = (address) => {
    setSelectedAddressId(address._id); 

    // 1. Reverse lookup the Country Code
    const allCountries = Country.getAllCountries();
    const matchedCountry = allCountries.find(c => c.name === address.country) || allCountries.find(c => c.isoCode === 'IN');
    const safeCountryCode = matchedCountry ? matchedCountry.isoCode : 'IN';

    // 2. Reverse lookup the State Code using the found Country Code
    const allStates = State.getStatesOfCountry(safeCountryCode);
    const matchedState = allStates.find(s => s.name === address.state);
    const safeStateCode = matchedState ? matchedState.isoCode : '';

    setFormData(prev => ({
      ...prev,
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      email: address.email || prev.email,
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      stateCode: safeStateCode,       
      pinCode: address.pinCode || '',
      country: address.country || 'India',
      countryCode: safeCountryCode,   
      phone: address.phone || prev.phone
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- THE AUTO-CALCULATION ENGINE ---
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const formattedItems = cartItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
      }));

      dispatch(calculateCheckoutTotals({
        items: formattedItems,
        country: formData.country,
        state: formData.state,
        couponCode: appliedCouponCode,
        paymentOption: paymentOption,
        skipAutoApply: skipAutoApply,
        guestEmail: isGuest ? formData.email : undefined,
        deviceId: deviceId || 'browser-fingerprint-fallback' 
      }));
    }
  }, [cartItems, formData.state, formData.country, appliedCouponCode, paymentOption, skipAutoApply, isGuest, formData.email, deviceId, dispatch]);

  // --- THE RAZORPAY GATEWAY HANDLER ---
  const handleProceedToPayment = async () => {
    if (!formData.street || !formData.city || !formData.state || !formData.firstName || !formData.phone) {
      alert("Please complete all required shipping details before paying.");
      return;
    }

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      return;
    }

    const addressPayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pinCode: formData.pinCode,
    };

    const orderPayload = {
      items: cartItems.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
      shippingAddress: addressPayload,
      billingAddress: addressPayload, 
      couponCode: appliedCouponCode,
      paymentOption: paymentOption,
      skipAutoApply: skipAutoApply,
      guestEmail: isGuest ? formData.email : undefined,
      deviceId: deviceId || 'browser-fingerprint-fallback'
    };

    const resultAction = await dispatch(createRazorpayOrder(orderPayload));

    if (createRazorpayOrder.fulfilled.match(resultAction)) {
      const { razorpayOrderId, orderId, amount, currency, keyId } = resultAction.payload;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Mritsna",
        description: "Secure Checkout",
        order_id: razorpayOrderId,
        handler: async function (response) {
          const verifyPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            db_order_id: orderId
          };

          const verifyAction = await dispatch(verifyRazorpayPayment(verifyPayload));
          
          if (verifyRazorpayPayment.fulfilled.match(verifyAction)) {
            // 1. WIPE THE CART
            if (isGuest) {
              dispatch(clearLocalCart());
            } else {
              dispatch(clearCartDB());
            }

            // 2. REDIRECT SAFELY
            const confirmedOrderNumber = verifyAction.payload.data.orderNumber;
            
            const trackingId = isGuest ? confirmedOrderNumber : orderId; 

            const queryParams = isGuest && formData.email ? `?email=${encodeURIComponent(formData.email.toLowerCase())}` : "";
            
            navigate(`/track-order/${trackingId}${queryParams}`, { replace: true });
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#171410" 
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response){
        alert(`Payment Failed: ${response.error.description}`);
      });
      
      paymentObject.open();

    } else {
      alert(resultAction.payload?.message || "Failed to initialize the order in the database.");
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[100px] pb-20 selection:bg-[#1a1a1a] selection:text-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        <div className="mb-12">
          <h1 className="text-3xl font-light tracking-wide">Checkout</h1>
          <p className="text-xs text-gray-500 mt-2 tracking-widest uppercase">Secure Encrypted Transaction</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 relative">
          
          <div className="w-full lg:w-[60%] flex flex-col gap-12">
            <CheckoutAddresses 
              isGuest={isGuest} 
              addresses={addresses}
              loading={addressLoading}
              selectedAddressId={selectedAddressId} 
              onSelect={handleAddressSelect} 
            />
            
            {(!isGuest && addresses && addresses.length > 0) && (
               <hr className="border-black/5" />
            )}
            
            <CheckoutForm 
              formData={formData} 
              onChange={handleFormChange} 
              setFormData={setFormData} 
              isGuest={isGuest} 
            />
          </div>

          <div className="w-full lg:w-[40%]">
            <div className="sticky top-[120px]">
              <CheckoutSummary 
                cartItems={cartItems} 
                shippingState={formData.state} 
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
                onPay={handleProceedToPayment}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Checkout;