'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCommandes } from '@/lib/hooks/useCommandes'
import { CommandeCard } from '@/components/cuisine/CommandeCard'

export default function CuisinePage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const { commandes, refetch, mettreAJourStatutLocal } = useCommandes(restaurantId)
  const compteurPrecedent = useRef(0)

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

  // Son à chaque nouvelle commande (Web Audio API)
  useEffect(() => {
    const enAttente = commandes.filter((c) => c.statut === 'en_attente').length
    if (enAttente > compteurPrecedent.current) {
      jouerSon()
    }
    compteurPrecedent.current = enAttente
  }, [commandes])

  function jouerSon() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {
      // Audio non disponible, on ignore silencieusement
    }
  }

  async function changerStatut(id: string, statut: 'en_preparation' | 'pret') {
    // Retour visuel instantané, avant même la réponse serveur
    mettreAJourStatutLocal(id, statut)

    const res = await fetch('/api/dashboard/commandes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Erreur lors de la mise à jour de la commande')
    }
    refetch()
  }

  return (
    <div className="-mx-8 -my-8 min-h-screen bg-[#0a0a0a] p-6">
      <h1 className="mb-6 font-display text-2xl font-semibold text-white">Cuisine</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {commandes.map((c) => (
          <CommandeCard key={c.id} commande={c} onChangerStatut={changerStatut} />
        ))}
        {commandes.length === 0 && (
          <p className="col-span-full text-center text-white/40">Aucune commande en cours</p>
        )}
      </div>
    </div>
  )
}
