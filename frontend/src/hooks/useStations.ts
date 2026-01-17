import { useState, useCallback, useRef, useEffect } from 'react';
import { Station } from '../types/station';

// Standardize BASE_URL to ensure it includes /api/v1 and handles trailing slashes
let API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
if (!API_URL.includes('/api/v1') && !API_URL.includes('localhost')) {
  API_URL += '/api/v1';
}
const BASE_URL = API_URL;



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

  // Use refs to keep stable function identities for pagination
  const countriesRef = useRef(countries);
  const languagesRef = useRef(languages);
  const tagsRef = useRef(tags);
  const nearMeRef = useRef(nearMeStations);
  const stationsRef = useRef(stations);

  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => { languagesRef.current = languages; }, [languages]);
  useEffect(() => { tagsRef.current = tags; }, [tags]);
  useEffect(() => { nearMeRef.current = nearMeStations; }, [nearMeStations]);
  useEffect(() => { stationsRef.current = stations; }, [stations]);
  
  // Spotlight Search State
  const [globalSearchResults, setGlobalSearchResults] = useState<{
    countries: any[];
    languages: any[];
    tags: any[];
    locations: any[];
    stations: Station[];
  } | null>(null);

  const [stats, setStats] = useState<{ countries: number, languages: number, tags: number, stations: number } | null>(null);

  const offsetRef = useRef(offset);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/stations/stats`);
      if (!response.ok) throw new Error("Stats failed");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const resetPagination = useCallback(() => {
    setOffset(0);
    setHasMore(true);
  }, []);

  const searchStations = useCallback(async (
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
    const newOffset = options.resetOffset ? 0 : (shouldAppend ? (stationsRef.current.length > 0 ? offsetRef.current + 100 : 0) : 0);
    
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
  }, []);

  const searchGlobal = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
        setGlobalSearchResults(null);
        setStations([]);
        resetPagination();
        return;
    }

    setStations([]);
    resetPagination();
    setGlobalSearchResults(null);
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${BASE_URL}/stations/global-search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setGlobalSearchResults(data);
        setHasMore(data.stations.length >= 20);
    } catch (err) {
        console.error("Global search failed", err);
        setError("Failed to search.");
    } finally {
        setLoading(false);
    }
  }, []);

  const getTopStations = useCallback(async () => {
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
  }, []);

  const fetchCountries = useCallback(async (options: { append?: boolean, searchQuery?: string } = {}) => {
    const shouldAppend = options.append || false;
    const currentOffset = shouldAppend ? countriesRef.current.length : 0;
    const queryParam = options.searchQuery ? `&name=${encodeURIComponent(options.searchQuery)}` : '';
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/stations/countries?limit=24&offset=${currentOffset}${queryParam}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      const cleanData = Array.isArray(data) ? data : [];
      
      if (shouldAppend) {
        setCountries(prev => {
           const next = [...prev, ...cleanData];
           localStorage.setItem('radiolite_countries', JSON.stringify(next));
           return next;
        });
      } else {
        setCountries(cleanData);
        localStorage.setItem('radiolite_countries', JSON.stringify(cleanData));
      }
    } catch (err) {
      console.error("Failed to fetch countries", err);
      if (!shouldAppend && countriesRef.current.length === 0) setCountries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLanguages = useCallback(async (options: { append?: boolean, searchQuery?: string } = {}) => {
    const shouldAppend = options.append || false;
    const currentOffset = shouldAppend ? languagesRef.current.length : 0;
    const queryParam = options.searchQuery ? `&name=${encodeURIComponent(options.searchQuery)}` : '';

    setLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/stations/languages?limit=24&offset=${currentOffset}${queryParam}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      const cleanData = Array.isArray(data) ? data : [];

      if (shouldAppend) {
        setLanguages(prev => {
            const next = [...prev, ...cleanData];
            localStorage.setItem('radiolite_languages', JSON.stringify(next));
            return next;
        });
      } else {
        setLanguages(cleanData);
        localStorage.setItem('radiolite_languages', JSON.stringify(cleanData));
      }
    } catch (err) {
      console.error("Failed to fetch languages", err);
      if (!shouldAppend && languagesRef.current.length === 0) setLanguages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async (options: { append?: boolean, searchQuery?: string } = {}) => {
    const shouldAppend = options.append || false;
    const currentOffset = shouldAppend ? tagsRef.current.length : 0;
    const queryParam = options.searchQuery ? `&name=${encodeURIComponent(options.searchQuery)}` : '';
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/stations/tags?limit=24&offset=${currentOffset}${queryParam}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      const cleanData = Array.isArray(data) ? data : [];
      
      if (shouldAppend) {
        setTags(prev => {
            const next = [...prev, ...cleanData];
            localStorage.setItem('radiolite_tags', JSON.stringify(next));
            return next;
        });
      } else {
        setTags(cleanData);
        localStorage.setItem('radiolite_tags', JSON.stringify(cleanData));
      }
    } catch (err) {
      console.error("Failed to fetch tags", err);
      if (!shouldAppend && tagsRef.current.length === 0) setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLocation = useCallback(async () => {
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
  }, []);

  const fetchNearMeStations = useCallback(async (countryName: string, options: { append?: boolean } = {}) => {
    const shouldAppend = options.append || false;
    const newOffset = shouldAppend ? offsetRef.current + 100 : 0;

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
  }, []);

  const flushCache = useCallback(async () => {
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
  }, []);

  const toggleFavorite = useCallback((station: Station) => {
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
  }, []);

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
    resetPagination,
    searchGlobal,
    globalSearchResults,
    stats,
    clearGlobalSearch: () => setGlobalSearchResults(null)
  };
}
