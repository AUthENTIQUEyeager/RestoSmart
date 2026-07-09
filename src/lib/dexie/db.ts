import Dexie, { type Table } from 'dexie'

// ── Types miroir (allégés) de Supabase ──────────────────────

export interface PlatOffline {
  id: string
  restaurant_id: string
  nom: string
  description: string
  prix: number
  image_url: string
  categorie: string
  disponible: boolean
  temps_prep: number
  ordre: number
}

export interface TableOffline {
  id: string
  restaurant_id: string
  numero: number
  nom: string | null
  capacite: number
}

export interface LigneCommandeOffline {
  plat_id: string | null
  plat_nom: string
  quantite: number
  prix_unitaire: number
}

export interface CommandeOffline {
  id: string // uuid généré côté client
  restaurant_id: string
  table_id: string | null
  table_numero: number
  statut: 'en_attente' | 'en_preparation' | 'pret' | 'paye' | 'annule'
  total: number
  note: string
  methode_paiement: string
  lignes: LigneCommandeOffline[]
  synced: 0 | 1 // IndexedDB ne trie pas bien les booléens → entier
  created_at: string
}

export interface SyncQueueItem {
  id?: number // auto-increment
  operation: 'insert' | 'update' | 'delete'
  table: string
  data: Record<string, unknown>
  created_at: string
}

// ── Base Dexie ───────────────────────────────────────────────

class RestoSmartDB extends Dexie {
  plats!: Table<PlatOffline, string>
  tables_resto!: Table<TableOffline, string>
  commandes!: Table<CommandeOffline, string>
  sync_queue!: Table<SyncQueueItem, number>

  constructor() {
    super('restosmart_db')
    this.version(1).stores({
      plats: 'id, restaurant_id, categorie, disponible',
      tables_resto: 'id, restaurant_id, numero',
      commandes: 'id, restaurant_id, statut, synced, created_at',
      sync_queue: '++id, table, created_at',
    })
  }
}

export const db = new RestoSmartDB()
