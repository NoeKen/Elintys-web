import { ProtectedRoute } from '@/shared/guards/ProtectedRoute';

export default function EventCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
