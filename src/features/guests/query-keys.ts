export const guestKeys = {
  all: ["guests"] as const,
  event: (eventId: string) => [...guestKeys.all, eventId] as const,
  page: (eventId: string, page: number) =>
    [...guestKeys.event(eventId), "page", page] as const,
};
