import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single()

  let restaurantIds: string[] = []
  if (profile?.role === 'manager') {
    const { data } = await supabase.from('restaurants').select('id').eq('manager_id', auth.user.id).single()
    if (data) restaurantIds = [data.id]
  } else if (profile?.role === 'patron') {
    const { data } = await supabase.from('patron_restaurants').select('restaurant_id').eq('patron_id', auth.user.id)
    restaurantIds = (data ?? []).map((r) => r.restaurant_id)
  }

  if (restaurantIds.length === 0) return NextResponse.json({ error: 'Aucun restaurant' }, { status: 404 })

  const debutJour = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const { data: commandes } = await supabase
    .from('commandes')
    .select('total, statut, created_at, restaurant_id, lignes_commande(plat_nom, quantite)')
    .in('restaurant_id', restaurantIds)
    .gte('created_at', debutJour)

  const payees = (commandes ?? []).filter((c) => c.statut === 'paye')
  const chiffreAffaireJour = payees.reduce((s, c) => s + Number(c.total), 0)

  const compteurPlats: Record<string, number> = {}
  for (const c of payees) {
    for (const l of c.lignes_commande ?? []) {
      compteurPlats[l.plat_nom] = (compteurPlats[l.plat_nom] ?? 0) + l.quantite
    }
  }
  const topPlats = Object.entries(compteurPlats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nom, quantite]) => ({ nom, quantite }))

  return NextResponse.json({
    chiffreAffaireJour,
    commandesPayeesJour: payees.length,
    topPlats,
  })
}
