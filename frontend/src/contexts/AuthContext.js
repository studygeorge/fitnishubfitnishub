// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Проверка токена при загрузке
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await api.auth.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Ошибка при проверке авторизации:', error);
      // Если токен недействителен, очищаем его
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.auth.login(credentials);
      const { token, user: userData } = response;
      
      localStorage.setItem('token', token);
      
      // Если в ответе есть данные пользователя, используем их
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Если данных пользователя нет в ответе, получаем их отдельно
        try {
          const userProfile = await api.auth.getCurrentUser();
          setUser(userProfile);
          setIsAuthenticated(true);
        } catch (profileError) {
          console.error('Ошибка получения профиля после входа:', profileError);
          // Даже если не удалось получить профиль, считаем что вход выполнен
          setIsAuthenticated(true);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return { 
        success: false, 
        error: error.message || 'Ошибка при входе' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.auth.register(userData);
      const { token, user: newUser } = response;
      
      localStorage.setItem('token', token);
      
      // Если в ответе есть данные пользователя, используем их
      if (newUser) {
        setUser(newUser);
        setIsAuthenticated(true);
      } else {
        // Если данных пользователя нет в ответе, получаем их отдельно
        try {
          const userProfile = await api.auth.getCurrentUser();
          setUser(userProfile);
          setIsAuthenticated(true);
        } catch (profileError) {
          console.error('Ошибка получения профиля после регистрации:', profileError);
          // Даже если не удалось получить профиль, считаем что регистрация выполнена
          setIsAuthenticated(true);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      return { 
        success: false, 
        error: error.message || 'Ошибка при регистрации' 
      };
    }
  };

  const logout = async () => {
    try {
      // Сначала очищаем локальные данные для мгновенного отклика UI
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      
      // Затем уведомляем сервер (но не ждем ответа)
      api.auth.logout().catch(error => {
        console.error('Ошибка при выходе на сервере:', error);
        // Игнорируем ошибки сервера при выходе, так как локально уже очистили
      });
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Даже если произошла ошибка, очищаем локальные данные
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await api.users.updateProfile(profileData);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      return { 
        success: false, 
        error: error.message || 'Ошибка при обновлении профиля' 
      };
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      await api.users.updatePassword(passwordData);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при смене пароля:', error);
      return { 
        success: false, 
        error: error.message || 'Ошибка при смене пароля' 
      };
    }
  };

  // Функция для принудительного обновления профиля
  const refreshUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && isAuthenticated) {
        console.log('🔄 Обновляем данные пользователя...');
        const userData = await api.auth.getCurrentUser();
        setUser(userData);
        console.log('✅ Данные пользователя обновлены:', userData);
        return { success: true, user: userData };
      }
      return { success: false, error: 'Пользователь не авторизован' };
    } catch (error) {
      console.error('❌ Ошибка при обновлении профиля:', error);
      return { 
        success: false, 
        error: error.message || 'Ошибка при обновлении профиля' 
      };
    }
  };

  // Функция для проверки Telegram статуса
  const checkTelegramStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Нет токена' };

      console.log('🔍 Проверяем Telegram статус...');
      
      const response = await fetch('/api/telegram/user/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📱 Telegram статус с сервера:', data);
      
      if (data.success) {
        return {
          success: true,
          isLinked: data.isLinked,
          telegramUsername: data.telegramUsername,
          connected: data.connected
        };
      }
      
      return { success: false, error: data.message };
    } catch (error) {
      console.error('❌ Ошибка проверки Telegram статуса:', error);
      return { success: false, error: error.message };
    }
  };

  // НОВЫЕ ФУНКЦИИ ДЛЯ АВАТАРОВ
  const uploadAvatar = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Нет токена' };

      console.log('📤 Загружаем аватар...');
      
      // Используем существующий API метод
      const result = await api.users.uploadAvatar(file);
      
      console.log('✅ Аватар загружен:', result.profile_image);
      
      // Обновляем данные пользователя
      setUser(prevUser => ({
        ...prevUser,
        profile_image: result.profile_image
      }));
      
      return { success: true, imageUrl: result.profile_image };
    } catch (error) {
      console.error('❌ Ошибка загрузки аватара:', error);
      return { success: false, error: error.message };
    }
  };

  const removeAvatar = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Нет токена' };

      console.log('🗑️ Удаляем аватар...');
      
      // Используем существующий API метод
      await api.users.deleteAvatar();
      
      console.log('✅ Аватар удален');
      
      // Обновляем данные пользователя
      setUser(prevUser => ({
        ...prevUser,
        profile_image: null
      }));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления аватара:', error);
      return { success: false, error: error.message };
    }
  };

  const getAvatar = async (userId = null) => {
    try {
      console.log('🔍 Получаем аватар...');
      
      const result = await api.users.getAvatar(userId);
      
      return { 
        success: true, 
        profile_image: result.profile_image,
        hasAvatar: result.hasAvatar 
      };
    } catch (error) {
      console.error('❌ Ошибка получения аватара:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    updatePassword,
    checkAuthStatus,
    refreshUserProfile,
    checkTelegramStatus,
    uploadAvatar,     // НОВОЕ
    removeAvatar,     // НОВОЕ  
    getAvatar,        // НОВОЕ
    // Предоставляем доступ к API для компонентов
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};