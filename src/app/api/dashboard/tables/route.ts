import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const tableSchema = z.object({
  numero: z.number().int().positive(),
  nom: z.string().optional(),
  capacite: z.number().int().positive().default(4),
})

async function getRestaurantId(supabase: ReturnType<typeof createClient>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await supabase.from('restaurants').select('id, slug').eq('manager_id', auth.user.id).single()
  return data ?? null
}

export async function GET() {
  const supabase = createClient()
  const restaurant = await getRestaurantId(supabase)
  if (!restaurant) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('tables_resto')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('numero')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tables: data, slug: restaurant.slug })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const restaurant = await getRestaurantId(supabase)
  if (!restaurant) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = tableSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { data, error } = await supabase
    .from('tables_resto')
    .insert({ ...parsed.data, restaurant_id: restaurant.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ table: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const restaurant = await getRestaurantId(supabase)
  if (!restaurant) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const { error } = await supabase.from('tables_resto').delete().eq('id', id).eq('restaurant_id', restaurant.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
