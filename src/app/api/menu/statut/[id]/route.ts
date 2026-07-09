import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: commande, error } = await supabase
    .from('commandes')
    .select('id, statut, table_numero, total, created_at')
    .eq('id', params.id)
    .single()

  if (error || !commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  return NextResponse.json({ commande })
}
