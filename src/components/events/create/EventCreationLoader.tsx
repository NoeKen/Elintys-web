'use client';

import { useQuery } from '@tanstack/react-query';
import { eventsService } from '@/features/events/services/events.service';
import { eventCreationCopy as copy } from '@/features/events/i18n/event-creation.copy';
import { EventCreationWizard } from './EventCreationWizard';

interface EventCreationLoaderProps {
  eventId: string;
}

export function EventCreationLoader({ eventId }: EventCreationLoaderProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', eventId, 'creation'],
    queryFn: () => eventsService.get(eventId),
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="event-creation min-h-screen bg-event-background p-6 sm:p-12">
        <div className="premium-skeleton mx-auto h-[720px] max-w-5xl rounded-[24px]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="event-creation flex min-h-screen items-center justify-center bg-event-background p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-event-panel">
          <p className="text-sm text-destructive">{copy.saveError}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 min-h-11 rounded-2xl bg-event-petrol px-5 text-sm font-semibold text-white"
          >
            {copy.retry}
          </button>
        </div>
      </div>
    );
  }

  return <EventCreationWizard initialEvent={data} />;
}
