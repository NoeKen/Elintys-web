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
    <main className="public-detail-shell mesh-gradient">
      <article className="container-public">
        <div className="glass-card mx-auto max-w-3xl p-6 sm:p-9">
          <Link href="/prestataires" className="premium-button-ghost mb-6">
            Retour aux prestataires
          </Link>

          <p className="section-eyebrow mb-4">Prestataire vérifié</p>
          <h1 className="premium-heading mb-3">{vendor.businessName}</h1>

          <p className="mb-7 inline-flex rounded-full border border-teal/20 bg-teal-pale px-4 py-2 text-sm font-bold text-teal-dark">
            {vendor.category}
          </p>

          <div className="mb-7 grid gap-3 text-sm text-on-surface-variant sm:grid-cols-2">
            {vendor.serviceArea && (
              <p className="rounded-2xl border border-outline-variant/70 bg-white/70 p-4 shadow-[var(--shadow-soft-line)]">
                Zone de service&nbsp;: {vendor.serviceArea}
              </p>
            )}

            {vendor.reviewCount > 0 && (
              <p className="rounded-2xl border border-outline-variant/70 bg-white/70 p-4 shadow-[var(--shadow-soft-line)]">
                {vendor.rating.toFixed(1)} / 5 ({vendor.reviewCount} avis)
              </p>
            )}
          </div>

          {vendor.description && (
            <p className="premium-subtitle whitespace-pre-wrap">
              {vendor.description}
            </p>
          )}

          {vendor.contactEmail && (
            <p className="mt-7 text-sm text-on-surface-variant">
              Courriel&nbsp;:{' '}
              <a href={`mailto:${vendor.contactEmail}`} className="font-semibold text-teal hover:text-teal-dark">
                {vendor.contactEmail}
              </a>
            </p>
          )}
        </div>
      </article>
    </main>
  );
}
