import { cookies } from 'next/headers'
import { COOKIE_NAMES } from './cookies'

export interface AuthSession {
  id: string
  email: string
  role: string
  roles: string[]
}

function decodeJwtPayload(token: string): { sub?: string; email?: string; role?: string; roles?: string[] } | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(normalizedPayload, 'base64').toString('utf8')) as {
      sub?: string
      email?: string
      role?: string
      roles?: string[]
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value
  if (!token) return null

  const payload = decodeJwtPayload(token)
  if (!payload?.sub || !payload.email) return null

  const roles = payload.roles ?? (payload.role ? [payload.role] : [])
  return { id: payload.sub, email: payload.email, role: roles[0] ?? '', roles }
}

export async function setSession(accessToken: string, refreshToken: string) {
  void accessToken
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN)
}
