'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCommandes } from '@/lib/hooks/useCommandes'
import { PanneauPaiement } from '@/components/caisse/PanneauPaiement'
import { COULEURS_STATUT, LABELS_STATUT, fmt, formatHeure } from '@/lib/utils/format'
import clsx from 'clsx'

export default function CaissePage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const { commandes, refetch } = useCommandes(restaurantId)
  const [selectionId, setSelectionId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('manager_id', data.user.id)
        .single()
      setRestaurantId(restaurant?.id ?? null)
    })
  }, [])

  const commandesTriees = [...commandes].sort((a, b) => {
    const ordre = { en_attente: 0, en_preparation: 1, pret: 2 }
    const diff = (ordre as Record<string, number>)[a.statut] - (ordre as Record<string, number>)[b.statut]
    if (diff !== 0) return diff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const selection = commandesTriees.find((c) => c.id === selectionId) ?? commandesTriees[0] ?? null

  async function valider(methode: string) {
    if (!selection) return
    await fetch('/api/dashboard/commandes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selection.id, statut: 'paye', methode_paiement: methode }),
    })
    setSelectionId(null)
    refetch()
  }

  return (
    <div className="-mx-8 -my-8 flex h-screen">
      <div className="w-[340px] overflow-y-auto border-r border-border bg-white">
        <h1 className="border-b border-border px-4 py-4 font-display text-lg font-semibold">Caisse</h1>
        {commandesTriees.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectionId(c.id)}
            className={clsx(
              'flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-bg',
              selection?.id === c.id && 'bg-brand-light'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Table {c.table_numero}</span>
              <span className="text-xs text-textlight">{formatHeure(c.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', COULEURS_STATUT[c.statut])}>
                {LABELS_STATUT[c.statut]}
              </span>
              <span className="text-sm font-semibold">{fmt(c.total)}</span>
            </div>
          </button>
        ))}
        {commandesTriees.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-textlight">Aucune commande active</p>
        )}
      </div>

      <div className="flex-1 bg-bg">
        {selection ? (
          <PanneauPaiement commande={selection} onPaye={valider} />
        ) : (
          <div className="flex h-full items-center justify-center text-textlight">
            Sélectionnez une commande
          </div>
        )}
      </div>
    </div>
  )
}
