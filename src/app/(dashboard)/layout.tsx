import { ProtectedRoute } from '@/shared/guards/ProtectedRoute';
import { Sidebar } from '@/shared/layout/Sidebar';
import { DashboardChrome } from '@/shared/layout/DashboardChrome';
import { MobileNav } from '@/shared/layout/MobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="mesh-gradient premium-noise flex h-screen overflow-hidden bg-background text-on-surface">
        <div className="hidden h-full md:flex">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardChrome />
          {/* `tabIndex={0}` : cette zone défile (`overflow-y-auto`). Sans être
              focalisable, elle est inatteignable au clavier dès que son contenu
              ne comporte aucun élément focalisable — un état vide, par exemple.
              C'est la règle axe `scrollable-region-focusable`. */}
          <main
            tabIndex={0}
            className="flex-1 overflow-y-auto px-3 pb-24 pt-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal md:px-5 md:pb-6"
          >
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </ProtectedRoute>
  );
}
