const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const defaultBaseUrl = (rawApiUrl && rawApiUrl !== 'undefined')
  ? rawApiUrl.replace(/\/+$/, '')
  : '/api';

const candidateUrls: string[] = Array.from(new Set([
  defaultBaseUrl,
  '/api',
  'http://127.0.0.1:5000/api',
  'http://localhost:5000/api',
]));

let activeBaseUrl = candidateUrls[0];

export const getApiBaseUrl = () => activeBaseUrl;

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Prioritize activeBaseUrl, followed by other candidate URLs if network fails
  const urlsToTry = [
    activeBaseUrl,
    ...candidateUrls.filter((u) => u !== activeBaseUrl),
  ];

  let response: Response | null = null;
  let lastNetworkError: any = null;

  for (const baseUrl of urlsToTry) {
    const fullUrl = `${baseUrl}${cleanEndpoint}`;
    try {
      response = await fetch(fullUrl, {
        ...options,
        headers,
      });
      // If we got any HTTP response (even 4xx/5xx), the server was reached successfully
      activeBaseUrl = baseUrl;
      lastNetworkError = null;
      break;
    } catch (err: any) {
      lastNetworkError = err;
      // Connection/Network error, continue to next candidate
    }
  }

  if (!response) {
    throw new Error(
      `Unable to reach backend server. Please verify the backend is running on port 5000 (${lastNetworkError?.message || 'Network request failed'}).`
    );
  }

  const text = await response.text();
  let data: any = {};
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const errorMsg =
      data.message ||
      data.error ||
      `Request failed with status ${response.status} (${response.statusText})`;
    throw new Error(errorMsg);
  }

  return data;
};
