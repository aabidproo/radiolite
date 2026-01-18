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
  const [userCountryCode, setUserCountryCode] = useState<string | null>(() => {
    return localStorage.getItem('radiolite_user_country_code');
  });
  const [loading, setLoading] = useState(false);

  const detectLocation = useCallback(async () => {
    try {
      const data = await apiFetch<any>('https://ipapi.co/json/');
      if (data.country) {
        // We store the 2-letter country code for searching, but display the name
        setUserCountry(data.country_name || data.country);
        setUserCountryCode(data.country);
        localStorage.setItem('radiolite_user_country', data.country_name || data.country);
        localStorage.setItem('radiolite_user_country_code', data.country);
        return data.country;
      }
    } catch (err) {
      console.error("Failed to detect location", err);
    }
    return null;
  }, []);

  const fetchNearMeStations = useCallback(async (countryCode: string, options: { append?: boolean, offset?: number } = {}) => {
    const shouldAppend = options.append || false;
    const currentOffset = options.offset || 0;

    setLoading(true);
    try {
      // Use countrycode (2-letter code) instead of full country name for much better reliability
      const url = `/stations/search?countrycode=${encodeURIComponent(countryCode)}&limit=100&offset=${currentOffset}&hidebroken=true&order=clickcount&reverse=true`;
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
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    nearMeStations,
    userCountry,
    userCountryCode,
    detectLocation,
    fetchNearMeStations,
    setNearMeStations,
    loading
  };
}
