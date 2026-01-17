import { useState, useCallback } from 'react';
import { Station } from '../types/station';
import { apiFetch } from '../services/apiClient';
import { CURATED_STATIONS } from '../config/curatedStations';

export function useFeaturedStations() {
  const [featuredStations, setFeaturedStations] = useState<Station[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredStationsCache, setFeaturedStationsCache] = useState<Record<string, Station[]>>({});

  const getFeaturedStations = useCallback(async (region: string = 'Europe', forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh && featuredStationsCache[region]) {
        setFeaturedStations(featuredStationsCache[region]);
        return;
      }

      const stationsToFetch = CURATED_STATIONS[region] || [];
      if (stationsToFetch.length === 0) {
        setFeaturedStations([]);
        return;
      }

      setFeaturedLoading(true);
      const promises = stationsToFetch.map(async (query) => {
        try {
          let url = `/stations/search?limit=1&order=votes&reverse=true`;
          url += `&name=${encodeURIComponent(query.name)}`;
          if (query.countryCode) {
            url += `&countrycode=${encodeURIComponent(query.countryCode)}`;
          }

          const dataArr = await apiFetch<Station[]>(url);
          const station = dataArr[0];

          if (!station) return null;

          if (query.countryCode && station.countrycode && station.countrycode.toUpperCase() !== query.countryCode.toUpperCase()) {
            return null;
          }

          return station;
        } catch (e) {
          return null;
        }
      });
      
      const resultsArr = await Promise.all(promises);
      const filteredResults = resultsArr.filter(Boolean) as Station[];
      
      setFeaturedStations(filteredResults);
      setFeaturedStationsCache(prev => ({ ...prev, [region]: filteredResults }));
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
