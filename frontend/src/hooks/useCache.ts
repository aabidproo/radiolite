import { useState, useCallback } from 'react';
import { apiFetch } from '../services/apiClient';

export function useCache() {
  const [flushing, setFlushing] = useState(false);

  const flushCache = useCallback(async () => {
    setFlushing(true);
    try {
      await apiFetch(`/stations/cache/flush`, { method: 'POST' });
      
      localStorage.removeItem('radiolite_countries');
      localStorage.removeItem('radiolite_languages');
      localStorage.removeItem('radiolite_tags');
      localStorage.removeItem('radiolite_near_me_stations');
      
      return true;
    } catch (err) {
      console.error("Failed to flush cache", err);
      return false;
    } finally {
      setFlushing(false);
    }
  }, []);

  return {
    flushing,
    flushCache
  };
}
