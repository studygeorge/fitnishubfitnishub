// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Импорт Layout компонентов
import Layout from './components/Layout/Layout';

// Импорт компонентов страниц
import HomePage from './pages/HomePage';
import ClubsPage from './pages/ClubsPage';
import SchedulePage from './pages/SchedulePage';
import ProfilePage from './pages/ProfilePage';
import BalancePage from './pages/BalancePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClubDetailPage from './components/club/ClubDetailPage';
import ClubRegisterPage from './pages/ClubRegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminRegisterClubPage from './pages/AdminRegisterClubPage';
import AdminRegisterOwnerPage from './pages/AdminRegisterOwnerPage';

// Импорт юридических страниц
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import RecommendationPolicyPage from './pages/RecommendationPolicyPage';
import UserRulesPage from './pages/UserRulesPage';
import OfertaPartners from './pages/OfertaPartners'; // Новая страница договора оферты для партнеров

// Импорт клубных компонентов
import { ClubProvider } from './club/contexts/ClubContext';
import ClubLoginPage from './club/pages/ClubLoginPage';
import ClubDashboard from './club/pages/ClubDashboard';
import ClubSchedulePage from './club/pages/ClubSchedulePage';
import ClubBookingsPage from './club/pages/ClubBookingsPage';
import ClubProfilePage from './club/pages/ClubProfilePage';
import ClubFinancesPage from './club/pages/ClubFinancesPage';
import ClubSettingsPage from './club/pages/ClubSettingsPage';
import ClubTemplatesPage from './club/pages/ClubTemplatesPage';

// Импорт компонентов для защищенных маршрутов
import ProtectedRoute from './components/ProtectedRoute';
import ClubProtectedRoute from './club/components/ClubProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Контекст авторизации
import { AuthProvider } from './contexts/AuthContext';

const AppContent = () => {
  return (
    <Routes>
      {/* Админские маршруты БЕЗ Layout */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={
        <AdminProtectedRoute>
          <AdminDashboardPage />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/clubs/register" element={
        <AdminProtectedRoute>
          <AdminRegisterClubPage />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/clubs/:id/edit" element={
        <AdminProtectedRoute>
          <AdminRegisterClubPage isEdit={true} />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/users/register-owner" element={
        <AdminProtectedRoute>
          <AdminRegisterOwnerPage />
        </AdminProtectedRoute>
      } />

      {/* Клубские маршруты БЕЗ Layout */}
      <Route path="/club/login" element={
        <ClubProvider>
          <ClubLoginPage />
        </ClubProvider>
      } />
      <Route path="/club/dashboard" element={
        <ClubProvider>
          <ClubProtectedRoute>
            <ClubDashboard />
          </ClubProtectedRoute>
        </ClubProvider>
      } />
      <Route path="/club/schedule" element={
        <ClubProvider>
          <ClubProtectedRoute>
            <ClubSchedulePage />
          </ClubProtectedRoute>
        </ClubProvider>
      } />
      <Route path="/club/bookings" element={
        <ClubProvider>
          <ClubProtectedRoute>
            <ClubBookingsPage />
          </ClubProtectedRoute>
        </ClubProvider>
      } />
      <Route path="/club/profile" element={
        <ClubProvider>
          <ClubProtectedRoute>
            <ClubProfilePage />
          </ClubProtectedRoute>
        </ClubProvider>
      } />
      <Route path="/club/finances" element={
        <ClubProvider>
          <ClubProtectedRoute>
            <ClubFinancesPage />
          </ClubProtectedRoute>
        </ClubProvider>
      } />
      <Route path="/club/templates" element={
        <ClubProvider>
          <ClubProtectedRoute>
            <ClubTemplatesPage />
          </ClubProtectedRoute>
        </ClubProvider>
      } />
      <Route path="/club/settings" element={
        <ClubProvider>
          <ClubProtectedRoute>
            <ClubSettingsPage />
          </ClubProtectedRoute>
        </ClubProvider>
      } />

      {/* Основные маршруты С Layout */}
      <Route path="/" element={
        <Layout>
          <HomePage />
        </Layout>
      } />
      <Route path="/clubs" element={
        <Layout>
          <ClubsPage />
        </Layout>
      } />
      <Route path="/clubs/:id" element={
        <Layout>
          <ClubDetailPage />
        </Layout>
      } />
      <Route path="/schedule" element={
        <Layout>
          <SchedulePage />
        </Layout>
      } />
      <Route path="/profile" element={
        <Layout>
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </Layout>
      } />
      <Route path="/balance" element={
        <Layout>
          <ProtectedRoute>
            <BalancePage />
          </ProtectedRoute>
        </Layout>
      } />
      <Route path="/login" element={
        <Layout>
          <LoginPage />
        </Layout>
      } />
      <Route path="/register" element={
        <Layout>
          <RegisterPage />
        </Layout>
      } />
      <Route path="/club-register" element={
        <Layout>
          <ClubRegisterPage />
        </Layout>
      } />

      {/* Юридические страницы С Layout */}
      <Route path="/privacy-policy" element={
        <Layout>
          <PrivacyPolicyPage />
        </Layout>
      } />
      <Route path="/terms-of-service" element={
        <Layout>
          <TermsOfServicePage />
        </Layout>
      } />
      <Route path="/recommendation-policy" element={
        <Layout>
          <RecommendationPolicyPage />
        </Layout>
      } />
      <Route path="/user-rules" element={
        <Layout>
          <UserRulesPage />
        </Layout>
      } />
      
      {/* Новая страница договора оферты для партнеров */}
      <Route path="/partner-agreement" element={
        <Layout>
          <OfertaPartners />
        </Layout>
      } />
      
      {/* Альтернативные URL для договора оферты партнеров */}
      <Route path="/oferta-partners" element={
        <Layout>
          <OfertaPartners />
        </Layout>
      } />
      <Route path="/club-agreement" element={
        <Layout>
          <OfertaPartners />
        </Layout>
      } />
      
      {/* 404 страница */}
      <Route path="*" element={
        <Layout>
          <div className="not-found">
            <h2>Страница не найдена</h2>
            <p>Запрашиваемая страница не существует</p>
          </div>
        </Layout>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
