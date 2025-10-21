// src/hooks/usePriceData.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface PriceData {
  ethPrice: number;
  lastUpdate: string;
  isFresh: boolean;
  error?: string;
}

export const usePriceData = () => {
  const [priceData, setPriceData] = useState<PriceData>({ 
    ethPrice: 0, 
    lastUpdate: '', 
    isFresh: false 
  });
  const [loading, setLoading] = useState(true);

  const fetchPrice = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/price');
      setPriceData(response.data);
    } catch (error) {
      console.error('Error fetching from API:', error);
      setPriceData(prev => ({ 
        ...prev, 
        error: 'Failed to fetch from API' 
      }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  return { priceData, loading, fetchPrice };
};