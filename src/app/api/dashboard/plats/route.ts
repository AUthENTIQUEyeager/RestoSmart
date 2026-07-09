import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const platSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional().default(''),
  prix: z.number().positive(),
  image_url: z.string().optional().default(''),
  categorie: z.string().default('Plats'),
  disponible: z.boolean().default(true),
  temps_prep: z.number().int().positive().default(15),
})

async function getRestaurantId(supabase: ReturnType<typeof createClient>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await supabase.from('restaurants').select('id').eq('manager_id', auth.user.id).single()
  return data?.id ?? null
}

export async function GET() {
  const supabase = createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('plats')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('categorie')
    .order('ordre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plats: data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = platSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { data, error } = await supabase
    .from('plats')
    .insert({ ...parsed.data, restaurant_id: restaurantId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plat: data })
}

export async function PUT(req: NextRequest) {
  const supabase = createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const parsed = platSchema.partial().safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { data, error } = await supabase
    .from('plats')
    .update(parsed.data)
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plat: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const { error } = await supabase.from('plats').delete().eq('id', id).eq('restaurant_id', restaurantId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
