import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';

export const metadata: Metadata = {
  title: {
    template: '%s — Elintys',
    default: 'Elintys — Plateforme événementielle québécoise',
  },
  description:
    'Découvrez les événements, prestataires et lieux de Montréal. ' +
    'La plateforme événementielle tout-en-un au Québec.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
}
