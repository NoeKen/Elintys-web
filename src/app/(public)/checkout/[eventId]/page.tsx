import { PlaceholderPage } from "@/shared/navigation/PlaceholderPage";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <PlaceholderPage
      title="Paiement"
      description={`Le paiement pour l'événement ${eventId} sera finalisé ici.`}
      backHref={`/evenements/${eventId}`}
      backLabel="Retour à l'événement"
    />
  );
}
