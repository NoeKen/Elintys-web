import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface VendorProfile {
  _id: string;
  businessName: string;
  category: string;
  description?: string;
  serviceArea?: string;
  rating: number;
  reviewCount: number;
  contactEmail?: string;
  isActive: boolean;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/vendors/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Prestataire introuvable — Elintys' };
    const vendor = await res.json() as VendorProfile;
    return {
      title: `${vendor.businessName} — Elintys`,
      description: vendor.description?.slice(0, 160),
    };
  } catch {
    return { title: 'Prestataire — Elintys' };
  }
}

export default async function PrestataireDetailPage({ params }: Props) {
  const { id } = await params;

  const res = await fetch(`${API_URL}/vendors/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) notFound();
  const vendor: VendorProfile = await res.json();
  if (!vendor.isActive) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/prestataires" className="text-sm text-teal hover:underline">
        &larr; Retour aux prestataires
      </Link>

      <h1 className="font-serif text-3xl text-navy mt-6 mb-2">
        {vendor.businessName}
      </h1>

      <p className="text-teal font-medium mb-4">{vendor.category}</p>

      {vendor.serviceArea && (
        <p className="text-sm text-muted mb-2">
          Zone de service&nbsp;: {vendor.serviceArea}
        </p>
      )}

      {vendor.reviewCount > 0 && (
        <p className="text-sm text-muted mb-2">
          {vendor.rating.toFixed(1)} / 5 ({vendor.reviewCount} avis)
        </p>
      )}

      {vendor.description && (
        <p className="text-sm text-muted mt-4 leading-relaxed">
          {vendor.description}
        </p>
      )}

      {vendor.contactEmail && (
        <p className="mt-4 text-sm">
          Courriel&nbsp;:{' '}
          <a href={`mailto:${vendor.contactEmail}`} className="text-teal hover:underline">
            {vendor.contactEmail}
          </a>
        </p>
      )}
    </main>
  );
}
