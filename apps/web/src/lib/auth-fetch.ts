import { apiFetch, ApiClientError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

type ApiFetchOptions = Parameters<typeof apiFetch>[1];

/**
 * Fetch wrapper that adds the Bearer token automatically.
 * On 401, attempts a token refresh once and retries.
 * Safe to call from client components (reads Zustand state directly).
 */
export async function authFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { accessToken, refreshSession } = useAuthStore.getState();

  const withBearer = (token: string | null): ApiFetchOptions => ({
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  try {
    return await apiFetch<T>(path, withBearer(accessToken));
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      const refreshed = await refreshSession();
      if (refreshed) {
        const newToken = useAuthStore.getState().accessToken;
        return await apiFetch<T>(path, withBearer(newToken));
      }
    }
    throw err;
  }
}
