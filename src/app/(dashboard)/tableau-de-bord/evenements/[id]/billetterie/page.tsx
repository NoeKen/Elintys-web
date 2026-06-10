import { PlaceholderPage } from "@/shared/navigation/PlaceholderPage";

export default async function EventBilletteriePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PlaceholderPage
      title="Billetterie de l'événement"
      description={`Les types de billets et ventes de l'événement ${id} seront disponibles ici.`}
      backHref={`/tableau-de-bord/evenements/${id}`}
      backLabel="Retour à l'événement"
    />
  );
}
