import { EventWorkspaceShell } from '@/components/events/organizer/EventWorkspaceShell';

export default function EventWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <EventWorkspaceShell>{children}</EventWorkspaceShell>;
}
