import { useState, useCallback } from 'react';
import { Station } from '../types/station';
import { apiFetch } from '../services/apiClient';

export function useLocation() {
  const [nearMeStations, setNearMeStations] = useState<Station[]>(() => {
    const saved = localStorage.getItem('radiolite_near_me_stations');
    return saved ? JSON.parse(saved) : [];
  });
  const [userCountry, setUserCountry] = useState<string | null>(() => {
    return localStorage.getItem('radiolite_user_country');
  });

  const detectLocation = useCallback(async () => {
    try {
      const data = await apiFetch<any>('https://ipapi.co/json/');
      if (data.country_name) {
        setUserCountry(data.country_name);
        localStorage.setItem('radiolite_user_country', data.country_name);
        return data.country_name;
      }
    } catch (err) {
      console.error("Failed to detect location", err);
    }
    return null;
  }, []);

  const fetchNearMeStations = useCallback(async (countryName: string, options: { append?: boolean, offset?: number } = {}) => {
    const shouldAppend = options.append || false;
    const currentOffset = options.offset || 0;

    try {
      const url = `/stations/search?country=${encodeURIComponent(countryName)}&limit=100&offset=${currentOffset}&hidebroken=true&order=clickcount&reverse=true`;
      const data = await apiFetch<Station[]>(url);
      
      if (shouldAppend) {
        setNearMeStations(prev => [...prev, ...data]);
      } else {
        setNearMeStations(data);
        localStorage.setItem('radiolite_near_me_stations', JSON.stringify(data));
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch near me stations", err);
      throw err;
    }
  }, []);

  return {
    nearMeStations,
    userCountry,
    detectLocation,
    fetchNearMeStations,
    setNearMeStations
  };
}
