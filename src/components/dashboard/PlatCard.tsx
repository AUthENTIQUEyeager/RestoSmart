'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { fmt } from '@/lib/utils/format'
import { imagePlat } from '@/lib/utils/slug'

export interface Plat {
  id: string
  nom: string
  description: string
  prix: number
  image_url: string
  categorie: string
  disponible: boolean
  temps_prep: number
}

export function PlatCard({
  plat,
  onEdit,
  onDelete,
  onToggle,
}: {
  plat: Plat
  onEdit: () => void
  onDelete: () => void
  onToggle: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-white p-4">
      <img
        src={imagePlat(plat.image_url, plat.categorie)}
        alt={plat.nom}
        className="h-16 w-16 rounded object-cover"
      />
      <div className="flex-1">
        <p className="font-medium">{plat.nom}</p>
        <p className="text-sm text-textmid">{fmt(plat.prix)} · {plat.categorie}</p>
      </div>
      <Toggle checked={plat.disponible} onChange={onToggle} />
      <button onClick={onEdit} className="text-textmid hover:text-brand">
        <Pencil size={18} />
      </button>
      <button onClick={onDelete} className="text-textmid hover:text-red">
        <Trash2 size={18} />
      </button>
    </div>
  )
}
