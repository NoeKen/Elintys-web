import { redirect } from 'next/navigation'
import { getSession } from './session'
import { ROUTES } from '@/shared/constants/routes'

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect(ROUTES.AUTH.LOGIN)
  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) redirect(ROUTES.DASHBOARD.HOME)
  return session
}
