import { requireAuth } from '@/server/auth/guards'
import { Sidebar } from '@/shared/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar session={session} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
