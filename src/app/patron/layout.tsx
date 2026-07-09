import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UtensilsCrossed, LogOut } from 'lucide-react'

export default async function PatronLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-brand" size={22} />
          <span className="font-display text-lg font-semibold">RestoSmart</span>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="flex items-center gap-1.5 text-sm text-textmid hover:text-red">
            <LogOut size={16} /> Déconnexion
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
