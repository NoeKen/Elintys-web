import { QRScanner } from '@/components/tickets/QRScanner';

interface Props {
  params: Promise<{ eventId: string }>;
}

export const metadata = { title: 'Scanner billets — Elintys' };

export default async function ScanPage({ params }: Props) {
  const { eventId } = await params;
  return (
    <div className="min-h-screen bg-navy text-white p-6">
      <h1 className="font-serif text-xl font-bold text-center mb-6">Scanner billets</h1>
      <QRScanner eventId={eventId} />
    </div>
  );
}
