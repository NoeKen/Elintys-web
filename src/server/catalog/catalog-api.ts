import 'server-only';

import { randomUUID } from 'node:crypto';
import { API_URL } from '@/shared/config/api-url';

const CATALOG_FETCH_TIMEOUT_MS = 5_000;

export interface CatalogResult<T> {
  data: T | null;
  error: boolean;
  requestId: string;
}

interface CatalogFetchOptions {
  revalidate?: number;
}

export async function fetchCatalogJson<T>(
  path: string,
  { revalidate = 60 }: CatalogFetchOptions = {},
): Promise<CatalogResult<T>> {
  const requestId = randomUUID();
  const startedAt = performance.now();
  const route = path.split('?')[0];

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { 'x-request-id': requestId },
      next: { revalidate },
      signal: AbortSignal.timeout(CATALOG_FETCH_TIMEOUT_MS),
    });
    const durationMs = Math.round(performance.now() - startedAt);

    console.info(
      JSON.stringify({
        event: 'catalog_fetch',
        service: 'elintys-web',
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
        requestId,
        method: 'GET',
        route,
        status: response.status,
        durationMs,
      }),
    );

    if (!response.ok) {
      return { data: null, error: true, requestId };
    }

    return { data: (await response.json()) as T, error: false, requestId };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'catalog_fetch_error',
        service: 'elintys-web',
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
        requestId,
        method: 'GET',
        route,
        status: 0,
        durationMs: Math.round(performance.now() - startedAt),
        errorType: error instanceof Error ? error.name : 'UnknownError',
      }),
    );

    return { data: null, error: true, requestId };
  }
}

