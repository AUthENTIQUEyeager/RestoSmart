import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Plus, LogOut, UtensilsCrossed } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-brand" size={22} />
          <span className="font-display text-lg font-semibold">RestoSmart Admin</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-textmid hover:text-brand">
            <LayoutDashboard size={16} /> Restaurants
          </Link>
          <Link href="/admin/nouveau" className="flex items-center gap-1.5 text-sm text-textmid hover:text-brand">
            <Plus size={16} /> Nouveau
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="flex items-center gap-1.5 text-sm text-textmid hover:text-red">
              <LogOut size={16} /> Déconnexion
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
