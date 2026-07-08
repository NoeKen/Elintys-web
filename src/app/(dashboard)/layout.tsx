import { requireAuth } from '@/server/auth/guards';
import { Sidebar } from '@/shared/layout/Sidebar';
import { Topbar } from '@/shared/layout/Topbar';
import { MobileNav } from '@/shared/layout/MobileNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="mesh-gradient premium-noise flex h-screen overflow-hidden bg-background text-on-surface">
      <div className="hidden h-full md:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-3 pb-24 pt-4 md:px-5 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
