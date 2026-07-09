import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes protégées et rôle requis
const ROUTE_ROLES: { prefix: string; role: string }[] = [
  { prefix: '/admin', role: 'super_admin' },
  { prefix: '/dashboard', role: 'manager' },
  { prefix: '/patron', role: 'patron' },
]

const HOME_BY_ROLE: Record<string, string> = {
  super_admin: '/admin',
  manager: '/dashboard',
  patron: '/patron',
}

export async function middleware(request: NextRequest) {
  const { response, user, role } = await updateSession(request)
  const path = request.nextUrl.pathname

  const protectedRoute = ROUTE_ROLES.find((r) => path.startsWith(r.prefix))

  if (protectedRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (role !== protectedRoute.role) {
      const url = request.nextUrl.clone()
      url.pathname = role ? HOME_BY_ROLE[role] ?? '/login' : '/login'
      return NextResponse.redirect(url)
    }
  }

  // Si déjà connecté et sur /login → redirige vers son espace
  if (path === '/login' && user && role) {
    const url = request.nextUrl.clone()
    url.pathname = HOME_BY_ROLE[role] ?? '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/patron/:path*',
    '/login',
  ],
}
