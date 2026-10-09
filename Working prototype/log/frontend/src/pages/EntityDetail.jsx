/**
 * EntityDetail: Show risk score, timeline, and signals for ACCOUNT/COMPUTER/PAIR/SOURCE
 */

import React, { useState, useEffect } from 'react';
import RiskGauge from '../components/RiskGauge';
import RiskChart from '../components/RiskChart';
import { BACKEND_URL, parseUtc } from '../useAuthSentinel';

export default function EntityDetail({ entityType, entityId }) {
  const [entity, setEntity] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntity = async () => {
      try {
        setLoading(true);
        const url = `${BACKEND_URL}/api/entity/${entityType}/${encodeURIComponent(entityId)}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        setEntity(data);
        
        // Transform timeline for chart
        if (data.timeline && Array.isArray(data.timeline)) {
          const chartData = data.timeline.map(point => ({
            timestamp: point.timestamp,
            score: point.score
          }));
          setTimeline(chartData);
        }
      } catch (err) {
        console.error('Error fetching entity:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (entityType && entityId) {
      fetchEntity();
      // Refresh every 10 seconds
      const interval = setInterval(fetchEntity, 10000);
      return () => clearInterval(interval);
    }
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!entity) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Entity not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{entityType}: {entityId}</h1>
      
      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
        {/* Left: Risk Gauge */}
        <div>
          <h3>Current Risk Score</h3>
          <RiskGauge score={entity.current_risk_score} size="large" />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem', textAlign: 'center' }}>
            Peak: {entity.peak_risk_score}
          </p>
        </div>
        
        {/* Right: Stats */}
        <div>
          <h3>Details</h3>
          <dl style={{ lineHeight: '1.8' }}>
            <div>
              <dt style={{ fontWeight: '600' }}>Current Risk Band</dt>
              <dd>{entity.risk_band}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: '600' }}>Events (24h)</dt>
              <dd>{entity.event_count}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: '600' }}>Incident Status</dt>
              <dd>{entity.incident_status || 'None'}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: '600' }}>Last Event</dt>
              <dd>{entity.last_event ? parseUtc(entity.last_event).toLocaleString() : 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Timeline Chart */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Risk Score Timeline</h3>
        <RiskChart data={timeline} height={300} showThresholds={true} />
      </div>

      {/* Signal Breakdown */}
      {entity.active_signals && entity.active_signals.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Active Signals</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {entity.active_signals.map((signal, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Signal</p>
                <p style={{ margin: 0, fontWeight: '600' }}>{signal}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
