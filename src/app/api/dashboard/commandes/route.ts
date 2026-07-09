import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getRestaurantId(supabase: ReturnType<typeof createClient>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await supabase.from('restaurants').select('id').eq('manager_id', auth.user.id).single()
  return data?.id ?? null
}

// GET → commandes actives ou historique (?statut=paye&limit=50)
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut')
  const limit = Number(searchParams.get('limit') ?? 100)

  let query = supabase
    .from('commandes')
    .select('*, lignes_commande(*)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  query = statut ? query.eq('statut', statut) : query.in('statut', ['en_attente', 'en_preparation', 'pret'])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ commandes: data })
}

// PUT → changer le statut d'une commande (cuisine/caisse)
export async function PUT(req: NextRequest) {
  const supabase = createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, statut, methode_paiement } = await req.json()
  if (!id || !statut) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const update: Record<string, unknown> = { statut }
  if (methode_paiement) update.methode_paiement = methode_paiement

  const { data, error } = await supabase
    .from('commandes')
    .update(update)
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (statut === 'paye') {
    await supabase.from('paiements').insert({
      commande_id: id,
      montant: data.total,
      methode: methode_paiement ?? 'especes',
    })
  }

  return NextResponse.json({ commande: data })
}
