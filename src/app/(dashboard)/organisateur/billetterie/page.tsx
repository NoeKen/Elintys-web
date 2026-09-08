import { PlaceholderPage } from '@/shared/navigation/PlaceholderPage';

export default function OrganisateurBilletteriePage() {
  return (
    <PlaceholderPage
      title="Billetterie organisateur"
      description="Il n’existe pas encore de vue consolidée de la billetterie. Les billets réellement configurés se gèrent depuis l’espace de chaque événement."
      backHref="/tableau-de-bord/evenements"
      backLabel="Choisir un événement"
    />
  );
}
