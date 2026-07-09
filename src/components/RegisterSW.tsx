'use client'

import { useEffect } from 'react'
import { registerAutoSync } from '@/lib/dexie/sync'

export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Échec silencieux — l'app fonctionne sans PWA
      })
    }
    registerAutoSync()
  }, [])

  return null
}
