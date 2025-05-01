import React from 'react';

const StatusDisplay = ({ status }) => {
  const formatStatusValue = (key, value) => {
    if (value === 'unknown') return 'Unknown';
    
    switch (key) {
      case 'power':
        return value === 'on' ? 'ON' : 'STANDBY';
      case 'volume':
        return value ? `${value} dB` : 'Unknown';
      case 'mute':
        return value === 'on' ? 'MUTED' : 'UNMUTED';
      default:
        return value;
    }
  };

  const getBadgeClass = (key, value) => {
    if (value === 'unknown') return '';
    
    switch (key) {
      case 'power':
        return value === 'on' ? 'badge-success' : 'badge-error';
      case 'mute':
        return value === 'on' ? 'badge-warning' : '';
      default:
        return '';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Receiver Status</h2>
      </div>
      
      <div className="status-display">
        {Object.entries(status)
          .filter(([key]) => !['last_command', 'last_response'].includes(key))
          .map(([key, value]) => (
            <div key={key} className="status-item">
              <span className="status-label">{key.replace('_', ' ').toUpperCase()}</span>
              <span className={`status-value ${getBadgeClass(key, value)}`}>
                {formatStatusValue(key, value)}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default StatusDisplay;