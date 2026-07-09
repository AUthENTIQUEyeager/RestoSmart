'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ConfigPage() {
  const [restaurant, setRestaurant] = useState<{
    id: string; nom: string; adresse: string | null; telephone: string | null; date_fin_abo: string
  } | null>(null)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: resto } = await supabase
        .from('restaurants')
        .select('id, nom, adresse, telephone, date_fin_abo')
        .eq('manager_id', data.user.id)
        .single()
      setRestaurant(resto)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurant) return
    await supabase
      .from('restaurants')
      .update({ nom: restaurant.nom, adresse: restaurant.adresse, telephone: restaurant.telephone })
      .eq('id', restaurant.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!restaurant) return null

  return (
    <div className="max-w-md">
      <h1 className="mb-6 font-display text-xl font-semibold">Configuration</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nom du restaurant"
          value={restaurant.nom}
          onChange={(e) => setRestaurant({ ...restaurant, nom: e.target.value })}
        />
        <Input
          label="Adresse"
          value={restaurant.adresse ?? ''}
          onChange={(e) => setRestaurant({ ...restaurant, adresse: e.target.value })}
        />
        <Input
          label="Téléphone"
          value={restaurant.telephone ?? ''}
          onChange={(e) => setRestaurant({ ...restaurant, telephone: e.target.value })}
        />
        <Input label="Fin d'abonnement" value={restaurant.date_fin_abo} disabled />
        <p className="text-xs text-textlight">
          La date de fin d&apos;abonnement est gérée par l&apos;administrateur.
        </p>
        <Button type="submit">{saved ? 'Enregistré ✓' : 'Enregistrer'}</Button>
      </form>
    </div>
  )
}
