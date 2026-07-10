'use client'

import { ImagePlat } from '@/components/ui/ImagePlat'
import { fmt } from '@/lib/utils/format'
import { X, Minus, Plus, Clock } from 'lucide-react'
import type { PlatMenu } from './PlatCard'

export function DetailPlat({
  plat,
  quantiteDansPanier,
  onClose,
  onAjouter,
  onChangerQuantite,
}: {
  plat: PlatMenu
  quantiteDansPanier: number
  onClose: () => void
  onAjouter: () => void
  onChangerQuantite: (delta: number) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white">
        <div className="relative">
          <ImagePlat nom={plat.nom} imageUrl={plat.image_url} className="h-[220px] w-full" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <h2 className="font-display text-2xl font-semibold">{plat.nom}</h2>
          <p className="mt-2 text-textmid">{plat.description}</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xl font-semibold text-brand">{fmt(plat.prix)}</span>
            <span className="flex items-center gap-1 text-sm text-textlight">
              <Clock size={14} /> {plat.temps_prep} min
            </span>
          </div>
          {!plat.disponible && (
            <p className="mt-2 text-sm font-medium text-red">Actuellement indisponible</p>
          )}

          <div className="mt-6">
            {quantiteDansPanier === 0 ? (
              <button
                onClick={onAjouter}
                disabled={!plat.disponible}
                className="h-[52px] w-full rounded bg-brand text-base font-medium text-white disabled:opacity-40"
              >
                Ajouter au panier
              </button>
            ) : (
              <div className="flex items-center justify-center gap-6 rounded bg-bg py-3">
                <button
                  onClick={() => onChangerQuantite(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"
                >
                  <Minus size={18} />
                </button>
                <span className="w-8 text-center text-lg font-semibold">{quantiteDansPanier}</span>
                <button
                  onClick={() => onChangerQuantite(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
                >
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
