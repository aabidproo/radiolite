import { useState, useCallback } from 'react';
import { Station } from '../types/station';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Station[]>(() => {
    const saved = localStorage.getItem('radiolite_favorites');
    return saved ? JSON.parse(saved) : [];
  });

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
    favorites,
    toggleFavorite
  };
}
