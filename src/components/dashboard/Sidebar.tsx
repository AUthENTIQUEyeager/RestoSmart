'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  LayoutDashboard, UtensilsCrossed, Grid3x3, ChefHat, CreditCard, History, Settings, LogOut,
} from 'lucide-react'

const LIENS = [
  { href: '/dashboard', label: 'Vue d\u2019ensemble', icon: LayoutDashboard },
  { href: '/dashboard/plats', label: 'Plats', icon: UtensilsCrossed },
  { href: '/dashboard/tables', label: 'Tables & QR', icon: Grid3x3 },
  { href: '/dashboard/cuisine', label: 'Cuisine', icon: ChefHat },
  { href: '/dashboard/caisse', label: 'Caisse', icon: CreditCard },
  { href: '/dashboard/historique', label: 'Historique', icon: History },
  { href: '/dashboard/config', label: 'Configuration', icon: Settings },
]

export function Sidebar({ nomRestaurant }: { nomRestaurant: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-5 py-5">
        <p className="font-display text-lg font-semibold leading-tight">{nomRestaurant}</p>
        <p className="text-xs text-textlight">Espace manager</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {LIENS.map(({ href, label, icon: Icon }) => {
          const actif = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'mb-1 flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition',
                actif ? 'bg-brand-light text-brand' : 'text-textmid hover:bg-bg'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
      <form action="/api/auth/logout" method="post" className="border-t border-border p-3">
        <button className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-textmid hover:bg-bg hover:text-red">
          <LogOut size={18} />
          Déconnexion
        </button>
      </form>
    </aside>
  )
}
