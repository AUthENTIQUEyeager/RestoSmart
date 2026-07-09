import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { fmt, formatDate } from '@/lib/utils/format'
import { Store, TrendingUp, Users } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: commandesPayees } = await supabase.from('commandes').select('total').eq('statut', 'paye')
  const chiffreAffaireTotal = (commandesPayees ?? []).reduce((s, c) => s + Number(c.total), 0)
  const actifs = (restaurants ?? []).filter((r) => r.actif).length

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-5">
          <Store className="text-brand" size={20} />
          <p className="mt-2 text-2xl font-semibold">{restaurants?.length ?? 0}</p>
          <p className="text-sm text-textmid">Restaurants au total</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5">
          <Users className="text-green" size={20} />
          <p className="mt-2 text-2xl font-semibold">{actifs}</p>
          <p className="text-sm text-textmid">Restaurants actifs</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5">
          <TrendingUp className="text-blue" size={20} />
          <p className="mt-2 text-2xl font-semibold">{fmt(chiffreAffaireTotal)}</p>
          <p className="text-sm text-textmid">Chiffre d&apos;affaires cumulé</p>
        </div>
      </div>

      <div>
        <h1 className="mb-4 font-display text-xl font-semibold">Restaurants</h1>
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-bg text-left text-textmid">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Fin abonnement</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {(restaurants ?? []).map((r) => {
                const expire = !r.actif || new Date(r.date_fin_abo) < new Date()
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.nom}</td>
                    <td className="px-4 py-3 text-textmid">{r.slug}</td>
                    <td className="px-4 py-3 text-textmid">{r.date_fin_abo}</td>
                    <td className="px-4 py-3">
                      <Badge className={expire ? 'bg-red/10 text-red' : 'bg-green/10 text-green'}>
                        {expire ? 'Expiré / bloqué' : 'Actif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-textmid">{formatDate(r.created_at)}</td>
                  </tr>
                )
              })}
              {(restaurants ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-textlight">
                    Aucun restaurant pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
