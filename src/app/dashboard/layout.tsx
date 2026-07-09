import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('manager_id', auth.user.id)
    .single()

  if (!restaurant) redirect('/login')

  const expire = !restaurant.actif || new Date(restaurant.date_fin_abo) < new Date(new Date().toDateString())

  return (
    <div className="flex h-screen">
      <Sidebar nomRestaurant={restaurant.nom} />
      <main className="flex-1 overflow-y-auto bg-bg px-8 py-8">
        {expire ? (
          <ScreenExpire dateFin={restaurant.date_fin_abo} />
        ) : (
          children
        )}
      </main>
    </div>
  )
}

function ScreenExpire({ dateFin }: { dateFin: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h1 className="font-display text-2xl font-semibold text-red">Abonnement expiré</h1>
      <p className="mt-2 max-w-md text-textmid">
        Votre abonnement a expiré le {dateFin}. Contactez l&apos;administrateur pour le renouveler
        via Orange Money ou Wave.
      </p>
    </div>
  )
}
