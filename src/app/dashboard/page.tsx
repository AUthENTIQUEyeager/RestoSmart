import { createClient } from '@/lib/supabase/server'
import { CardStat } from '@/components/dashboard/CardStat'
import { fmt } from '@/lib/utils/format'
import { ShoppingBag, TrendingUp, Clock, UtensilsCrossed } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, nom')
    .eq('manager_id', auth.user!.id)
    .single()

  if (!restaurant) return null

  const debutJour = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const { data: commandesJour } = await supabase
    .from('commandes')
    .select('total, statut')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', debutJour)

  const { count: platsCount } = await supabase
    .from('plats')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)

  const commandesPayees = (commandesJour ?? []).filter((c) => c.statut === 'paye')
  const chiffreAffaireJour = commandesPayees.reduce((s, c) => s + Number(c.total), 0)
  const commandesEnCours = (commandesJour ?? []).filter((c) =>
    ['en_attente', 'en_preparation', 'pret'].includes(c.statut)
  ).length

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-xl font-semibold">Bonjour 👋</h1>
        <p className="text-sm text-textmid">Voici l&apos;activité du jour pour {restaurant.nom}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardStat icon={TrendingUp} label="Chiffre d'affaires du jour" valeur={fmt(chiffreAffaireJour)} />
        <CardStat icon={ShoppingBag} label="Commandes payées" valeur={commandesPayees.length} couleur="text-green" />
        <CardStat icon={Clock} label="Commandes en cours" valeur={commandesEnCours} couleur="text-blue" />
        <CardStat icon={UtensilsCrossed} label="Plats au menu" valeur={platsCount ?? 0} couleur="text-textmid" />
      </div>
    </div>
  )
}
