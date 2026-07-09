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

// Écoute les commandes d'un restaurant en temps réel (Supabase Realtime),
// avec repli sur polling toutes les 5s si Realtime est indisponible.
export function useCommandes(restaurantId: string | null) {
  const [commandes, setCommandes] = useState<CommandeAvecLignes[]>([])
  const [realtimeOk, setRealtimeOk] = useState(true)
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

    const channel = supabase
      .channel(`commandes-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commandes', filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchCommandes()
      )
      .subscribe((status) => {
        setRealtimeOk(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, fetchCommandes, supabase])

  // Fallback polling si Realtime indisponible
  useEffect(() => {
    if (realtimeOk || !restaurantId) return
    const interval = setInterval(fetchCommandes, 5000)
    return () => clearInterval(interval)
  }, [realtimeOk, restaurantId, fetchCommandes])

  return { commandes, refetch: fetchCommandes }
}
