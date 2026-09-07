import { ProtectedRoute } from '@/shared/guards/ProtectedRoute';

/**
 * Le scanner est réservé aux comptes autorisés sur l'événement.
 *
 * Sans cette garde, un visiteur anonyme ouvrait la caméra et chaque scan
 * repartait en 401 : l'écran promettait une capacité que la session ne
 * permettait pas. L'API reste la seule autorité (elle vérifie que l'appelant
 * peut gérer CET événement) ; cette garde évite d'exposer une expérience qui
 * ne peut pas aboutir.
 */
export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
