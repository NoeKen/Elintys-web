import type { Metadata } from 'next';
import { InvitationRedemption } from './InvitationRedemption';

export const metadata: Metadata = {
  title: 'Invitation — Elintys',
  robots: { index: false, follow: false },
};

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <InvitationRedemption token={token} />;
}
