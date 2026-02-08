// src/club/components/ClubProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useClub } from '../contexts/ClubContext';

const ClubProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useClub();

  if (loading) {
    return (
      <div className="club-loading">
        <div className="loading-spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/club/login" replace />;
};

export default ClubProtectedRoute;
