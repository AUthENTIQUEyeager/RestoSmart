'use client'

import { fmt } from '@/lib/utils/format'
import { Minus, Plus, X } from 'lucide-react'

export interface ArticlePanier {
  plat_id: string
  nom: string
  prix: number
  quantite: number
}

export function Panier({
  articles,
  note,
  onNoteChange,
  onChangerQuantite,
  onFermer,
  onEnvoyer,
  envoiEnCours,
}: {
  articles: ArticlePanier[]
  note: string
  onNoteChange: (v: string) => void
  onChangerQuantite: (platId: string, delta: number) => void
  onFermer: () => void
  onEnvoyer: () => void
  envoiEnCours: boolean
}) {
  const total = articles.reduce((s, a) => s + a.prix * a.quantite, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-xl font-semibold">Votre panier</h2>
          <button onClick={onFermer}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-3">
            {articles.map((a) => (
              <div key={a.plat_id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.nom}</p>
                  <p className="text-sm text-textmid">{fmt(a.prix)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onChangerQuantite(a.plat_id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-bg"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center font-medium">{a.quantite}</span>
                  <button
                    onClick={() => onChangerQuantite(a.plat_id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
            {articles.length === 0 && <p className="text-center text-textlight">Votre panier est vide</p>}
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium">Note pour la cuisine (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Ex: sans piment, bien cuit..."
              className="mt-1.5 w-full rounded border border-border p-3 text-sm outline-none focus:border-brand"
              rows={2}
            />
          </div>
        </div>

        <div className="border-t border-border p-5">
          <div className="mb-3 flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-brand">{fmt(total)}</span>
          </div>
          <button
            onClick={onEnvoyer}
            disabled={articles.length === 0 || envoiEnCours}
            className="h-[52px] w-full rounded bg-brand text-base font-medium text-white disabled:opacity-40"
          >
            {envoiEnCours ? 'Envoi en cours...' : 'Envoyer la commande'}
          </button>
        </div>
      </div>
    </div>
  )
}
