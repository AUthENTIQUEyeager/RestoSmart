import { createClient } from '@/lib/supabase/server'
import { MenuClient } from '@/components/menu/MenuClient'
import { notFound } from 'next/navigation'

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { table?: string }
}) {
  const tableNumero = Number(searchParams.table ?? 0)
  if (!tableNumero) notFound()

  const supabase = createClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('nom, actif, date_fin_abo')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) notFound()

  const expire = !restaurant.actif || new Date(restaurant.date_fin_abo) < new Date()
  if (expire) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-textmid">Ce restaurant n&apos;est pas disponible pour le moment.</p>
      </div>
    )
  }

  return <MenuClient slug={params.slug} tableNumero={tableNumero} restaurantNom={restaurant.nom} />
}
