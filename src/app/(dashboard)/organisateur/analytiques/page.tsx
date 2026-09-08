import { PlaceholderPage } from '@/shared/navigation/PlaceholderPage';

export default function OrganisateurAnalytiquesPage() {
  return (
    <PlaceholderPage
      title="Analytiques"
      description="Les indicateurs analytiques ne sont pas encore disponibles. Les données de vos événements restent accessibles depuis leur espace de gestion."
      backHref="/tableau-de-bord/evenements"
      backLabel="Gérer mes événements"
    />
  );
}
