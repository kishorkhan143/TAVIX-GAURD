/**
 * AuthSentinel — Modern Security Dashboard
 * Light mode with sidebar navigation and clean UI
 */

import { useState, useEffect, useMemo } from 'react';
import './App.css';
import './csv_analytics/csvAnalytics.css';
import tavixLogo from './assets/tavix-guard-logo.png';
import { useAuthSentinel, BACKEND_URL } from './useAuthSentinel';
import Sparkline, { generateTrendIntervals } from './components/Sparkline';
import CsvAnalyticsPage from './csv_analytics/CsvAnalyticsPage';
import LaboratoriesView from './components/live/LaboratoriesView';
import LabComputersView from './components/live/LabComputersView';
import ComputerDetailView from './components/live/ComputerDetailView';
import LabTerminalsView from './components/live/LabTerminalsView';
import ExportAnalysisDropdown from './components/ExportAnalysisDropdown';
import DateFilter from './components/DateFilter';
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
            <div className="nav-items">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => onMenuChange(item.id)}
                >
                  <span className="nav-icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="admin-btn">
          <span className="admin-icon">
            <Icon name="user" size={16} />
          </span>
          <span>Admin Account</span>
        </button>
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
        <div className="header-category">{currentCategory}</div>
      </div>
      <div className="header-right">
        <DateFilter />
        <div className="clock">
          {time.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })}
        </div>
      </div>
    </header>
  );
}

function StatusBadge({ label, online, count }) {
  return (
    <div className={`status-badge ${online ? 'online' : 'offline'}`}>
      <span className="dot" />
      <span>{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </div>
  );
}

function OverviewSection({ events, alerts }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
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

  return (
    <div className="section">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>System Status</h2>
          </div>
          {!isToday && (
            <div className="viewing-past-date-pill">
              <span>Viewing {displayDate}</span>
              <button type="button" className="btn-back-to-live" onClick={resetToToday}>
                Back to live
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-content">
            <div className="stat-icon">
              <Icon name="activity" size={32} />
            </div>
            <div className="stat-value">{totalEvents}</div>
          </div>
          <div className="stat-chart">
            <Sparkline data={trends.total} color="#0066ff" height={40} id="total-events" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Successful</div>
          <div className="stat-content">
            <div className="stat-icon">
              <Icon name="check-circle" size={32} />
            </div>
            <div className="stat-value">{successfulLogins}</div>
          </div>
          <div className="stat-chart">
            <Sparkline data={trends.successful} color="#10b981" height={40} id="successful-events" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className="stat-content">
            <div className="stat-icon">
              <Icon name="x-circle" size={32} />
            </div>
            <div className="stat-value">{failedLogins}</div>
          </div>
          <div className="stat-chart">
            <Sparkline data={trends.failed} color="#ef4444" height={40} id="failed-events" />
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-label">Alerts</div>
          <div className="stat-content">
            <div className="stat-icon">
              <Icon name="alert-triangle" size={32} />
            </div>
            <div className="stat-value">{activeAlerts}</div>
          </div>
          <div className="stat-chart">
            <Sparkline data={trends.alerts} color="#f59e0b" height={40} id="alerts-events" />
          </div>
        </div>
      </div>

      <div className="events-panel">
        <div className="panel-header">
          <h3>Recent Events</h3>
          <span className="badge">{filteredEvents.length}</span>
        </div>
        <EventsTable events={filteredEvents} emptyMessage={`No events on ${displayDate}`} />
      </div>

      <div className="alerts-panel">
        <div className="panel-header">
          <h3>Active Alerts</h3>
          <span className="badge alert">{filteredAlerts.length}</span>
        </div>
        <AlertList alerts={filteredAlerts} emptyMessage={`No incidents on ${displayDate}`} />
      </div>
    </div>
  );
}

function LiveTelemetrySection({ events, alerts }) {
  const { selectedDate, isToday, resetToToday, displayDate } = useDateFilter();
  const filteredEvents = filterByDate(events, selectedDate);
  const filteredAlerts = filterByDate(alerts, selectedDate);

  return (
    <div className="section">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Incidents</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {!isToday && (
              <div className="viewing-past-date-pill">
                <span>Viewing {displayDate}</span>
                <button type="button" className="btn-back-to-live" onClick={resetToToday}>
                  Back to live
                </button>
              </div>
            )}
            <ExportAnalysisDropdown alerts={filteredAlerts.length > 0 ? filteredAlerts : alerts} />
          </div>
        </div>
      </div>

      <div className="telemetry-grid">
        <div className="telemetry-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Authentication Events</h3>
            <span className="badge">{filteredEvents.length}</span>
          </div>
          <EventsTable events={filteredEvents} emptyMessage={`No events on ${displayDate}`} />
        </div>
        <div className="telemetry-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Detected Incidents</h3>
            <span className="badge alert">{filteredAlerts.length}</span>
          </div>
          <AlertList alerts={filteredAlerts} emptyMessage={`No incidents on ${displayDate}`} />
        </div>
      </div>
    </div>
  );
}


function SettingsSection({ health }) {
  const isCollectorOnline = health?.collector_status === 'CONNECTED';
  const isBackendOnline   = health?.backend === 'ONLINE';
  const isDbOnline        = health?.database === 'ONLINE';

  return (
    <div className="section">
      <div className="section-header">
        <h2>System Settings</h2>
        <p>Configure system preferences and connections</p>
      </div>

      <div className="settings-card">
        <h3>System Status</h3>
        
        <div className="status-grid settings-status">
          <StatusBadge label="Backend" online={isBackendOnline} />
          <StatusBadge label="Database" online={isDbOnline} />
          <StatusBadge label="Collectors" online={isCollectorOnline} count={isCollectorOnline ? 1 : 0} />
        </div>
      </div>

      <div className="settings-card">
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
      </div>
    </div>
  );
}

function EventsTable({ events, emptyMessage = 'No events to display' }) {
  if (!events.length) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="events-list">
      {events.map((ev) => (
        <div key={ev.id} className={`event-row ${ev.status}`}>
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
        </div>
      ))}
    </div>
  );
}

function AlertList({ alerts, emptyMessage = 'No alerts to display' }) {
  if (!alerts.length) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="alerts-list">
      {alerts.map((al) => {
        const typeLabel = alertTypeLabel(al.alert_type);
        const fullTime = fmtDateTime(al.triggered_at);
        const timeParts = fullTime && fullTime.includes(',') ? fullTime.split(', ') : null;

        return (
          <div key={al.id} className={`alert-row ${al.risk_level}`}>
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
          </div>
        );
      })}
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
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DateProvider>
      <AppContent />
    </DateProvider>
  );
}
