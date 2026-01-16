import { useState } from 'react';
import { Station } from '../types/station';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Station[]>(() => {
    const saved = localStorage.getItem('radiolite_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [countries, setCountries] = useState<any[]>(() => {
    const saved = localStorage.getItem('radiolite_countries');
    return saved ? JSON.parse(saved) : [];
  });
  const [languages, setLanguages] = useState<any[]>(() => {
    const saved = localStorage.getItem('radiolite_languages');
    return saved ? JSON.parse(saved) : [];
  });
  const [tags, setTags] = useState<any[]>(() => {
    const saved = localStorage.getItem('radiolite_tags');
    return saved ? JSON.parse(saved) : [];
  });
  const [nearMeStations, setNearMeStations] = useState<Station[]>(() => {
    const saved = localStorage.getItem('radiolite_near_me_stations');
    return saved ? JSON.parse(saved) : [];
  });
  const [userCountry, setUserCountry] = useState<string | null>(() => {
    return localStorage.getItem('radiolite_user_country');
  });

  const searchStations = async (
    query: string, 
    filters: { country?: string, language?: string, tag?: string } = {},
    options: { append?: boolean, resetOffset?: boolean } = {}
  ) => {
    // If no search parameters, just clear and return
    if (!query && !filters.country && !filters.language && !filters.tag) {
      setStations([]);
      return;
    }
    
    const shouldAppend = options.append || false;
    const newOffset = options.resetOffset ? 0 : (shouldAppend ? offset + 100 : 0);
    
    setLoading(true);
    setError(null);
    if (!shouldAppend) setStations([]);

    try {
      // Standardize search with hidebroken=true and clickcount order
      let url = `${BASE_URL}/stations/search?limit=100&offset=${newOffset}&hidebroken=true&order=clickcount&reverse=true`;
      if (query) url += `&name=${encodeURIComponent(query)}`;
      if (filters.country) url += `&country=${encodeURIComponent(filters.country)}`;
      if (filters.language) url += `&language=${encodeURIComponent(filters.language)}`;
      if (filters.tag) url += `&tag=${encodeURIComponent(filters.tag)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data = await response.json();
      
      if (shouldAppend) {
        setStations(prev => [...prev, ...data]);
      } else {
        setStations(data);
      }
      
      setOffset(newOffset);
      setHasMore(data.length === 100);
    } catch (err) {
      console.error("Search failed", err);
      setError("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const getTopStations = async () => {
    setLoading(true);
    setError(null);
    try {
      // getTopStations also benefits from hidebroken=true
      const url = `${BASE_URL}/stations/top?limit=100&hidebroken=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data = await response.json();
      setStations(data);
    } catch (err) {
      console.error("Failed to fetch top stations", err);
      setError("Failed to fetch top stations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    const hasCached = countries.length > 0;
    if (!hasCached) setLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/stations/countries`);
      const data = await response.json();
      const cleanData = Array.isArray(data) ? data : [];
      setCountries(cleanData);
      localStorage.setItem('radiolite_countries', JSON.stringify(cleanData));
    } catch (err) {
      console.error("Failed to fetch countries", err);
      if (!hasCached) setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    const hasCached = languages.length > 0;
    if (!hasCached) setLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/stations/languages`);
      const data = await response.json();
      const cleanData = Array.isArray(data) ? data : [];
      setLanguages(cleanData);
      localStorage.setItem('radiolite_languages', JSON.stringify(cleanData));
    } catch (err) {
      console.error("Failed to fetch languages", err);
      if (!hasCached) setLanguages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    const hasCached = tags.length > 0;
    if (!hasCached) setLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/stations/tags`);
      const data = await response.json();
      const cleanData = Array.isArray(data) ? data : [];
      setTags(cleanData);
      localStorage.setItem('radiolite_tags', JSON.stringify(cleanData));
    } catch (err) {
      console.error("Failed to fetch tags", err);
      if (!hasCached) setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.country_name) {
        setUserCountry(data.country_name);
        localStorage.setItem('radiolite_user_country', data.country_name);
        return data.country_name;
      }
    } catch (err) {
      console.error("Failed to detect location", err);
    }
    return null;
  };

  const fetchNearMeStations = async (countryName: string, options: { append?: boolean } = {}) => {
    const shouldAppend = options.append || false;
    const newOffset = shouldAppend ? offset + 100 : 0;

    // Persist loading state if no cached data
    const hasCached = nearMeStations.length > 0 && !shouldAppend;
    if (!hasCached) {
      setLoading(true);
      setStations([]); // Clear only if no cache to show
    }
    
    setError(null);

    try {
      const url = `${BASE_URL}/stations/search?country=${encodeURIComponent(countryName)}&limit=100&offset=${newOffset}&hidebroken=true&order=clickcount&reverse=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data = await response.json();
      
      if (shouldAppend) {
        setStations(prev => [...prev, ...data]);
      } else {
        setStations(data);
        setNearMeStations(data);
        localStorage.setItem('radiolite_near_me_stations', JSON.stringify(data));
      }
      
      setOffset(newOffset);
      setHasMore(data.length === 100);
    } catch (err) {
      console.error("Failed to fetch near me stations", err);
      if (!hasCached) {
        setError("Failed to fetch local stations.");
      }
    } finally {
      setLoading(false);
    }
  };

  const flushCache = async () => {
    setFlushing(true); // Specific refresh state
    try {
      // 1. Clear Backend Cache
      await fetch(`${BASE_URL}/stations/cache/flush`, { method: 'POST' });
      
      // 2. Clear LocalStorage for this app
      localStorage.removeItem('radiolite_countries');
      localStorage.removeItem('radiolite_languages');
      localStorage.removeItem('radiolite_tags');
      localStorage.removeItem('radiolite_near_me_stations');
      
      // 3. Reset local states
      setCountries([]);
      setLanguages([]);
      setTags([]);
      setNearMeStations([]);
      
      return true;
    } catch (err) {
      console.error("Failed to flush cache", err);
      return false;
    } finally {
      setFlushing(false);
    }
  };

  const toggleFavorite = (station: Station) => {
    setFavorites(prev => {
      const isFav = prev.some(s => s.stationuuid === station.stationuuid);
      let next;
      if (isFav) {
        next = prev.filter(s => s.stationuuid !== station.stationuuid);
      } else {
        next = [...prev, station];
      }
      localStorage.setItem('radiolite_favorites', JSON.stringify(next));
      return next;
    });
  };

  return {
    stations,
    nearMeStations,
    countries,
    languages,
    tags,
    loading,
    flushing, // Export the new flushing state
    searchStations,
    getTopStations,
    fetchCountries,
    fetchLanguages,
    fetchTags,
    favorites, 
    toggleFavorite,
    userCountry,
    detectLocation,
    fetchNearMeStations,
    flushCache,
    error,
    hasMore,
    resetPagination: () => {
      setOffset(0);
      setHasMore(true);
    }
  };
}
