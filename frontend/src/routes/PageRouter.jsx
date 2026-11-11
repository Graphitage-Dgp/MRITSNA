import React from "react";
import { Route, Routes } from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Verification from "../pages/Verification";
import Homepage from "../pages/Homepage";
import About from "../pages/About";
import Shop from "../pages/Shop";
import Product from "../pages/Product";
import Dashboard from "../pages/Dashboard";
import Orders from "../pages/Orders"; 
import TrackOrder from "../pages/TrackOrder";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Checkout from "../pages/Checkout";
import NotFound from "../pages/NotFound";
import Addresses from "../pages/Addresses";
import Contact from "../pages/Contact";
import Collection from "../pages/Collection";

// Auth Wrappers
import GuestRoute from "../components/auth/GuestRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ShippingPolicy from "../pages/ShippingPolicy";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Terms from "../pages/Terms";

const PageRouter = () => {
  return (
    <Routes>
      {/* ==========================================
          PUBLIC ROUTES
      ========================================== */}
      <Route path="/" element={<Homepage />} />
      <Route path="/about" element={<About />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:slug" element={<Product />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/track-order/:orderId?" element={<TrackOrder />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/shipping-returns" element={<ShippingPolicy />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />

      {/* ==========================================
          GUEST ROUTES (Only accessible if NOT logged in)
      ========================================== */}
      <Route 
        path="/account/signin" 
        element={
          <GuestRoute>
            <SignIn />
          </GuestRoute>
        } 
      />
      
      <Route 
        path="/account/signup" 
        element={
          <GuestRoute>
            <SignUp />
          </GuestRoute>
        } 
      />

      {/* ==========================================
          SEMI-PROTECTED: VERIFICATION PAGE 
          (Must be logged in, but UNVERIFIED)
      ========================================== */}
      <Route 
        path="/account/verify" 
        element={
          <ProtectedRoute requireVerification={false}>
            <Verification />
          </ProtectedRoute>
        } 
      />

      {/* ==========================================
          FULLY PROTECTED ROUTES 
          (Must be logged in AND Verified)
      ========================================== */}
      <Route 
        path="/account" 
        element={
          <ProtectedRoute requireVerification={true}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/account/orders" 
        element={
          <ProtectedRoute requireVerification={true}>
            <Orders />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/account/addresses" 
        element={
          <ProtectedRoute requireVerification={true}>
            <Addresses />
          </ProtectedRoute>
        } 
      />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
      
    </Routes>
  );
};

export default PageRouter;