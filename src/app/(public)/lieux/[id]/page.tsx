import { PlaceholderPage } from "@/shared/navigation/PlaceholderPage";

export default async function LieuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PlaceholderPage
      title="Fiche lieu"
      description={`La fiche du lieu ${id} sera disponible ici.`}
      backHref="/lieux"
      backLabel="Retour aux lieux"
    />
  );
}
