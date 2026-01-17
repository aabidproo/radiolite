import { useCallback } from 'react';
import { useSearch } from './useSearch';
import { useCategories } from './useCategories';
import { useFavorites } from './useFavorites';
import { useStats } from './useStats';
import { useLocation } from './useLocation';
import { useFeaturedStations } from './useFeaturedStations';
import { useCache } from './useCache';

export function useStations() {
  const search = useSearch();
  const categories = useCategories();
  const favorites = useFavorites();
  const stats = useStats();
  const location = useLocation();
  const featured = useFeaturedStations();
  const cache = useCache();

  // Unified flushCache that also resets internal hook states
  const flushCache = useCallback(async () => {
    const success = await cache.flushCache();
    if (success) {
      featured.setFeaturedStationsCache({});
      // Note: Other category states will be updated on their next fetch
    }
    return success;
  }, [cache, featured]);

  return {
    // Search
    stations: search.stations,
    loading: search.loading,
    error: search.error,
    hasMore: search.hasMore,
    globalSearchResults: search.globalSearchResults,
    searchStations: search.searchStations,
    searchGlobal: search.searchGlobal,
    getTopStations: search.getTopStations,
    resetPagination: search.resetPagination,
    clearGlobalSearch: () => search.setGlobalSearchResults(null),

    // Location
    nearMeStations: location.nearMeStations,
    userCountry: location.userCountry,
    detectLocation: location.detectLocation,
    fetchNearMeStations: location.fetchNearMeStations,

    // Categories
    countries: categories.countries,
    languages: categories.languages,
    tags: categories.tags,
    fetchCountries: categories.fetchCountries,
    fetchLanguages: categories.fetchLanguages,
    fetchTags: categories.fetchTags,

    // Featured
    featuredStations: featured.featuredStations,
    featuredLoading: featured.featuredLoading,
    getFeaturedStations: featured.getFeaturedStations,

    // Stats
    stats: stats.stats,
    fetchStats: stats.fetchStats,

    // Favorites
    favorites: favorites.favorites,
    toggleFavorite: favorites.toggleFavorite,

    // Cache
    flushing: cache.flushing,
    flushCache
  };
}
