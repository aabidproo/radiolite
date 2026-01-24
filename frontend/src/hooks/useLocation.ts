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
    console.log("Detecting location via IP...");
    try {
      // Primary: ipapi.co (Note: can be rate limited)
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.country) {
        console.log("Location detected (Primary):", data.country_name);
        setUserCountry(data.country_name || data.country);
        setUserCountryCode(data.country);
        localStorage.setItem('radiolite_user_country', data.country_name || data.country);
        localStorage.setItem('radiolite_user_country_code', data.country);
        return data.country;
      }
    } catch (err) {
      console.warn("Primary location service failed, trying fallback...", err);
      try {
        // Fallback: freeipapi.com (HTTPS supported)
        const res = await fetch('https://freeipapi.com/api/json');
        const data = await res.json();
        if (data.countryCode) {
           console.log("Location detected (Fallback):", data.countryName);
           setUserCountry(data.countryName);
           setUserCountryCode(data.countryCode);
           localStorage.setItem('radiolite_user_country', data.countryName);
           localStorage.setItem('radiolite_user_country_code', data.countryCode);
           return data.countryCode;
        }
      } catch (fallbackErr) {
        console.error("All IP location services failed", fallbackErr);
      }
    }
    return null;
  }, []);

  const detectLocationWithPermission = useCallback(async () => {
    console.log("Requesting browser geolocation permission...");
    setLoading(true);
    return new Promise<string | null>((resolve) => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser/platform");
        setLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            console.log("Coordinates obtained:", latitude, longitude);
            // Use reverse geocoding to get country code
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            console.log("Reverse geocode response payload:", data);
            
            if (data.countryCode) {
              console.log("Reverse geocode success:", data.countryName || data.countryCode);
              setUserCountry(data.countryName || data.countryCode);
              setUserCountryCode(data.countryCode);
              localStorage.setItem('radiolite_user_country', data.countryName || data.countryCode);
              localStorage.setItem('radiolite_user_country_code', data.countryCode);
              console.log("Location saved to localStorage.");
              setLoading(false);
              resolve(data.countryCode);
              return;
            } else {
              console.warn("No country code found in geocode response.");
            }
          } catch (err) {
            console.error("Reverse geocode failed", err);
          }
          setLoading(false);
          resolve(null);
        },
        (err) => {
          console.error("Geolocation permission denied or failed:", err.message, err.code);
          setLoading(false);
          resolve(null);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    });
  }, []);

  const fetchNearMeStations = useCallback(async (countryCode: string, options: { append?: boolean, offset?: number } = {}) => {
    if (!countryCode || countryCode === "Unknown") return [];
    
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
      // Don't re-throw to avoid breaking the UI/effect
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    nearMeStations,
    userCountry,
    userCountryCode,
    detectLocation,
    detectLocationWithPermission,
    fetchNearMeStations,
    setNearMeStations,
    loading
  };
}
