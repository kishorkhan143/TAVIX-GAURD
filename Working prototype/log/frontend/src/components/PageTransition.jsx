import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { variants, springs } from '../motion';

/**
 * PageTransition — Premium iOS-inspired View Container
 * Provides silky smooth opacity + subtle vertical spring entrance
 * without disturbing business logic, routing, or state.
 */
export default function PageTransition({ children, transitionKey, className = '' }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        className={`ios-page-container ${className}`}
        style={{width: '100%', minHeight: '100%'}}
        variants={variants.pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}