import type { Metadata } from 'next';
import { HeroSection } from '@/components/public/HeroSection';
import { FeaturedSection } from '@/components/public/FeaturedSection';
import { CategoriesSection } from '@/components/public/CategoriesSection';
import { WeeklySection } from '@/components/public/WeeklySection';

export const metadata: Metadata = {
  title: 'Événements à Montréal',
  description:
    'Découvrez les concerts, galas, conférences et ateliers à Montréal. ' +
    'Achetez vos billets directement sur Elintys.',
};

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const STATIC_FETCH_TIMEOUT_MS = 3_000;

async function fetchJsonWithTimeout<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(STATIC_FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return null;

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function EvenementsPage() {
  const [featuredData, recentData] = await Promise.all([
    fetchJsonWithTimeout<{ data?: unknown[] } | unknown[]>(`${API_URL}/discovery/featured`),
    fetchJsonWithTimeout<{ data?: unknown[]; items?: unknown[] } | unknown[]>(
      `${API_URL}/events?limit=5&status=published`,
    ),
  ]);

  const featured: unknown[] = Array.isArray(featuredData)
    ? featuredData
    : featuredData?.data ?? [];
  const recent: unknown[] = Array.isArray(recentData)
    ? recentData
    : recentData?.data ?? recentData?.items ?? [];

  return (
    <>
      <HeroSection />
      <FeaturedSection events={featured as Parameters<typeof FeaturedSection>[0]['events']} />
      <CategoriesSection />
      <WeeklySection events={recent as Parameters<typeof WeeklySection>[0]['events']} />
    </>
  );
}
