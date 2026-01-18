import { useState, useCallback } from 'react';
import { Station } from '../types/station';
import { apiFetch } from '../services/apiClient';

import bundledStations from '../assets/curated_stations.json';

export function useFeaturedStations() {
  const [featuredStations, setFeaturedStations] = useState<Station[]>((bundledStations as any)['Europe'] || []);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredStationsCache, setFeaturedStationsCache] = useState<Record<string, Station[]>>(bundledStations as unknown as Record<string, Station[]>);

  const getFeaturedStations = useCallback(async (region: string = 'Europe', forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh && featuredStationsCache[region]) {
        setFeaturedStations(featuredStationsCache[region]);
        return;
      }

      setFeaturedLoading(true);
      const stations = await apiFetch<Station[]>(`/stations/featured?region=${encodeURIComponent(region)}`);
      
      setFeaturedStations(stations);
      setFeaturedStationsCache(prev => ({ ...prev, [region]: stations }));
      setFeaturedLoading(false);
    } catch (err) {
      console.error("Failed to fetch featured stations", err);
      setFeaturedLoading(false);
    }
  }, [featuredStationsCache]);

  return {
    featuredStations,
    featuredLoading,
    getFeaturedStations,
    setFeaturedStationsCache
  };
}
