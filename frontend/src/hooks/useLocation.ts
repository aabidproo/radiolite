import { useState, useCallback } from 'react';
import { Station } from '../types/station';
import { apiFetch } from '../services/apiClient';
import { invoke } from '@tauri-apps/api/core';

// Detect if we're running inside a Tauri desktop app
const isTauri = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';

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

  /**
   * Detects location via IP lookup.
   *
   * In Tauri (desktop): delegates to the Rust `detect_location` command which uses
   * a native HTTP client — bypasses WebView CSP entirely and works on all platforms.
   *
   * In browser (web): falls through 3 HTTP services directly from JS.
   *
   * Always checks localStorage cache first to avoid redundant calls.
   */
  const detectLocation = useCallback(async (): Promise<string | null> => {
    // --- Cache hit: skip network call if already resolved ---
    const cachedCode = localStorage.getItem('radiolite_user_country_code');
    const cachedName = localStorage.getItem('radiolite_user_country');
    if (cachedCode) {
      console.log('[Location] Cache hit:', cachedName, cachedCode);
      setUserCountry(cachedName);
      setUserCountryCode(cachedCode);
      return cachedCode;
    }

    // --- Tauri path: use Rust-side HTTP (most reliable, bypasses CSP) ---
    if (isTauri) {
      console.log('[Location] Tauri detected, invoking Rust detect_location command...');
      try {
        const [code, name] = await invoke<[string, string]>('detect_location');
        console.log('[Location] Rust detection success:', name, code);
        setUserCountry(name);
        setUserCountryCode(code);
        localStorage.setItem('radiolite_user_country', name);
        localStorage.setItem('radiolite_user_country_code', code);
        return code;
      } catch (err) {
        console.error('[Location] Rust detect_location failed:', err);
        // Fall through to JS fallback below
      }
    }

    // --- Browser / Tauri fallback: JS IP services ---
    console.log('[Location] Trying JS IP geolocation services...');

    // Service 1: ipapi.co — returns {error: true} when rate-limited, check explicitly
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (!data.error && data.country) {
        const code = data.country as string;
        const name = (data.country_name || code) as string;
        console.log('[Location] ipapi.co success:', name, code);
        setUserCountry(name);
        setUserCountryCode(code);
        localStorage.setItem('radiolite_user_country', name);
        localStorage.setItem('radiolite_user_country_code', code);
        return code;
      } else if (data.error) {
        console.warn('[Location] ipapi.co rate-limited, trying fallback...');
      }
    } catch (err) {
      console.warn('[Location] ipapi.co failed:', err);
    }

    // Service 2: freeipapi.com
    try {
      const res = await fetch('https://freeipapi.com/api/json');
      const data = await res.json();
      if (data.countryCode) {
        const code = data.countryCode as string;
        const name = (data.countryName || code) as string;
        console.log('[Location] freeipapi.com success:', name, code);
        setUserCountry(name);
        setUserCountryCode(code);
        localStorage.setItem('radiolite_user_country', name);
        localStorage.setItem('radiolite_user_country_code', code);
        return code;
      }
    } catch (err) {
      console.warn('[Location] freeipapi.com failed:', err);
    }

    // Service 3: ip-api.com
    try {
      const res = await fetch('http://ip-api.com/json/?fields=countryCode,country');
      const data = await res.json();
      if (data.countryCode) {
        const code = data.countryCode as string;
        const name = (data.country || code) as string;
        console.log('[Location] ip-api.com success:', name, code);
        setUserCountry(name);
        setUserCountryCode(code);
        localStorage.setItem('radiolite_user_country', name);
        localStorage.setItem('radiolite_user_country_code', code);
        return code;
      }
    } catch (err) {
      console.warn('[Location] ip-api.com failed:', err);
    }

    console.error('[Location] All geolocation services failed.');
    return null;
  }, []);

  /**
   * "Detect with permission" — on desktop (Tauri), navigator.geolocation is NOT
   * supported without native OS entitlements, so we always use the same reliable
   * IP-based path. The name is kept for API compatibility with existing UI code.
   *
   * On web, this tries the browser's Geolocation API as a more precise option,
   * then falls back to IP-based detection.
   */
  const detectLocationWithPermission = useCallback(async (): Promise<string | null> => {
    setLoading(true);

    // On desktop, navigator.geolocation will silently fail (no OS entitlements).
    // Use IP-based detection which is fully reliable on all desktop platforms.
    if (isTauri) {
      console.log('[Location] Tauri desktop: using IP-based detection (GPS not available in WebView).');
      const code = await detectLocation();
      setLoading(false);
      return code;
    }

    // Web path: try browser geolocation for more precise country resolution
    console.log('[Location] Web: requesting browser geolocation permission...');
    return new Promise<string | null>((resolve) => {
      if (!navigator.geolocation) {
        console.warn('[Location] navigator.geolocation not supported, falling back to IP.');
        detectLocation().then((c) => {
          setLoading(false);
          resolve(c);
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            console.log('[Location] GPS coords obtained:', latitude, longitude);
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            if (data.countryCode) {
              const code = data.countryCode as string;
              const name = (data.countryName || code) as string;
              console.log('[Location] Reverse geocode success:', name, code);
              setUserCountry(name);
              setUserCountryCode(code);
              localStorage.setItem('radiolite_user_country', name);
              localStorage.setItem('radiolite_user_country_code', code);
              setLoading(false);
              resolve(code);
              return;
            }
          } catch (err) {
            console.error('[Location] Reverse geocode failed:', err);
          }
          // GPS succeeded but geocode failed — fall back to IP
          const code = await detectLocation();
          setLoading(false);
          resolve(code);
        },
        async (err) => {
          console.warn('[Location] Geolocation permission denied or failed:', err.message, '— falling back to IP.');
          const code = await detectLocation();
          setLoading(false);
          resolve(code);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    });
  }, [detectLocation]);

  const fetchNearMeStations = useCallback(async (countryCode: string, options: { append?: boolean, offset?: number } = {}) => {
    if (!countryCode || countryCode === 'Unknown') return [];

    const shouldAppend = options.append || false;
    const currentOffset = options.offset || 0;

    setLoading(true);
    try {
      console.log(`[Location] Fetching stations for: ${countryCode} (offset=${currentOffset})...`);
      const url = `/stations/search?countrycode=${encodeURIComponent(countryCode)}&limit=100&offset=${currentOffset}&hidebroken=true&order=clickcount&reverse=true`;
      const data = await apiFetch<Station[]>(url);

      console.log(`[Location] Found ${data.length} stations for ${countryCode}`);

      if (shouldAppend) {
        setNearMeStations(prev => [...prev, ...data]);
      } else {
        setNearMeStations(data);
        localStorage.setItem('radiolite_near_me_stations', JSON.stringify(data));
      }
      return data;
    } catch (err) {
      console.error('[Location] Failed to fetch near me stations:', err);
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
