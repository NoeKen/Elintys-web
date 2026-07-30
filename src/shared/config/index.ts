import { API_URL } from "./api-url";

export const APP_CONFIG = {
  name: "Elintys",
  locale: "fr-CA",
  currency: "CAD",
  apiUrl: API_URL,
  tokenRefreshThreshold: 5 * 60 * 1000,
} as const;

export { API_URL, resolveApiUrl } from "./api-url";
