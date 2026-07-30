import { EventCreationLoader } from '@/components/events/create/EventCreationLoader';
import { eventCreationCopy as copy } from '@/features/events/i18n/event-creation.copy';

export const metadata = { title: copy.metaTitle };

interface EventSetupPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventSetupPage({
  params,
}: EventSetupPageProps) {
  const { id } = await params;
  return <EventCreationLoader eventId={id} />;
}
