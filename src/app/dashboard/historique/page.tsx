'use client'

import { useEffect, useState } from 'react'
import { fmt, formatDate, LABELS_STATUT, COULEURS_STATUT } from '@/lib/utils/format'
import clsx from 'clsx'

interface CommandeHistorique {
  id: string
  table_numero: number
  statut: string
  total: number
  methode_paiement: string
  created_at: string
  lignes_commande: { plat_nom: string; quantite: number }[]
}

export default function HistoriquePage() {
  const [commandes, setCommandes] = useState<CommandeHistorique[]>([])
  const [filtre, setFiltre] = useState<string>('')

  useEffect(() => {
    const url = filtre ? `/api/dashboard/commandes?statut=${filtre}&limit=100` : '/api/dashboard/commandes?statut=paye&limit=100'
    fetch(url)
      .then((r) => r.json())
      .then((d) => setCommandes(d.commandes ?? []))
  }, [filtre])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Historique</h1>
        <select
          className="h-10 rounded border border-border px-3 text-sm"
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
        >
          <option value="paye">Payées</option>
          <option value="annule">Annulées</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-textmid">
            <tr>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Articles</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Paiement</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">Table {c.table_numero}</td>
                <td className="px-4 py-3 text-textmid">
                  {c.lignes_commande.map((l) => `${l.quantite}× ${l.plat_nom}`).join(', ')}
                </td>
                <td className="px-4 py-3 font-medium">{fmt(c.total)}</td>
                <td className="px-4 py-3 text-textmid capitalize">{c.methode_paiement.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', COULEURS_STATUT[c.statut])}>
                    {LABELS_STATUT[c.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-textmid">{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {commandes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-textlight">Aucune commande</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
