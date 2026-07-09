'use client'

import { imagePlat } from '@/lib/utils/slug'
import { fmt } from '@/lib/utils/format'
import { Plus } from 'lucide-react'

export interface PlatMenu {
  id: string
  nom: string
  description: string
  prix: number
  image_url: string
  categorie: string
  disponible: boolean
  temps_prep: number
}

export function PlatCard({ plat, onClick }: { plat: PlatMenu; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-white p-3 text-left"
    >
      <div className="flex-1">
        <p className="font-medium leading-snug">{plat.nom}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-textlight">{plat.description}</p>
        <p className="mt-1 font-semibold text-brand">{fmt(plat.prix)}</p>
      </div>
      <div className="relative shrink-0">
        <img
          src={imagePlat(plat.image_url, plat.categorie)}
          alt={plat.nom}
          className="h-[110px] w-[110px] rounded-lg object-cover"
        />
        <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow">
          <Plus size={16} />
        </span>
      </div>
    </button>
  )
}
