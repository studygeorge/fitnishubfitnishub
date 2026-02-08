import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.admin.login(credentials);
      
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('isAdmin', 'true');
      
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-logo">
          <h1>FitnessHub</h1>
          <p>Панель администратора</p>
        </div>
        
        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}
          
          <div className="admin-form-group">
            <label htmlFor="username">Логин</label>
            <input
              id="username"
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Введите логин администратора"
              autoComplete="off"
            />
          </div>
          
          <div className="admin-form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Введите пароль"
            />
          </div>
          
          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти в систему'}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <p>FitnessHub Admin Panel &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;