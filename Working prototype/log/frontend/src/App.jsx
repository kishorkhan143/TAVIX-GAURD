/**
 * AuthSentinel — Main App Router
 * ================================
 * Handles authentication routing and protects dashboard routes.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'motion/react';

// Pages & Components
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './Dashboard';

// Auth & Providers
import { useAuth } from './useAuth';
import { DateProvider } from './dateFilterUtils';

export default function App() {
  const { token, user, isLoading, isAuthenticated, login, logout } = useAuth();

  const handleVerified = (jwtToken) => {
    login(jwtToken);
  };

  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage onVerified={handleVerified} />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
              <DateProvider>
                <Dashboard user={user} onLogout={logout} />
              </DateProvider>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </MotionConfig>
  );
}
