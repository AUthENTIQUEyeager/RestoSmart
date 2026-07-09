import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ligneSchema = z.object({
  plat_id: z.string().uuid(),
  plat_nom: z.string(),
  quantite: z.number().int().positive(),
  prix_unitaire: z.number().positive(),
})

const commandeSchema = z.object({
  restaurant_slug: z.string(),
  table_numero: z.number().int().positive(),
  note: z.string().optional().default(''),
  lignes: z.array(ligneSchema).min(1),
})

// Rate limiting simple en mémoire — max 10 requêtes/min par IP.
// Note : réinitialisé à chaque redéploiement/instance froide sur Vercel.
// Pour une garantie stricte multi-instances, prévoir Upstash Redis en V2.
const compteurRequetes = new Map<string, { count: number; reset: number }>()

function rateLimitOk(ip: string): boolean {
  const maintenant = Date.now()
  const entree = compteurRequetes.get(ip)
  if (!entree || maintenant > entree.reset) {
    compteurRequetes.set(ip, { count: 1, reset: maintenant + 60_000 })
    return true
  }
  if (entree.count >= 10) return false
  entree.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez dans une minute' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = commandeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  const d = parsed.data

  const supabase = createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, actif, date_fin_abo')
    .eq('slug', d.restaurant_slug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  const expire = !restaurant.actif || new Date(restaurant.date_fin_abo) < new Date()
  if (expire) return NextResponse.json({ error: 'Restaurant indisponible' }, { status: 403 })

  const { data: table } = await supabase
    .from('tables_resto')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('numero', d.table_numero)
    .single()

  const total = d.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)

  const { data: commande, error: commandeErr } = await supabase
    .from('commandes')
    .insert({
      restaurant_id: restaurant.id,
      table_id: table?.id ?? null,
      table_numero: d.table_numero,
      note: d.note,
      total,
    })
    .select()
    .single()

  if (commandeErr || !commande) {
    return NextResponse.json({ error: commandeErr?.message ?? 'Erreur création commande' }, { status: 500 })
  }

  const lignes = d.lignes.map((l) => ({
    commande_id: commande.id,
    plat_id: l.plat_id,
    plat_nom: l.plat_nom,
    quantite: l.quantite,
    prix_unitaire: l.prix_unitaire,
  }))
  await supabase.from('lignes_commande').insert(lignes)

  return NextResponse.json({ commande })
}
