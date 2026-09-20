import { VenueEditorScreen } from '@/features/venues/components/ManagerScreens';
export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VenueEditorScreen venueId={id} />;
}
