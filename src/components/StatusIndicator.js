import React from 'react';


function StatusIndicator({ isOnline, isServerUp }) {
    return (
        <div className="status-indicator">
            <p>Network: <span className={isOnline ? 'online' : 'offline'}>{isOnline ? 'Online' : 'Offline'}</span></p>
            <p>Server: <span className={isServerUp ? 'up' : 'down'}>{isServerUp ? 'Up' : 'Down'}</span></p>
        </div>
    );
}

export default StatusIndicator;