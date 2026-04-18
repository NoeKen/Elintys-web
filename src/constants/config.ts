export const APP_CONFIG = {
  name: "Elintys",
  locale: "fr-CA",
  currency: "CAD",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
} as const;
