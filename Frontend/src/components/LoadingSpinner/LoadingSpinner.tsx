// src/components/LoadingSpinner/LoadingSpinner.tsx
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="eth-spinner">
        <div className="eth-logo">⟠</div>
        <div className="spinner-ring"></div>
      </div>
      <p>Fetching ETH Price...</p>
    </div>
  );
};

export default LoadingSpinner;