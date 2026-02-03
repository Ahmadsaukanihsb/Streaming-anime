import { BACKEND_URL } from '@/config/api';
import { getAuthHeaders, saveAuthToken } from '@/lib/auth';

type FetchInput = RequestInfo | URL;
type FetchInit = RequestInit | undefined;

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.token) {
        saveAuthToken(data.token);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function canRetryBody(body: BodyInit | null | undefined): boolean {
  if (!body) return true;
  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) return false;
  return true;
}

export async function apiFetch(input: FetchInput, init?: FetchInit): Promise<Response> {
  const headers = { ...(init?.headers || {}), ...getAuthHeaders() };
  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: init?.credentials || 'include'
  };

  const res = await fetch(input, requestInit);
  if (res.status !== 401) return res;

  if (!canRetryBody(requestInit.body)) {
    return res;
  }

  const refreshed = await tryRefreshToken();
  if (!refreshed) return res;

  const retryHeaders = { ...(init?.headers || {}), ...getAuthHeaders() };
  const retryInit: RequestInit = {
    ...init,
    headers: retryHeaders,
    credentials: init?.credentials || 'include'
  };

  return fetch(input, retryInit);
}
