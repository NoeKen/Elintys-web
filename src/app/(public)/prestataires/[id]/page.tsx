import { PlaceholderPage } from "@/shared/navigation/PlaceholderPage";

export default async function PrestataireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PlaceholderPage
      title="Fiche prestataire"
      description={`La fiche du prestataire ${id} sera disponible ici.`}
      backHref="/prestataires"
      backLabel="Retour aux prestataires"
    />
  );
}
