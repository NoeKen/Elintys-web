import { PlaceholderPage } from "@/shared/navigation/PlaceholderPage";
import { participationCopy as copy } from "@/features/events/lib/participation-error";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <PlaceholderPage
      title={copy.paidUnavailableTitle}
      description={copy.paidUnavailableDescription}
      backHref={`/evenements/${eventId}`}
      backLabel="Retour à l'événement"
    />
  );
}
