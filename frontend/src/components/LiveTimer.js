// LiveTimer.js - Live countdown timer component
import React, { useState, useEffect } from 'react';

const LiveTimer = ({ startTime, label = 'Fee paid' }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const updateElapsed = () => {
      if (!startTime) return;

      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now - start;

      if (diffMs < 0) {
        setElapsed('Just now');
        return;
      }

      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeStr = '';

      if (days > 0) {
        timeStr = `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        timeStr = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
        timeStr = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
        timeStr = `${seconds} second${seconds > 1 ? 's' : ''} ago`;
      }

      setElapsed(timeStr);
    };

    // Update immediately
    updateElapsed();

    // Update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="live-timer">
      <span className="timer-label">{label}:</span>
      <span className="timer-value">{elapsed || 'Loading...'}</span>
    </div>
  );
};

export default LiveTimer;
