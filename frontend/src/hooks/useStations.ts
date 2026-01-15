import { useState } from 'react';
import { Station } from '../types/station';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Station[]>(() => {
    const saved = localStorage.getItem('radiolite_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const searchStations = async (query: string, country?: string) => {
    if (!query && !country) return;
    setLoading(true);
    try {
      let url = `${BASE_URL}/stations/search?limit=20`;
      if (query) url += `&name=${encodeURIComponent(query)}`;
      if (country) url += `&country=${encodeURIComponent(country)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setStations(data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const getTopStations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/stations/top?limit=20`);
      const data = await response.json();
      setStations(data);
    } catch (err) {
      console.error("Failed to fetch top stations", err);
    } finally {
      setLoading(false);
    }
  };

  const [countries, setCountries] = useState<any[]>([]);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/stations/countries`);
      const data = await response.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch countries", err);
      setCountries([]);
    } finally {
      setLoading(false);
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
    countries,
    loading,
    searchStations,
    getTopStations,
    fetchCountries,
    favorites,
    toggleFavorite,
  };
}
