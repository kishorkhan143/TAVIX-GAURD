import React, { useRef } from 'react';
import { useDateFilter } from '../dateFilterUtils';

export default function DateFilter() {
  const { selectedDate, setSelectedDate, today, isToday, resetToToday, displayDate } = useDateFilter();
  const inputRef = useRef(null);

  const handlePillClick = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="date-filter-container">
      <div
        className="date-filter-pill"
        onClick={handlePillClick}
        title="Click to select date"
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePillClick();
          }
        }}
      >
        <span className="date-filter-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className="date-filter-text">{displayDate}</span>
        <input
          ref={inputRef}
          type="date"
          className="date-filter-native-input"
          value={selectedDate}
          max={today}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDate(e.target.value);
            }
          }}
          aria-label="Select date"
        />
      </div>

      {!isToday && (
        <button
          type="button"
          className="date-filter-today-btn"
          onClick={resetToToday}
          title="Reset filter to today"
        >
          Today
        </button>
      )}
    </div>
  );
}
