import React from 'react';
import { Navigate } from 'react-router-dom';

// Компонент для защиты маршрутов, требующих авторизацию клуба
const ClubProtectedRoute = ({ children }) => {
  const clubToken = localStorage.getItem('clubToken');
  const isClubOwner = localStorage.getItem('isClubOwner');
  
  if (!clubToken || isClubOwner !== 'true') {
    // Если владелец клуба не авторизован, перенаправляем на страницу входа для клубов
    return <Navigate to="/club-login" replace />;
  }
  
  // Если владелец клуба авторизован, отображаем дочерние компоненты
  return children;
};

export default ClubProtectedRoute;
