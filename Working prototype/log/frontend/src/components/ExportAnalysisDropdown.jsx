import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { springs } from '../motion';
import {
  exportIncidentAnalysisCsv,
  exportIncidentAnalysisJson,
  exportIncidentAnalysisPdf,
} from '../utils/exportIncidentAnalysis';

const FORMATS = [
  { id: 'csv', label: 'Export as CSV', sub: 'Table & summary headers', icon: 'CSV', bg: '#ecfdf5', color: '#059669' },
  { id: 'json', label: 'Export as JSON', sub: 'Structured audit payload', icon: 'JSON', bg: '#eff6ff', color: '#2563eb' },
  { id: 'pdf', label: 'Export as PDF', sub: 'Official incident audit report', icon: 'PDF', bg: '#fee2e2', color: '#dc2626' },
];

export default function ExportAnalysisDropdown({ alerts = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('success');
  const dropdownRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showFeedback = (msg, type = 'success') => {
    setStatusMessage(msg);
    setStatusType(type);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleExport = (format) => {
    setIsOpen(false);
    if (!alerts || alerts.length === 0) {
      showFeedback('No incident data available to export in current view.', 'error');
      return;
    }
    try {
      if (format === 'csv') {
        exportIncidentAnalysisCsv(alerts);
        showFeedback(`Exported ${alerts.length} incidents to TAVIX_GUARD_Incident_Analysis.csv`, 'success');
      } else if (format === 'json') {
        exportIncidentAnalysisJson(alerts);
        showFeedback(`Exported ${alerts.length} incidents to TAVIX_GUARD_Incident_Analysis.json`, 'success');
      } else if (format === 'pdf') {
        exportIncidentAnalysisPdf(alerts);
        showFeedback('Generated TAVIX_GUARD_Incident_Analysis.pdf report successfully', 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      showFeedback(err.message || 'Export failed. Please try again.', 'error');
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <motion.button
        type="button"
        id="btn-export-analysis"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Export incident analysis data and report"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={springs.snappy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', fontSize: '13px', fontWeight: 600,
          background: 'var(--accent)', color: '#ffffff', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,102,255,0.22)', userSelect: 'none',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Export Analysis</span>
        <motion.svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springs.snappy}
          style={{ marginLeft: '2px' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={springs.sheet}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '230px', background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: 'var(--ios-shadow-popover)', zIndex: 1000, padding: '6px',
              transformOrigin: 'top right',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            }}
          >
            <div style={{ padding: '6px 10px 4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
              Export Format
            </div>
            {FORMATS.map((fmt) => (
              <motion.button
                key={fmt.id} type="button" role="menuitem"
                onClick={() => handleExport(fmt.id)}
                whileHover={{ backgroundColor: 'var(--bg-tertiary)', x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={springs.snappy}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', background: 'transparent', border: 'none',
                  borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer',
                  textAlign: 'left', color: 'var(--text-primary)',
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: fmt.bg, color: fmt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  {fmt.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{fmt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{fmt.sub}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {statusMessage && (
          <motion.div
            role="status"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={springs.sheet}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '12px', fontWeight: 500,
              borderRadius: 'var(--radius-md, 8px)',
              background: statusType === 'error' ? '#fef2f2' : '#ecfdf5',
              color: statusType === 'error' ? '#b91c1c' : '#047857',
              border: `1px solid ${statusType === 'error' ? '#fecaca' : '#a7f3d0'}`,
              boxShadow: 'var(--ios-shadow-card)', zIndex: 1001,
              display: 'flex', alignItems: 'center', gap: '8px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span>{statusType === 'error' ? '⚠️' : '✓'}</span>
            <span>{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
