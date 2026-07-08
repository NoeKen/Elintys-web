export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface ApiRequestConfig {
  params?: object;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  data?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(`HTTP ${status}`);
    this.name = "ApiClientError";
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

let refreshPromise: Promise<boolean> | null = null;

export function setAuthToken(_token: string | null) {
  void _token;
  // Compatibilité temporaire: l'auth Phase 2 utilise uniquement les cookies httpOnly.
}

export function setRefreshTokenFn(_fn: () => Promise<string | null>) {
  void _fn;
  // Compatibilité temporaire: le refresh est géré par cookie dans request().
}

function buildUrl(path: string, params?: ApiRequestConfig["params"]): string {
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(`${base}${normalizedPath}`, origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (
      value === null ||
      value === undefined ||
      !["string", "number", "boolean"].includes(typeof value)
    ) return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function shouldRefresh(path: string, status: number, retried: boolean): boolean {
  return (
    status === 401 &&
    !retried &&
    !path.includes("/auth/refresh") &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/register")
  );
}

async function refreshSessionCookie(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  config: ApiRequestConfig = {},
  retried = false,
): Promise<ApiResponse<T>> {
  const response = await fetch(buildUrl(path, config.params), {
    method,
    credentials: "include",
    signal: config.signal,
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (shouldRefresh(path, response.status, retried)) {
    const refreshed = await refreshSessionCookie();
    if (refreshed) return request<T>(method, path, body, config, true);
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new ApiClientError(response.status, payload);
  }

  return { data: payload as T, status: response.status };
}

const api = {
  get<T>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>("GET", path, undefined, config);
  },

  post<T>(path: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>("POST", path, data, config);
  },

  put<T>(path: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, data, config);
  },

  patch<T>(path: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, data, config);
  },

  delete<T>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path, config?.data, config);
  },
};

export default api;
