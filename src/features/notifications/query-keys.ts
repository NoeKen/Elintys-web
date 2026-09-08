export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly = false, page = 1) =>
    [...notificationKeys.all, "list", { unreadOnly, page }] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};
