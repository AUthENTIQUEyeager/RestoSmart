import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { count: totalRestaurants } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })

  const { count: restaurantsActifs } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .eq('actif', true)

  const { data: commandesPayees } = await supabase
    .from('commandes')
    .select('total')
    .eq('statut', 'paye')

  const chiffreAffaireTotal = (commandesPayees ?? []).reduce((sum, c) => sum + Number(c.total), 0)

  return NextResponse.json({
    totalRestaurants: totalRestaurants ?? 0,
    restaurantsActifs: restaurantsActifs ?? 0,
    chiffreAffaireTotal,
  })
}
