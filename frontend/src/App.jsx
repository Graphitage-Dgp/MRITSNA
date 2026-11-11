import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast'; 
import Navbar from './components/navbar/Navbar';
import PageRouter from './routes/PageRouter';
import PreFooterContact from './components/footer/PreFooterContact';
import Footer from './components/footer/Footer';
import CustomCursor from './components/global/CustomCursor';
import RouteTracker from './components/RouteTracker';
import CartDrawer from './components/cart/CartDrawer';

import { checkAuth } from "./store/features/authSlice";
import { fetchUserCart, hydrateGuestCartAPI } from './store/features/cartSlice';
import { fetchUserWishlist, hydrateGuestWishlistAPI } from './store/features/wishlistSlice';
import { fetchUserRegion } from './store/features/regionSlice'; 

const App = () => {
  const dispatch = useDispatch();
  
  const { isCheckingAuth, isAuthenticated } = useSelector((state) => state.auth);
  const { data: regionData } = useSelector((state) => state.region);
  
  const [isAppReady, setIsAppReady] = useState(false);

  // 1. P2: Currency state strictly defaults to INR (₹).
  // Only refresh foreign exchange rate if the user explicitly switched the currency dropdown.
  useEffect(() => {
    if (!regionData) {
      dispatch(fetchUserRegion("IN"));
    } else if (regionData.isManual && regionData.countryCode && regionData.countryCode !== "IN") {
      dispatch(fetchUserRegion(regionData.countryCode));
    }
  }, [regionData?.countryCode, regionData?.isManual, dispatch]);

  // 2. Fire the Auth Check on Mount
  useEffect(() => {
    dispatch(checkAuth()).finally(() => {
      setIsAppReady(true); 
    });
  }, [dispatch]);

  // 3. Fetch Cart & Wishlist once Auth Check settles
  useEffect(() => {
    if (isAppReady) {
      if (isAuthenticated) {
        dispatch(fetchUserCart());
        dispatch(fetchUserWishlist());
      } else {
        dispatch(hydrateGuestCartAPI());
        dispatch(hydrateGuestWishlistAPI()); 
      }
    }
  }, [isAuthenticated, isAppReady, dispatch]);

  // 4. Global UI Blocker (No longer blocked by IP Geo-lookup since INR is synchronous default)
  if (isCheckingAuth || !isAppReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#f8f8f8]">
        <div className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 animate-pulse">
          Loading Mritsna...
        </div>
      </div>
    );
  }

  return (
    <div className='wrapper w-full relative'>
      
      <RouteTracker />
      
      {/* --- GLOBAL TOASTER NOTIFICATION SYSTEM --- */}
      <Toaster 
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 999999999,
          top: '70px',
        }}
        toastOptions={{
          style: {
            background: '#171410', 
            color: '#f8f8f8',
            fontSize: '12px',
            borderRadius: '2px',
            letterSpacing: '0.05em'
          },
          success: {
            iconTheme: {
              primary: '#f8f8f8',
              secondary: '#171410',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4b4b',
              secondary: '#f8f8f8',
            },
          },
        }}
      />
      
      <CustomCursor />
      
      <header className='w-full'>
        <Navbar />
      </header>

      {/* P0: Global Instant Slide-Over Cart Drawer */}
      <CartDrawer />
      
      <main className='w-full'>
        <PageRouter />
        <PreFooterContact />
      </main>
      
      <Footer />
    </div>
  );
};

export default App;