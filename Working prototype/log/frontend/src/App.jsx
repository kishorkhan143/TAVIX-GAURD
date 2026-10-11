/**
 * AuthSentinel — Modern Security Dashboard
 * Light mode with sidebar navigation and clean UI
 */

import { useState, useEffect, useMemo } from 'react';
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
import DateFilter from './components/DateFilter';
import PageTransition from './components/PageTransition';
import {
  DateProvider,
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

// ── Components ────────────────────────────────────────────────────────────────

function Sidebar({ activeMenu, onMenuChange }) {
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

      <div className="sidebar-footer">
        <motion.button 
          className="admin-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={springs.snappy}
        >
          <span className="admin-icon">
            <Icon name="user" size={16} />
          </span>
          <span>Admin Account</span>
        </motion.button>
      </div>
    </aside>
  );
}

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
      <div className="header-right">
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

// ── Overview: Event Timeline Analytics ───────────────────────────────────────
function OverviewSection({ events, alerts }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;

  const filteredEvents = filterByDate(events, selectedDate);
  const filteredAlerts = filterByDate(alerts, selectedDate);

  const totalEvents   = filteredEvents.length;
  const successful    = filteredEvents.filter((e) => e.status === 'SUCCESS').length;
  const failed        = filteredEvents.filter((e) => e.status === 'FAILURE').length;
  const activeAlerts  = filteredAlerts.filter((a) => !a.resolved).length;

  const trends = useMemo(
    () => generateTrendIntervals(filteredEvents, filteredAlerts, 12),
    [filteredEvents, filteredAlerts]
  );

  // Build SVG polyline points from a data array, fitting into viewBox 0 0 W H
  const toPoints = (data, W = 320, H = 90) => {
    if (!data || data.length < 2) return `0,${H} ${W},${H}`;
    const max = Math.max(...data, 1);
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - (v / max) * (H - 6);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const totalPts   = toPoints(trends.total);
  const successPts = toPoints(trends.successful);
  const failedPts  = toPoints(trends.failed);
  const alertPts   = toPoints(trends.alerts);

  // Donut segments from real data
  const total3 = (successful + failed + activeAlerts) || 1;
  const pctS = successful / total3;
  const pctF = failed / total3;
  const pctA = activeAlerts / total3;
  const circ = 2 * Math.PI * 38;
  const segS = circ * pctS;
  const segF = circ * pctF;
  const segA = circ * pctA;

  const dominantPct = Math.round(Math.max(pctS, pctF, pctA) * 100);
  const dominantLabel = pctF >= pctS && pctF >= pctA ? 'Failure' : pctS >= pctA ? 'Success' : 'Anomaly';

  return (
    <motion.div
      className="section ov-section"
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <div className="ov-header">
        <div>
          <h2 className="ov-title">Event Timeline Analytics</h2>
        </div>
        {!isToday && (
          <motion.div
            className="viewing-past-date-pill"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.snappy}
          >
            <span>Viewing {displayDate}</span>
            <button type="button" className="btn-back-to-live" onClick={resetToToday}>Back to live</button>
          </motion.div>
        )}
      </div>

      {/* Charts row */}
      <div className="ov-charts-row">

        {/* Left: Trend line chart */}
        <motion.div
          className="ov-chart-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.05 }}
        >
          <div className="ov-chart-header">
            <span className="ov-chart-title">Event &amp; Alert Trends</span>
            <span className="ov-time-badge">24 hour les</span>
          </div>

          {/* Y-axis + SVG */}
          <div className="ov-chart-body">
            <div className="ov-yaxis">
              {[totalEvents, '', Math.round(totalEvents * 0.6), '', Math.round(totalEvents * 0.3), '', 1].map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <svg viewBox="0 0 320 90" preserveAspectRatio="none" className="ov-svg">
                <defs>
                  <linearGradient id="ovGT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066ff" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0066ff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="ovGS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="ovGF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                {[15, 30, 45, 60, 75].map((y) => (
                  <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#f0f0f0" strokeWidth="0.8" />
                ))}
                {/* Area fills */}
                <polygon fill="url(#ovGT)" points={`${totalPts} 320,90 0,90`} />
                <polygon fill="url(#ovGS)" points={`${successPts} 320,90 0,90`} />
                <polygon fill="url(#ovGF)" points={`${failedPts} 320,90 0,90`} />
                {/* Lines */}
                <polyline fill="none" stroke="#0066ff" strokeWidth="2" strokeLinejoin="round" points={totalPts} />
                <polyline fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" points={successPts} />
                <polyline fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" points={failedPts} />
                <polyline fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,4" strokeLinejoin="round" points={alertPts} />
              </svg>
              {/* X labels */}
              <div className="ov-xlabels">
                {['0h','3h','6h','9h','12h','15h','18h','21h','24h'].map((l) => <span key={l}>{l}</span>)}
              </div>
              {/* Legend */}
              <div className="ov-legend">
                <div className="ov-leg"><span className="ov-leg-dot" style={{ background: '#0066ff' }} />Total</div>
                <div className="ov-leg"><span className="ov-leg-dot" style={{ background: '#10b981' }} />Successful</div>
                <div className="ov-leg"><span className="ov-leg-dot" style={{ background: '#ef4444' }} />Failed</div>
                <div className="ov-leg"><span className="ov-leg-dash" style={{ borderColor: '#f59e0b' }} />Alerts</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Donut */}
        <motion.div
          className="ov-chart-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.1 }}
        >
          <div className="ov-chart-title" style={{ marginBottom: 14 }}>System Health</div>
          <div className="ov-donut-wrap">
            <svg viewBox="0 0 100 100" className="ov-donut-svg">
              {/* Background */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="16" />
              {/* Success */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="16"
                strokeDasharray={`${segS.toFixed(1)} ${(circ - segS).toFixed(1)}`}
                strokeDashoffset="0" transform="rotate(-90 50 50)" />
              {/* Failure */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="16"
                strokeDasharray={`${segF.toFixed(1)} ${(circ - segF).toFixed(1)}`}
                strokeDashoffset={`-${segS.toFixed(1)}`} transform="rotate(-90 50 50)" />
              {/* Anomaly */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="16"
                strokeDasharray={`${segA.toFixed(1)} ${(circ - segA).toFixed(1)}`}
                strokeDashoffset={`-${(segS + segF).toFixed(1)}`} transform="rotate(-90 50 50)" />
              {/* Center hole */}
              <circle cx="50" cy="50" r="25" fill="white" />
              <text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="800" fill="#111827" fontFamily="var(--font-mono)">{dominantPct}%</text>
              <text x="50" y="57" textAnchor="middle" fontSize="7" fill="#9ca3af" fontFamily="var(--font-sans)">{dominantLabel}</text>
            </svg>
            <div className="ov-donut-legend">
              <div className="ov-dl-item"><span className="ov-dl-sw" style={{ background: '#10b981' }} />{Math.round(pctS * 100)}% Success</div>
              <div className="ov-dl-item"><span className="ov-dl-sw" style={{ background: '#ef4444' }} />{Math.round(pctF * 100)}% Failure</div>
              <div className="ov-dl-item"><span className="ov-dl-sw" style={{ background: '#f59e0b' }} />{Math.round(pctA * 100)}% Anomaly</div>
            </div>
          </div>
        </motion.div>

      </div>{/* /ov-charts-row */}
    </motion.div>
  );
}

// ── Incidents: Status, Events & Triage ───────────────────────────────────────
function LiveTelemetrySection({ events, alerts }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;

  const filteredEvents = filterByDate(events, selectedDate);
  const filteredAlerts = filterByDate(alerts, selectedDate);

  const totalEvents  = filteredEvents.length;
  const successful   = filteredEvents.filter((e) => e.status === 'SUCCESS').length;
  const failed       = filteredEvents.filter((e) => e.status === 'FAILURE').length;
  const activeAlerts = filteredAlerts.filter((a) => !a.resolved).length;
  const resolved     = filteredAlerts.filter((a) => a.resolved).length;

  const trends = useMemo(
    () => generateTrendIntervals(filteredEvents, filteredAlerts, 12),
    [filteredEvents, filteredAlerts]
  );

  const [selectedIncident, setSelectedIncident] = useState(null);

  // Auto-select the first unresolved alert for drill-down
  const firstAlert = filteredAlerts.find((a) => !a.resolved) || filteredAlerts[0] || null;
  const drillAlert = selectedIncident || firstAlert;

  // Build drill-down timeline from events matching drillAlert user
  const drillEvents = drillAlert
    ? filteredEvents
        .filter((e) => e.username === drillAlert.username)
        .slice(0, 5)
    : [];

  return (
    <motion.div
      className="section inc-section"
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header row */}
      <div className="inc-hdr-row">
        <h2 className="inc-title">Incidents Queue</h2>
        <div className="inc-hdr-pills">
          {!isToday && (
            <motion.div
              className="viewing-past-date-pill"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.snappy}
            >
              <span>Viewing {displayDate}</span>
              <button type="button" className="btn-back-to-live" onClick={resetToToday}>Back to live</button>
            </motion.div>
          )}
          <span className="inc-open-pill">Open ({activeAlerts})</span>
          <span className="inc-res-pill">Resolved ({resolved})</span>
          <ExportAnalysisDropdown alerts={filteredAlerts.length > 0 ? filteredAlerts : alerts} />
        </div>
      </div>

      {/* System Status mini cards */}
      <div className="inc-stat-row">
        {[
          { label: 'TOTAL EVENTS', value: totalEvents, color: '#0066ff', icon: 'activity', data: trends.total },
          { label: 'SUCCESSFUL',   value: successful,  color: '#10b981', icon: 'check-circle', data: trends.successful },
          { label: 'FAILED',       value: failed,      color: '#ef4444', icon: 'x-circle', data: trends.failed },
          { label: 'ALERTS',       value: activeAlerts,color: '#f59e0b', icon: 'alert-triangle', data: trends.alerts },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            className="inc-mini-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.soft, delay: i * 0.04 }}
            whileHover={{ y: -2 }}
          >
            <div className="inc-mini-label">{c.label}</div>
            <div className="inc-mini-row">
              <div style={{ color: c.color }}><Icon name={c.icon} size={20} /></div>
              <div className="inc-mini-val" style={{ color: c.color }}>{c.value}</div>
            </div>
            <Sparkline data={c.data} color={c.color} height={28} id={`inc-spark-${c.label}`} />
          </motion.div>
        ))}
      </div>

      {/* Three-column content */}
      <div className="inc-three-col">

        {/* Col 1: Recent Activities & Events */}
        <motion.div
          className="inc-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.06 }}
        >
          <div className="inc-panel-hdr">
            <span className="inc-panel-title">Recent Activities &amp; Events</span>
          </div>
          <div className="inc-panel-body">
            {filteredEvents.length === 0 ? (
              <div className="empty-state"><p>No events on {displayDate}</p></div>
            ) : (
              <table className="inc-evt-table">
                <thead>
                  <tr>
                    <th>Times</th>
                    <th>Activity</th>
                    <th>Event Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filteredEvents.slice(0, 12).map((ev, idx) => (
                      <motion.tr
                        key={ev.id}
                        layout="position"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ ...springs.snappy, delay: Math.min(idx * 0.02, 0.08) }}
                      >
                        <td className="inc-td-time">{fmtTime(ev.timestamp)}</td>
                        <td className="inc-td-user">{ev.username || '—'}</td>
                        <td className="inc-td-type">
                          {ev.status === 'SUCCESS' ? 'Access' : 'Auth attempt'}
                        </td>
                        <td>
                          <span className={`inc-risk-tag ${ev.risk_level === 'HIGH' ? 'rhi' : ev.risk_level === 'MEDIUM' ? 'rmed' : 'rlo'}`}>
                            {ev.risk_level}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Col 2: Incidents & Anomalies Triage */}
        <motion.div
          className="inc-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.1 }}
        >
          <div className="inc-panel-hdr">
            <span className="inc-panel-title">Incidents &amp; Anomalies</span>
            <span className="inc-panel-sub">Investigation/Triage Queue</span>
          </div>
          <div className="inc-panel-body">
            {filteredAlerts.length === 0 ? (
              <div className="empty-state"><p>No incidents on {displayDate}</p></div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredAlerts.slice(0, 8).map((al, idx) => {
                  const typeLabel = alertTypeLabel(al.alert_type);
                  const isSelected = drillAlert?.id === al.id;
                  const isCritical = al.risk_level === 'HIGH' || al.failure_count >= 5;
                  return (
                    <motion.div
                      key={al.id}
                      className={`inc-triage-item${isSelected ? ' inc-triage-selected' : ''}`}
                      layout="position"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ ...springs.snappy, delay: Math.min(idx * 0.03, 0.1) }}
                      onClick={() => setSelectedIncident(al)}
                    >
                      <div className="inc-tr-top">
                        <div className="inc-tr-avatar">{(al.username || '?')[0].toUpperCase()}</div>
                        <span className="inc-tr-user">{al.username || '—'}</span>
                      </div>
                      <div className="inc-tr-tags">
                        <span className={`inc-sev-tag ${isCritical ? 'sev-crit' : 'sev-med'}`}>
                          {isCritical ? 'CRITICAL' : 'MEDIUM'}
                        </span>
                        <span className={`inc-type-tag ${al.alert_type === 'SUCCESS_AFTER_FAILURES' ? 'type-anom' : ''}`}>
                          {typeLabel} {al.failure_count > 0 ? `×${al.failure_count}` : ''}
                        </span>
                      </div>
                      <div className="inc-tr-actions">
                        <motion.button className="inc-ab ab-ack" whileTap={{ scale: 0.95 }} transition={springs.snappy}>Acknowledge</motion.button>
                        <motion.button className="inc-ab ab-blk" whileTap={{ scale: 0.95 }} transition={springs.snappy}>Block IP</motion.button>
                        {al.alert_type === 'SUCCESS_AFTER_FAILURES' && (
                          <motion.button className="inc-ab ab-inv" whileTap={{ scale: 0.95 }} transition={springs.snappy}>Investigate</motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Col 3: Deep Drill-Down */}
        <motion.div
          className="inc-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.14 }}
        >
          <div className="inc-panel-hdr" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="alert-triangle" size={13} />
              <span className="inc-panel-title">Deep Drill-Down</span>
            </div>
            {drillAlert && (
              <motion.button
                className="inc-dd-close"
                onClick={() => setSelectedIncident(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={springs.snappy}
              >✕</motion.button>
            )}
          </div>

          <div className="inc-panel-body">
            {!drillAlert ? (
              <div className="empty-state"><p>Select an incident to drill down</p></div>
            ) : (
              <motion.div
                key={drillAlert.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={springs.soft}
              >
                {/* Metadata */}
                <div className="inc-dd-section">
                  <div className="inc-dd-label">Metadata</div>
                  <div className="inc-dd-meta">{fmtDateTime(drillAlert.triggered_at)}</div>
                </div>

                {/* Info rows */}
                <div className="inc-dd-section">
                  <div className="inc-dd-row"><span>User</span><span className="inc-dd-val-accent">{drillAlert.username || '—'}</span></div>
                  <div className="inc-dd-row"><span>Source IP</span><span className="inc-dd-val-mono">{drillAlert.source_ip || '—'}</span></div>
                  <div className="inc-dd-row"><span>Type</span><span className="inc-dd-val-err">{alertTypeLabel(drillAlert.alert_type)}</span></div>
                  {drillAlert.failure_count > 0 && (
                    <div className="inc-dd-row"><span>Occurrences</span><span className="inc-dd-val-err">×{drillAlert.failure_count}</span></div>
                  )}
                </div>

                {/* Timeline Events */}
                <div className="inc-dd-section">
                  <div className="inc-dd-label">Timeline Events</div>
                  <div className="inc-dd-tl">
                    {drillEvents.length === 0 ? (
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>No events found</p>
                    ) : (
                      drillEvents.map((ev, i) => (
                        <div key={ev.id || i} className="inc-dd-tl-row">
                          <span className="inc-dd-tl-dot" style={{ background: ev.status === 'SUCCESS' ? '#10b981' : '#ef4444' }} />
                          <span className="inc-dd-tl-time">{fmtTime(ev.timestamp)}</span>
                          <span className={`inc-dd-tl-status ${ev.status === 'SUCCESS' ? 'tl-ok' : 'tl-fail'}`}>
                            ● {ev.status === 'SUCCESS' ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="inc-dd-actions">
                  <motion.button className="inc-dd-btn dab-fp" whileTap={{ scale: 0.97 }} transition={springs.snappy}>
                    Mark False Positive
                  </motion.button>
                  <motion.button className="inc-dd-btn dab-mute" whileTap={{ scale: 0.97 }} transition={springs.snappy}>
                    Mute Alerts
                  </motion.button>
                  <motion.button className="inc-dd-btn dab-blk" whileTap={{ scale: 0.97 }} transition={springs.snappy}>
                    Block IP Address
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

      </div>{/* /inc-three-col */}
    </motion.div>
  );
}


function SettingsSection({ health }) {
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;
  
  const isCollectorOnline = health?.collector_status === 'CONNECTED';
  const isBackendOnline   = health?.backend === 'ONLINE';
  const isDbOnline        = health?.database === 'ONLINE';

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
        <p>Configure system preferences and connections</p>
      </div>

      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={springs.soft}
        viewport={{ once: true, margin: '-40px' }}
      >
        <h3>System Status</h3>
        
        <div className="status-grid settings-status">
          <StatusBadge label="Backend" online={isBackendOnline} />
          <StatusBadge label="Database" online={isDbOnline} />
          <StatusBadge label="Collectors" online={isCollectorOnline} count={isCollectorOnline ? 1 : 0} />
        </div>
      </motion.div>

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

function EventsTable({ events, emptyMessage = 'No events to display' }) {
  const motionPrefs = useMotionPrefs();
  const listVariants = motionPrefs.listItem || variants.listItem;
  
  if (!events.length) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="events-list">
      <AnimatePresence initial={false}>
        {events.map((ev, idx) => (
          <motion.div
            key={ev.id}
            layout="position"
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={idx < 5 ? undefined : { delay: Math.min(idx * 0.02, 0.1) }}
            className={`event-row ${ev.status}`}
          >
            <div className="event-time">
              <div>{fmtTime(ev.timestamp)}</div>
              <div className="event-date-sub">{formatDisplayDate(getItemDateString(ev.timestamp))}</div>
            </div>
            <div className="event-user">{ev.username || '—'}</div>
            <div className="event-ip">{ev.source_ip || '—'}</div>
            <div className={`event-status ${ev.status}`}>
              {ev.status === 'SUCCESS' ? (
                <Icon name="check-circle" size={16} />
              ) : (
                <Icon name="x-circle" size={16} />
              )}
            </div>
            <div className={`risk-level ${ev.risk_level}`}>{ev.risk_level}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AlertList({ alerts, emptyMessage = 'No alerts to display' }) {
  const motionPrefs = useMotionPrefs();
  const listVariants = motionPrefs.listItem || variants.listItem;
  
  if (!alerts.length) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="alerts-list">
      <AnimatePresence initial={false}>
        {alerts.map((al, idx) => {
          const typeLabel = alertTypeLabel(al.alert_type);
          const fullTime = fmtDateTime(al.triggered_at);
          const timeParts = fullTime && fullTime.includes(',') ? fullTime.split(', ') : null;

          return (
            <motion.div
              key={al.id}
              layout="position"
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={idx < 5 ? undefined : { delay: Math.min(idx * 0.02, 0.1) }}
              className={`alert-row ${al.risk_level}`}
            >
              <div className="alert-type" title={typeLabel}>
                {typeLabel}
              </div>
              <div className="alert-user" title={al.username || '—'}>
                {al.username || '—'}
              </div>
              <div className="alert-ip" title={al.source_ip || '—'}>
                {al.source_ip || '—'}
              </div>
              <div
                className="alert-count"
                title={al.failure_count > 0 ? `${al.failure_count} occurrences` : ''}
              >
                {al.failure_count > 0 ? `×${al.failure_count}` : ''}
              </div>
              <div className="alert-time" title={fullTime}>
                {timeParts ? (
                  <>
                    <span className="alert-time-line1">{timeParts[0]}</span>
                    <span className="alert-time-line2">{timeParts[1]}</span>
                  </>
                ) : (
                  fullTime
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function AppContent() {
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
  } = useAuthSentinel(selectedDate);
  const [activeMenu, setActiveMenu] = useState('live');
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedComputer, setSelectedComputer] = useState(null);

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

  return (
    <div className="app-wrapper">
      <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} />
      
      <div className="main-content">
        <Header 
          currentMenuLabel={currentMenu.label}
          currentCategory={currentMenu.category}
        />
        
        <div className="body">
          <PageTransition transitionKey={`${activeMenu}-${selectedLab?.id || ''}-${selectedComputer?.terminal_id || ''}`}>
            {activeMenu === 'overview' && <OverviewSection events={events} alerts={alerts} />}
            {activeMenu === 'live' && <LiveTelemetrySection events={events} alerts={alerts} />}
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
            {activeMenu === 'settings' && <SettingsSection health={health} />}
          </PageTransition>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <DateProvider>
        <AppContent />
      </DateProvider>
    </MotionConfig>
  );
}
