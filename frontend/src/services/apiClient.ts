// Standardize BASE_URL to ensure it includes /api/v1 and handles trailing slashes
let API_URL = import.meta.env.VITE_API_URL || 'https://radiolite.onrender.com/api/v1';
if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
if (!API_URL.includes('/api/v1') && !API_URL.includes('localhost')) {
  API_URL += '/api/v1';
}

export const BASE_URL = API_URL;

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
