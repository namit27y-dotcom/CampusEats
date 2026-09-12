const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = (env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Normalize endpoint to always match /api/...
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiPath = normalizedEndpoint.startsWith('/api/')
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`;

  const baseOrigin = API_BASE_URL.replace(/\/api$/, '');
  const url = `${baseOrigin}${apiPath}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}
