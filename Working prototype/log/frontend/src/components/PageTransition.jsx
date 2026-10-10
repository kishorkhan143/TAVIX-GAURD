import React from 'react';

/**
 * PageTransition — Premium iOS-inspired View Container
 * Provides silky smooth opacity + subtle vertical spring entrance
 * without disturbing business logic, routing, or state.
 */
export default function PageTransition({ children, transitionKey, className = '' }) {
  return (
    <div
      key={transitionKey}
      className={`ios-page-container ${className}`}
      style={{
        width: '100%',
        minHeight: '100%',
      }}
    >
      {children}
    </div>
  );
}
