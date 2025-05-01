import React from 'react';

const CommandHistory = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Command History</h2>
        </div>
        <p className="text-center">No commands have been sent yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Command History</h2>
      </div>
      
      <ul className="history-list">
        {history.map((item, index) => (
          <li key={index} className="history-item">
            <div className="history-time">{item.timestamp}</div>
            <div className="history-command">→ {item.command}</div>
            {item.response && (
              <div className="history-response">← {item.response}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommandHistory;