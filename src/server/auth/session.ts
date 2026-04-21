import { cookies } from 'next/headers'

export interface AuthSession {
  id: string
  email: string
  role: string
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('elintys_access_token')?.value
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.sub, email: payload.email, role: payload.role }
  } catch {
    return null
  }
}

export async function setSession(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set('elintys_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 15,
    path: '/',
  })
  cookieStore.set('elintys_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('elintys_access_token')
  cookieStore.delete('elintys_refresh_token')
}
