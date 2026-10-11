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
        {/* Redirect root to login if not authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage onVerified={handleVerified} />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
              <DateProvider>
                <Dashboard user={user} onLogout={logout} />
              </DateProvider>
            </ProtectedRoute>
          }
        />

        {/* Catch-all - redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MotionConfig>
  );
}
