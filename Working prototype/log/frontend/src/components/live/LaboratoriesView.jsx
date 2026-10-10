import React, { useState } from 'react';
import AddLabModal from './AddLabModal';
import { formatDateTime } from '../../useAuthSentinel';

export default function LaboratoriesView({ labs = [], onAddLab, onDeleteLab, onSelectLab }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top action bar with Add Lab button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Laboratories
          </h2>
        </div>

        <button
          type="button"
          id="btn-add-lab-top"
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 2px 6px rgba(0, 102, 255, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Add Lab</span>
        </button>
      </div>

      {/* Labs List / Grid */}
      {(!labs || labs.length === 0) ? (
        <div
          className="empty-state"
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-normal)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '20px 0',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            <path d="M4.54 11.46L2.19 14.81A2 2 0 0 0 3.81 18h16.38a2 2 0 0 0 1.62-3.19l-2.35-3.35" />
            <path d="M6 4h12v7H6z" />
          </svg>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>No laboratories configured</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '420px', margin: '0 0 20px 0' }}>
            Click the <strong>+ Add Lab</strong> button above to register and configure your first test environment.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
            }}
          >
            <span>+ Add Lab Now</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {labs.map((lab) => (
            <div
              key={lab.id}
              id={`lab-card-${lab.id}`}
              onClick={() => onSelectLab && onSelectLab(lab)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {lab.id}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLab(lab.id);
                    }}
                    title="Delete Laboratory"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {lab.name}
                </h4>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                  {lab.description || 'No description provided.'}
                </p>

                {lab.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{lab.location}</span>
                  </div>
                )}
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-light)',
                    marginTop: '12px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Assigned Terminals:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{lab.terminals_count || 0}</strong>
                  </div>

                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {formatDateTime(lab.created_at)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--border-light)',
                    fontSize: '12px',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }}
                >
                  <span>View connected computers</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lab Modal */}
      {showAddModal && (
        <AddLabModal
          onClose={() => setShowAddModal(false)}
          onAddLab={onAddLab}
        />
      )}
    </div>
  );
}
