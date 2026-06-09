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

export default async function EvenementsPage() {
  const [featuredRes, recentRes] = await Promise.allSettled([
    fetch(`${API_URL}/discovery/featured`, { next: { revalidate: 60 } }),
    fetch(`${API_URL}/events?limit=5&status=published`, { next: { revalidate: 60 } }),
  ]);

  const featuredData =
    featuredRes.status === 'fulfilled' && featuredRes.value.ok
      ? await featuredRes.value.json()
      : null;

  const recentData =
    recentRes.status === 'fulfilled' && recentRes.value.ok
      ? await recentRes.value.json()
      : null;

  const featured: unknown[] = featuredData?.data ?? featuredData ?? [];
  const recent: unknown[] = recentData?.data ?? recentData?.items ?? [];

  return (
    <>
      <HeroSection />
      <FeaturedSection events={featured as Parameters<typeof FeaturedSection>[0]['events']} />
      <CategoriesSection />
      <WeeklySection events={recent as Parameters<typeof WeeklySection>[0]['events']} />
    </>
  );
}
