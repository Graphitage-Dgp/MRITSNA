import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    if (!user?.isVerified) {
      return <Navigate to="/account/verify" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;