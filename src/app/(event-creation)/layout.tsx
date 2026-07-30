import { requireAuth } from '@/server/auth/guards';

export default async function EventCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return children;
}
