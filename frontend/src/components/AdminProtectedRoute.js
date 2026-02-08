import React from 'react';
import { Navigate } from 'react-router-dom';

// Компонент для защиты маршрутов, требующих авторизацию администратора
const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!adminToken || !isAdmin) {
    // Если администратор не авторизован, перенаправляем на страницу входа для администраторов
    return <Navigate to="/admin/login" replace />;
  }
  
  // Если администратор авторизован, отображаем дочерние компоненты
  return children;
};

export default AdminProtectedRoute;