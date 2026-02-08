// src/club/contexts/ClubContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ClubContext = createContext();

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub должен использоваться внутри ClubProvider');
  }
  return context;
};

export const ClubProvider = ({ children }) => {
  const [clubOwner, setClubOwner] = useState(null);
  const [club, setClub] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('clubToken');
      const clubId = localStorage.getItem('clubId');
      
      if (token && clubId) {
        // Получаем данные клуба
        const clubData = await api.clubs.getById(clubId);
        setClub(clubData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Ошибка при проверке авторизации клуба:', error);
      localStorage.removeItem('clubToken');
      localStorage.removeItem('clubId');
      localStorage.removeItem('isClubOwner');
      setClubOwner(null);
      setClub(null);
      setIsAuthenticated(false);
      setError('Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Поддержка только объектного формата: login({ email, password })
      const loginData = credentials;
      
      const response = await api.auth.clubLogin(loginData);
      const { token, user, clubId, clubName, balance } = response;
      
      // Сохраняем токены и данные
      localStorage.setItem('clubToken', token);
      localStorage.setItem('clubId', clubId);
      localStorage.setItem('isClubOwner', 'true');
      
      // Устанавливаем состояние
      setIsAuthenticated(true);
      setClubOwner(user);
      
      // Если есть данные клуба в ответе, используем их
      if (clubId) {
        const clubData = { 
          id: clubId, 
          name: clubName, 
          balance, 
          ...response 
        };
        setClub(clubData);
      } else {
        // Если нет данных клуба, получаем их отдельно
        try {
          const clubData = await api.clubs.getById(clubId);
          setClub(clubData);
        } catch (clubError) {
          console.error('Ошибка получения данных клуба:', clubError);
          // Не критично, данные клуба можно получить позже
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при входе:', error);
      setError(error.message);
      return { 
        success: false, 
        error: error.message || 'Ошибка при входе' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Сначала очищаем локальные данные для мгновенного отклика UI
      localStorage.removeItem('clubToken');
      localStorage.removeItem('clubId');
      localStorage.removeItem('isClubOwner');
      setClubOwner(null);
      setClub(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Затем уведомляем сервер (но не ждем ответа)
      api.auth.clubLogout().catch(error => {
        console.error('Ошибка при выходе на сервере:', error);
        // Игнорируем ошибки сервера при выходе, так как локально уже очистили
      });
      
      // Перенаправляем на страницу входа
      navigate('/club/login');
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Даже если произошла ошибка, очищаем локальные данные
      localStorage.removeItem('clubToken');
      localStorage.removeItem('clubId');
      localStorage.removeItem('isClubOwner');
      setClubOwner(null);
      setClub(null);
      setIsAuthenticated(false);
      navigate('/club/login');
      return { success: true };
    }
  };

  const updateClub = (clubData) => {
    setClub(prevClub => ({ ...prevClub, ...clubData }));
  };

  const refreshClubData = async () => {
    if (!club?.id) return;
    
    try {
      const updatedClub = await api.clubs.getById(club.id);
      setClub(updatedClub);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при обновлении данных клуба:', error);
      return { 
        success: false, 
        error: error.message || 'Ошибка при обновлении данных клуба' 
      };
    }
  };

  const value = {
    clubOwner,
    club,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    updateClub,
    refreshClubData,
    checkAuthStatus
  };

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
};