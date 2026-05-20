import type { ApiResponse } from '@mvh/types';

/**
 * URL base del API. Se inyecta vía variable de entorno.
 * En el server (RSC) puede apuntar al hostname interno; en cliente al público.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
  /**
   * Tags para revalidación on-demand de Next.js (server-side fetch).
   */
  tags?: string[];
  /**
   * Tiempo de revalidación en segundos (ISR).
   */
  revalidate?: number | false;
}

/**
 * Cliente fetch tipado que consume nuestra API.
 * Funciona tanto en RSC (server) como en client components.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, searchParams, tags, revalidate, headers, ...rest } = options;

  const url = new URL(`${API_URL}${path}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const fetchInit: RequestInit & { next?: { tags?: string[]; revalidate?: number | false } } = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  // Hooks de cache de Next.js (sólo aplican en server-side fetch)
  if (tags || revalidate !== undefined) {
    fetchInit.next = {
      ...(tags ? { tags } : {}),
      ...(revalidate !== undefined ? { revalidate } : {}),
    };
  }

  const res = await fetch(url.toString(), fetchInit);

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(res.status, 'INVALID_RESPONSE', 'Respuesta inválida del servidor');
  }

  if (!res.ok || !json.ok) {
    if (json && 'error' in json) {
      throw new ApiClientError(
        res.status,
        json.error.code,
        json.error.message,
        json.error.details,
      );
    }
    throw new ApiClientError(res.status, 'UNKNOWN_ERROR', `HTTP ${res.status}`);
  }

  return json.data;
}
