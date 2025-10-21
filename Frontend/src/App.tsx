// src/App.tsx
import React from 'react';
import { gsap } from 'gsap';
import { usePriceData } from './hooks/usePriceData';
import PriceDisplay from './components/PriceDisplay/PriceDisplay';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import './styles/animations.css';
import './App.css';

function App() {
  const { priceData, loading, fetchPrice } = usePriceData();

  return (
    <div className="App">
      <div className="app-container">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <PriceDisplay priceData={priceData} onRefresh={fetchPrice} />
        )}
        
        <div className="background-effects">
          <div className="floating-eth">⟠</div>
          <div className="floating-eth">⟠</div>
          <div className="floating-eth">⟠</div>
        </div>
      </div>
    </div>
  );
}

export default App;