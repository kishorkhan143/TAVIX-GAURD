import React, { useState, useRef, useEffect } from 'react';
import {
  exportIncidentAnalysisCsv,
  exportIncidentAnalysisJson,
  exportIncidentAnalysisPdf,
} from '../utils/exportIncidentAnalysis';

export default function ExportAnalysisDropdown({ alerts = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('success'); // 'success' | 'error' | 'info'
  const dropdownRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Close dropdown when clicking outside
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
    toastTimeoutRef.current = setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
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
        showFeedback(`Generated TAVIX_GUARD_Incident_Analysis.pdf report successfully`, 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      showFeedback(err.message || 'Export failed. Please try again.', 'error');
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Export Analysis Button */}
      <button
        type="button"
        id="btn-export-analysis"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Export incident analysis data and report"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          background: 'var(--accent)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0, 102, 255, 0.22)',
          transition: 'all var(--transition-fast, 0.15s ease)',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-hover)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        {/* Export / Download Icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>

        <span>Export Analysis</span>

        {/* Dropdown Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            marginLeft: '2px',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '230px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-light, #e5e7eb)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            padding: '6px',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            style={{
              padding: '6px 10px 4px 10px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary, #9ca3af)',
              borderBottom: '1px solid var(--border-light, #f3f4f6)',
              marginBottom: '4px',
            }}
          >
            Export Format
          </div>

          {/* Option: CSV */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport('csv')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
              color: 'var(--text-primary, #1f2937)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary, #f3f4f6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              CSV
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Export as CSV</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #9ca3af)' }}>Table & summary headers</div>
            </div>
          </button>

          {/* Option: JSON */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport('json')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
              color: 'var(--text-primary, #1f2937)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary, #f3f4f6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              JSON
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Export as JSON</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #9ca3af)' }}>Structured audit payload</div>
            </div>
          </button>

          {/* Option: PDF */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport('pdf')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
              color: 'var(--text-primary, #1f2937)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary, #f3f4f6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              PDF
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Export as PDF</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #9ca3af)' }}>Official incident audit report</div>
            </div>
          </button>
        </div>
      )}

      {/* Floating Status Toast Notification */}
      {statusMessage && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            whiteSpace: 'nowrap',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: 'var(--radius-md, 8px)',
            background: statusType === 'error' ? '#fef2f2' : '#ecfdf5',
            color: statusType === 'error' ? '#b91c1c' : '#047857',
            border: `1px solid ${statusType === 'error' ? '#fecaca' : '#a7f3d0'}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>{statusType === 'error' ? '⚠️' : '✓'}</span>
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
