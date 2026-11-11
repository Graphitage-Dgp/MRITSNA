import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requireVerification = true }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Not logged in at all? Kick to Sign In.
  if (!isAuthenticated) {
    return <Navigate to="/account/signin" replace />;
  }

  // Are they trying to access a normal account page, but aren't verified? Kick to Verify.
  if (requireVerification && !user?.isVerified) {
    return <Navigate to="/account/verify" replace />;
  }

  // Are they trying to access the Verify page, but are ALREADY verified? Kick to Home.
  if (!requireVerification && user?.isVerified) {
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render the page
  return children;
};

export default ProtectedRoute;