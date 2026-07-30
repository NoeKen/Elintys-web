import { EventCreationWizard } from '@/components/events/create/EventCreationWizard';
import { eventCreationCopy as copy } from '@/features/events/i18n/event-creation.copy';

export const metadata = { title: copy.metaTitle };

export default function CreateEventPage() {
  return <EventCreationWizard />;
}
