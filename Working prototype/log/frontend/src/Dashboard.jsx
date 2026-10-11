/**
 * Dashboard — Main Application Layout
 * ===================================
 * Wraps the original App functionality inside ProtectedRoute.
 * This is where the sidebar, header, and main content live.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import './App.css';
import './csv_analytics/csvAnalytics.css';
import tavixLogo from './assets/tavix-guard-logo.png';
import { useAuthSentinel, BACKEND_URL } from './useAuthSentinel';
import { springs, variants, useMotionPrefs } from './motion';
import Sparkline, { generateTrendIntervals } from './components/Sparkline';
import CsvAnalyticsPage from './csv_analytics/CsvAnalyticsPage';
import LaboratoriesView from './components/live/LaboratoriesView';
import LabComputersView from './components/live/LabComputersView';
import ComputerDetailView from './components/live/ComputerDetailView';
import LabTerminalsView from './components/live/LabTerminalsView';
import ExportAnalysisDropdown from './components/ExportAnalysisDropdown';
import LiveAlertModal from './components/live/LiveAlertModal';
import DateFilter from './components/DateFilter';
import PageTransition from './components/PageTransition';
import {
  useDateFilter,
  filterByDate,
  getItemDateString,
  formatDisplayDate,
  fmtTime,
  fmtDateTime,
} from './dateFilterUtils';

function alertTypeLabel(type) {
  if (type === 'REPEATED_FAILURE') return 'BRUTE FORCE';
  if (type === 'SUCCESS_AFTER_FAILURES') return 'ANOMALY';
  if (type === 'UNUSUAL_LOGIN') return 'UNUSUAL LOGIN';
  return type;
}

// ── Icons as SVG Components ──────────────────────────────────────────────────
function Icon({ name, size = 20 }) {
  const icons = {
    'chart-bar': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="18"></rect>
        <rect x="14" y="8" width="7" height="13"></rect>
      </svg>
    ),
    'signal': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
    ),
    'alert-triangle': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.04h16.94a2 2 0 0 0 1.71-3.04l-8.47-14.14a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    'beaker': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4.54 11.46L2.19 14.81A2 2 0 0 0 3.81 18h16.38a2 2 0 0 0 1.62-3.19l-2.35-3.35"></path>
        <path d="M6 4h12v7H6z"></path>
      </svg>
    ),
    'monitor': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
    'table': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"></path>
        <line x1="10" y1="3" x2="10" y2="19"></line>
        <line x1="14" y1="3" x2="14" y2="19"></line>
      </svg>
    ),
    'settings': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-15.78 7.78l4.24-4.24m3.08-3.08l4.24-4.24"></path>
      </svg>
    ),
    'user': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    'activity': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    ),
    'check-circle': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    'x-circle': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ),
    'log-out': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4m10-4l4-4m0 0l-4-4m4 4H10"></path>
      </svg>
    ),
  };

  return icons[name] || null;
}

// ── Navigation Items ─────────────────────────────────────────────────────────
const MENU_ITEMS = [
  {
    category: 'MONITORING',
    items: [
      { id: 'overview', label: 'Overview', icon: 'chart-bar' },
      { id: 'live', label: 'Incidents', icon: 'alert-triangle' },
    ],
  },
  {
    category: 'INVENTORY',
    items: [
      { id: 'labs', label: 'Laboratories', icon: 'beaker' },
      { id: 'terminals', label: 'Terminals', icon: 'monitor' },
    ],
  },
  {
    category: 'TOOLS',
    items: [
      { id: 'csv', label: 'CSV Analyzer', icon: 'table' },
    ],
  },
  {
    category: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

// ── Sidebar Component ────────────────────────────────────────────────────────
function Sidebar({ activeMenu, onMenuChange, user, onLogout }) {
  const motionPrefs = useMotionPrefs();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src={tavixLogo} alt="TAVIX GUARD" className="logo-img" />
        </div>
        <div className="logo-text">
          <div className="logo-title">
            <span className="tavix-text">TAVIX </span>
            <span className="guard-text">GUARD</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU_ITEMS.map((section) => (
          <div key={section.category} className="nav-section">
            <div className="nav-section-title">{section.category}</div>
            <motion.div 
              className="nav-items"
              variants={motionPrefs.navItemContainer}
              initial="hidden"
              animate="visible"
            >
              {section.items.map((item) => (
                <motion.button
                  key={item.id}
                  className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => onMenuChange(item.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springs.snappy}
                  variants={motionPrefs.navItem}
                  style={{ position: 'relative' }}
                >
                  {activeMenu === item.id && (
                    <motion.div
                      layoutId="nav-active"
                      className="nav-active-pill"
                      transition={springs.snappy}
                    />
                  )}
                  <span className="nav-icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <motion.button 
          className="admin-btn"
          onClick={() => onMenuChange('settings')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={springs.snappy}
          style={{ flex: 1, padding: '8px 10px', minWidth: 0, textAlign: 'left' }}
          title={user?.email ? `Account: ${user.name ? `${user.name} (${user.email})` : user.email} — Click to edit profile` : 'Account Settings'}
        >
          <span className="admin-icon" style={{ flexShrink: 0 }}>
            <Icon name="user" size={16} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden', minWidth: 0, flex: 1 }}>
            <span style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {user?.name || user?.email || 'Admin profile'}
            </span>
            {user?.name && user?.email && (
              <span style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: '#94a3b8' }}>
                {user.email}
              </span>
            )}
          </div>
        </motion.button>
        <motion.button
          onClick={onLogout}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={springs.snappy}
          title="Sign out / Logout"
          style={{
            padding: '10px 10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md, 8px)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="log-out" size={16} />
        </motion.button>
      </div>
    </aside>
  );
}

// ── Header Component ────────────────────────────────────────────────────────
function Header({ currentMenuLabel, currentCategory }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-category">
          <motion.span 
            key={currentCategory}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.snappy}
          >
            {currentCategory}
          </motion.span>
        </div>
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <DateFilter />
        <div 
          className="clock"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {time.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })}
        </div>
      </div>
    </header>
  );
}

// ── Status Badge Component ───────────────────────────────────────────────────
function StatusBadge({ label, online, count }) {
  return (
    <motion.div 
      className={`status-badge ${online ? 'online' : 'offline'}`}
      key={online ? 'online' : 'offline'}
      animate={{ opacity: 1 }}
    >
      {online ? (
        <motion.span 
          className="dot"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      ) : (
        <span className="dot" />
      )}
      <span>{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </motion.div>
  );
}

// ── Event & Alert Trends Chart ───────────────────────────────────────────────
function EventAlertTrendsChart({ trends }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const W = 480;
  const H = 130;
  const padL = 22;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setTimeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const series = [
    { key: 'total',      label: 'Total Events', color: '#3b82f6', dash: false },
    { key: 'successful', label: 'Successful',   color: '#10b981', dash: false },
    { key: 'failed',     label: 'Failed',       color: '#ef4444', dash: false },
    { key: 'alerts',     label: 'Alerts',       color: '#f59e0b', dash: true  },
  ];

  const allValues = [
    ...(trends.total      || []),
    ...(trends.successful || []),
    ...(trends.failed     || []),
    ...(trends.alerts     || []),
  ];
  const maxVal = Math.max(...allValues, 1);
  const yMax = Math.max(Math.ceil(maxVal), 2);
  const yTicks = [0, Math.round(yMax * 0.25), Math.round(yMax * 0.5), Math.round(yMax * 0.75), yMax];
  const uniqueYTicks = [...new Set(yTicks)].sort((a, b) => a - b);

  const xTick = ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h', '24h'];

  function getPoints(data) {
    if (!data || data.length === 0) return [];
    return data.map((val, i) => {
      const x = padL + (i / (data.length - 1)) * innerW;
      const y = padT + innerH - (val / yMax) * innerH;
      return { x, y, val };
    });
  }

  function buildPath(points) {
    if (points.length === 0) return '';
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = ((p0.x + p1.x) / 2).toFixed(2);
      d += ` C ${midX} ${p0.y.toFixed(2)}, ${midX} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    }
    return d;
  }

  function buildArea(points) {
    if (points.length === 0) return '';
    const line = buildPath(points);
    const last = points[points.length - 1];
    const first = points[0];
    const bottom = padT + innerH;
    return `${line} L ${last.x.toFixed(2)} ${bottom} L ${first.x.toFixed(2)} ${bottom} Z`;
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - padL) / innerW));
    const totalPoints = (trends.total || []).length || 12;
    const nearestIdx = Math.round(ratio * (totalPoints - 1));
    setHoveredIdx(nearestIdx);
  };

  const timeLabelMap = {
    '24h': '24 Hours',
    '12h': '12 Hours',
    '6h': '6 Hours',
    '1h': '1 Hour',
  };

  const hoveredData = hoveredIdx !== null ? {
    time: xTick[Math.min(hoveredIdx, xTick.length - 1)] || `${hoveredIdx * 2}h`,
    total: trends.total?.[hoveredIdx] ?? 0,
    successful: trends.successful?.[hoveredIdx] ?? 0,
    failed: trends.failed?.[hoveredIdx] ?? 0,
    alerts: trends.alerts?.[hoveredIdx] ?? 0,
  } : null;

  return (
    <div>
      <div className="trend-chart-header" style={{ display: 'none' }} />
      <div
        className="trend-chart-body"
        style={{ position: 'relative', overflow: 'visible' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Y-axis labels */}
        <div className="trend-yaxis" style={{ height: `${H}px`, paddingTop: `${padT}px`, paddingBottom: `${padB}px` }}>
          {[...uniqueYTicks].reverse().map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* SVG chart */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="trend-svg"
            style={{ width: '100%', height: `${H}px`, overflow: 'visible', cursor: 'crosshair' }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient key={`grad-${s.key}`} id={`eatrend-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
              <filter id="datumGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.25)" />
              </filter>
            </defs>

            {/* Horizontal gridlines */}
            {uniqueYTicks.map((v) => {
              const y = padT + innerH - (v / yMax) * innerH;
              return (
                <line
                  key={`grid-${v}`}
                  x1={padL} y1={y} x2={W - padR} y2={y}
                  stroke="#e5e7eb" strokeWidth="0.7" strokeDasharray="3 3"
                />
              );
            })}

            {/* Vertical guide line on hover */}
            {hoveredIdx !== null && (
              <line
                x1={padL + (hoveredIdx / (((trends.total || []).length || 12) - 1)) * innerW}
                y1={padT}
                x2={padL + (hoveredIdx / (((trends.total || []).length || 12) - 1)) * innerW}
                y2={padT + innerH}
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                style={{ transition: 'x1 0.08s ease, x2 0.08s ease' }}
              />
            )}

            {/* Area fills */}
            {series.map((s, idx) => {
              const data = trends[s.key] || [];
              const pts = getPoints(data);
              if (pts.length < 2) return null;
              return (
                <motion.path
                  key={`area-${s.key}`}
                  d={buildArea(pts)}
                  fill={`url(#eatrend-grad-${s.key})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: idx * 0.12 + 0.15 }}
                />
              );
            })}

            {/* Lines */}
            {series.map((s, idx) => {
              const data = trends[s.key] || [];
              const pts = getPoints(data);
              if (pts.length < 2) return null;
              return (
                <motion.path
                  key={`line-${s.key}`}
                  d={buildPath(pts)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={s.dash ? '5 3' : undefined}
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.08 }}
                />
              );
            })}

            {/* Interactive datum dots - come forward smoothly on hover */}
            {series.map((s) => {
              const data = trends[s.key] || [];
              const pts = getPoints(data);
              return pts.map((pt, i) => {
                const isHovered = hoveredIdx === i;
                return (
                  <circle
                    key={`dot-${s.key}-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 2.5}
                    fill={isHovered ? '#ffffff' : s.color}
                    stroke={s.color}
                    strokeWidth={isHovered ? 2.5 : 1}
                    filter={isHovered ? 'url(#datumGlow)' : undefined}
                    style={{
                      transition: 'r 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275), stroke-width 0.22s ease',
                      pointerEvents: 'none',
                    }}
                  />
                );
              });
            })}
          </svg>

          {/* iOS Floating datum Tooltip */}
          <AnimatePresence>
            {hoveredData && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: `${Math.min(Math.max(15, (padL + (hoveredIdx / (((trends.total || []).length || 12) - 1)) * innerW) / W * 100), 85)}%`,
                  transform: 'translate(-50%, -100%)',
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.05)',
                  padding: '8px 12px',
                  pointerEvents: 'none',
                  zIndex: 40,
                  minWidth: '130px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', marginBottom: '4px' }}>
                  Interval {hoveredData.time}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '10.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#3b82f6' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                    Total: <strong>{hoveredData.total}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    Success: <strong>{hoveredData.successful}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    Failed: <strong>{hoveredData.failed}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    Alerts: <strong>{hoveredData.alerts}</strong>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* X-axis time labels */}
          <div className="trend-xlabels">
            {xTick.map((t, idx) => (
              <span
                key={t}
                style={{
                  color: hoveredIdx === idx ? 'var(--text-primary)' : undefined,
                  fontWeight: hoveredIdx === idx ? 700 : undefined,
                  transition: 'color 0.15s ease',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overview Section ────────────────────────────────────────────────────────
function OverviewSection({ events, alerts, onExecuteAction, onSelectAlert }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;
  
  const [trendRange, setTrendRange] = useState('24h');
  const [trendDropdownOpen, setTrendDropdownOpen] = useState(false);
  const trendDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (trendDropdownRef.current && !trendDropdownRef.current.contains(e.target)) {
        setTrendDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEvents = filterByDate(events, selectedDate);
  const filteredAlerts = filterByDate(alerts, selectedDate);

  const totalEvents = filteredEvents.length;
  const successfulLogins = filteredEvents.filter((e) => e.status === 'SUCCESS').length;
  const failedLogins = filteredEvents.filter((e) => e.status === 'FAILURE').length;
  const activeAlerts = filteredAlerts.filter((a) => !a.resolved).length;

  const trends = useMemo(
    () => generateTrendIntervals(filteredEvents, filteredAlerts, 12),
    [filteredEvents, filteredAlerts]
  );

  const statCards = [
    { id: 'total', label: 'Total Events', icon: 'activity', value: totalEvents, color: '#0066ff', data: trends.total },
    { id: 'success', label: 'Successful', icon: 'check-circle', value: successfulLogins, color: '#10b981', data: trends.successful },
    { id: 'failed', label: 'Failed', icon: 'x-circle', value: failedLogins, color: '#ef4444', data: trends.failed },
    { id: 'alerts', label: 'Alerts', icon: 'alert-triangle', value: activeAlerts, color: '#f59e0b', data: trends.alerts, isAlert: true },
  ];

  const trendRangeLabels = {
    '24h': '24 hour les',
    '12h': '12 hour les',
    '6h': '6 hour les',
    '1h': '1 hour les',
  };

  return (
    <motion.div
      className="section"
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="section-header" style={{ marginBottom: !isToday ? '16px' : '0', minHeight: !isToday ? 'auto' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          {!isToday && (
            <motion.div
              className="viewing-past-date-pill"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.snappy}
            >
              <span>Viewing {displayDate}</span>
              <button type="button" className="btn-back-to-live" onClick={resetToToday}>
                Back to live
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.id}
            className={`stat-card stat-card-${card.id} ${card.isAlert ? 'alert' : ''}`}
            variants={fadeUpVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ ...springs.soft, delay: idx * 0.05 }}
            whileHover={{
              y: -8,
              scale: 1.025,
              transition: { type: 'spring', stiffness: 380, damping: 22 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="stat-label">{card.label}</div>
            <div className="stat-content">
              <div className="stat-icon">
                <Icon name={card.icon} size={32} />
              </div>
              <div className="stat-value">{card.value}</div>
            </div>
            <div className="stat-chart">
              <Sparkline data={card.data} color={card.color} height={40} id={`sparkline-${card.id}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="overview-bottom-row"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={springs.soft}
        viewport={{ once: true, margin: '-40px' }}
      >
        {/* Left: Recent Events panel */}
        <div className="events-panel">
          <div className="panel-header">
            <h3>Recent Events</h3>
            <span className="badge">{filteredEvents.length}</span>
          </div>
          <EventsTable events={filteredEvents} emptyMessage={`No events on ${displayDate}`} />
        </div>

        {/* Right: Event & Alert Trends chart */}
        <div className="trend-chart-panel">
          <div className="panel-header">
            <h3>Event &amp; Alert Trends</h3>
            <div ref={trendDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="trend-time-badge"
                onClick={() => setTrendDropdownOpen(!trendDropdownOpen)}
                aria-expanded={trendDropdownOpen}
              >
                {trendRangeLabels[trendRange]} ▾
              </button>
              <AnimatePresence>
                {trendDropdownOpen && (
                  <motion.div
                    className="ios-soft-dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      zIndex: 100,
                      minWidth: '120px',
                    }}
                  >
                    {['24h', '12h', '6h', '1h'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`ios-dropdown-item ${trendRange === r ? 'active' : ''}`}
                        onClick={() => {
                          setTrendRange(r);
                          setTrendDropdownOpen(false);
                        }}
                      >
                        {trendRangeLabels[r]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="trend-chart-content">
            <EventAlertTrendsChart trends={trends} />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="alerts-panel"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={springs.soft}
        viewport={{ once: true, margin: '-40px' }}
      >
        <div className="panel-header">
          <h3>Active Alerts</h3>
          <span className="badge alert">{filteredAlerts.length}</span>
        </div>
        <AlertList
          alerts={filteredAlerts}
          emptyMessage={`No incidents on ${displayDate}`}
          onExecuteAction={onExecuteAction}
          onSelectAlert={onSelectAlert}
        />
      </motion.div>
    </motion.div>
  );
}

// ── Incidents Section (Live Telemetry) ──────────────────────────────────────
function LiveTelemetrySection({ events, alerts, onExecuteAction, onSelectAlert }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;

  const filteredEvents = filterByDate(events, selectedDate);
  const filteredAlerts = filterByDate(alerts, selectedDate);

  return (
    <motion.div
      className="section incidents-section"
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Page heading */}
      <div className="section-header incidents-page-header">
        <div>
          <h2 className="incidents-heading">Incidents</h2>
          <p className="incidents-subheading">Authentication events and detected security incidents</p>
        </div>
        <div className="incidents-header-actions">
          {!isToday && (
            <motion.div
              className="viewing-past-date-pill"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.snappy}
            >
              <span>Viewing {displayDate}</span>
              <button type="button" className="btn-back-to-live" onClick={resetToToday}>
                Back to live
              </button>
            </motion.div>
          )}
          <ExportAnalysisDropdown alerts={filteredAlerts.length > 0 ? filteredAlerts : alerts} />
        </div>
      </div>

      {/* Two-panel layout: 40% events | 60% incidents */}
      <div className="incidents-panels-grid">
        {/* Left: Authentication Events (~40%) */}
        <motion.div
          className="incidents-panel incidents-panel-events"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={springs.soft}
          viewport={{ once: true, margin: '-40px' }}
        >
          <div className="incidents-panel-header">
            <span className="incidents-panel-title">Authentication Events</span>
            <span className="incidents-count-badge">{filteredEvents.length}</span>
          </div>

          <EventsTable events={filteredEvents} emptyMessage={`No events on ${displayDate}`} />
        </motion.div>

        {/* Right: Detected Incidents (~60%) */}
        <motion.div
          className="incidents-panel incidents-panel-incidents"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={springs.soft}
          viewport={{ once: true, margin: '-40px' }}
        >
          <div className="incidents-panel-header">
            <span className="incidents-panel-title">Detected Incidents</span>
            <span className="incidents-count-badge incidents-count-badge--alert">{filteredAlerts.length}</span>
          </div>

          <DetectedIncidentsTable
            alerts={filteredAlerts}
            emptyMessage={`No incidents on ${displayDate}`}
            onSelectAlert={onSelectAlert}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Settings Section ────────────────────────────────────────────────────────
function SettingsSection({ health, user, token, onLogout, onUpdateUser }) {
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;
  
  const isCollectorOnline = health?.collector_status === 'CONNECTED';
  const isBackendOnline   = health?.backend === 'ONLINE';
  const isDbOnline        = health?.database === 'ONLINE';

  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Profile editing state
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);

  useEffect(() => {
    if (user?.name !== undefined && user?.name !== null) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  const handleSaveName = async (e) => {
    e?.preventDefault();
    if (!nameInput.trim()) {
      setProfileStatus({ success: false, message: 'Please enter a name.' });
      return;
    }
    setIsSavingName(true);
    setProfileStatus(null);
    try {
      const activeToken = token || localStorage.getItem('tavix_guard_jwt');
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update profile');
      }
      if (onUpdateUser) {
        onUpdateUser(data);
      }
      setProfileStatus({ success: true, message: '✓ Name updated successfully!' });
    } catch (err) {
      setProfileStatus({ success: false, message: `✕ ${err.message}` });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSendTestIncidentEmail = async () => {
    setIsSendingTest(true);
    setTestEmailStatus(null);
    try {
      const recipient = user?.email || 'kishorkhan.dev@gmail.com';
      const res = await fetch(`${BACKEND_URL}/api/auth/admin/test-alert-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: recipient }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to dispatch test alert');
      }
      setTestEmailStatus({
        success: true,
        message: `✓ Test incident alert email dispatched to ${recipient} via SMTP!`,
      });
    } catch (err) {
      setTestEmailStatus({
        success: false,
        message: `✕ Error sending test alert: ${err.message}`,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <motion.div
      className="section"
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="section-header">
        <h2>System Settings</h2>
        <p>System status, profile settings, and real-time SMTP incident alerting</p>
      </div>

      {/* 1. Account Profile Card: Edit User Name */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={springs.soft}
        viewport={{ once: true, margin: '-40px' }}
      >
        <h3>Account Profile</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
          Personalize your account display name across the dashboard.
        </p>

        <form onSubmit={handleSaveName} style={{ maxWidth: '520px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Display Name
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name (e.g. Kishor Khan)"
                disabled={isSavingName}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <motion.button
                type="submit"
                disabled={isSavingName}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSavingName ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                }}
                whileHover={{ scale: isSavingName ? 1 : 1.02 }}
                whileTap={{ scale: isSavingName ? 1 : 0.97 }}
              >
                {isSavingName ? 'Saving...' : 'Save Name'}
              </motion.button>
            </div>
            {profileStatus && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: profileStatus.success ? '#10b981' : '#ef4444',
                }}
              >
                {profileStatus.message}
              </div>
            )}
          </div>

          <div className="info-grid" style={{ marginTop: '16px' }}>
            <div className="info-item">
              <span className="info-label">Current Name:</span>
              <span className="info-value" style={{ fontWeight: 600, color: '#0066ff' }}>
                {user?.name || 'Not set'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Email:</span>
              <span className="info-value">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </form>
      </motion.div>

      {/* 2. Restored System Status: Backend, Database, Collectors indicators */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={springs.soft}
        viewport={{ once: true, margin: '-40px' }}
      >
        <h3>System Status</h3>
        <div className="status-grid settings-status" style={{ marginTop: '16px' }}>
          <StatusBadge label="Backend" online={isBackendOnline} />
          <StatusBadge label="Database" online={isDbOnline} />
          <StatusBadge label="Collectors" online={isCollectorOnline} count={isCollectorOnline ? 1 : 0} />
        </div>
      </motion.div>

      {/* 2. Admin Logic & SMTP Incident Alert Dispatch */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={springs.soft}
        viewport={{ once: true, margin: '-40px' }}
      >
        <h3>Administrator &amp; Incident Alerts</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
          When any security incident or brute-force threat occurs, alert notifications are immediately dispatched to the active login account via SMTP.
        </p>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Active Admin Account:</span>
            <span className="info-value" style={{ fontWeight: 600 }}>{user?.email || 'kishorkhan.dev@gmail.com'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Role:</span>
            <span className="info-value" style={{ color: '#10b981', fontWeight: 600 }}>{user?.role || 'Administrator'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">SMTP Alert Dispatch:</span>
            <span className="info-value" style={{ color: '#0066ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Active (smtp.gmail.com:587)
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Incident Recipient Mail ID:</span>
            <span className="info-value" style={{ fontWeight: 600 }}>{user?.email || 'kishorkhan.dev@gmail.com'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
          <motion.button
            onClick={handleSendTestIncidentEmail}
            disabled={isSendingTest}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isSendingTest ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            }}
            whileHover={{ scale: isSendingTest ? 1 : 1.02 }}
            whileTap={{ scale: isSendingTest ? 1 : 0.97 }}
            transition={springs.snappy}
          >
            {isSendingTest ? 'Sending Alert...' : '✉ Send Test Incident Alert (SMTP)'}
          </motion.button>

          <motion.button
            onClick={onLogout}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={springs.snappy}
          >
            Logout
          </motion.button>

          {testEmailStatus && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: testEmailStatus.success ? '#10b981' : '#ef4444',
                padding: '6px 12px',
                background: testEmailStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '6px',
                border: `1px solid ${testEmailStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {testEmailStatus.message}
            </span>
          )}
        </div>
      </motion.div>

      {/* 3. Service Information */}
      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={springs.soft}
        viewport={{ once: true, margin: '-40px' }}
      >
        <h3>Service Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Backend URL:</span>
            <span className="info-value">{BACKEND_URL}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Database:</span>
            <span className="info-value">SQLite (authsentinel.db)</span>
          </div>
          <div className="info-item">
            <span className="info-label">Frontend URL:</span>
            <span className="info-value">{window.location.origin}</span>
          </div>
          {health && (
            <div className="info-item">
              <span className="info-label">Uptime:</span>
              <span className="info-value">{Math.round((health.uptime_seconds || 0) / 60)} minutes</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Events Table Component ──────────────────────────────────────────────────
function EventsTable({ events, emptyMessage = 'No events to display' }) {
  const motionPrefs = useMotionPrefs();
  const listVariants = motionPrefs.listItem || variants.listItem;
  
  if (!events.length) {
    return (
      <div className="events-empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="events-table-container">
      <div className="events-table-header">
        <div className="evt-hcol evt-col-time">Time</div>
        <div className="evt-hcol evt-col-user">User</div>
        <div className="evt-hcol evt-col-ip">IP Address</div>
        <div className="evt-hcol evt-col-status">Status</div>
        <div className="evt-hcol evt-col-sev">Severity</div>
      </div>
      <div className="events-table-body">
        <AnimatePresence initial={false}>
          {events.map((ev, idx) => {
            const timeStr = fmtTime(ev.timestamp);
            const dateStr = formatDisplayDate(getItemDateString(ev.timestamp));
            const risk = (ev.risk_level || 'LOW').toUpperCase();
            const isHigh = risk === 'HIGH' || risk === 'CRITICAL';

            return (
              <motion.div
                key={ev.id}
                layout="position"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={idx < 5 ? undefined : { delay: Math.min(idx * 0.02, 0.1) }}
                className={`event-row status-${ev.status?.toLowerCase() || 'unknown'}`}
              >
                <div className="evt-cell evt-col-time">
                  <div className="evt-time-val">{timeStr}</div>
                  <div className="evt-date-val">{dateStr}</div>
                </div>
                <div className="evt-cell evt-col-user">
                  <span className="evt-user-link" title={`User: ${ev.username || '—'}`}>
                    {ev.username || '—'}
                  </span>
                </div>
                <div className="evt-cell evt-col-ip" title={`IP: ${ev.source_ip || '—'}`}>
                  <span className="evt-ip-text">{ev.source_ip || '—'}</span>
                </div>
                <div className="evt-cell evt-col-status">
                  {ev.status === 'SUCCESS' ? (
                    <span className="evt-status-icon success" title="Successful authentication">
                      <Icon name="check-circle" size={15} />
                    </span>
                  ) : (
                    <span className="evt-status-icon failure" title="Failed authentication">
                      <Icon name="x-circle" size={15} />
                    </span>
                  )}
                </div>
                <div className="evt-cell evt-col-sev">
                  <span className={`evt-severity-tag ${isHigh ? 'high' : 'low'}`}>
                    {isHigh ? 'HIGH' : 'LOW'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Detected Incidents Table Component (Incidents Page) ─────────────────────
function DetectedIncidentsTable({
  alerts,
  emptyMessage = 'No incidents to display',
  onSelectAlert,
}) {
  const motionPrefs = useMotionPrefs();
  const listVariants = motionPrefs.listItem || variants.listItem;

  if (!alerts.length) {
    return (
      <div className="incidents-empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="detected-inc-container">
      <div className="detected-inc-header">
        <div className="inc-hcol inc-col-type">Severity &amp; Type</div>
        <div className="inc-hcol inc-col-user">User</div>
        <div className="inc-hcol inc-col-device">Device</div>
        <div className="inc-hcol inc-col-ip">IP Address</div>
        <div className="inc-hcol inc-col-status">Status</div>
      </div>
      <div className="detected-inc-body">
        <AnimatePresence initial={false}>
          {alerts.map((al, idx) => {
            const rawType = alertTypeLabel(al.alert_type);
            const status = (al.status || (al.resolved ? 'RESOLVED' : 'OPEN')).toUpperCase();
            const machine = al.source_host || al.target_computer || 'LAPTOP-A';
            const ip = al.source_ip || '—';
            const risk = (al.risk_level || 'HIGH').toUpperCase();
            const isHighOrCritical = risk === 'HIGH' || risk === 'CRITICAL';
            const count = al.failure_count || al.event_count || 0;

            return (
              <motion.div
                key={al.id}
                layout="position"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={idx < 5 ? undefined : { delay: Math.min(idx * 0.02, 0.1) }}
                className={`detected-inc-row severity-${risk.toLowerCase()}`}
                onClick={() => onSelectAlert && onSelectAlert(al)}
                title="Click to view full incident details"
              >
                {/* 1. Severity & Type */}
                <div className="inc-cell inc-col-type">
                  <span className={`inc-severity-badge ${isHighOrCritical ? 'high' : 'normal'}`}>
                    HIGH
                  </span>
                  <div className="inc-type-wrap">
                    <span className="inc-type-name">{rawType}</span>
                    {count > 1 && (
                      <span className="inc-count-tag">
                        ({count} attempts)
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. User */}
                <div className="inc-cell inc-col-user">
                  <span
                    className="inc-user-link"
                    title={al.username ? `User: ${al.username}` : 'No user identified'}
                  >
                    {al.username || '—'}
                  </span>
                </div>

                {/* 3. Device */}
                <div className="inc-cell inc-col-device" title={`Device: ${machine}`}>
                  <span className="inc-device-text">{machine}</span>
                </div>

                {/* 4. IP Address */}
                <div className="inc-cell inc-col-ip" title={`IP: ${ip}`}>
                  <span className="inc-ip-text">{ip}</span>
                </div>

                {/* 5. Status */}
                <div className="inc-cell inc-col-status">
                  {status === 'AUTHORIZED' ? (
                    <button
                      type="button"
                      className="inc-status-btn authorized"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlert && onSelectAlert(al);
                      }}
                      title="Authorized benign event"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <span>Authorized</span>
                    </button>
                  ) : status === 'REMEDIATING' ? (
                    <span className="inc-status-badge remediating">
                      Remediating
                    </span>
                  ) : status === 'RESOLVED' ? (
                    <span className="inc-status-badge resolved">
                      Resolved
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="inc-status-btn review"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlert && onSelectAlert(al);
                      }}
                      title="Review security incident"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span>Review</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Alert List Component (Professional SOC Design) ──────────────────────────
function AlertList({
  alerts,
  emptyMessage = 'No alerts to display',
  onExecuteAction,
  onSelectAlert,
}) {
  const motionPrefs = useMotionPrefs();
  const listVariants = motionPrefs.listItem || variants.listItem;
  const [actingAlertId, setActingAlertId] = useState(null);
  const [confirmShutdownId, setConfirmShutdownId] = useState(null);

  if (!alerts.length) {
    return (
      <div className="alerts-empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const handleActionClick = async (e, al, action) => {
    e.stopPropagation();
    if (action === 'shutdown' && confirmShutdownId !== al.id) {
      setConfirmShutdownId(al.id);
      return;
    }
    setActingAlertId(al.id);
    try {
      if (onExecuteAction) {
        await onExecuteAction(al.id, action, {
          terminalId: al.source_host || al.target_computer,
        });
      }
    } finally {
      setActingAlertId(null);
      setConfirmShutdownId(null);
    }
  };

  return (
    <div className="alerts-table-wrapper">
      {/* Table Column Headers */}
      <div className="alerts-table-header">
        <div className="col-header col-type">Severity &amp; Type</div>
        <div className="col-header col-user">User</div>
        <div className="col-header col-ip">IP Address</div>
        <div className="col-header col-status">Status</div>
        <div className="col-header col-actions">Actions</div>
        <div className="col-header col-time">Timestamp</div>
      </div>

      {/* Table Body */}
      <div className="alerts-table-body">
        <AnimatePresence initial={false}>
          {alerts.map((al, idx) => {
            const rawType = alertTypeLabel(al.alert_type);
            const fullTime = fmtDateTime(al.triggered_at);
            const timeParts = fullTime && fullTime.includes(',') ? fullTime.split(', ') : null;
            const status = (al.status || (al.resolved ? 'RESOLVED' : 'OPEN')).toUpperCase();
            const machine = al.source_host || al.target_computer || 'LAPTOP-A';
            const ip = al.source_ip || '—';
            const risk = (al.risk_level || 'HIGH').toUpperCase();
            const isHighOrCritical = risk === 'HIGH' || risk === 'CRITICAL';
            const isActing = actingAlertId === al.id;
            const isConfirmingShutdown = confirmShutdownId === al.id;
            const count = al.failure_count || al.event_count || 0;

            return (
              <motion.div
                key={al.id}
                layout="position"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={idx < 5 ? undefined : { delay: Math.min(idx * 0.02, 0.1) }}
                className={`alert-row severity-${risk.toLowerCase()}`}
                onClick={() => onSelectAlert && onSelectAlert(al)}
                title="Click to view full threat details"
              >
                {/* 1. Severity & Type */}
                <div className="col-cell col-type">
                  <span className={`alert-severity-indicator ${isHighOrCritical ? 'high' : 'normal'}`}>
                    <span className="severity-dot" />
                    {risk}
                  </span>
                  <div className="alert-type-text-wrap">
                    <span className="alert-type-name">{rawType}</span>
                    {count > 1 && (
                      <span className="alert-count-tag">
                        ({count} attempts)
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. User (Interactive Blue Link) */}
                <div className="col-cell col-user">
                  <span
                    className="alert-user-link"
                    title={al.username ? `User: ${al.username}` : 'No user identified'}
                  >
                    {al.username || '—'}
                  </span>
                </div>

                {/* 3. IP Address */}
                <div className="col-cell col-ip" title={ip}>
                  <span className="alert-ip-text">{ip}</span>
                </div>

                {/* 5. Authorization Status */}
                <div className="col-cell col-status">
                  {status === 'AUTHORIZED' ? (
                    <span className="alert-status-pill authorized">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      Authorized
                    </span>
                  ) : status === 'REMEDIATING' ? (
                    <span className="alert-status-pill remediating">
                      Remediating
                    </span>
                  ) : status === 'RESOLVED' ? (
                    <span className="alert-status-pill resolved">
                      Resolved
                    </span>
                  ) : (
                    <span className="alert-status-pill open">
                      Open
                    </span>
                  )}
                </div>

                {/* 6. Actions (Compact Outlined Buttons) */}
                <div className="col-cell col-actions" onClick={(e) => e.stopPropagation()}>
                  {isConfirmingShutdown ? (
                    <div className="alert-shutdown-confirm">
                      <span className="shutdown-confirm-text">Shutdown?</span>
                      <button
                        type="button"
                        className="btn-confirm-yes"
                        onClick={(e) => handleActionClick(e, al, 'shutdown')}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="btn-confirm-cancel"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmShutdownId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="alert-action-buttons">
                      <button
                        type="button"
                        className="btn-action-outline shutdown"
                        disabled={isActing}
                        onClick={(e) => handleActionClick(e, al, 'shutdown')}
                        title={`Remotely power off ${machine}`}
                      >
                        Shutdown
                      </button>

                      <button
                        type="button"
                        className="btn-action-outline lock"
                        disabled={isActing}
                        onClick={(e) => handleActionClick(e, al, 'lock_screen')}
                        title={`Lock workstation on ${machine}`}
                      >
                        Lock
                      </button>

                      <button
                        type="button"
                        className="btn-action-outline authorize"
                        disabled={isActing || status === 'AUTHORIZED'}
                        onClick={(e) => handleActionClick(e, al, 'authorize')}
                        title="Authorize activity as benign"
                      >
                        Authorize
                      </button>
                    </div>
                  )}
                </div>

                {/* 7. Timestamp */}
                <div className="col-cell col-time" title={fullTime}>
                  {timeParts ? (
                    <div className="alert-timestamp-wrap">
                      <span className="timestamp-time">{timeParts[1] || timeParts[0]}</span>
                      <span className="timestamp-date">{timeParts[0]}</span>
                    </div>
                  ) : (
                    <span className="timestamp-time">{fullTime}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ────────────────────────────────────────────────
export default function Dashboard({ user, token, onLogout, onUpdateUser }) {
  const { selectedDate } = useDateFilter();
  const {
    events,
    alerts,
    stats,
    health,
    labs,
    terminals,
    addLab,
    deleteLab,
    assignTerminal,
    labHours,
    updateLabHours,
    executeAlertAction,
    updateAlertStatus,
  } = useAuthSentinel(selectedDate);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedComputer, setSelectedComputer] = useState(null);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState(null);

  // Map menu IDs to labels and categories
  const menuConfig = {
    overview: { label: 'Overview', category: 'MONITORING' },
    live: { label: 'Incidents', category: 'MONITORING' },
    labs: {
      label: selectedComputer
        ? `${selectedLab?.name || 'Lab'} › ${selectedComputer?.computer_name || selectedComputer?.hostname || selectedComputer?.terminal_id}`
        : selectedLab
        ? `${selectedLab.name} › Connected Computers`
        : 'Laboratories',
      category: 'INVENTORY',
    },
    terminals: { label: 'Terminals', category: 'INVENTORY' },
    csv: { label: 'CSV Analyzer', category: 'TOOLS' },
    settings: { label: 'Settings', category: 'SYSTEM' },
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    setSelectedLab(null);
    setSelectedComputer(null);
  };

  const currentMenu = menuConfig[activeMenu] || { label: 'Overview', category: 'MONITORING' };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-wrapper">
        <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} user={user} onLogout={handleLogout} />
        
        <div className="main-content">
          <Header 
            currentMenuLabel={currentMenu.label}
            currentCategory={currentMenu.category}
          />
          
          <div className="body">
            <PageTransition transitionKey={`${activeMenu}-${selectedLab?.id || ''}-${selectedComputer?.terminal_id || ''}`}>
              {activeMenu === 'overview' && (
                <OverviewSection
                  events={events}
                  alerts={alerts}
                  onExecuteAction={executeAlertAction}
                  onSelectAlert={setSelectedAlertForModal}
                />
              )}
              {activeMenu === 'live' && (
                <LiveTelemetrySection
                  events={events}
                  alerts={alerts}
                  onExecuteAction={executeAlertAction}
                  onSelectAlert={setSelectedAlertForModal}
                />
              )}
              {activeMenu === 'labs' && (
                selectedComputer ? (
                  <ComputerDetailView
                    terminalId={selectedComputer.terminal_id}
                    lab={selectedLab}
                    onBackToComputers={() => setSelectedComputer(null)}
                    onGoToLabs={() => {
                      setSelectedComputer(null);
                      setSelectedLab(null);
                    }}
                  />
                ) : selectedLab ? (
                  <LabComputersView
                    lab={selectedLab}
                    onBack={() => {
                      setSelectedLab(null);
                      setSelectedComputer(null);
                    }}
                    onSelectComputer={(comp) => setSelectedComputer(comp)}
                    onGoToTerminals={() => {
                      setSelectedLab(null);
                      setSelectedComputer(null);
                      setActiveMenu('terminals');
                    }}
                  />
                ) : (
                  <LaboratoriesView
                    labs={labs}
                    onAddLab={addLab}
                    onDeleteLab={deleteLab}
                    labHours={labHours}
                    onUpdateLabHours={updateLabHours}
                    onSelectLab={(lab) => {
                      setSelectedLab(lab);
                      setSelectedComputer(null);
                    }}
                  />
                )
              )}
              {activeMenu === 'terminals' && (
                <LabTerminalsView
                  terminals={terminals}
                  labs={labs}
                  onAssign={assignTerminal}
                />
              )}
              {activeMenu === 'csv' && <CsvAnalyticsPage />}
              {activeMenu === 'settings' && (
                <SettingsSection
                  health={health}
                  user={user}
                  token={token}
                  onLogout={handleLogout}
                  onUpdateUser={onUpdateUser}
                />
              )}
            </PageTransition>
          </div>
        </div>

        {selectedAlertForModal && (
          <LiveAlertModal
            alert={selectedAlertForModal}
            onClose={() => setSelectedAlertForModal(null)}
            onExecuteAction={executeAlertAction}
            onUpdateStatus={updateAlertStatus}
          />
        )}
      </div>
    </MotionConfig>
  );
}
