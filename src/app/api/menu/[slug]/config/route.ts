import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, nom, slug, logo_url, actif, date_fin_abo')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const expire = !restaurant.actif || new Date(restaurant.date_fin_abo) < new Date()
  if (expire) return NextResponse.json({ error: 'Restaurant temporairement indisponible' }, { status: 403 })

  return NextResponse.json({ restaurant: { nom: restaurant.nom, slug: restaurant.slug, logo_url: restaurant.logo_url } })
}
