'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Restaurant {
  id: string
  nom: string
  slug: string
  adresse: string | null
  telephone: string | null
  logo_url: string | null
  date_fin_abo: string
  actif: boolean
}

// Récupère le restaurant du manager connecté
export function useRestaurant() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('manager_id', auth.user.id)
        .single()

      setRestaurant(data)
      setLoading(false)
    })()
  }, [])

  const expire = restaurant
    ? !restaurant.actif || new Date(restaurant.date_fin_abo) < new Date(new Date().toDateString())
    : false

  return { restaurant, loading, expire }
}
