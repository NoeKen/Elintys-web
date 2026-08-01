import type { MetadataRoute } from 'next';
import { API_URL } from '@/shared/config/api-url';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.elintys.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/evenements`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/prestataires`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/lieux`, changeFrequency: 'daily', priority: 0.8 },
  ];
  try {
    const response = await fetch(`${API_URL}/events?limit=100`, { next: { revalidate: 3600 } });
    if (!response.ok) return staticRoutes;
    const payload = await response.json() as { data?: Array<{ slug?: string; updatedAt?: string; discoverability?: string }> };
    const events = (payload.data ?? [])
      .filter((event) => event.slug && event.discoverability === 'public')
      .map((event) => ({
        url: `${SITE_URL}/evenements/${event.slug}`,
        lastModified: event.updatedAt ? new Date(event.updatedAt) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    return [...staticRoutes, ...events];
  } catch {
    return staticRoutes;
  }
}
