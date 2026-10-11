/**
 * Dashboard — Main Application Layout
 * ===================================
 * Wraps the original App functionality inside ProtectedRoute.
 * This is where the sidebar, header, and main content live.
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

      <div className="sidebar-footer">
        <motion.button 
          className="admin-btn"
          onClick={onLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={springs.snappy}
          title={`Logged in as ${user?.email || 'User'}`}
        >
          <span className="admin-icon">
            <Icon name="log-out" size={16} />
          </span>
          <span>Logout</span>
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

// ── Overview Section ────────────────────────────────────────────────────────
function OverviewSection({ events, alerts }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;
  
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

  return (
    <motion.div
      className="section"
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>System Status</h2>
          </div>
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
            className={`stat-card ${card.isAlert ? 'alert' : ''}`}
            variants={fadeUpVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ ...springs.soft, delay: idx * 0.05 }}
            whileHover={{ y: -3 }}
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

        {/* Right: System Health Breakdown donut */}
        <motion.div
          className="health-donut-panel"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={springs.soft}
          viewport={{ once: true, margin: '-40px' }}
        >
          <div className="health-donut-title">System Health Breakdown</div>

          <div className="health-donut-wrap">
            {/* Donut chart */}
            <svg viewBox="0 0 100 100" className="health-donut-svg">
              {(() => {
                const success = filteredEvents.filter((e) => e.status === 'SUCCESS').length;
                const failed = filteredEvents.filter((e) => e.status === 'FAILURE').length;
                const anomaly = activeAlerts;
                const total = Math.max(success + failed + anomaly, 1);

                const pctS = success / total;
                const pctF = failed / total;
                const pctA = anomaly / total;

                const circ = 2 * Math.PI * 38;
                const segS = circ * pctS;
                const segF = circ * pctF;
                const segA = circ * pctA;

                const dominantPct = Math.round(Math.max(pctS, pctF, pctA) * 100);
                const dominantLabel =
                  pctF >= pctS && pctF >= pctA ? 'Failure' : pctS >= pctA ? 'Success' : 'Anomaly';

                return (
                  <>
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="16" />

                    {/* Success segment */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="16"
                      strokeDasharray={`${segS.toFixed(1)} ${(circ - segS).toFixed(1)}`}
                      strokeDashoffset="0" transform="rotate(-90 50 50)" />

                    {/* Failure segment */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="16"
                      strokeDasharray={`${segF.toFixed(1)} ${(circ - segF).toFixed(1)}`}
                      strokeDashoffset={`-${segS.toFixed(1)}`} transform="rotate(-90 50 50)" />

                    {/* Anomaly segment */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="16"
                      strokeDasharray={`${segA.toFixed(1)} ${(circ - segA).toFixed(1)}`}
                      strokeDashoffset={`-${(segS + segF).toFixed(1)}`} transform="rotate(-90 50 50)" />

                    {/* Center circle */}
                    <circle cx="50" cy="50" r="25" fill="white" />

                    {/* Center text */}
                    <text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="800" fill="#111827" fontFamily="var(--font-mono)">{dominantPct}%</text>
                    <text x="50" y="57" textAnchor="middle" fontSize="7" fill="#9ca3af" fontFamily="var(--font-sans)">{dominantLabel}</text>
                  </>
                );
              })()}
            </svg>

            {/* Legend */}
            <div className="health-donut-legend">
              <div className="health-leg-item">
                <span className="health-leg-sw" style={{ background: '#10b981' }} />
                <span>Success</span>
              </div>
              <div className="health-leg-item">
                <span className="health-leg-sw" style={{ background: '#ef4444' }} />
                <span>Failure</span>
              </div>
              <div className="health-leg-item">
                <span className="health-leg-sw" style={{ background: '#f59e0b' }} />
                <span>Anomaly</span>
              </div>
            </div>
          </div>
        </motion.div>
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
        <AlertList alerts={filteredAlerts} emptyMessage={`No incidents on ${displayDate}`} />
      </motion.div>
    </motion.div>
  );
}

// ── Live Telemetry Section ──────────────────────────────────────────────────
function LiveTelemetrySection({ events, alerts }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
  const motionPrefs = useMotionPrefs();
  const fadeUpVariant = motionPrefs.fadeUp || variants.fadeUp;
  
  const filteredEvents = filterByDate(events, selectedDate);
  const filteredAlerts = filterByDate(alerts, selectedDate);

  return (
    <motion.div
      className="section"
      variants={fadeUpVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Incidents</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
      </div>

      <div className="telemetry-grid">
        <motion.div
          className="telemetry-panel"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={springs.soft}
          viewport={{ once: true, margin: '-40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Authentication Events</h3>
            <span className="badge">{filteredEvents.length}</span>
          </div>
          <EventsTable events={filteredEvents} emptyMessage={`No events on ${displayDate}`} />
        </motion.div>
        <motion.div
          className="telemetry-panel"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={springs.soft}
          viewport={{ once: true, margin: '-40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Detected Incidents</h3>
            <span className="badge alert">{filteredAlerts.length}</span>
          </div>
          <AlertList alerts={filteredAlerts} emptyMessage={`No incidents on ${displayDate}`} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Settings Section ────────────────────────────────────────────────────────
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

// ── Events Table Component ──────────────────────────────────────────────────
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

// ── Alert List Component ────────────────────────────────────────────────────
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

// ── Main Dashboard Component ────────────────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
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
    </MotionConfig>
  );
}
