import { redirect } from 'next/navigation';

export default function LegacyVenueProfilePage() {
  redirect('/tableau-de-bord/gestionnaire/lieux');
}
