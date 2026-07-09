import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TYPES_AUTORISES = ['image/jpeg', 'image/png', 'image/webp']
const TAILLE_MAX = 5 * 1024 * 1024 // 5 Mo

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('manager_id', auth.user.id)
    .single()
  if (!restaurant) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  if (!TYPES_AUTORISES.includes(file.type)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 })
  }
  if (file.size > TAILLE_MAX) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })
  }

  const extension = file.name.split('.').pop()
  const chemin = `${restaurant.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('plats')
    .upload(chemin, file, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrl } = supabase.storage.from('plats').getPublicUrl(chemin)
  return NextResponse.json({ url: publicUrl.publicUrl })
}
