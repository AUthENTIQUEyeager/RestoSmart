import { initialePlat } from '@/lib/utils/slug'
import clsx from 'clsx'

// Affiche la photo du plat si disponible, sinon un placeholder avec l'initiale
export function ImagePlat({
  nom,
  imageUrl,
  className,
}: {
  nom: string
  imageUrl: string
  className?: string
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt={nom} className={clsx('object-cover', className)} />
  }
  return (
    <div className={clsx('flex items-center justify-center bg-brand-light font-display font-semibold text-brand', className)}>
      <span style={{ fontSize: '2em' }}>{initialePlat(nom)}</span>
    </div>
  )
}
