const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const API_BASE_URL = (rawApiUrl && rawApiUrl !== 'undefined')
  ? rawApiUrl.replace(/\/+$/, '')
  : 'http://localhost:5000/api';

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
  const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(
      `Unable to reach server at ${API_BASE_URL}. Please ensure the backend is running.`
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
