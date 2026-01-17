import { useState, useCallback, useRef } from 'react';
import { apiFetch } from '../services/apiClient';

export function useCategories() {
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
  const [loading, setLoading] = useState(false);

  const countriesRef = useRef(countries);
  const languagesRef = useRef(languages);
  const tagsRef = useRef(tags);

  const fetchCountries = useCallback(async (options: { append?: boolean, searchQuery?: string } = {}) => {
    const shouldAppend = options.append || false;
    const currentOffset = shouldAppend ? countriesRef.current.length : 0;
    const queryParam = options.searchQuery ? `&name=${encodeURIComponent(options.searchQuery)}` : '';
    
    setLoading(true);
    try {
      const data = await apiFetch<any[]>(`/stations/countries?limit=24&offset=${currentOffset}${queryParam}`);
      const cleanData = Array.isArray(data) ? data : [];
      
      const next = shouldAppend ? [...countriesRef.current, ...cleanData] : cleanData;
      setCountries(next);
      countriesRef.current = next;
      localStorage.setItem('radiolite_countries', JSON.stringify(next));
    } catch (err) {
      console.error("Failed to fetch countries", err);
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
      const data = await apiFetch<any[]>(`/stations/languages?limit=24&offset=${currentOffset}${queryParam}`);
      const cleanData = Array.isArray(data) ? data : [];

      const next = shouldAppend ? [...languagesRef.current, ...cleanData] : cleanData;
      setLanguages(next);
      languagesRef.current = next;
      localStorage.setItem('radiolite_languages', JSON.stringify(next));
    } catch (err) {
      console.error("Failed to fetch languages", err);
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
      const data = await apiFetch<any[]>(`/stations/tags?limit=24&offset=${currentOffset}${queryParam}`);
      const cleanData = Array.isArray(data) ? data : [];
      
      const next = shouldAppend ? [...tagsRef.current, ...cleanData] : cleanData;
      setTags(next);
      tagsRef.current = next;
      localStorage.setItem('radiolite_tags', JSON.stringify(next));
    } catch (err) {
      console.error("Failed to fetch tags", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    countries,
    languages,
    tags,
    fetchCountries,
    fetchLanguages,
    fetchTags,
    setCountries,
    setLanguages,
    setTags,
    categoriesLoading: loading
  };
}
