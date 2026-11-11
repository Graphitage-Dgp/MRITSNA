import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthLoader = () => (
  <div className="w-full min-h-screen bg-[#f8f8f8] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a1a1a]"></div>
  </div>
);

// 1. Guest Guard: For /signin. If already verified, kick DIRECTLY to dashboard.
export const GuestGuard = ({ children }) => {
  const { isAuthenticated, isVerified, isInitializing } = useSelector((state) => state.auth);

  if (isInitializing) return <AuthLoader />;

  if (isAuthenticated && isVerified) {
    // ✅ FIX: Navigate directly to the dashboard, avoiding the "/" redirect chain
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (isAuthenticated && !isVerified) {
    return <Navigate to="/verify" replace />;
  }
  return children;
};

// 2. Verify Guard: For /verify. Must be authenticated, but NOT verified.
export const VerifyGuard = ({ children }) => {
  const { isAuthenticated, isVerified, isInitializing } = useSelector((state) => state.auth);

  if (isInitializing) return <AuthLoader />;

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (isVerified) {
    // ✅ FIX: Direct redirect here as well
    return <Navigate to="/admin/dashboard" replace />; 
  }
  
  return children;
};

// 3. Admin Guard: For Dashboard. Must have passed both steps.
export const AdminGuard = ({ children }) => {
  const { isAuthenticated, isVerified, isInitializing } = useSelector((state) => state.auth);

  if (isInitializing) return <AuthLoader />;

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isVerified) return <Navigate to="/verify" replace />;

  return children;
};