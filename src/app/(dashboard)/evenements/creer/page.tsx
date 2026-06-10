import { EventWizard } from '@/components/events/EventWizard';

export const metadata = { title: 'Créer un événement — Elintys' };

export default function CreerEvenementPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-navy mb-8">Créer un événement</h1>
      <EventWizard />
    </div>
  );
}
