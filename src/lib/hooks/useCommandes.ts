'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CommandeAvecLignes {
  id: string
  restaurant_id: string
  table_numero: number
  statut: 'en_attente' | 'en_preparation' | 'pret' | 'paye' | 'annule'
  total: number
  note: string
  methode_paiement: string
  created_at: string
  lignes_commande: { plat_nom: string; quantite: number; prix_unitaire: number }[]
}

// Écoute les commandes actives d'un restaurant.
// Polling toutes les 5s en base fiable (fonctionne même si Realtime n'est
// pas activé côté Supabase pour la table `commandes`), + Realtime en bonus
// pour une mise à jour quasi instantanée quand disponible.
export function useCommandes(restaurantId: string | null) {
  const [commandes, setCommandes] = useState<CommandeAvecLignes[]>([])
  const supabase = createClient()

  const fetchCommandes = useCallback(async () => {
    if (!restaurantId) return
    const { data } = await supabase
      .from('commandes')
      .select('*, lignes_commande(plat_nom, quantite, prix_unitaire)')
      .eq('restaurant_id', restaurantId)
      .in('statut', ['en_attente', 'en_preparation', 'pret'])
      .order('created_at', { ascending: true })

    if (data) setCommandes(data as CommandeAvecLignes[])
  }, [restaurantId, supabase])

  useEffect(() => {
    if (!restaurantId) return
    fetchCommandes()

    // Polling de base — garantit la mise à jour même sans Realtime
    const interval = setInterval(fetchCommandes, 5000)

    // Realtime en complément, pour accélérer la mise à jour quand actif
    const channel = supabase
      .channel(`commandes-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commandes', filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchCommandes()
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [restaurantId, fetchCommandes, supabase])

  // Retire immédiatement une commande de la liste locale (ex: après paiement)
  const retirerLocalement = useCallback((id: string) => {
    setCommandes((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // Met à jour immédiatement le statut d'une commande en local (retour visuel instantané)
  const mettreAJourStatutLocal = useCallback((id: string, statut: CommandeAvecLignes['statut']) => {
    setCommandes((prev) => prev.map((c) => (c.id === id ? { ...c, statut } : c)))
  }, [])

  return { commandes, refetch: fetchCommandes, retirerLocalement, mettreAJourStatutLocal }
}
