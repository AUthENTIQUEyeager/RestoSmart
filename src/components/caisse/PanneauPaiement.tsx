'use client'

import { useState } from 'react'
import { fmt } from '@/lib/utils/format'
import type { CommandeAvecLignes } from '@/lib/hooks/useCommandes'
import { Button } from '@/components/ui/Button'
import { Printer } from 'lucide-react'

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'autre', label: 'Autre' },
]

export function PanneauPaiement({
  commande,
  onPaye,
  disabled = false,
}: {
  commande: CommandeAvecLignes
  onPaye: (methode: string) => void
  disabled?: boolean
}) {
  const [methode, setMethode] = useState('especes')

  function imprimer() {
    const fenetre = window.open('', '_blank', 'width=380,height=600')
    if (!fenetre) return
    fenetre.document.write(`
      <html><head><title>Reçu - Table ${commande.table_numero}</title>
      <style>
        body { font-family: monospace; padding: 16px; font-size: 13px; }
        h1 { font-size: 16px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 4px 0; }
        .total { font-weight: bold; border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; }
      </style></head><body>
      <h1>RestoSmart — Table ${commande.table_numero}</h1>
      <p>${new Date(commande.created_at).toLocaleString('fr-FR')}</p>
      <table>
        ${commande.lignes_commande.map((l) => `<tr><td>${l.quantite}x ${l.plat_nom}</td><td style="text-align:right">${fmt(l.quantite * l.prix_unitaire)}</td></tr>`).join('')}
      </table>
      <div class="total">TOTAL : ${fmt(commande.total)}</div>
      <p>Paiement : ${MODES_PAIEMENT.find((m) => m.value === methode)?.label}</p>
      </body></html>
    `)
    fenetre.document.close()
    fenetre.print()
  }

  return (
    <div className="flex h-full flex-col gap-5 p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Table {commande.table_numero}</h2>
        <p className="text-sm text-textmid">{new Date(commande.created_at).toLocaleString('fr-FR')}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-4">
        {commande.lignes_commande.map((l, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{l.quantite}× {l.plat_nom}</span>
            <span className="font-medium">{fmt(l.quantite * l.prix_unitaire)}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-[#0a0a0a] p-5 text-center">
        <p className="text-sm text-white/60">Total à payer</p>
        <p className="font-display text-3xl font-semibold text-white">{fmt(commande.total)}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Mode de paiement</p>
        <div className="grid grid-cols-2 gap-2">
          {MODES_PAIEMENT.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethode(m.value)}
              className={`h-11 rounded border text-sm font-medium ${
                methode === m.value ? 'border-brand bg-brand-light text-brand' : 'border-border text-textmid'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Button size="lg" variant="success" onClick={() => onPaye(methode)} disabled={disabled}>
          {disabled ? 'Validation...' : 'Valider le paiement'}
        </Button>
        <Button size="lg" variant="secondary" onClick={imprimer}><Printer size={16} /> Imprimer reçu</Button>
      </div>
    </div>
  )
}
