'use client'

import clsx from 'clsx'
import { formatHeure, minutesEcoulees } from '@/lib/utils/format'
import type { CommandeAvecLignes } from '@/lib/hooks/useCommandes'

export function CommandeCard({
  commande,
  onChangerStatut,
}: {
  commande: CommandeAvecLignes
  onChangerStatut: (id: string, statut: 'en_preparation' | 'pret') => void
}) {
  const urgente = commande.statut === 'en_attente' && minutesEcoulees(commande.created_at) > 15

  return (
    <div
      className={clsx(
        'flex flex-col gap-3 rounded-lg bg-[#161616] p-4',
        urgente ? 'animate-pulse border-2 border-brand' : 'border border-[#2a2a2a]'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-semibold text-white">Table {commande.table_numero}</span>
        <div className="flex items-center gap-2">
          <StatutBadge statut={commande.statut} />
          <span className="text-sm text-white/50">{formatHeure(commande.created_at)}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {commande.lignes_commande.map((l, i) => (
          <li key={i} className="flex justify-between text-[15px] text-white/90">
            <span>{l.plat_nom}</span>
            <span className="font-semibold text-brand">×{l.quantite}</span>
          </li>
        ))}
      </ul>

      {commande.note && (
        <p className="border-l-2 border-brand bg-white/5 px-3 py-2 text-sm text-white/80">{commande.note}</p>
      )}

      <div className="mt-1">
        {commande.statut === 'en_attente' && (
          <button
            onClick={() => onChangerStatut(commande.id, 'en_preparation')}
            className="h-11 w-full rounded bg-blue font-medium text-white"
          >
            En préparation
          </button>
        )}
        {commande.statut === 'en_preparation' && (
          <button
            onClick={() => onChangerStatut(commande.id, 'pret')}
            className="h-11 w-full rounded bg-green font-medium text-white"
          >
            Marquer prêt
          </button>
        )}
        {commande.statut === 'pret' && (
          <p className="text-center text-sm font-medium text-green">Prêt — En attente caisse</p>
        )}
      </div>
    </div>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const labels: Record<string, string> = { en_attente: 'En attente', en_preparation: 'En préparation', pret: 'Prêt' }
  const couleurs: Record<string, string> = {
    en_attente: 'bg-brand/20 text-brand',
    en_preparation: 'bg-blue/20 text-blue',
    pret: 'bg-green/20 text-green',
  }
  return (
    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', couleurs[statut])}>
      {labels[statut]}
    </span>
  )
}
