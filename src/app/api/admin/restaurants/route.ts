import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateSlug, slugUnique } from '@/lib/utils/slug'

const schema = z.object({
  nom: z.string().min(2),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  date_fin_abo: z.string(),
  manager_email: z.string().email(),
  manager_password: z.string().min(8),
  manager_nom: z.string().min(2),
  proprietaire_type: z.enum(['nouveau', 'existant', 'aucun']),
  patron_nom: z.string().optional(),
  patron_email: z.string().email().optional().or(z.literal('')),
  patron_password: z.string().optional(),
  patron_existant_id: z.string().optional(),
})

// GET → liste des restaurants (super_admin)
export async function GET() {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('restaurants')
    .select('*, profiles!restaurants_manager_id_fkey(nom)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ restaurants: data })
}

// POST → création restaurant complète (8 étapes)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single()
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès réservé au super admin' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const d = parsed.data
  const admin = createAdminClient()

  try {
    // 1. Créer compte Auth manager
    const { data: managerAuth, error: managerAuthErr } = await admin.auth.admin.createUser({
      email: d.manager_email,
      password: d.manager_password,
      email_confirm: true,
    })
    if (managerAuthErr || !managerAuth.user) throw new Error(managerAuthErr?.message ?? 'Création manager échouée')

    // 2. Créer profil manager
    const { error: profileErr } = await admin
      .from('profiles')
      .insert({ id: managerAuth.user.id, role: 'manager', nom: d.manager_nom })
    if (profileErr) throw new Error(profileErr.message)

    // 3. Générer slug unique
    const { data: existants } = await admin.from('restaurants').select('slug')
    const slugBase = generateSlug(d.nom)
    const slug = slugUnique(slugBase, (existants ?? []).map((r: { slug: string }) => r.slug))

    // 4. Créer restaurant
    const { data: restaurant, error: restoErr } = await admin
      .from('restaurants')
      .insert({
        nom: d.nom,
        slug,
        adresse: d.adresse || null,
        telephone: d.telephone || null,
        date_fin_abo: d.date_fin_abo,
        manager_id: managerAuth.user.id,
        created_by: auth.user.id,
      })
      .select()
      .single()
    if (restoErr || !restaurant) throw new Error(restoErr?.message ?? 'Création restaurant échouée')

    // 5. Si patron nouveau avec email → créer compte + profil
    let patronId: string | null = null
    if (d.proprietaire_type === 'nouveau' && d.patron_nom) {
      if (d.patron_email && d.patron_password) {
        const { data: patronAuth, error: patronAuthErr } = await admin.auth.admin.createUser({
          email: d.patron_email,
          password: d.patron_password,
          email_confirm: true,
        })
        if (patronAuthErr || !patronAuth.user) throw new Error(patronAuthErr?.message ?? 'Création patron échouée')
        await admin.from('profiles').insert({ id: patronAuth.user.id, role: 'patron', nom: d.patron_nom })
        patronId = patronAuth.user.id
      }
    } else if (d.proprietaire_type === 'existant' && d.patron_existant_id) {
      patronId = d.patron_existant_id
    }

    // 6. Insérer dans patron_restaurants
    if (patronId) {
      await admin.from('patron_restaurants').insert({ patron_id: patronId, restaurant_id: restaurant.id })
    }

    // 7. Créer 5 tables par défaut (aucun plat de démo — le manager ajoute ses propres plats)
    const tables = Array.from({ length: 5 }, (_, i) => ({
      restaurant_id: restaurant.id,
      numero: i + 1,
      nom: `Table ${i + 1}`,
      capacite: 4,
    }))
    await admin.from('tables_resto').insert(tables)

    // 8. Succès
    return NextResponse.json({ restaurant })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
