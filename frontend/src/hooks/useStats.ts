import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';

export function useStats() {
  const [stats, setStats] = useState<{ countries: number, languages: number, tags: number, stations: number } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch<any>(`/stations/stats`);
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    fetchStats
  };
}
