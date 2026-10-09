import React, { useState } from 'react';
import { formatDateTime } from '../../useAuthSentinel';

export default function LiveAlertModal({ alert, onClose, onUpdateStatus }) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!alert) return null;

  const currentStatus = (alert.status || (alert.resolved ? 'RESOLVED' : 'OPEN')).toUpperCase();
  const alertId = alert.id ? `ALT-${String(alert.id).padStart(4, '0')}` : 'ALT-0001';
  const riskLevel = (alert.risk_level || 'HIGH').toUpperCase();
  const rawType = (alert.alert_type || 'ANOMALY').replace(/_/g, ' ').toLowerCase();
  const alertTitle = rawType.charAt(0).toUpperCase() + rawType.slice(1);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(alert.id, newStatus);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const user = alert.username || alert.user || '—';
  const ip = alert.source_ip || alert.ip || '—';
  const eventCount = alert.event_count || alert.failure_count || 1;
  const failedCount = alert.failed_count || alert.failure_count || 0;

  // Reusable array of detail rows in required order
  const detailRows = [
    {
      label: 'Targeted user',
      value: user,
    },
    {
      label: 'Source IP',
      value: (
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {ip}
        </span>
      ),
    },
    {
      label: 'Events',
      value: (
        <span>
          {eventCount} total,{' '}
          <span style={{ color: '#dc2626' }}>
            {failedCount} failed
          </span>
        </span>
      ),
    },
    {
      label: 'Country',
      value: alert.country || 'Local Domain / Internal',
    },
    {
      label: 'First seen',
      value: formatDateTime(alert.first_seen || alert.triggered_at || alert.created_at),
    },
    {
      label: 'Last seen',
      value: formatDateTime(alert.last_seen || alert.triggered_at || alert.created_at),
    },
  ];

  const flaggedBullets = [
    failedCount > 0 ? `${failedCount} of ${eventCount} login attempts failed` : 'Repeated authentication anomaly',
    'Failure rate is above the normal limit',
    `Detection rules triggered for both ${user} and ${ip}`,
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog alert-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        {/* Header */}
        <div className="modal-header alert-modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="alert-modal-title-row">
              <span className={`severity-pill ${riskLevel}`}>
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase()}
              </span>
              <h3 className="alert-modal-title">{alertTitle}</h3>
            </div>
            <div className="alert-modal-id-line">
              Alert ID: {alertId}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body alert-modal-body">
          {/* Details Table */}
          <div className="alert-details-table">
            {detailRows.map((row, idx) => (
              <div key={idx} className="alert-details-row">
                <div className="alert-details-label">{row.label}</div>
                <div className="alert-details-value">{row.value}</div>
              </div>
            ))}
          </div>

          {/* Incident Summary */}
          {(alert.reason || alert.message) && (
            <div className="alert-incident-summary">
              {alert.reason || alert.message || `Automated heuristic detection flagged elevated failure rates for account ${user}.`}
            </div>
          )}

          {/* Why this was flagged */}
          <div className="alert-flagged-section">
            <h4 className="alert-flagged-heading">Why this was flagged</h4>
            <ul className="alert-flagged-list">
              {flaggedBullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer alert-modal-footer">
          <div className="alert-modal-status-group">
            <span className="alert-status-label">Status:</span>
            <span className={`status-pill ${currentStatus}`}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase()}
            </span>
          </div>

          <div className="alert-modal-actions">
            <button
              type="button"
              className="btn-investigate"
              disabled={isUpdating}
              onClick={() => handleStatusChange('INVESTIGATING')}
            >
              Investigate
            </button>
            <button
              type="button"
              className="btn-resolve"
              disabled={isUpdating}
              onClick={() => handleStatusChange('RESOLVED')}
            >
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
