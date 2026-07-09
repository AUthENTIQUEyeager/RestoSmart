import { db, type SyncQueueItem } from './db'
import { createClient } from '@/lib/supabase/client'

// Stratégie :
// 1. Toute écriture passe d'abord par Dexie + sync_queue
// 2. Si online → tentative Supabase immédiate
// 3. Si offline (ou échec réseau) → reste dans sync_queue
// 4. Au retour de connexion → flushSyncQueue() vide la file dans l'ordre
// 5. Conflits → last-write-wins (created_at le plus récent gagne)

export async function enqueue(item: Omit<SyncQueueItem, 'id'>) {
  await db.sync_queue.add(item)
  if (navigator.onLine) {
    await flushSyncQueue()
  }
}

export async function flushSyncQueue() {
  if (!navigator.onLine) return

  const supabase = createClient()
  const items = await db.sync_queue.orderBy('created_at').toArray()

  for (const item of items) {
    try {
      if (item.operation === 'insert') {
        const { error } = await supabase.from(item.table).insert(item.data)
        if (error) throw error
      } else if (item.operation === 'update') {
        const { id, ...rest } = item.data as { id: string; [k: string]: unknown }
        const { error } = await supabase.from(item.table).update(rest).eq('id', id)
        if (error) throw error
      } else if (item.operation === 'delete') {
        const { id } = item.data as { id: string }
        const { error } = await supabase.from(item.table).delete().eq('id', id)
        if (error) throw error
      }

      // Succès → retire de la file et marque synced si c'est une commande
      if (item.id !== undefined) await db.sync_queue.delete(item.id)
      if (item.table === 'commandes' && item.operation === 'insert') {
        const data = item.data as { id: string }
        await db.commandes.update(data.id, { synced: 1 })
      }
    } catch (err) {
      // Échec réseau probable → on arrête ici, on retentera au prochain flush
      console.error('Sync échouée pour', item, err)
      break
    }
  }
}

// À appeler une fois au montage de l'app (ex: dans un composant racine client)
export function registerAutoSync() {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    flushSyncQueue()
  })

  // Le seul événement 'online' n'est pas fiable partout (ex: WiFi captif) :
  // on ajoute un polling de secours toutes les 15s.
  setInterval(() => {
    if (navigator.onLine) flushSyncQueue()
  }, 15000)
}
