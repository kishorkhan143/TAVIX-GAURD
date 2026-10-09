import React, { useState, useMemo } from 'react';
import LiveAlertModal from './LiveAlertModal';
import { formatDateTime } from '../../useAuthSentinel';

export default function LiveAlertsView({ alerts, onUpdateStatus }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((al) => {
      const status = (al.status || (al.resolved ? 'RESOLVED' : 'OPEN')).toUpperCase();
      const severity = (al.risk_level || 'LOW').toUpperCase();
      const type = (al.alert_type || '').toUpperCase();
      const user = (al.username || '').toLowerCase();
      const ip = (al.source_ip || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      // Severity match
      if (severityFilter !== 'ALL' && severity !== severityFilter) {
        return false;
      }

      // Status match
      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }

      // Search match
      if (search) {
        const matchesUser = user.includes(search);
        const matchesIp = ip.includes(search);
        const matchesType = type.includes(search.toUpperCase());
        const matchesSeverity = severity.includes(search.toUpperCase());
        const matchesStatus = status.includes(search.toUpperCase());
        const matchesId = String(al.id).includes(search);
        if (!matchesUser && !matchesIp && !matchesType && !matchesSeverity && !matchesStatus && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, searchTerm, severityFilter, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters Bar */}
      <div className="grouping-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search alerts (user, IP, type)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-normal)',
              fontSize: '13px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              width: '240px',
              outline: 'none',
            }}
          />

          {/* Severity Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="severity-filter" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Severity:
            </label>
            <select
              id="severity-filter"
              className="dimension-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="ALL">ALL</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="status-filter" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Status:
            </label>
            <select
              id="status-filter"
              className="dimension-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">ALL</option>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </span>
      </div>

      {/* Security Alerts Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>User</th>
              <th>Source IP</th>
              <th>Count</th>
              <th>Attack / Alert Type</th>
              <th>Risk Level</th>
              <th>Status</th>
              <th>First Seen</th>
              <th>Last Seen</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-tertiary)' }}>
                  No security alerts detected
                </td>
              </tr>
            ) : (
              filteredAlerts.map((al) => {
                const alertId = al.id ? `ALT-${String(al.id).padStart(4, '0')}` : 'ALT-0001';
                const status = (al.status || (al.resolved ? 'RESOLVED' : 'OPEN')).toUpperCase();
                const riskLevel = (al.risk_level || 'HIGH').toUpperCase();
                const attackType = (al.alert_type || 'ANOMALY').replace(/_/g, ' ');
                const firstSeen = formatDateTime(al.triggered_at || al.created_at);
                const lastSeen = formatDateTime(al.triggered_at || al.created_at);

                return (
                  <tr key={al.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' }}>
                      {alertId}
                    </td>
                    <td style={{ fontWeight: 600 }}>{al.username || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {al.source_ip || 'Internal'}
                    </td>
                    <td>
                      {al.failure_count || 1}
                      {al.failure_count > 1 && (
                        <span style={{ color: '#ef4444', fontSize: '11px', marginLeft: '4px' }}>
                          ({al.failure_count} events)
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{attackType}</td>
                    <td>
                      <span className={`severity-pill ${riskLevel}`}>
                        {riskLevel}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${status}`}>
                        {status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {firstSeen}
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {lastSeen}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        onClick={() => setSelectedAlert(al)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedAlert && (
        <LiveAlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
}
