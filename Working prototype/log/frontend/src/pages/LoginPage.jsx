/**
 * LoginPage — Email Verification Login
 * =====================================
 * Users enter their email to receive a verification link.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import '../styles/LoginPage.css';
import tavixLogo from '../assets/tavix-guard-logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Failed to send verification email');
        return;
      }

      setIsSuccess(true);
      setEmail('');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background gradient */}
      <div className="login-bg-gradient" />

      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="login-logo-section">
          <img src={tavixLogo} alt="TAVIX GUARD" className="login-logo-img" />
          <div className="login-logo-text">
            <h1>TAVIX GUARD</h1>
            <p>Security Event Monitoring</p>
          </div>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <motion.div
            className="login-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="success-icon">✓</div>
            <h2>Verification email sent!</h2>
            <p>Check your inbox for a verification link. It will expire in 15 minutes.</p>
            <button
              onClick={() => setIsSuccess(false)}
              className="btn-send-another"
            >
              Send another email
            </button>
          </motion.div>
        )}

        {/* Login Form */}
        {!isSuccess && (
          <motion.form
            className="login-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Welcome to TAVIX GUARD</h2>
            <p className="login-subtitle">
              Enter your email to receive a verification link
            </p>

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={isLoading}
                autoFocus
                className="form-input"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="error-icon">⚠</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn-submit ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Sending...
                </>
              ) : (
                'Send Verification Link'
              )}
            </button>

            {/* Info */}
            <div className="login-info">
              <p>
                We'll send you an email with a link to verify your identity.
                <br />
                The link expires in 15 minutes.
              </p>
            </div>
          </motion.form>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>&copy; 2025 TAVIX GUARD. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
