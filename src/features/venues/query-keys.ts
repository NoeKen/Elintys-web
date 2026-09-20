import type { QueryClient } from '@tanstack/react-query';
export const venueKeys = {
  manager: (userId?: string) => ['venue-manager', userId] as const,
  mine: (userId?: string, page = 1) => ['venues-mine', userId, page] as const,
  detail: (userId?: string, venueId?: string) => ['venues-mine', userId, 'detail', venueId] as const,
};
export async function invalidateVenueQueries(client: QueryClient) {
  await Promise.all(['venues-mine', 'venue-catalog', 'venue-bookings-mine', 'venue-bookings'].map(key => client.invalidateQueries({ queryKey: [key] })));
}
