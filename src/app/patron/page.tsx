import { createClient } from '@/lib/supabase/server'
import { fmt } from '@/lib/utils/format'
import { TrendingUp, ShoppingBag, Store } from 'lucide-react'

export default async function PatronPage() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data: relations } = await supabase
    .from('patron_restaurants')
    .select('restaurant_id, restaurants(id, nom, slug, actif, date_fin_abo)')
    .eq('patron_id', auth.user.id)

  const restaurants = (relations ?? []).map((r) => r.restaurants).filter(Boolean) as unknown as {
    id: string; nom: string; slug: string; actif: boolean; date_fin_abo: string
  }[]

  const debutJour = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const restaurantIds = restaurants.map((r) => r.id)

  const { data: commandesJour } = restaurantIds.length
    ? await supabase
        .from('commandes')
        .select('total, statut, restaurant_id, lignes_commande(plat_nom, quantite)')
        .in('restaurant_id', restaurantIds)
        .gte('created_at', debutJour)
        .eq('statut', 'paye')
    : { data: [] }

  const chiffreAffaireGlobal = (commandesJour ?? []).reduce((s, c) => s + Number(c.total), 0)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-xl font-semibold">Mes restaurants</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-5">
          <Store className="text-brand" size={20} />
          <p className="mt-2 text-2xl font-semibold">{restaurants.length}</p>
          <p className="text-sm text-textmid">Restaurants</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5">
          <ShoppingBag className="text-blue" size={20} />
          <p className="mt-2 text-2xl font-semibold">{(commandesJour ?? []).length}</p>
          <p className="text-sm text-textmid">Commandes payées aujourd&apos;hui</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5">
          <TrendingUp className="text-green" size={20} />
          <p className="mt-2 text-2xl font-semibold">{fmt(chiffreAffaireGlobal)}</p>
          <p className="text-sm text-textmid">Chiffre d&apos;affaires du jour</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {restaurants.map((r) => {
          const commandesResto = (commandesJour ?? []).filter((c) => c.restaurant_id === r.id)
          const totalResto = commandesResto.reduce((s, c) => s + Number(c.total), 0)
          const compteur: Record<string, number> = {}
          for (const c of commandesResto) {
            for (const l of c.lignes_commande ?? []) {
              compteur[l.plat_nom] = (compteur[l.plat_nom] ?? 0) + l.quantite
            }
          }
          const topPlat = Object.entries(compteur).sort((a, b) => b[1] - a[1])[0]

          return (
            <div key={r.id} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{r.nom}</h2>
                <span className={`text-xs font-semibold ${r.actif ? 'text-green' : 'text-red'}`}>
                  {r.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="mt-2 text-sm text-textmid">Chiffre d&apos;affaires du jour</p>
              <p className="text-xl font-semibold">{fmt(totalResto)}</p>
              {topPlat && (
                <p className="mt-2 text-sm text-textmid">
                  Plat le plus vendu : <span className="font-medium text-textdark">{topPlat[0]}</span>
                </p>
              )}
            </div>
          )
        })}
        {restaurants.length === 0 && (
          <p className="text-sm text-textlight">Aucun restaurant associé à votre compte pour le moment.</p>
        )}
      </div>
    </div>
  )
}
