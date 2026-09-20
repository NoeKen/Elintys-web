'use client';

import { RoleGuard } from '@/shared/guards/RoleGuard';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['gestionnaire_salle']} fallback={<p role="alert">Cet espace est réservé aux gestionnaires de lieux.</p>}>{children}</RoleGuard>;
}
