// src/components/PriceDisplay/PriceDisplay.tsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './PriceDisplay.css';

interface PriceDisplayProps {
  priceData: {
    ethPrice: number;
    lastUpdate: string;
    isFresh: boolean;
    error?: string;
  };
  onRefresh: () => void;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ priceData, onRefresh }) => {
  const priceRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const freshnessRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (priceRef.current) {
      gsap.fromTo(priceRef.current, 
        { scale: 1.2, color: '#627eea' },
        { scale: 1, color: '#ffffff', duration: 0.6, ease: 'elastic.out(1, 0.5)' }
      );
    }
  }, [priceData.ethPrice]);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  useEffect(() => {
    if (freshnessRef.current) {
      if (priceData.isFresh) {
        gsap.to(freshnessRef.current, {
          backgroundColor: '#10b981',
          color: 'white',
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        gsap.to(freshnessRef.current, {
          backgroundColor: '#f59e0b',
          color: 'white',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
  }, [priceData.isFresh]);

  const handleRefresh = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }
    onRefresh();
  };

  return (
    <div ref={cardRef} className="price-card">
      <div className="price-header">
        <div className="eth-icon">⟠</div>
        <h2>ETH/USD Price Oracle</h2>
      </div>
      
      <div className="price-content">
        <p className="price-label">Current ETH Price</p>
        <p ref={priceRef} className="price-value">
          ${priceData.ethPrice.toFixed(2)} USD
        </p>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Last Update:</span>
            <span className="info-value">{priceData.lastUpdate}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Data Freshness:</span>
            <span ref={freshnessRef} className="freshness-badge">
              {priceData.isFresh ? 'Fresh' : 'Stale'}
            </span>
          </div>
        </div>
      </div>

      {priceData.error && (
        <div className="error-message">
          ⚠️ {priceData.error}
        </div>
      )}

      <button 
        className="refresh-button"
        onClick={handleRefresh}
      >
        <span className="button-icon">↻</span>
        Refresh Now
      </button>
    </div>
  );
};

export default PriceDisplay;