import { useState, useCallback } from 'react';
import { Station } from '../types/station';
import { apiFetch } from '../services/apiClient';

export function useSearch() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [globalSearchResults, setGlobalSearchResults] = useState<{
    countries: any[];
    languages: any[];
    tags: any[];
    locations: any[];
    stations: Station[];
  } | null>(null);

  const resetPagination = useCallback(() => {
    setOffset(0);
    setHasMore(true);
  }, []);

  const searchStations = useCallback(async (
    query: string, 
    filters: { country?: string, language?: string, tag?: string } = {},
    options: { append?: boolean, resetOffset?: boolean, offset?: number } = {}
  ) => {
    if (!query && !filters.country && !filters.language && !filters.tag) {
      setStations([]);
      return;
    }
    
    const shouldAppend = options.append || false;
    const newOffset = options.resetOffset ? 0 : (options.offset ?? 0);
    
    setLoading(true);
    setError(null);
    if (!shouldAppend) setStations([]);

    try {
      let url = `/stations/search?limit=100&offset=${newOffset}&hidebroken=true&order=clickcount&reverse=true`;
      if (query) url += `&name=${encodeURIComponent(query)}`;
      if (filters.country) url += `&country=${encodeURIComponent(filters.country)}`;
      if (filters.language) url += `&language=${encodeURIComponent(filters.language)}`;
      if (filters.tag) url += `&tag=${encodeURIComponent(filters.tag)}`;
      
      const data = await apiFetch<Station[]>(url);
      
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
        const data = await apiFetch<any>(`/stations/global-search?query=${encodeURIComponent(query)}`);
        setGlobalSearchResults(data);
        setHasMore(data.stations.length >= 20);
    } catch (err) {
        console.error("Global search failed", err);
        setError("Failed to search.");
    } finally {
        setLoading(false);
    }
  }, [resetPagination]);

  const getTopStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Station[]>(`/stations/top?limit=100&hidebroken=true`);
      setStations(data);
    } catch (err) {
      console.error("Failed to fetch top stations", err);
      setError("Failed to fetch top stations.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stations,
    loading,
    error,
    offset,
    hasMore,
    globalSearchResults,
    resetPagination,
    searchStations,
    searchGlobal,
    getTopStations,
    setStations,
    setGlobalSearchResults
  };
}
