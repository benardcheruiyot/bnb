// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container text-center" style={{ marginTop: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/eligibility" replace />;
  }

  return children;
};

export default ProtectedRoute;
