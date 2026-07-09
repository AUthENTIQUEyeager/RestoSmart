import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { data: plats, error } = await supabase
    .from('plats')
    .select('id, nom, description, prix, image_url, categorie, disponible, temps_prep, ordre')
    .eq('restaurant_id', restaurant.id)
    .eq('disponible', true)
    .order('categorie')
    .order('ordre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plats })
}
